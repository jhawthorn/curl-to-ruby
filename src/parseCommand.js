import {parse} from "shell-quote";
import parseArgs from "minimist";

export default function parseCommand(input, options) {
	if (typeof options === 'undefined') {
		options = {};
	}

	var result = {_: []}, // what we return
	    cursor = 0,       // iterator position
	    token = "";       // current token (word or quoted string) being built

  // trim \ at and of line
  input = input.replace(/\\\n/g, '')

	// trim leading $ or # that may have been left in
	input = input.trim();
	if (input.length > 2 && (input[0] == '$' || input[0] == '#') && whitespace(input[1]))
		input = input.substr(1).trim();

  let argv = parse(input);
  let parsed = parseArgs(argv, {boolean: options.boolOptions});

  return parsed;




	// flagSet handles flags and it assumes the current cursor
	// points to a first dash.
	function flagSet() {
		// long flag form?
		if (cursor < input.length-1 && input[cursor+1] == "-") {
			return longFlag();
		}

		// if not, parse short flag form
		cursor++; // skip leading dash
		while (cursor < input.length && !whitespace(input[cursor]))
		{
			var flagName = input[cursor];
			if (typeof result[flagName] == 'undefined') {
				result[flagName] = [];
			}
			cursor++; // skip the flag name
			if (boolFlag(flagName))
				result[flagName] = true;
			else if (Array.isArray(result[flagName]))
				result[flagName].push(nextString());
		}
	}

	// longFlag consumes a "--long-flag" sequence and
	// stores it in result.
	function longFlag() {
		cursor += 2; // skip leading dashes
		var flagName = nextString("=");
		if (boolFlag(flagName))
			result[flagName] = true;
		else {
			if (typeof result[flagName] == 'undefined') {
				result[flagName] = [];
			}
			if (Array.isArray(result[flagName])) {
				result[flagName].push(nextString());
			}
		}
	}

	// unflagged consumes the next string as an unflagged value,
	// storing it in the result.
	function unflagged() {
		result._.push(nextString());
	}

	// boolFlag returns whether a flag is known to be boolean type
	function boolFlag(flag) {
		if (Array.isArray(options.boolFlags)) {
			for (var i = 0; i < options.boolFlags.length; i++) {
				if (options.boolFlags[i] == flag)
					return true;
			}
		}
		return false;
	}

	// nextString skips any leading whitespace and consumes the next
	// space-delimited string value and returns it. If endChar is set,
	// it will be used to determine the end of the string. Normally just
	// unescaped whitespace is the end of the string, but endChar can
	// be used to specify another end-of-string. This function honors \
	// as an escape character and does not include it in the value, except
	// in the special case of the \$ sequence, the backslash is retained
	// so other code can decide whether to treat as an env var or not.
	function nextString(endChar) {
		skipWhitespace();

		var str = "";

		var quoted = false,
			quoteCh = "",
			escaped = false;

		for (; cursor < input.length; cursor++) {
			if (quoted) {
				if (input[cursor] == quoteCh && !escaped) {
					quoted = false;
					continue;
				}
			}
			if (!quoted) {
				if (!escaped) {
					if (whitespace(input[cursor])) {
						return str;
					}
					if (input[cursor] == '"' || input[cursor] == "'") {
						quoted = true;
						quoteCh = input[cursor];
						cursor++;
					}
					if (endChar && input[cursor] == endChar) {
						cursor++; // skip the endChar
						return str;
					}
				}
			}
			if (!escaped && input[cursor] == "\\") {
				escaped = true;
				// skip the backslash unless the next character is $
				if (!(cursor < input.length-1 && input[cursor+1] == '$'))
					continue;
			}
			
			str += input[cursor];
			escaped = false;
		}

		return str;
	}

	// skipWhitespace skips whitespace between tokens, taking into account escaped whitespace.
	function skipWhitespace() {
		for (; cursor < input.length; cursor++) {
			while (input[cursor] == "\\" && (cursor < input.length-1 && whitespace(input[cursor+1])))
				cursor++;
			if (!whitespace(input[cursor]))
				break;
		}
	}

	// whitespace returns true if ch is a whitespace character.
	function whitespace(ch) {
		return ch == " " || ch == "\t" || ch == "\n" || ch == "\r";
	}
}
