/*
	curl-to-ruby

	A simple utility to convert curl commands into ruby code.

	Based on curl-to-go by Matt Holt
	https://github.com/mholt/curl-to-go
*/

import parseCommand from "./parseCommand";
import wrapArray from "./wrapArray";

export default function curlToRuby(curl) {
	var prelude = "require 'net/http'\nrequire 'uri'\n\n";
	var coda = "\n" +
		"# response.status\n" +
		"# response.body\n";

	// List of curl flags that are boolean typed; this helps with parsing
	// a command like `curl -abc value` to know whether 'value' belongs to '-c'
	// or is just a positional argument instead.
	var boolOptions = ['#', 'progress-bar', '-', 'next', '0', 'http1.0', 'http1.1', 'http2',
		'no-npn', 'no-alpn', '1', 'tlsv1', '2', 'sslv2', '3', 'sslv3', '4', 'ipv4', '6', 'ipv6',
		'a', 'append', 'anyauth', 'B', 'use-ascii', 'basic', 'compressed', 'create-dirs',
		'crlf', 'digest', 'disable-eprt', 'disable-epsv', 'environment', 'cert-status',
		'false-start', 'f', 'fail', 'ftp-create-dirs', 'ftp-pasv', 'ftp-skip-pasv-ip',
		'ftp-pret', 'ftp-ssl-ccc', 'ftp-ssl-control', 'g', 'globoff', 'G', 'get',
		'ignore-content-length', 'i', 'include', 'I', 'head', 'j', 'junk-session-cookies',
		'J', 'remote-header-name', 'k', 'insecure', 'l', 'list-only', 'L', 'location',
		'location-trusted', 'metalink', 'n', 'netrc', 'N', 'no-buffer', 'netrc-file',
		'netrc-optional', 'negotiate', 'no-keepalive', 'no-sessionid', 'ntlm', 'O',
		'remote-name', 'oauth2-bearer', 'p', 'proxy-tunnel', 'path-as-is', 'post301', 'post302',
		'post303', 'proxy-anyauth', 'proxy-basic', 'proxy-digest', 'proxy-negotiate',
		'proxy-ntlm', 'q', 'raw', 'remote-name-all', 's', 'silent', 'sasl-ir', 'S', 'show-error',
		'ssl', 'ssl-reqd', 'ssl-allow-beast', 'ssl-no-revoke', 'socks5-gssapi-nec', 'tcp-nodelay',
		'tlsv1.0', 'tlsv1.1', 'tlsv1.2', 'tr-encoding', 'trace-time', 'v', 'verbose', 'xattr',
		'h', 'help', 'M', 'manual', 'V', 'version'];

	var httpMethods = {
	 'COPY':      'Copy',
	 'DELETE':    'Delete',
	 'GET':       'Get',
	 'HEAD':      'Head',
	 'LOCK':      'Lock',
	 'MKCOL':     'Mkcol',
	 'MoVE':      'Move',
	 'OPTIONS':   'Options',
	 'PATCH':     'Patch',
	 'POST':      'Post',
	 'PROPFIND':  'Propfind',
	 'PROPPATCH': 'Proppatch',
	 'PUT':       'Put',
	 'TRACE':     'Trace',
	 'UNLOCK':    'Unlock'
	};

	if (!curl.trim())
		return;
	var cmd = parseCommand(curl, { boolFlags: boolOptions });

	if (cmd._[0] != "curl")
		throw "Not a curl command";

	var req = extractRelevantPieces(cmd);

	if (req.headers.length == 0 && req.method == "GET" && !req.data.ascii && !req.data.files && !req.basicauth) {
		return renderSimple(req);
	} else {
	 	return renderComplex(req);
	}


	// renderSimple renders a simple HTTP request using net/http convenience methods
	function renderSimple(req) {
		var ruby = "";

		ruby += prelude;
		ruby += 'uri = URI.parse("' + rubyEsc(req.url) + '")\n';
		ruby += 'response = Net::HTTP.get_response(uri)\n';

		return ruby + coda;
	}

	// renderComplex renders Go code that requires making a http.Request.
	function renderComplex(req) {
		// First, figure out the headers
		var headers = {};
		for (var i = 0; i < req.headers.length; i++) {
			var split = req.headers[i].indexOf(":");
			if (split == -1) continue;
			var name = req.headers[i].substr(0, split).trim();
			var value = req.headers[i].substr(split+1).trim();
			headers[toTitleCase(name)] = value;
		}

		delete headers["Accept-Encoding"];

		var ruby = "";

		ruby += prelude;
		ruby += 'uri = URI.parse("' + rubyEsc(req.url) + '")\n';

		if (httpMethods[req.method]) {
			ruby += 'request = Net::HTTP::'+httpMethods[req.method]+'.new(uri)\n';
		} else {
			ruby += 'request = Net::HTTPGenericRequest.new("' + rubyEsc(req.method) + '", false, false, uri)\n';
		}

		// set basic auth
		if (req.basicauth) {
			ruby += 'request.basic_auth("'+rubyEsc(req.basicauth.user)+'", "'+rubyEsc(req.basicauth.pass)+'")\n';
		}

		if (headers["Content-Type"]) {
			ruby += 'request.content_type = "' + rubyEsc(headers["Content-Type"]) + '"\n';
			delete(headers["Content-Type"]);
		}

		// set headers
		for (var name in headers) {
			ruby += 'request["'+rubyEsc(name)+'"] = "'+rubyEsc(headers[name])+'"\n';
		}

		if (req.data.ascii) {
			ruby += 'request.body = "' + rubyEsc(req.data.ascii) + '"\n';
		}

		if (req.data.files && req.data.files.length > 0) {
			if (!req.data.ascii) {
				ruby += 'request.body = ""\n';
			}

			for (var i = 0; i < req.data.files.length; i++) {
				ruby += 'request.body << File.read("'+rubyEsc(req.data.files[i])+'").delete("\\r\\n")\n';
			}
		}

		ruby += '\n'
		ruby += 'response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|\n'
		ruby += '  http.request(request)\n'
		ruby += 'end\n'

		return ruby + coda;
	}

	// extractRelevantPieces returns an object with relevant pieces
	// extracted from cmd, the parsed command. This accounts for
	// multiple flags that do the same thing and return structured
	// data that makes it easy to spit out Go code.
	function extractRelevantPieces(cmd) {
		var relevant = {
			url: "",
			method: "",
			headers: [],
			data: {}
		};

		// prefer --url over unnamed parameter, if it exists; keep first one only
		if (cmd.url)
			relevant.url = cmd.url;
		else if (cmd._.length > 1)
			relevant.url = cmd._[1]; // position 1 because index 0 is the curl command itself

		relevant.url = fixUrl(relevant.url);

		// gather the headers together
		if (cmd.H)
			relevant.headers = relevant.headers.concat(wrapArray(cmd.H));
		if (cmd.header)
			relevant.headers = relevant.headers.concat(wrapArray(cmd.header));

		// set method to HEAD?
		if (cmd.I || cmd.head)
			relevant.method = "HEAD";

		// between -X and --request, prefer the long form I guess
    function setMethod(method){
			method = wrapArray(method);
			relevant.method = method[method.length-1].toUpperCase(); // if multiple, use last (according to curl docs)
    }
		if (cmd.request) {
      setMethod(cmd.request);
		} else if (cmd.X) {
      setMethod(cmd.X);
    }

		// join multiple request body data, if any
		var dataAscii = [];
		var dataFiles = [];
		var loadData = function(d) {
      d = wrapArray(d);
			if (!relevant.method)
				relevant.method = "POST";
			for (var i = 0; i < d.length; i++)
			{
				if (d[i].length > 0 && d[i][0] == "@")
					dataFiles.push(d[i].substr(1));
				else
					dataAscii.push(d[i]);
			}
		};
		if (cmd.d)
			loadData(cmd.d);
		if (cmd.data)
			loadData(cmd.data);
		if (dataAscii.length > 0)
			relevant.data.ascii = dataAscii.join("&");
		if (dataFiles.length > 0)
			relevant.data.files = dataFiles;

		// between -u and --user, choose the long form...
		var basicAuthString = "";
		if (cmd.user)
			basicAuthString = cmd.user;
		else if (cmd.u)
			basicAuthString = cmd.u;
		var basicAuthSplit = basicAuthString.indexOf(":");
		if (basicAuthSplit > -1) {
			relevant.basicauth = {
				user: basicAuthString.substr(0, basicAuthSplit),
				pass: basicAuthString.substr(basicAuthSplit+1)
			};
		} else {
			relevant.basicAuth = { user: basicAuthString, pass: "<PASSWORD>" };
		}

		// default to GET if nothing else specified
		if (!relevant.method)
			relevant.method = "GET";

		return relevant;
	}

	function fixUrl(url) {
		if(url && !(new RegExp("^https?://", "i")).test(url)) {
			return "http://" +  url;
		} else {
			return url;
		}
	}

	function toTitleCase(str) {
		return str.replace(/\w*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	function rubyEsc(s) {
		return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	}
}
