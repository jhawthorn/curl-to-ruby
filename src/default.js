import curlToRuby from "./curlToRuby";
import $ from "jquery";
import hljs from "./highlight.pack.js";

$(function(){
	var emptyOutputMsg = "Ruby code will appear here";
	var formattedEmptyOutputMsg = '<span style="color: #777;">'+emptyOutputMsg+'</span>';

	function updateOutput() {
		var input = $(this).val();
		if (!input) {
			$('#output').html(formattedEmptyOutputMsg);
			return;
		}

		try {
			var output = curlToRuby(input);
			if (output) {
				var coloredOutput = hljs.highlight("ruby", output);
				$('#output').html(coloredOutput.value);
			}
		} catch (e) {
		 	$('#output').html('<span class="clr-red">'+e+'</span>');
		}
	}
	updateOutput();

	// Update placeholder text
	$('#input').on('focus, blur, keyup', updateOutput);

	// Highlights the output for the user
	$('#output').click(function() {
		if (document.selection) {
			var range = document.body.createTextRange();
			range.moveToElementText(this);
			range.select();
		} else if (window.getSelection) {
			var range = document.createRange();
			range.selectNode(this);
			window.getSelection().addRange(range);
		}
	});

	// Fill in examples
	$('#example1').click(function() {
		$('#input').val('curl echoip.com').keyup();
	});
	$('#example2').click(function() {
		$('#input').val('curl https://api.example.com/surprise \\\n     -u banana:coconuts \\\n     -d "sample data"').keyup();
	});
	$('#example3').click(function() {
		$('#input').val('curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer b7d03a6947b217efb6f3ec3bd3504582" -d \'{"type":"A","name":"www","data":"162.10.66.0","priority":null,"port":null,"weight":null}\' "https://api.digitalocean.com/v2/domains/example.com/records"').keyup();
	});
	$('#example4').click(function() {
		$('#input').val('curl -u "demo" -X POST -d @file1.txt -d @file2.txt https://example.com/upload').keyup();
	});
	$('#example5').click(function() {
		$('#input').val("curl -X POST https://api.easypost.com/v2/shipments \\\n     -u API_KEY: \\\n     -d 'shipment[to_address][id]=adr_HrBKVA85' \\\n     -d 'shipment[from_address][id]=adr_VtuTOj7o' \\\n     -d 'shipment[parcel][id]=prcl_WDv2VzHp' \\\n     -d 'shipment[is_return]=true' \\\n     -d 'shipment[customs_info][id]=cstinfo_bl5sE20Y'").keyup();
	});

});
