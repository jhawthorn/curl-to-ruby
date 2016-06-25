require 'minitest'
require 'minitest/autorun'
require 'execjs'
require 'webrick'

class TestCurlToGo < Minitest::Test
  JS_CONTEXT = ExecJS.compile(File.read("resources/js/curl-to-ruby.js"))

  def test_simple_get
    assert_curl_eq "/"
    assert_curl_eq "/foo.txt"
  end

  def test_post
    assert_curl_eq "/", '-X POST -d "foo"'
    assert_curl_eq "/", '-X POST -d "foobar"'
  end

  def test_headers
    assert_curl_eq "/", '-XPOST -H MyCrazyHeader:foo -d "foo"'
  end

  def test_basic_auth
    assert_curl_eq "/", "-u banana:coconuts"
  end

  def test_complex_post
    assert_curl_eq "/", <<-CURL
     -X POST \
     -u API_KEY: \
     -d 'shipment[to_address][id]=adr_HrBKVA85' \
     -d 'shipment[from_address][id]=adr_VtuTOj7o' \
     -d 'shipment[parcel][id]=prcl_WDv2VzHp' \
     -d 'shipment[is_return]=true' \
     -d 'shipment[customs_info][id]=cstinfo_bl5sE20Y'
     CURL
  end

  def test_simple_data
    assert_curl_eq "/", "-d foo=bar"
  end

  def test_data_file_reference
    assert_curl_eq "/", "-d @README.md"
  end

  def test_query_string
    assert_curl_eq "/curl-to-ruby/?foo=bar", "-d @README.md"
  end

  private

  def assert_curl_eq(path, curl_args="")
    curl_req = normalize_request capture_http { |url|
      system "curl -s -o /dev/null #{url}#{path} #{curl_args}"
    }

    ruby_req = normalize_request capture_http { |url|
      ruby = curl_to_ruby("curl #{url}#{path} #{curl_args}")
      eval(ruby)
    }

    assert_equal curl_req.verb, ruby_req.verb
    assert_equal curl_req.path, ruby_req.path
    assert_equal curl_req.body, ruby_req.body
    assert_equal curl_req.headers, ruby_req.headers
  end

  Request = Struct.new(:verb, :path, :headers, :body)

  def curl_to_ruby(cmd)
    JS_CONTEXT.call("curlToRuby.default", cmd)
  end

  def normalize_request(original)
    headers = original.headers.dup
    headers.delete("accept-encoding")
    headers.delete("user-agent")
    headers.delete("host")
    headers.delete("expect")

    if original.body
      body = original.body
      if headers['content-type'] == ['application/x-www-form-urlencoded']
        # May encode slightly differently
        begin
          body = URI.decode_www_form(body)
          headers.delete("content-length")
        rescue ArgumentError
        end
      end
    end

    Request.new(
      original.verb,
      original.path,
      headers,
      body
    )
  end

  def capture_http
    server = WEBrick::HTTPServer.new(
      Port: 0,
      Logger: WEBrick::Log.new("/dev/null"),
      AccessLog: []
    )
    port = server[:Port]
    request = nil

    thread = Thread.new do
      server.mount_proc('/') do |req, res|
        request = Request.new(
          req.request_method,
          req.path,
          req.header,
          req.body
        )
        res.body = "hello, world"
        server.shutdown
      end

      server.start

      request
    end

    url = "http://127.0.0.1:#{port}"
    yield url, port

    thread.join
    thread.value
  end
end
