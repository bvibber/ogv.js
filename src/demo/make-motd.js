var http = require('http');
var url = require('url');
var querystring = require('querystring');

var motd = {};


/**
 * Make a call to Commons API
 *
 * @param object params
 * @param function(jsonData) callback
 */
function commonsApi(params, callback) {
	var baseUrl = 'https://commons.wikimedia.org/w/api.php';
	params.format = 'json';
	var data = querystring.stringify(params);
	var post = http.request({
		hostname: 'commons.wikimedia.org',
		path: '/w/api.php',
		port: 80,
		method: 'POST',
		headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
		}
	}, function(response) {
		var result = '';
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			result += chunk;
		});
		response.on('end', function() {
			callback(JSON.parse(result));
		});
	});
	post.write(data);
	post.end();
}

function fetchMediaList(callback) {
	function pad00(n) {
		if (n < 10) {
			return '0' + n;
		} else {
			return '' + n;
		}
	}
	
	var today = new Date(),
		year = 2013,
		month = 10,
		day = 28; // where we left off in motd.js

	var input = '';
	while (true) {
		if ((year > today.getUTCFullYear()) ||
			(year == today.getUTCFullYear() && month > (today.getUTCMonth() + 1)) ||
			(year == today.getUTCFullYear() && month == (today.getUTCMonth() + 1) && day > today.getUTCDate())) {
			break;
		}
		var ymd = year +
				'-' +
				pad00(month) +
				'-' +
				pad00(day);
		var line = ymd + '|{{Motd/' + ymd + '}}\n';
		input += line;

		day++;
		if (day > 31) {
			day = 1;
			month++;
			if (month > 12) {
				month = 1;
				year++;
			}
		}
	}

	commonsApi({
		action: 'expandtemplates',
		text: input
	}, function(data, err) {
		var output = data.expandtemplates['*'],
			lines = output.split('\n');
		lines.forEach(function(line) {
			var bits = line.split('|'),
				date = bits[0],
				filename = bits[1];
			if (filename && !filename.match(/\.gif$/i)) {
				//console.log(filename);
				motd[date] = filename;
			} else {
				//console.log('motd update skipping ' + filename);
			}
		});
		callback();
	});
}

fetchMediaList(function() {
	console.log('var motd = ' + JSON.stringify(motd));
});
