import {parse} from "shell-quote";

export default function parseCommand(input, options) {
  if (typeof options === 'undefined') {
    options = {};
  }

  // trim \ at and of line
  input = input.replace(/\\\n/g, '');
  input = input.trim();

  let argv = parse(input);

  let argObj = {_: []};

  function setFlag(name, value) {
    argObj[name] || (argObj[name] = []);
    argObj[name].push(value);
  }

  while(argv.length) {
    let flag = argv.shift();

    /* Assume globs are typos/missing qutotes/shell-quote sillyness w */
    if (flag.op == 'glob') {
      flag = flag.pattern;
    }

    if (flag[0] == '-'){
      flag = flag.substring(1, flag.length);
      if (flag[0] == '-') { /* long argument */
	flag = flag.substring(1, flag.length);
	if (boolFlag(flag)) {
	  argObj[flag] = true;
	} else {
	  if (flag.indexOf('=') > 0) {
	    let flagName = flag.substring(0, flag.indexOf('='));
	    setFlag(flagName, flag.substring(flag.indexOf('=')+1, flag.length));
	  } else {
	    setFlag(flag, argv.shift());
	  }
	}
      } else {
	if (boolFlag(flag)) {
	  argObj[flag] = true;
	} else if(flag.length > 1) {
	  setFlag(flag[0], flag.substring(1, flag.length));
	} else {
	  setFlag(flag[0], argv.shift());
	}
      }
      if (boolFlag(flag)) {
	argObj[flag] = true;
      }
    } else {
      setFlag('_', flag);
    }
  }

  return argObj;

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
}
