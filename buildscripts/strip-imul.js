#!//usr/bin/env node

/*

Math_imul=Math.imul
...
var O=global.Math.imul
...
q=O(m,e[r+18>>1]|0)|0


O(i+-1|0,d[5399+(p*3|0).... can have nested internals

*/

const recast = require('recast');
const types = require('ast-types');
const builders = types.builders;

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
  // hacky detection first
  const initialMatch = input_js.match(/var (\w+)=global\.Math\.imul/);
  if (!initialMatch) {
    throw new Error('Did not find Math.imul in emscripten output.');
  }
  const minifiedName = initialMatch[1];


  // This regex fails on nested parens and stuff.
  /*
  const re = new RegExp('\\b' + minifiedName + '\\b\\((.*?),(.*?)\\)', 'g');
  return input_js.replace(re, (match, p1, p2) => {
    let rep = '((' + p1 + ')*(' + p2 + '))';
    console.error(match, p1, p2, rep);
    return rep;
  });
  */

  let ast = recast.parse(input_js);
  types.visit(ast, {
    visitCallExpression: function(path) {
      const node = path.node;
      if (node.type === 'CallExpression' &&
          node.callee.type === 'Identifier' &&
          node.callee.name === minifiedName) {
        path.replace(
          builders.parenthesizedExpression(
            builders.binaryExpression('|',
              builders.parenthesizedExpression(
                builders.binaryExpression('*',
                  builders.parenthesizedExpression(node.arguments[0]),
                  builders.parenthesizedExpression(node.arguments[1])
                )
              ),
              types.builders.literal(0))
            )
          );
        return false;
      }
      this.traverse(path);
    }
  });
  return recast.print(ast).code;
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
