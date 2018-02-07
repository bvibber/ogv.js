#!//usr/bin/env node

/*

Math_imul=Math.imul
...
var O=global.Math.imul
...
q=O(m,e[r+18>>1]|0)|0

*/

/**
 * Take JavaScript emscripten output and strip out the use of Math.imul
 * in generated asm.js code in favor of a gross and wrong optimization
 * to use raw multiplication.
 *
 * This WILL FAIL in the general case. Beware.
 *
 * @param {string} input_js
 * @return {string} same code with use of Math.imul stripped.
 */
function strip_imul(input_js) {
  const initialMatch = input_js.match(/var (\w+)=global\.Math\.imul/);
  if (!initialMatch) {
    throw new Error('Did not find Math.imul in emscripten output.');
  }
  const minifiedName = initialMatch[1];
  const re = new RegExp('\\b' + minifiedName + '\\b\\((.*?),(.*?)\\)', 'g');
  return input_js.replace(re, (match, p1, p2) => {
    return '(' + p1 + ')*(' + p2 + ')';
  });
}

if (require.main !== module) {
  module.exports = strip_imul;
} else {
  // Consume input JS from stdin as utf-8
  let input = '';

  const stdin = process.stdin;
  stdin.setEncoding('utf8');
  stdin.on('readable', () => {
    const chunk = stdin.read()
    if (chunk !== null) {
      input += chunk;
    }
  });
  stdin.on('end', () => {
    let output = strip_imul(input);
    process.stdout.write(output);
    process.exit(0);
  });
}
