fs = require('fs');

if (process.argv.length < 3) {
	console.error("Usage: node file2def.js filename > module.js");
	process.exit(1);
}

var fileName = process.argv[2];

var contents = fs.readFileSync(fileName, {
	encoding: 'utf8'
});

function addslashes(str) {
	return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\"/g, '\\"');
}

var definition = 'module.exports = "' + addslashes(contents) + '"';

console.log(definition);
process.exit(0);
