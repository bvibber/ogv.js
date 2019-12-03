/*

var O=global.Math.imul
...
q=O(m,e[r+18>>1]|0)|0
...
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
 * @param {string} input_js asm.js code to process
 * @return {string} same code with use of Math.imul stripped.
 */
function strip_imul(input_js) {
  // hacky detection first
  const initialMatch = input_js.match(/(\w+)\s*=\s*global\.Math\.imul/);
  if (!initialMatch) {
    // hack something changed, worry about it later
    console.warn('Did not find Math.imul in emscripten output.');
    return input_js;
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
          node.callee.name === minifiedName &&
          node.arguments.length == 2) {
        // note the arguments length check is a hack
        // it probably means the minifier sometimes
        // reuses the symbol
        path.replace(
          builders.parenthesizedExpression(
            builders.binaryExpression('|',
              builders.binaryExpression('*',
                builders.parenthesizedExpression(node.arguments[0]),
                builders.parenthesizedExpression(node.arguments[1])
              ),
              builders.literal(0)
            )
          )
        );
        //return false;
      }
      this.traverse(path);
    }
  });
  return recast.print(ast).code;
}

function strip_fround(input_js) {
  // hacky detection first
  const initialMatch = input_js.match(/(\w+)\s*=\s*global\.Math\.fround/);
  if (!initialMatch) {
    // hack something changed, worry about it later
    console.warn('Did not find Math.fround in emscripten output.');
    return input_js;
  }
  const minifiedName = initialMatch[1];


  let ast = recast.parse(input_js);
  types.visit(ast, {
    visitCallExpression: function(path) {
      const node = path.node;
      if (node.type === 'CallExpression' &&
          node.callee.type === 'Identifier' &&
          node.callee.name === minifiedName &&
          node.arguments.length == 1) {
        // note the arguments length check is a hack
        // it probably means the minifier sometimes
        // reuses the symbol
        path.replace(
          builders.parenthesizedExpression(node.arguments[0])
        );
        //return false;
      }
      this.traverse(path);
    }
  });
  return recast.print(ast).code;
}

if (require.main !== module) {
  module.exports = strip_imul;
} else {
  // Consume input JS from file in first argument,
  // then write back the processed output in place.
  const fs = require('fs');

  if (process.argv.length > 2) {
    const filename = process.argv[2];
    const input = fs.readFileSync(filename, {
      encoding: 'utf8'
    });
    const output = strip_fround(strip_imul(input));
    fs.writeFileSync(filename, output, {
      encoding: 'utf8'
    });
    process.exit(0);
  } else {
    console.error('Give file to process as argument');
    process.exit(1);
  }
}
