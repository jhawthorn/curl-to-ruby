export default function jsonToRuby(json) {
	let type = typeof(json);
	if (json == null) {
		return "nil";
	} else if (type == "boolean") {
		return json.toString();
	} else if (type == "number") {
		return json.toString();
	} else if (type == "string") {
		return '"' + json.toString() + '"';
	} else if (Array.isArray(json)) {
		let ret = "[";
		json.forEach((element) => {
			ret += jsonToRuby(element);
			ret += ", ";
		});
		ret = ret.slice(0, -2);
		ret += "]";
		return ret;
	} else if (type == "object") {
		let ret = "{";
		for (var key in json) {
			ret += jsonToRuby(key);
			ret += " => ";
			ret += jsonToRuby(json[key]);
			ret += ", ";
		}
		ret = ret.slice(0, -2);
		ret += "}";
		return ret;
	} else {
		throw "Invalid JSON object";
	}
}
