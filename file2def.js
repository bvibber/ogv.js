fs = require('fs');

if (process.argv.length < 4) {
	console.error("Usage: node file2def.js filename MACRO_NAME > output");
	process.exit(1);
}

var fileName = process.argv[2];
var macroName = process.argv[3];

var contents = fs.readFileSync(fileName, {
	encoding: 'utf8'
});

function addslashes(str) {
	return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\"/g, '\\"');
}

var line = '#define ' + macroName + ' "' + addslashes(contents) + '"';

console.log(line);
process.exit(0);
