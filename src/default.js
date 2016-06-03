import curlToRuby from "./curlToRuby";
import hljs from "./highlight.pack.js";

function init() {
  const emptyOutputMsg = "Ruby code will appear here";
  const formattedEmptyOutputMsg = '<span style="color: #777;">'+emptyOutputMsg+'</span>';

  function getOutputHTML(input) {
    if (!input) {
      return formattedEmptyOutputMsg;
    }

    try {
      const output = curlToRuby(input);
      if (output) {
	const coloredOutput = hljs.highlight("ruby", output);
	return coloredOutput.value;
      }
    } catch (e) {
      console.log(e);
      return '<span class="clr-red">'+e+'</span>';
    }
  }

  function updateOutput() {
    const input = document.getElementById('input').value;
    const output = document.getElementById('output');

    output.innerHTML = getOutputHTML(input);
  }

  // Update placeholder text
  ['focus', 'blur', 'keyup'].forEach((ev) => {
    document.getElementById('input').addEventListener(ev, updateOutput);
  });
  updateOutput();

  // Highlights the output for the user
  document.getElementById('output').addEventListener('click', function() {
    if (document.selection) {
      const range = document.body.createTextRange();
      range.moveToElementText(this);
      range.select();
    } else if (window.getSelection) {
      const range = document.createRange();
      range.selectNode(this);
      window.getSelection().addRange(range);
    }
  });

  window.useExample = function(name) {
    const example = document.getElementById(name).innerHTML.trim();
    const input = document.getElementById('input');
    input.value = example;
    updateOutput();
  }
}

if (document.readyState != 'loading'){
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
