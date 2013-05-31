var OpusDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('opus', this);
    
    var Module = {};
    // Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((ptr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 20196;
assert(STATICTOP < TOTAL_MEMORY);
allocate([106,28,141,56,82,187,30,58,8,105,220,58,130,237,87,59,137,99,178,59,3,42,5,60,48,220,57,60,180,62,119,60,28,163,158,60,209,242,197,60,254,134,241,60,155,171,16,61,5,173,42,61,132,194,70,61,83,230,100,61,17,137,130,61,135,159,147,61,203,178,165,61,209,190,184,61,58,191,204,61,84,175,225,61,20,138,247,61,14,37,7,62,217,244,18,62,95,49,31,62,104,215,43,62,138,227,56,62,48,82,70,62,148,31,84,62,191,71,98,62,142,198,112,62,176,151,127,62,82,91,135,62,96,15,143,62,152,229,150,62,121,219,158,62,112,238,166,62,216,27,175,62,251,96,183,62,17,187,191,62,70,39,200,62,183,162,208,62,120,42,217,62,148,187,225,62,12,83,234,62,222,237,242,62,6,137,251,62,190,16,2,63,31,90,6,63,36,159,10,63,80,222,14,63,43,22,19,63,65,69,23,63,37,106,27,63,115,131,31,63,206,143,35,63,230,141,39,63,116,124,43,63,63,90,47,63,25,38,51,63,231,222,54,63,153,131,58,63,51,19,62,63,197,140,65,63,119,239,68,63,127,58,72,63,39,109,75,63,206,134,78,63,229,134,81,63,241,108,84,63,142,56,87,63,105,233,89,63,69,127,92,63,250,249,94,63,115,89,97,63,175,157,99,63,193,198,101,63,207,212,103,63,17,200,105,63,210,160,107,63,110,95,109,63,80,4,111,63,244,143,112,63,230,2,114,63,189,93,115,63,31,161,116,63,191,205,117,63,87,228,118,63,176,229,119,63,151,210,120,63,227,171,121,63,115,114,122,63,39,39,123,63,231,202,123,63,157,94,124,63,53,227,124,63,156,89,125,63,189,194,125,63,134,31,126,63,222,112,126,63,171,183,126,63,207,244,126,63,38,41,127,63,134,85,127,63,190,122,127,63,150,153,127,63,204,178,127,63,20,199,127,63,28,215,127,63,130,227,127,63,221,236,127,63,182,243,127,63,138,248,127,63,200,251,127,63,214,253,127,63,7,255,127,63,165,255,127,63,232,255,127,63,253,255,127,63,0,0,128,63], "i8", ALLOC_NONE, 5242880);
allocate([126,124,119,109,87,41,19,9,4,2,0] /* ~|wmW)\13\09\04\02\0 */, "i8", ALLOC_NONE, 5243360);
allocate([0,255,0,255,0,255,0,255,0,255,0,254,1,0,1,255,0,254,0,253,2,0,1,255,0,254,0,253,3,0,1,255], "i8", ALLOC_NONE, 5243372);
allocate([2,1,0] /* \02\01\00 */, "i8", ALLOC_NONE, 5243404);
allocate([25,23,2,0] /* \19\17\02\00 */, "i8", ALLOC_NONE, 5243408);
allocate([2,1,0] /* \02\01\00 */, "i8", ALLOC_NONE, 5243412);
allocate([224,192,160,128,96,64,32,0] /* \E0\C0\A0\80`@ \00 */, "i8", ALLOC_NONE, 5243416);
allocate([213,171,128,85,43,0] /* \D5\AB\80U+\00 */, "i8", ALLOC_NONE, 5243424);
allocate([205,154,102,51,0] /* \CD\9Af3\00 */, "i8", ALLOC_NONE, 5243432);
allocate([192,128,64,0] /* \C0\80@\00 */, "i8", ALLOC_NONE, 5243440);
allocate([171,85,0] /* \ABU\00 */, "i8", ALLOC_NONE, 5243444);
allocate([230,0] /* \E6\00 */, "i8", ALLOC_NONE, 5243448);
allocate([232,158,10,0] /* \E8\9E\0A\00 */, "i8", ALLOC_NONE, 5243452);
allocate([92,202,190,216,182,223,154,226,156,230,120,236,122,244,204,252,52,3,134,11,136,19,100,25,102,29,74,32,66,39,164,53], "i8", ALLOC_NONE, 5243456);
allocate([249,247,246,245,244,234,210,202,201,200,197,174,82,59,56,55,54,46,22,12,11,10,9,7,0] /* \F9\F7\F6\F5\F4\EA\D */, "i8", ALLOC_NONE, 5243488);
allocate([64,0] /* @\00 */, "i8", ALLOC_NONE, 5243516);
allocate([254,49,67,77,82,93,99,198,11,18,24,31,36,45,255,46,66,78,87,94,104,208,14,21,32,42,51,66,255,94,104,109,112,115,118,248,53,69,80,88,95,102] /* \FE1CMR]c\C6\0B\12\1 */, "i8", ALLOC_NONE, 5243520);
allocate([0,0,2,5,9,14,20,27,35,44,54,65,77,90,104,119,135] /* \00\00\02\05\09\0E\1 */, "i8", ALLOC_NONE, 5243564);
allocate([130,0,200,58,0,231,130,26,0,244,184,76,12,0,249,214,130,43,6,0,252,232,173,87,24,3,0,253,241,203,131,56,14,2,0,254,246,221,167,94,35,8,1,0,254,249,232,193,130,65,23,5,1,0,255,251,239,211,162,99,45,15,4,1,0,255,251,243,223,186,131,74,33,11,3,1,0,255,252,245,230,202,158,105,57,24,8,2,1,0,255,253,247,235,214,179,132,84,44,19,7,2,1,0,255,254,250,240,223,196,159,112,69,36,15,6,2,1,0,255,254,253,245,231,209,176,136,93,55,27,11,3,2,1,0,255,254,253,252,239,221,194,158,117,76,42,18,4,3,2,1,0] /* \82\00\C8:\00\E7\82\ */, "i8", ALLOC_NONE, 5243584);
allocate([129,0,203,54,0,234,129,23,0,245,184,73,10,0,250,215,129,41,5,0,252,232,173,86,24,3,0,253,240,200,129,56,15,2,0,253,244,217,164,94,38,10,1,0,253,245,226,189,132,71,27,7,1,0,253,246,231,203,159,105,56,23,6,1,0,255,248,235,213,179,133,85,47,19,5,1,0,255,254,243,221,194,159,117,70,37,12,2,1,0,255,254,248,234,208,171,128,85,48,22,8,2,1,0,255,254,250,240,220,189,149,107,67,36,16,6,2,1,0,255,254,251,243,227,201,166,128,90,55,29,13,5,2,1,0,255,254,252,246,234,213,183,147,109,73,43,22,10,4,2,1,0] /* \81\00\CB6\00\EA\81\ */, "i8", ALLOC_NONE, 5243736);
allocate([129,0,207,50,0,236,129,20,0,245,185,72,10,0,249,213,129,42,6,0,250,226,169,87,27,4,0,251,233,194,130,62,20,4,0,250,236,207,160,99,47,17,3,0,255,240,217,182,131,81,41,11,1,0,255,254,233,201,159,107,61,20,2,1,0,255,249,233,206,170,128,86,50,23,7,1,0,255,250,238,217,186,148,108,70,39,18,6,1,0,255,252,243,226,200,166,128,90,56,30,13,4,1,0,255,252,245,231,209,180,146,110,76,47,25,11,4,1,0,255,253,248,237,219,194,163,128,93,62,37,19,8,3,1,0,255,254,250,241,226,205,177,145,111,79,51,30,15,6,2,1,0] /* \81\00\CF2\00\EC\81\ */, "i8", ALLOC_NONE, 5243888);
allocate([128,0,214,42,0,235,128,21,0,244,184,72,11,0,248,214,128,42,7,0,248,225,170,80,25,5,0,251,236,198,126,54,18,3,0,250,238,211,159,82,35,15,5,0,250,231,203,168,128,88,53,25,6,0,252,238,216,185,148,108,71,40,18,4,0,253,243,225,199,166,128,90,57,31,13,3,0,254,246,233,212,183,147,109,73,44,23,10,2,0,255,250,240,223,198,166,128,90,58,33,16,6,1,0,255,251,244,231,210,181,146,110,75,46,25,12,5,1,0,255,253,248,238,221,196,164,128,92,60,35,18,8,3,1,0,255,253,249,242,229,208,180,146,110,76,48,27,14,7,3,1,0] /* \80\00\D6_\00\EB\80\ */, "i8", ALLOC_NONE, 5244040);
allocate([189,0,168,253,105,2,103,119,117,0,97,255,210,251,8,116,52,0,221,0,168,246,116,110,252,255,17,2,234,242,229,102,208,255,246,2,140,240,165,93,176,255,137,3,117,239,6,83,157,255,204,3,130,239,102,71,149,255,199,3,139,240,39,59,153,255,128,3,97,242,174,46,165,255,5,3,207,244,94,34,185,255,99,2,161,247,152,22,210,255,169,1,161,250,180,11], "i8", ALLOC_NONE, 5244192);
allocate([241,190,178,132,87,74,41,14,0,223,193,157,140,106,57,39,18,0], "i8", ALLOC_NONE, 5244288);
allocate([125,51,26,18,15,12,11,10,9,8,7,6,5,4,3,2,1,0,198,105,45,22,15,12,11,10,9,8,7,6,5,4,3,2,1,0,213,162,116,83,59,43,32,24,18,15,12,9,7,6,5,3,2,0,239,187,116,59,28,16,11,10,9,8,7,6,5,4,3,2,1,0,250,229,188,135,86,51,30,19,13,10,8,6,5,4,3,2,1,0,249,235,213,185,156,128,103,83,66,53,42,33,26,21,17,13,10,0,254,249,235,206,164,118,77,46,27,16,10,7,5,4,3,2,1,0,255,253,249,239,220,191,156,119,85,57,37,23,15,10,6,4,2,0,255,253,251,246,237,223,203,179,152,124,98,75,55,40,29,21,15,0,255,254,253,247,220,162,106,67,42,28,18,12,9,6,4,3,2,0], "i8", ALLOC_NONE, 5244308);
allocate([253,250,244,233,212,182,150,131,120,110,98,85,72,60,49,40,32,25,19,15,13,11,9,8,7,6,5,4,3,2,1,0] /* \FD\FA\F4\E9\D4\B6\9 */, "i8", ALLOC_NONE, 5244488);
allocate([210,208,206,203,199,193,183,168,142,104,74,52,37,27,20,14,10,6,4,2,0] /* \D2\D0\CE\CB\C7\C1\B */, "i8", ALLOC_NONE, 5244520);
allocate([223,201,183,167,152,138,124,111,98,88,79,70,62,56,50,44,39,35,31,27,24,21,18,16,14,12,10,8,6,4,3,2,1,0] /* \DF\C9\B7\A7\98\8A|o */, "i8", ALLOC_NONE, 5244544);
allocate([188,176,155,138,119,97,67,43,26,10,0] /* \BC\B0\9B\8AwaC+\1A\ */, "i8", ALLOC_NONE, 5244580);
allocate([165,119,80,61,47,35,27,20,14,9,4,0] /* \A5wP=/#\1B\14\0E\09 */, "i8", ALLOC_NONE, 5244592);
allocate([113,63,0] /* q?\00 */, "i8", ALLOC_NONE, 5244604);
allocate([120,0] /* x\00 */, "i8", ALLOC_NONE, 5244608);
allocate([224,112,44,15,3,2,1,0,254,237,192,132,70,23,4,0,255,252,226,155,61,11,2,0], "i8", ALLOC_NONE, 5244612);
allocate([250,245,234,203,71,50,42,38,35,33,31,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0] /* \FA\F5\EA\CBG2_&#!\1 */, "i8", ALLOC_NONE, 5244636);
allocate([42,175,213,201,207,255,64,0,17,0,99,255,97,1,16,254,163,0,39,43,189,86,217,255,6,0,91,0,86,255,186,0,23,0,128,252,192,24,216,77,237,255,220,255,102,0,167,255,232,255,72,1,73,252,8,10,37,62], "i8", ALLOC_NONE, 5244680);
allocate([135,199,61,201,64,0,128,0,134,255,36,0,54,1,0,253,72,2,51,36,69,69,12,0,128,0,18,0,114,255,32,1,139,255,159,252,27,16,123,56], "i8", ALLOC_NONE, 5244740);
allocate([148,107,103,196,17,0,12,0,8,0,1,0,246,255,234,255,226,255,224,255,234,255,3,0,44,0,100,0,168,0,243,0,61,1,125,1,173,1,199,1], "i8", ALLOC_NONE, 5244780);
allocate([228,87,5,197,3,0,242,255,236,255,241,255,2,0,25,0,37,0,25,0,240,255,185,255,149,255,177,255,50,0,36,1,111,2,214,3,8,5,184,5], "i8", ALLOC_NONE, 5244820);
allocate([230,62,198,196,243,255,0,0,20,0,26,0,5,0,225,255,213,255,252,255,65,0,90,0,7,0,99,255,8,255,212,255,81,2,47,6,52,10,199,12], "i8", ALLOC_NONE, 5244860);
allocate([104,2,13,200,246,255,39,0,58,0,210,255,172,255,120,0,184,0,197,254,227,253,4,5,4,21,64,35], "i8", ALLOC_NONE, 5244900);
allocate([100,0,240,0,32,0,100,0], "i8", ALLOC_NONE, 5244928);
allocate([243,221,192,181,0] /* \F3\DD\C0\B5\00 */, "i8", ALLOC_NONE, 5244936);
allocate([175,148,160,176,178,173,174,164,177,174,196,182,198,192,182,68,62,66,60,72,117,85,90,118,136,151,142,160,142,155] /* \AF\94\A0\B0\B2\AD\A */, "i8", ALLOC_NONE, 5244944);
allocate([179,138,140,148,151,149,153,151,163,116,67,82,59,92,72,100,89,92] /* \B3\8A\8C\94\97\95\9 */, "i8", ALLOC_NONE, 5244976);
allocate([100,40,16,7,3,1,0] /* d(\10\07\03\01\00 */, "i8", ALLOC_NONE, 5244996);
allocate([100,0,3,0,40,0,3,0,3,0,3,0,5,0,14,0,14,0,10,0,11,0,3,0,8,0,9,0,7,0,3,0,91,1], "i8", ALLOC_NONE, 5245004);
allocate([250,0,3,0,6,0,3,0,3,0,3,0,4,0,3,0,3,0,3,0,205,1], "i8", ALLOC_NONE, 5245040);
allocate([32,0,16,0,102,38,171,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245064);
allocate([32,0,10,0,20,46,100,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245100);
allocate([255,254,253,244,12,3,2,1,0,255,254,252,224,38,3,2,1,0,255,254,251,209,57,4,2,1,0,255,254,244,195,69,4,2,1,0,255,251,232,184,84,7,2,1,0,255,254,240,186,86,14,2,1,0,255,254,239,178,91,30,5,1,0,255,248,227,177,100,19,2,1,0] /* \FF\FE\FD\F4\0C\03\0 */, "i8", ALLOC_NONE, 5245136);
allocate([255,254,253,238,14,3,2,1,0,255,254,252,218,35,3,2,1,0,255,254,250,208,59,4,2,1,0,255,254,246,194,71,10,2,1,0,255,252,236,183,82,8,2,1,0,255,252,235,180,90,17,2,1,0,255,248,224,171,97,30,4,1,0,255,254,236,173,95,37,7,1,0] /* \FF\FE\FD\EE\0E\03\0 */, "i8", ALLOC_NONE, 5245208);
allocate([0,0,0,0,0,0,0,1,100,102,102,68,68,36,34,96,164,107,158,185,180,185,139,102,64,66,36,34,34,0,1,32,208,139,141,191,152,185,155,104,96,171,104,166,102,102,102,132,1,0,0,0,0,16,16,0,80,109,78,107,185,139,103,101,208,212,141,139,173,153,123,103,36,0,0,0,0,0,0,1,48,0,0,0,0,0,0,32,68,135,123,119,119,103,69,98,68,103,120,118,118,102,71,98,134,136,157,184,182,153,139,134,208,168,248,75,189,143,121,107,32,49,34,34,34,0,17,2,210,235,139,123,185,137,105,134,98,135,104,182,100,183,171,134,100,70,68,70,66,66,34,131,64,166,102,68,36,2,1,0,134,166,102,68,34,34,66,132,212,246,158,139,107,107,87,102,100,219,125,122,137,118,103,132,114,135,137,105,171,106,50,34,164,214,141,143,185,151,121,103,192,34,0,0,0,0,0,1,208,109,74,187,134,249,159,137,102,110,154,118,87,101,119,101,0,2,0,36,36,66,68,35,96,164,102,100,36,0,2,33,167,138,174,102,100,84,2,2,100,107,120,119,36,197,24,0] /* \00\00\00\00\00\00\0 */, "i8", ALLOC_NONE, 5245280);
allocate([16,0,0,0,0,99,66,36,36,34,36,34,34,34,34,83,69,36,52,34,116,102,70,68,68,176,102,68,68,34,65,85,68,84,36,116,141,152,139,170,132,187,184,216,137,132,249,168,185,139,104,102,100,68,68,178,218,185,185,170,244,216,187,187,170,244,187,187,219,138,103,155,184,185,137,116,183,155,152,136,132,217,184,184,170,164,217,171,155,139,244,169,184,185,170,164,216,223,218,138,214,143,188,218,168,244,141,136,155,170,168,138,220,219,139,164,219,202,216,137,168,186,246,185,139,116,185,219,185,138,100,100,134,100,102,34,68,68,100,68,168,203,221,218,168,167,154,136,104,70,164,246,171,137,139,137,155,218,219,139] /* \10\00\00\00\00cB$$\ */, "i8", ALLOC_NONE, 5245536);
allocate([255,255,255,156,4,154,255,255,255,255,255,227,102,15,92,255,255,255,255,255,213,83,24,72,236,255,255,255,255,150,76,33,63,214,255,255,255,190,121,77,43,55,185,255,255,255,245,137,71,43,59,139,255,255,255,255,131,66,50,66,107,194,255,255,166,116,76,55,53,125,255,255] /* \FF\FF\FF\9C\04\9A\F */, "i8", ALLOC_NONE, 5245696);
allocate([255,255,255,131,6,145,255,255,255,255,255,236,93,15,96,255,255,255,255,255,194,83,25,71,221,255,255,255,255,162,73,34,66,162,255,255,255,210,126,73,43,57,173,255,255,255,201,125,71,48,58,130,255,255,255,166,110,73,57,62,104,210,255,255,251,123,65,55,68,100,171,255] /* \FF\FF\FF\83\06\91\F */, "i8", ALLOC_NONE, 5245768);
allocate([225,204,201,184,183,175,158,154,153,135,119,115,113,110,109,99,98,95,79,68,52,50,48,45,43,32,31,27,18,10,3,0,255,251,235,230,212,201,196,182,167,166,163,151,138,124,110,104,90,78,76,70,69,57,45,34,24,21,11,6,5,4,3,0] /* \E1\CC\C9\B8\B7\AF\9 */, "i8", ALLOC_NONE, 5245840);
allocate([212,178,148,129,108,96,85,82,79,77,61,59,57,56,51,49,48,45,42,41,40,38,36,34,31,30,21,12,10,3,1,0,255,245,244,236,233,225,217,203,190,176,175,161,149,136,125,114,102,91,81,71,60,52,43,35,28,20,19,18,12,11,5,0] /* \D4\B2\94\81l`UROM=; */, "i8", ALLOC_NONE, 5245904);
allocate([7,23,38,54,69,85,100,116,131,147,162,178,193,208,223,239,13,25,41,55,69,83,98,112,127,142,157,171,187,203,220,236,15,21,34,51,61,78,92,106,126,136,152,167,185,205,225,240,10,21,36,50,63,79,95,110,126,141,157,173,189,205,221,237,17,20,37,51,59,78,89,107,123,134,150,164,184,205,224,240,10,15,32,51,67,81,96,112,129,142,158,173,189,204,220,236,8,21,37,51,65,79,98,113,126,138,155,168,179,192,209,218,12,15,34,55,63,78,87,108,118,131,148,167,185,203,219,236,16,19,32,36,56,79,91,108,118,136,154,171,186,204,220,237,11,28,43,58,74,89,105,120,135,150,165,180,196,211,226,241,6,16,33,46,60,75,92,107,123,137,156,169,185,199,214,225,11,19,30,44,57,74,89,105,121,135,152,169,186,202,218,234,12,19,29,46,57,71,88,100,120,132,148,165,182,199,216,233,17,23,35,46,56,77,92,106,123,134,152,167,185,204,222,237,14,17,45,53,63,75,89,107,115,132,151,171,188,206,221,240,9,16,29,40,56,71,88,103,119,137,154,171,189,205,222,237,16,19,36,48,57,76,87,105,118,132,150,167,185,202,218,236,12,17,29,54,71,81,94,104,126,136,149,164,182,201,221,237,15,28,47,62,79,97,115,129,142,155,168,180,194,208,223,238,8,14,30,45,62,78,94,111,127,143,159,175,192,207,223,239,17,30,49,62,79,92,107,119,132,145,160,174,190,204,220,235,14,19,36,45,61,76,91,108,121,138,154,172,189,205,222,238,12,18,31,45,60,76,91,107,123,138,154,171,187,204,221,236,13,17,31,43,53,70,83,103,114,131,149,167,185,203,220,237,17,22,35,42,58,78,93,110,125,139,155,170,188,206,224,240,8,15,34,50,67,83,99,115,131,146,162,178,193,209,224,239,13,16,41,66,73,86,95,111,128,137,150,163,183,206,225,241,17,25,37,52,63,75,92,102,119,132,144,160,175,191,212,231,19,31,49,65,83,100,117,133,147,161,174,187,200,213,227,242,18,31,52,68,88,103,117,126,138,149,163,177,192,207,223,239,16,29,47,61,76,90,106,119,133,147,161,176,193,209,224,240,15,21,35,50,61,73,86,97,110,119,129,141,175,198,218,237] /* \07\17&6EUdt\83\93\A */, "i8", ALLOC_NONE, 5245968);
allocate([12,35,60,83,108,132,157,180,206,228,15,32,55,77,101,125,151,175,201,225,19,42,66,89,114,137,162,184,209,230,12,25,50,72,97,120,147,172,200,223,26,44,69,90,114,135,159,180,205,225,13,22,53,80,106,130,156,180,205,228,15,25,44,64,90,115,142,168,196,222,19,24,62,82,100,120,145,168,190,214,22,31,50,79,103,120,151,170,203,227,21,29,45,65,106,124,150,171,196,224,30,49,75,97,121,142,165,186,209,229,19,25,52,70,93,116,143,166,192,219,26,34,62,75,97,118,145,167,194,217,25,33,56,70,91,113,143,165,196,223,21,34,51,72,97,117,145,171,196,222,20,29,50,67,90,117,144,168,197,221,22,31,48,66,95,117,146,168,196,222,24,33,51,77,116,134,158,180,200,224,21,28,70,87,106,124,149,170,194,217,26,33,53,64,83,117,152,173,204,225,27,34,65,95,108,129,155,174,210,225,20,26,72,99,113,131,154,176,200,219,34,43,61,78,93,114,155,177,205,229,23,29,54,97,124,138,163,179,209,229,30,38,56,89,118,129,158,178,200,231,21,29,49,63,85,111,142,163,193,222,27,48,77,103,133,158,179,196,215,232,29,47,74,99,124,151,176,198,220,237,33,42,61,76,93,121,155,174,207,225,29,53,87,112,136,154,170,188,208,227,24,30,52,84,131,150,166,186,203,229,37,48,64,84,104,118,156,177,201,230] /* \0C#_Sl\84\9D\B4\CE\ */, "i8", ALLOC_NONE, 5246480);
allocate([0,15,8,7,4,11,12,3,2,13,10,5,6,9,14,1] /* \00\0F\08\07\04\0B\0 */, "i8", ALLOC_NONE, 5246800);
allocate([0,9,6,3,4,5,8,1,2,7] /* \00\09\06\03\04\05\0 */, "i8", ALLOC_NONE, 5246816);
allocate([128,64,0] /* \80@\00 */, "i8", ALLOC_NONE, 5246828);
allocate(12, "i8", ALLOC_NONE, 5246832);
allocate([179,99,0] /* \B3c\00 */, "i8", ALLOC_NONE, 5246844);
allocate([250,27,61,39,5,245,42,88,4,1,254,60,65,6,252,255,251,73,56,1,247,19,94,29,247,0,12,99,6,4,8,237,102,46,243,3,2,13,3,2,9,235,84,72,238,245,46,104,234,8,18,38,48,23,0,240,70,83,235,11,5,245,117,22,248,250,23,117,244,3,3,248,95,28,4,246,15,77,60,241,255,4,124,2,252,3,38,84,24,231,2,13,42,13,31,21,252,56,46,255,255,35,79,243,19,249,65,88,247,242,20,4,81,49,227,20,0,75,3,239,5,247,44,92,248,1,253,22,69,31,250,95,41,244,5,39,67,16,252,1,0,250,120,55,220,243,44,122,4,232,81,5,11,3,7,2,0,9,10,88], "i8", ALLOC_NONE, 5246848);
allocate([13,22,39,23,12,255,36,64,27,250,249,10,55,43,17,1,1,8,1,1,6,245,74,53,247,244,55,76,244,8,253,3,93,27,252,26,39,59,3,248,2,0,77,11,9,248,22,44,250,7,40,9,26,3,9,249,20,101,249,4,3,248,42,26,0,241,33,68,2,23,254,55,46,254,15,3,255,21,16,41], "i8", ALLOC_NONE, 5247008);
allocate([4,6,24,7,5,0,0,2,0,0,12,28,41,13,252,247,15,42,25,14,1,254,62,41,247,246,37,65,252,3,250,4,66,7,248,16,14,38,253,33], "i8", ALLOC_NONE, 5247088);
allocate(12, "i8", ALLOC_NONE, 5247128);
allocate([241,225,211,199,187,175,164,153,142,132,123,114,105,96,88,80,72,64,57,50,44,38,33,29,24,20,16,12,9,5,2,0] /* \F1\E1\D3\C7\BB\AF\A */, "i8", ALLOC_NONE, 5247140);
allocate([199,165,144,124,109,96,84,71,61,51,42,32,23,15,8,0] /* \C7\A5\90|m`TG=3_ \1 */, "i8", ALLOC_NONE, 5247172);
allocate([71,56,43,30,21,12,6,0] /* G8+\1E\15\0C\06\00 */, "i8", ALLOC_NONE, 5247188);
allocate([205,60,0,48,0,32], "i8", ALLOC_NONE, 5247196);
allocate([0,32,254,31,246,31,234,31,216,31,194,31,168,31,136,31,98,31,58,31,10,31,216,30,160,30,98,30,34,30,220,29,144,29,66,29,238,28,150,28,58,28,216,27,114,27,10,27,156,26,42,26,180,25,58,25,188,24,60,24,182,23,46,23,160,22,16,22,126,21,232,20,78,20,176,19,16,19,110,18,200,17,30,17,116,16,198,15,22,15,100,14,174,13,248,12,64,12,132,11,200,10,10,10,74,9,138,8,198,7,2,7,62,6,120,5,178,4,234,3,34,3,90,2,146,1,202,0,0,0,54,255,110,254,166,253,222,252,22,252,78,251,136,250,194,249,254,248,58,248,118,247,182,246,246,245,56,245,124,244,192,243,8,243,82,242,156,241,234,240,58,240,140,239,226,238,56,238,146,237,240,236,80,236,178,235,24,235,130,234,240,233,96,233,210,232,74,232,196,231,68,231,198,230,76,230,214,229,100,229,246,228,142,228,40,228,198,227,106,227,18,227,190,226,112,226,36,226,222,225,158,225,96,225,40,225,246,224,198,224,158,224,120,224,88,224,62,224,40,224,22,224,10,224,2,224,0,224], "i8", ALLOC_NONE, 5247204);
allocate(8, "i8", ALLOC_NONE, 5247464);
allocate([215,195,166,125,110,82,0] /* \D7\C3\A6}nR\00 */, "i8", ALLOC_NONE, 5247472);
allocate([203,150,0] /* \CB\96\00 */, "i8", ALLOC_NONE, 5247480);
allocate([6,0,0,0,4,0,0,0,3,0,0,0], "i8", ALLOC_NONE, 5247484);
allocate([0,0,1,255,1,255,2,254,2,254,3,253,0,1,0,1,255,2,255,2,254,3,254,3], "i8", ALLOC_NONE, 5247496);
allocate([0,0,1,255,0,1,255,0,255,1,254,2,254,254,2,253,2,3,253,252,3,252,4,4,251,5,250,251,6,249,6,5,8,247,0,0,1,0,0,0,0,0,0,0,255,1,0,0,1,255,0,1,255,255,1,255,2,1,255,2,254,254,2,254,2,2,3,253,0,1,0,0,0,0,0,0,1,0,1,0,0,1,255,1,0,0,2,1,255,2,255,255,2,255,2,2,255,3,254,254,254,3,0,1,0,0,1,0,1,255,2,255,2,255,2,3,254,3,254,254,4,4,253,5,253,252,6,252,6,5,251,8,250,251,249,9], "i8", ALLOC_NONE, 5247520);
allocate([0,1,0,0,0,1], "i8", ALLOC_NONE, 5247656);
allocate([0,2,255,255,255,0,0,1,1,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,255,2,1,0,1,1,0,0,255,255], "i8", ALLOC_NONE, 5247664);
allocate([0,1,1,1,2,3,3,3,2,3,3,3,2,3,3,3] /* \00\01\01\01\02\03\0 */, "i8", ALLOC_NONE, 5247708);
allocate([0,3,12,15,48,51,60,63,192,195,204,207,240,243,252,255] /* \00\03\0C\0F03_?\C0\ */, "i8", ALLOC_NONE, 5247724);
allocate([0,0,102,63,0,0,76,63,0,0,38,63,0,0,0,63], "i8", ALLOC_NONE, 5247740);
allocate([1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,7,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,6,0,0,0,1,0,0,0,5,0,0,0,2,0,0,0,15,0,0,0,0,0,0,0,8,0,0,0,7,0,0,0,12,0,0,0,3,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,1,0,0,0,9,0,0,0,6,0,0,0,13,0,0,0,2,0,0,0,10,0,0,0,5,0,0,0], "i8", ALLOC_NONE, 5247756);
allocate(24, "i8", ALLOC_NONE, 5247876);
allocate([128,187,0,0,120,0,0,0,21,0,0,0,21,0,0,0,0,154,89,63,0,0,0,0,0,0,128,63,0,0,128,63,0,0,0,0,3,0,0,0,8,0,0,0,120,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,7,0,0,3,0,0,0,84,43,80,0,32,43,80,0,236,42,80,0,184,42,80,0,0,0,0,0,136,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5247900);
allocate([0,0,128,63,166,255,127,63,153,254,127,63,216,252,127,63,99,250,127,63,58,247,127,63,94,243,127,63,206,238,127,63,139,233,127,63,148,227,127,63,233,220,127,63,139,213,127,63,121,205,127,63,180,196,127,63,59,187,127,63,15,177,127,63,47,166,127,63,156,154,127,63,86,142,127,63,92,129,127,63,175,115,127,63,78,101,127,63,58,86,127,63,116,70,127,63,249,53,127,63,204,36,127,63,236,18,127,63,89,0,127,63,18,237,126,63,25,217,126,63,109,196,126,63,14,175,126,63,253,152,126,63,56,130,126,63,193,106,126,63,152,82,126,63,188,57,126,63,46,32,126,63,237,5,126,63,250,234,125,63,85,207,125,63,253,178,125,63,244,149,125,63,56,120,125,63,203,89,125,63,172,58,125,63,219,26,125,63,89,250,124,63,37,217,124,63,63,183,124,63,168,148,124,63,96,113,124,63,103,77,124,63,189,40,124,63,97,3,124,63,85,221,123,63,152,182,123,63,42,143,123,63,12,103,123,63,61,62,123,63,190,20,123,63,143,234,122,63,176,191,122,63,33,148,122,63,226,103,122,63,243,58,122,63,84,13,122,63,6,223,121,63,9,176,121,63,92,128,121,63,0,80,121,63,246,30,121,63,60,237,120,63,212,186,120,63,189,135,120,63,248,83,120,63,132,31,120,63,99,234,119,63,147,180,119,63,22,126,119,63,234,70,119,63,17,15,119,63,139,214,118,63,88,157,118,63,119,99,118,63,234,40,118,63,176,237,117,63,201,177,117,63,54,117,117,63,246,55,117,63,11,250,116,63,115,187,116,63,48,124,116,63,65,60,116,63,167,251,115,63,97,186,115,63,112,120,115,63,213,53,115,63,143,242,114,63,158,174,114,63,3,106,114,63,190,36,114,63,207,222,113,63,54,152,113,63,244,80,113,63,8,9,113,63,115,192,112,63,53,119,112,63,79,45,112,63,191,226,111,63,136,151,111,63,168,75,111,63,32,255,110,63,241,177,110,63,26,100,110,63,156,21,110,63,118,198,109,63,170,118,109,63,55,38,109,63,30,213,108,63,94,131,108,63,249,48,108,63,237,221,107,63,61,138,107,63,231,53,107,63,235,224,106,63,75,139,106,63,7,53,106,63,29,222,105,63,144,134,105,63,95,46,105,63,138,213,104,63,18,124,104,63,247,33,104,63,57,199,103,63,216,107,103,63,212,15,103,63,47,179,102,63,231,85,102,63,254,247,101,63,116,153,101,63,72,58,101,63,123,218,100,63,14,122,100,63,1,25,100,63,83,183,99,63,6,85,99,63,25,242,98,63,141,142,98,63,97,42,98,63,151,197,97,63,47,96,97,63,40,250,96,63,132,147,96,63,66,44,96,63,99,196,95,63,230,91,95,63,205,242,94,63,23,137,94,63,197,30,94,63,215,179,93,63,78,72,93,63,41,220,92,63,106,111,92,63,15,2,92,63,26,148,91,63,139,37,91,63,98,182,90,63,160,70,90,63,69,214,89,63,80,101,89,63,196,243,88,63,158,129,88,63,225,14,88,63,140,155,87,63,160,39,87,63,29,179,86,63,3,62,86,63,84,200,85,63,13,82,85,63,49,219,84,63,192,99,84,63,185,235,83,63,30,115,83,63,239,249,82,63,43,128,82,63,212,5,82,63,234,138,81,63,108,15,81,63,91,147,80,63,184,22,80,63,132,153,79,63,189,27,79,63,101,157,78,63,123,30,78,63,2,159,77,63,248,30,77,63,94,158,76,63,53,29,76,63,124,155,75,63,53,25,75,63,94,150,74,63,250,18,74,63,7,143,73,63,135,10,73,63,123,133,72,63,225,255,71,63,187,121,71,63,9,243,70,63,204,107,70,63,3,228,69,63,175,91,69,63,209,210,68,63,105,73,68,63,119,191,67,63,252,52,67,63,247,169,66,63,106,30,66,63,85,146,65,63,184,5,65,63,146,120,64,63,231,234,63,63,181,92,63,63,251,205,62,63,189,62,62,63,249,174,61,63,176,30,61,63,225,141,60,63,143,252,59,63,185,106,59,63,95,216,58,63,129,69,58,63,35,178,57,63,65,30,57,63,220,137,56,63,247,244,55,63,144,95,55,63,169,201,54,63,65,51,54,63,90,156,53,63,243,4,53,63,13,109,52,63,168,212,51,63,197,59,51,63,100,162,50,63,135,8,50,63,45,110,49,63,85,211,48,63,1,56,48,63,50,156,47,63,232,255,46,63,34,99,46,63,226,197,45,63,41,40,45,63,246,137,44,63,73,235,43,63,36,76,43,63,136,172,42,63,114,12,42,63,230,107,41,63,227,202,40,63,106,41,40,63,121,135,39,63,20,229,38,63,58,66,38,63,235,158,37,63,39,251,36,63,241,86,36,63,71,178,35,63,41,13,35,63,153,103,34,63,151,193,33,63,36,27,33,63,63,116,32,63,235,204,31,63,37,37,31,63,241,124,30,63,76,212,29,63,58,43,29,63,184,129,28,63,201,215,27,63,110,45,27,63,164,130,26,63,111,215,25,63,205,43,25,63,192,127,24,63,71,211,23,63,100,38,23,63,24,121,22,63,98,203,21,63,66,29,21,63,185,110,20,63,201,191,19,63,113,16,19,63,178,96,18,63,140,176,17,63,0,0,17,63,13,79,16,63,182,157,15,63,249,235,14,63,217,57,14,63,85,135,13,63,110,212,12,63,36,33,12,63,118,109,11,63,104,185,10,63,247,4,10,63,38,80,9,63,246,154,8,63,100,229,7,63,117,47,7,63,37,121,6,63,119,194,5,63,106,11,5,63,2,84,4,63,62,156,3,63,27,228,2,63,156,43,2,63,194,114,1,63,143,185,0,63,255,255,255,62,45,140,254,62,172,23,253,62,117,162,251,62,142,44,250,62,251,181,248,62,185,62,247,62,198,198,245,62,39,78,244,62,220,212,242,62,235,90,241,62,76,224,239,62,5,101,238,62,23,233,236,62,134,108,235,62,76,239,233,62,111,113,232,62,237,242,230,62,206,115,229,62,10,244,227,62,169,115,226,62,170,242,224,62,9,113,223,62,203,238,221,62,241,107,220,62,129,232,218,62,115,100,217,62,204,223,215,62,142,90,214,62,190,212,212,62,84,78,211,62,86,199,209,62,200,63,208,62,168,183,206,62,244,46,205,62,175,165,203,62,223,27,202,62,126,145,200,62,144,6,199,62,22,123,197,62,21,239,195,62,135,98,194,62,113,213,192,62,215,71,191,62,179,185,189,62,10,43,188,62,221,155,186,62,52,12,185,62,2,124,183,62,79,235,181,62,29,90,180,62,111,200,178,62,65,54,177,62,150,163,175,62,115,16,174,62,211,124,172,62,186,232,170,62,40,84,169,62,36,191,167,62,166,41,166,62,179,147,164,62,81,253,162,62,124,102,161,62,51,207,159,62,121,55,158,62,83,159,156,62,189,6,155,62,185,109,153,62,74,212,151,62,116,58,150,62,48,160,148,62,132,5,147,62,113,106,145,62,252,206,143,62,31,51,142,62,225,150,140,62,64,250,138,62,58,93,137,62,212,191,135,62,15,34,134,62,239,131,132,62,110,229,130,62,146,70,129,62,180,78,127,62,154,15,124,62,200,207,120,62,70,143,117,62,25,78,114,62,73,12,111,62,209,201,107,62,172,134,104,62,235,66,101,62,130,254,97,62,123,185,94,62,215,115,91,62,161,45,88,62,203,230,84,62,96,159,81,62,97,87,78,62,218,14,75,62,188,197,71,62,19,124,68,62,231,49,65,62,51,231,61,62,243,155,58,62,47,80,55,62,243,3,52,62,48,183,48,62,241,105,45,62,57,28,42,62,17,206,38,62,108,127,35,62,85,48,32,62,213,224,28,62,222,144,25,62,124,64,22,62,185,239,18,62,143,158,15,62,247,76,12,62,253,250,8,62,164,168,5,62,244,85,2,62,194,5,254,61,234,94,247,61,115,183,240,61,68,15,234,61,112,102,227,61,253,188,220,61,255,18,214,61,91,104,207,61,53,189,200,61,115,17,194,61,56,101,187,61,105,184,180,61,28,11,174,61,101,93,167,61,40,175,160,61,122,0,154,61,97,81,147,61,240,161,140,61,12,242,133,61,148,131,126,61,94,34,113,61,158,192,99,61,63,94,86,61,41,251,72,61,166,151,59,61,128,51,46,61,223,206,32,61,205,105,19,61,116,4,6,61,59,61,241,60,227,112,214,60,245,163,187,60,195,214,160,60,225,8,134,60,64,117,86,60,40,216,32,60,62,119,214,59,43,119,86,59,46,189,59,179], "i8", ALLOC_NONE, 5248008);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,8,0,8,0,8,0,16,0,16,0,16,0,21,0,21,0,24,0,29,0,34,0,36,0], "i8", ALLOC_NONE, 5249932);
allocate([0,0,128,63,0,0,0,0,99,250,127,63,191,117,86,188,139,233,127,63,10,113,214,188,121,205,127,63,231,206,32,189,47,166,127,63,58,94,86,189,175,115,127,63,19,242,133,189,249,53,127,63,42,175,160,189,18,237,126,63,51,101,187,189,253,152,126,63,4,19,214,189,188,57,126,63,115,183,240,189,85,207,125,63,168,168,5,190,203,89,125,63,187,239,18,190,37,217,124,63,92,48,32,190,103,77,124,63,245,105,45,190,152,182,123,63,243,155,58,190,190,20,123,63,194,197,71,190,226,103,122,63,205,230,84,190,9,176,121,63,130,254,97,190,60,237,120,63,77,12,111,190,132,31,120,63,156,15,124,190,234,70,119,63,238,131,132,190,119,99,118,63,62,250,138,190,54,117,117,63,117,106,145,190,48,124,116,63,76,212,151,190,113,120,115,63,122,55,158,190,3,106,114,63,183,147,164,190,244,80,113,63,188,232,170,190,79,45,112,63,65,54,177,190,33,255,110,63,1,124,183,190,118,198,109,63,180,185,189,190,94,131,108,63,21,239,195,190,231,53,107,63,222,27,202,190,30,222,105,63,201,63,208,190,18,124,104,63,146,90,214,190,212,15,103,63,243,107,220,190,116,153,101,63,170,115,226,190,1,25,100,63,113,113,232,190,141,142,98,63,7,101,238,190,40,250,96,63,39,78,244,190,230,91,95,63,144,44,250,190,215,179,93,63,0,0,0,191,15,2,92,63,27,228,2,191,160,70,90,63,119,194,5,191,158,129,88,63,246,154,8,191,29,179,86,63,119,109,11,191,49,219,84,63,218,57,14,191,239,249,82,63,0,0,17,191,108,15,81,63,202,191,19,191,189,27,79,63,24,121,22,191,248,30,77,63,205,43,25,191,52,25,75,63,202,215,27,191,136,10,73,63,241,124,30,191,10,243,70,63,36,27,33,191,209,210,68,63,70,178,35,191,247,169,66,63,58,66,38,191,147,120,64,63,227,202,40,191,189,62,62,63,37,76,43,191,143,252,59,63,227,197,45,191,34,178,57,63,1,56,48,191,144,95,55,63,101,162,50,191,243,4,53,63,243,4,53,191,101,162,50,63,144,95,55,191,1,56,48,63,34,178,57,191,227,197,45,63,143,252,59,191,37,76,43,63,189,62,62,191,227,202,40,63,147,120,64,191,58,66,38,63,247,169,66,191,70,178,35,63,209,210,68,191,36,27,33,63,10,243,70,191,241,124,30,63,136,10,73,191,202,215,27,63,52,25,75,191,205,43,25,63,248,30,77,191,24,121,22,63,189,27,79,191,202,191,19,63,108,15,81,191,0,0,17,63,239,249,82,191,218,57,14,63,49,219,84,191,119,109,11,63,29,179,86,191,246,154,8,63,158,129,88,191,119,194,5,63,160,70,90,191,27,228,2,63,15,2,92,191,0,0,0,63,215,179,93,191,144,44,250,62,230,91,95,191,39,78,244,62,40,250,96,191,7,101,238,62,141,142,98,191,113,113,232,62,1,25,100,191,170,115,226,62,116,153,101,191,243,107,220,62,212,15,103,191,146,90,214,62,18,124,104,191,201,63,208,62,30,222,105,191,222,27,202,62,231,53,107,191,21,239,195,62,94,131,108,191,180,185,189,62,118,198,109,191,1,124,183,62,33,255,110,191,65,54,177,62,79,45,112,191,188,232,170,62,244,80,113,191,183,147,164,62,3,106,114,191,122,55,158,62,113,120,115,191,76,212,151,62,48,124,116,191,117,106,145,62,54,117,117,191,62,250,138,62,119,99,118,191,238,131,132,62,234,70,119,191,156,15,124,62,132,31,120,191,77,12,111,62,60,237,120,191,130,254,97,62,9,176,121,191,205,230,84,62,226,103,122,191,194,197,71,62,190,20,123,191,243,155,58,62,152,182,123,191,245,105,45,62,103,77,124,191,92,48,32,62,37,217,124,191,187,239,18,62,203,89,125,191,168,168,5,62,85,207,125,191,115,183,240,61,188,57,126,191,4,19,214,61,253,152,126,191,51,101,187,61,18,237,126,191,42,175,160,61,249,53,127,191,19,242,133,61,175,115,127,191,58,94,86,61,47,166,127,191,231,206,32,61,121,205,127,191,10,113,214,60,139,233,127,191,191,117,86,60,99,250,127,191,0,48,141,36,0,0,128,191,191,117,86,188,99,250,127,191,10,113,214,188,139,233,127,191,231,206,32,189,121,205,127,191,58,94,86,189,47,166,127,191,19,242,133,189,175,115,127,191,42,175,160,189,249,53,127,191,51,101,187,189,18,237,126,191,4,19,214,189,253,152,126,191,115,183,240,189,188,57,126,191,168,168,5,190,85,207,125,191,187,239,18,190,203,89,125,191,92,48,32,190,37,217,124,191,245,105,45,190,103,77,124,191,243,155,58,190,152,182,123,191,194,197,71,190,190,20,123,191,205,230,84,190,226,103,122,191,130,254,97,190,9,176,121,191,77,12,111,190,60,237,120,191,156,15,124,190,132,31,120,191,238,131,132,190,234,70,119,191,62,250,138,190,119,99,118,191,117,106,145,190,54,117,117,191,76,212,151,190,48,124,116,191,122,55,158,190,113,120,115,191,183,147,164,190,3,106,114,191,188,232,170,190,244,80,113,191,65,54,177,190,79,45,112,191,1,124,183,190,33,255,110,191,180,185,189,190,118,198,109,191,21,239,195,190,94,131,108,191,222,27,202,190,231,53,107,191,201,63,208,190,30,222,105,191,146,90,214,190,18,124,104,191,243,107,220,190,212,15,103,191,170,115,226,190,116,153,101,191,113,113,232,190,1,25,100,191,7,101,238,190,141,142,98,191,39,78,244,190,40,250,96,191,144,44,250,190,230,91,95,191,0,0,0,191,215,179,93,191,27,228,2,191,15,2,92,191,119,194,5,191,160,70,90,191,246,154,8,191,158,129,88,191,119,109,11,191,29,179,86,191,218,57,14,191,49,219,84,191,0,0,17,191,239,249,82,191,202,191,19,191,108,15,81,191,24,121,22,191,189,27,79,191,205,43,25,191,248,30,77,191,202,215,27,191,52,25,75,191,241,124,30,191,136,10,73,191,36,27,33,191,10,243,70,191,70,178,35,191,209,210,68,191,58,66,38,191,247,169,66,191,227,202,40,191,147,120,64,191,37,76,43,191,189,62,62,191,227,197,45,191,143,252,59,191,1,56,48,191,34,178,57,191,101,162,50,191,144,95,55,191,243,4,53,191,243,4,53,191,144,95,55,191,101,162,50,191,34,178,57,191,1,56,48,191,143,252,59,191,227,197,45,191,189,62,62,191,37,76,43,191,147,120,64,191,227,202,40,191,247,169,66,191,58,66,38,191,209,210,68,191,70,178,35,191,10,243,70,191,36,27,33,191,136,10,73,191,241,124,30,191,52,25,75,191,202,215,27,191,248,30,77,191,205,43,25,191,189,27,79,191,24,121,22,191,108,15,81,191,202,191,19,191,239,249,82,191,0,0,17,191,49,219,84,191,218,57,14,191,29,179,86,191,119,109,11,191,158,129,88,191,246,154,8,191,160,70,90,191,119,194,5,191,15,2,92,191,27,228,2,191,215,179,93,191,0,0,0,191,230,91,95,191,144,44,250,190,40,250,96,191,39,78,244,190,141,142,98,191,7,101,238,190,1,25,100,191,113,113,232,190,116,153,101,191,170,115,226,190,212,15,103,191,243,107,220,190,18,124,104,191,146,90,214,190,30,222,105,191,201,63,208,190,231,53,107,191,222,27,202,190,94,131,108,191,21,239,195,190,118,198,109,191,180,185,189,190,33,255,110,191,1,124,183,190,79,45,112,191,65,54,177,190,244,80,113,191,188,232,170,190,3,106,114,191,183,147,164,190,113,120,115,191,122,55,158,190,48,124,116,191,76,212,151,190,54,117,117,191,117,106,145,190,119,99,118,191,62,250,138,190,234,70,119,191,238,131,132,190,132,31,120,191,156,15,124,190,60,237,120,191,77,12,111,190,9,176,121,191,130,254,97,190,226,103,122,191,205,230,84,190,190,20,123,191,194,197,71,190,152,182,123,191,243,155,58,190,103,77,124,191,245,105,45,190,37,217,124,191,92,48,32,190,203,89,125,191,187,239,18,190,85,207,125,191,168,168,5,190,188,57,126,191,115,183,240,189,253,152,126,191,4,19,214,189,18,237,126,191,51,101,187,189,249,53,127,191,42,175,160,189,175,115,127,191,19,242,133,189,47,166,127,191,58,94,86,189,121,205,127,191,231,206,32,189,139,233,127,191,10,113,214,188,99,250,127,191,191,117,86,188,0,0,128,191,0,48,13,165,99,250,127,191,191,117,86,60,139,233,127,191,10,113,214,60,121,205,127,191,231,206,32,61,47,166,127,191,58,94,86,61,175,115,127,191,19,242,133,61,249,53,127,191,42,175,160,61,18,237,126,191,51,101,187,61,253,152,126,191,4,19,214,61,188,57,126,191,115,183,240,61,85,207,125,191,168,168,5,62,203,89,125,191,187,239,18,62,37,217,124,191,92,48,32,62,103,77,124,191,245,105,45,62,152,182,123,191,243,155,58,62,190,20,123,191,194,197,71,62,226,103,122,191,205,230,84,62,9,176,121,191,130,254,97,62,60,237,120,191,77,12,111,62,132,31,120,191,156,15,124,62,234,70,119,191,238,131,132,62,119,99,118,191,62,250,138,62,54,117,117,191,117,106,145,62,48,124,116,191,76,212,151,62,113,120,115,191,122,55,158,62,3,106,114,191,183,147,164,62,244,80,113,191,188,232,170,62,79,45,112,191,65,54,177,62,33,255,110,191,1,124,183,62,118,198,109,191,180,185,189,62,94,131,108,191,21,239,195,62,231,53,107,191,222,27,202,62,30,222,105,191,201,63,208,62,18,124,104,191,146,90,214,62,212,15,103,191,243,107,220,62,116,153,101,191,170,115,226,62,1,25,100,191,113,113,232,62,141,142,98,191,7,101,238,62,40,250,96,191,39,78,244,62,230,91,95,191,144,44,250,62,215,179,93,191,0,0,0,63,15,2,92,191,27,228,2,63,160,70,90,191,119,194,5,63,158,129,88,191,246,154,8,63,29,179,86,191,119,109,11,63,49,219,84,191,218,57,14,63,239,249,82,191,0,0,17,63,108,15,81,191,202,191,19,63,189,27,79,191,24,121,22,63,248,30,77,191,205,43,25,63,52,25,75,191,202,215,27,63,136,10,73,191,241,124,30,63,10,243,70,191,36,27,33,63,209,210,68,191,70,178,35,63,247,169,66,191,58,66,38,63,147,120,64,191,227,202,40,63,189,62,62,191,37,76,43,63,143,252,59,191,227,197,45,63,34,178,57,191,1,56,48,63,144,95,55,191,101,162,50,63,243,4,53,191,243,4,53,63,101,162,50,191,144,95,55,63,1,56,48,191,34,178,57,63,227,197,45,191,143,252,59,63,37,76,43,191,189,62,62,63,227,202,40,191,147,120,64,63,58,66,38,191,247,169,66,63,70,178,35,191,209,210,68,63,36,27,33,191,10,243,70,63,241,124,30,191,136,10,73,63,202,215,27,191,52,25,75,63,205,43,25,191,248,30,77,63,24,121,22,191,189,27,79,63,202,191,19,191,108,15,81,63,0,0,17,191,239,249,82,63,218,57,14,191,49,219,84,63,119,109,11,191,29,179,86,63,246,154,8,191,158,129,88,63,119,194,5,191,160,70,90,63,27,228,2,191,15,2,92,63,0,0,0,191,215,179,93,63,144,44,250,190,230,91,95,63,39,78,244,190,40,250,96,63,7,101,238,190,141,142,98,63,113,113,232,190,1,25,100,63,170,115,226,190,116,153,101,63,243,107,220,190,212,15,103,63,146,90,214,190,18,124,104,63,201,63,208,190,30,222,105,63,222,27,202,190,231,53,107,63,21,239,195,190,94,131,108,63,180,185,189,190,118,198,109,63,1,124,183,190,33,255,110,63,65,54,177,190,79,45,112,63,188,232,170,190,244,80,113,63,183,147,164,190,3,106,114,63,122,55,158,190,113,120,115,63,76,212,151,190,48,124,116,63,117,106,145,190,54,117,117,63,62,250,138,190,119,99,118,63,238,131,132,190,234,70,119,63,156,15,124,190,132,31,120,63,77,12,111,190,60,237,120,63,130,254,97,190,9,176,121,63,205,230,84,190,226,103,122,63,194,197,71,190,190,20,123,63,243,155,58,190,152,182,123,63,245,105,45,190,103,77,124,63,92,48,32,190,37,217,124,63,187,239,18,190,203,89,125,63,168,168,5,190,85,207,125,63,115,183,240,189,188,57,126,63,4,19,214,189,253,152,126,63,51,101,187,189,18,237,126,63,42,175,160,189,249,53,127,63,19,242,133,189,175,115,127,63,58,94,86,189,47,166,127,63,231,206,32,189,121,205,127,63,10,113,214,188,139,233,127,63,191,117,86,188,99,250,127,63,0,200,83,165,0,0,128,63,191,117,86,60,99,250,127,63,10,113,214,60,139,233,127,63,231,206,32,61,121,205,127,63,58,94,86,61,47,166,127,63,19,242,133,61,175,115,127,63,42,175,160,61,249,53,127,63,51,101,187,61,18,237,126,63,4,19,214,61,253,152,126,63,115,183,240,61,188,57,126,63,168,168,5,62,85,207,125,63,187,239,18,62,203,89,125,63,92,48,32,62,37,217,124,63,245,105,45,62,103,77,124,63,243,155,58,62,152,182,123,63,194,197,71,62,190,20,123,63,205,230,84,62,226,103,122,63,130,254,97,62,9,176,121,63,77,12,111,62,60,237,120,63,156,15,124,62,132,31,120,63,238,131,132,62,234,70,119,63,62,250,138,62,119,99,118,63,117,106,145,62,54,117,117,63,76,212,151,62,48,124,116,63,122,55,158,62,113,120,115,63,183,147,164,62,3,106,114,63,188,232,170,62,244,80,113,63,65,54,177,62,79,45,112,63,1,124,183,62,33,255,110,63,180,185,189,62,118,198,109,63,21,239,195,62,94,131,108,63,222,27,202,62,231,53,107,63,201,63,208,62,30,222,105,63,146,90,214,62,18,124,104,63,243,107,220,62,212,15,103,63,170,115,226,62,116,153,101,63,113,113,232,62,1,25,100,63,7,101,238,62,141,142,98,63,39,78,244,62,40,250,96,63,144,44,250,62,230,91,95,63,0,0,0,63,215,179,93,63,27,228,2,63,15,2,92,63,119,194,5,63,160,70,90,63,246,154,8,63,158,129,88,63,119,109,11,63,29,179,86,63,218,57,14,63,49,219,84,63,0,0,17,63,239,249,82,63,202,191,19,63,108,15,81,63,24,121,22,63,189,27,79,63,205,43,25,63,248,30,77,63,202,215,27,63,52,25,75,63,241,124,30,63,136,10,73,63,36,27,33,63,10,243,70,63,70,178,35,63,209,210,68,63,58,66,38,63,247,169,66,63,227,202,40,63,147,120,64,63,37,76,43,63,189,62,62,63,227,197,45,63,143,252,59,63,1,56,48,63,34,178,57,63,101,162,50,63,144,95,55,63,243,4,53,63,243,4,53,63,144,95,55,63,101,162,50,63,34,178,57,63,1,56,48,63,143,252,59,63,227,197,45,63,189,62,62,63,37,76,43,63,147,120,64,63,227,202,40,63,247,169,66,63,58,66,38,63,209,210,68,63,70,178,35,63,10,243,70,63,36,27,33,63,136,10,73,63,241,124,30,63,52,25,75,63,202,215,27,63,248,30,77,63,205,43,25,63,189,27,79,63,24,121,22,63,108,15,81,63,202,191,19,63,239,249,82,63,0,0,17,63,49,219,84,63,218,57,14,63,29,179,86,63,119,109,11,63,158,129,88,63,246,154,8,63,160,70,90,63,119,194,5,63,15,2,92,63,27,228,2,63,215,179,93,63,0,0,0,63,230,91,95,63,144,44,250,62,40,250,96,63,39,78,244,62,141,142,98,63,7,101,238,62,1,25,100,63,113,113,232,62,116,153,101,63,170,115,226,62,212,15,103,63,243,107,220,62,18,124,104,63,146,90,214,62,30,222,105,63,201,63,208,62,231,53,107,63,222,27,202,62,94,131,108,63,21,239,195,62,118,198,109,63,180,185,189,62,33,255,110,63,1,124,183,62,79,45,112,63,65,54,177,62,244,80,113,63,188,232,170,62,3,106,114,63,183,147,164,62,113,120,115,63,122,55,158,62,48,124,116,63,76,212,151,62,54,117,117,63,117,106,145,62,119,99,118,63,62,250,138,62,234,70,119,63,238,131,132,62,132,31,120,63,156,15,124,62,60,237,120,63,77,12,111,62,9,176,121,63,130,254,97,62,226,103,122,63,205,230,84,62,190,20,123,63,194,197,71,62,152,182,123,63,243,155,58,62,103,77,124,63,245,105,45,62,37,217,124,63,92,48,32,62,203,89,125,63,187,239,18,62,85,207,125,63,168,168,5,62,188,57,126,63,115,183,240,61,253,152,126,63,4,19,214,61,18,237,126,63,51,101,187,61,249,53,127,63,42,175,160,61,175,115,127,63,19,242,133,61,47,166,127,63,58,94,86,61,121,205,127,63,231,206,32,61,139,233,127,63,10,113,214,60,99,250,127,63,191,117,86,60], "i8", ALLOC_NONE, 5249976);
allocate([60,0,0,0,137,136,136,60,3,0,0,0,4,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5253816);
allocate([120,0,0,0,136,136,8,60,2,0,0,0,4,0,30,0,2,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5253868);
allocate([240,0,0,0,137,136,136,59,1,0,0,0,4,0,60,0,4,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5253920);
allocate([224,1,0,0,135,136,8,59,255,255,255,255,4,0,120,0,4,0,30,0,2,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5253972);
allocate([0,0,15,0,30,0,45,0,5,0,20,0,35,0,50,0,10,0,25,0,40,0,55,0,1,0,16,0,31,0,46,0,6,0,21,0,36,0,51,0,11,0,26,0,41,0,56,0,2,0,17,0,32,0,47,0,7,0,22,0,37,0,52,0,12,0,27,0,42,0,57,0,3,0,18,0,33,0,48,0,8,0,23,0,38,0,53,0,13,0,28,0,43,0,58,0,4,0,19,0,34,0,49,0,9,0,24,0,39,0,54,0,14,0,29,0,44,0,59,0], "i8", ALLOC_NONE, 5254024);
allocate([0,0,120,0,240,0,104,1,30,0,150,0,14,1,134,1,60,0,180,0,44,1,164,1,90,0,210,0,74,1,194,1,15,0,135,0,255,0,119,1,45,0,165,0,29,1,149,1,75,0,195,0,59,1,179,1,105,0,225,0,89,1,209,1,5,0,125,0,245,0,109,1,35,0,155,0,19,1,139,1,65,0,185,0,49,1,169,1,95,0,215,0,79,1,199,1,20,0,140,0,4,1,124,1,50,0,170,0,34,1,154,1,80,0,200,0,64,1,184,1,110,0,230,0,94,1,214,1,10,0,130,0,250,0,114,1,40,0,160,0,24,1,144,1,70,0,190,0,54,1,174,1,100,0,220,0,84,1,204,1,25,0,145,0,9,1,129,1,55,0,175,0,39,1,159,1,85,0,205,0,69,1,189,1,115,0,235,0,99,1,219,1,1,0,121,0,241,0,105,1,31,0,151,0,15,1,135,1,61,0,181,0,45,1,165,1,91,0,211,0,75,1,195,1,16,0,136,0,0,1,120,1,46,0,166,0,30,1,150,1,76,0,196,0,60,1,180,1,106,0,226,0,90,1,210,1,6,0,126,0,246,0,110,1,36,0,156,0,20,1,140,1,66,0,186,0,50,1,170,1,96,0,216,0,80,1,200,1,21,0,141,0,5,1,125,1,51,0,171,0,35,1,155,1,81,0,201,0,65,1,185,1,111,0,231,0,95,1,215,1,11,0,131,0,251,0,115,1,41,0,161,0,25,1,145,1,71,0,191,0,55,1,175,1,101,0,221,0,85,1,205,1,26,0,146,0,10,1,130,1,56,0,176,0,40,1,160,1,86,0,206,0,70,1,190,1,116,0,236,0,100,1,220,1,2,0,122,0,242,0,106,1,32,0,152,0,16,1,136,1,62,0,182,0,46,1,166,1,92,0,212,0,76,1,196,1,17,0,137,0,1,1,121,1,47,0,167,0,31,1,151,1,77,0,197,0,61,1,181,1,107,0,227,0,91,1,211,1,7,0,127,0,247,0,111,1,37,0,157,0,21,1,141,1,67,0,187,0,51,1,171,1,97,0,217,0,81,1,201,1,22,0,142,0,6,1,126,1,52,0,172,0,36,1,156,1,82,0,202,0,66,1,186,1,112,0,232,0,96,1,216,1,12,0,132,0,252,0,116,1,42,0,162,0,26,1,146,1,72,0,192,0,56,1,176,1,102,0,222,0,86,1,206,1,27,0,147,0,11,1,131,1,57,0,177,0,41,1,161,1,87,0,207,0,71,1,191,1,117,0,237,0,101,1,221,1,3,0,123,0,243,0,107,1,33,0,153,0,17,1,137,1,63,0,183,0,47,1,167,1,93,0,213,0,77,1,197,1,18,0,138,0,2,1,122,1,48,0,168,0,32,1,152,1,78,0,198,0,62,1,182,1,108,0,228,0,92,1,212,1,8,0,128,0,248,0,112,1,38,0,158,0,22,1,142,1,68,0,188,0,52,1,172,1,98,0,218,0,82,1,202,1,23,0,143,0,7,1,127,1,53,0,173,0,37,1,157,1,83,0,203,0,67,1,187,1,113,0,233,0,97,1,217,1,13,0,133,0,253,0,117,1,43,0,163,0,27,1,147,1,73,0,193,0,57,1,177,1,103,0,223,0,87,1,207,1,28,0,148,0,12,1,132,1,58,0,178,0,42,1,162,1,88,0,208,0,72,1,192,1,118,0,238,0,102,1,222,1,4,0,124,0,244,0,108,1,34,0,154,0,18,1,138,1,64,0,184,0,48,1,168,1,94,0,214,0,78,1,198,1,19,0,139,0,3,1,123,1,49,0,169,0,33,1,153,1,79,0,199,0,63,1,183,1,109,0,229,0,93,1,213,1,9,0,129,0,249,0,113,1,39,0,159,0,23,1,143,1,69,0,189,0,53,1,173,1,99,0,219,0,83,1,203,1,24,0,144,0,8,1,128,1,54,0,174,0,38,1,158,1,84,0,204,0,68,1,188,1,114,0,234,0,98,1,218,1,14,0,134,0,254,0,118,1,44,0,164,0,28,1,148,1,74,0,194,0,58,1,178,1,104,0,224,0,88,1,208,1,29,0,149,0,13,1,133,1,59,0,179,0,43,1,163,1,89,0,209,0,73,1,193,1,119,0,239,0,103,1,223,1], "i8", ALLOC_NONE, 5254144);
allocate([0,0,60,0,120,0,180,0,15,0,75,0,135,0,195,0,30,0,90,0,150,0,210,0,45,0,105,0,165,0,225,0,5,0,65,0,125,0,185,0,20,0,80,0,140,0,200,0,35,0,95,0,155,0,215,0,50,0,110,0,170,0,230,0,10,0,70,0,130,0,190,0,25,0,85,0,145,0,205,0,40,0,100,0,160,0,220,0,55,0,115,0,175,0,235,0,1,0,61,0,121,0,181,0,16,0,76,0,136,0,196,0,31,0,91,0,151,0,211,0,46,0,106,0,166,0,226,0,6,0,66,0,126,0,186,0,21,0,81,0,141,0,201,0,36,0,96,0,156,0,216,0,51,0,111,0,171,0,231,0,11,0,71,0,131,0,191,0,26,0,86,0,146,0,206,0,41,0,101,0,161,0,221,0,56,0,116,0,176,0,236,0,2,0,62,0,122,0,182,0,17,0,77,0,137,0,197,0,32,0,92,0,152,0,212,0,47,0,107,0,167,0,227,0,7,0,67,0,127,0,187,0,22,0,82,0,142,0,202,0,37,0,97,0,157,0,217,0,52,0,112,0,172,0,232,0,12,0,72,0,132,0,192,0,27,0,87,0,147,0,207,0,42,0,102,0,162,0,222,0,57,0,117,0,177,0,237,0,3,0,63,0,123,0,183,0,18,0,78,0,138,0,198,0,33,0,93,0,153,0,213,0,48,0,108,0,168,0,228,0,8,0,68,0,128,0,188,0,23,0,83,0,143,0,203,0,38,0,98,0,158,0,218,0,53,0,113,0,173,0,233,0,13,0,73,0,133,0,193,0,28,0,88,0,148,0,208,0,43,0,103,0,163,0,223,0,58,0,118,0,178,0,238,0,4,0,64,0,124,0,184,0,19,0,79,0,139,0,199,0,34,0,94,0,154,0,214,0,49,0,109,0,169,0,229,0,9,0,69,0,129,0,189,0,24,0,84,0,144,0,204,0,39,0,99,0,159,0,219,0,54,0,114,0,174,0,234,0,14,0,74,0,134,0,194,0,29,0,89,0,149,0,209,0,44,0,104,0,164,0,224,0,59,0,119,0,179,0,239,0], "i8", ALLOC_NONE, 5255104);
allocate([0,0,30,0,60,0,90,0,15,0,45,0,75,0,105,0,5,0,35,0,65,0,95,0,20,0,50,0,80,0,110,0,10,0,40,0,70,0,100,0,25,0,55,0,85,0,115,0,1,0,31,0,61,0,91,0,16,0,46,0,76,0,106,0,6,0,36,0,66,0,96,0,21,0,51,0,81,0,111,0,11,0,41,0,71,0,101,0,26,0,56,0,86,0,116,0,2,0,32,0,62,0,92,0,17,0,47,0,77,0,107,0,7,0,37,0,67,0,97,0,22,0,52,0,82,0,112,0,12,0,42,0,72,0,102,0,27,0,57,0,87,0,117,0,3,0,33,0,63,0,93,0,18,0,48,0,78,0,108,0,8,0,38,0,68,0,98,0,23,0,53,0,83,0,113,0,13,0,43,0,73,0,103,0,28,0,58,0,88,0,118,0,4,0,34,0,64,0,94,0,19,0,49,0,79,0,109,0,9,0,39,0,69,0,99,0,24,0,54,0,84,0,114,0,14,0,44,0,74,0,104,0,29,0,59,0,89,0,119,0], "i8", ALLOC_NONE, 5255584);
allocate([15,0,0,0,10,0,0,0,5,0,0,0], "i8", ALLOC_NONE, 5255824);
allocate([0,0,1,0,2,0,3,0,4,0,5,0,6,0,7,0,8,0,10,0,12,0,14,0,16,0,20,0,24,0,28,0,34,0,40,0,48,0,60,0,78,0,100,0], "i8", ALLOC_NONE, 5255836);
allocate([72,127,65,129,66,128,65,128,64,128,62,128,64,128,64,128,92,78,92,79,92,78,90,79,116,41,115,40,114,40,132,26,132,26,145,17,161,12,176,10,177,11,24,179,48,138,54,135,54,132,53,134,56,133,55,132,55,132,61,114,70,96,74,88,75,88,87,74,89,66,91,67,100,59,108,50,120,40,122,37,97,43,78,50,83,78,84,81,88,75,86,74,87,71,90,73,93,74,93,74,109,40,114,36,117,34,117,34,143,17,145,18,146,19,162,12,165,10,178,7,189,6,190,8,177,9,23,178,54,115,63,102,66,98,69,99,74,89,71,91,73,91,78,89,86,80,92,66,93,64,102,59,103,60,104,60,117,52,123,44,138,35,133,31,97,38,77,45,61,90,93,60,105,42,107,41,110,45,116,38,113,38,112,38,124,26,132,27,136,19,140,20,155,14,159,16,158,18,170,13,177,10,187,8,192,6,175,9,159,10,21,178,59,110,71,86,75,85,84,83,91,66,88,73,87,72,92,75,98,72,105,58,107,54,115,52,114,55,112,56,129,51,132,40,150,33,140,29,98,35,77,42,42,121,96,66,108,43,111,40,117,44,123,32,120,36,119,33,127,33,134,34,139,21,147,23,152,20,158,25,154,26,166,21,173,16,184,13,184,10,150,13,139,15,22,178,63,114,74,82,84,83,92,82,103,62,96,72,96,67,101,73,107,72,113,55,118,52,125,52,118,52,117,55,135,49,137,39,157,32,145,29,97,33,77,40], "i8", ALLOC_NONE, 5255880);
allocate([0,0,206,64,0,0,200,64,0,0,184,64,0,0,170,64,0,0,162,64,0,0,154,64,0,0,144,64,0,0,140,64,0,0,156,64,0,0,150,64,0,0,146,64,0,0,142,64,0,0,156,64,0,0,148,64,0,0,138,64,0,0,144,64,0,0,140,64,0,0,148,64,0,0,152,64,0,0,142,64,0,0,112,64,0,0,112,64,0,0,112,64,0,0,112,64,0,0,112,64], "i8", ALLOC_NONE, 5256216);
allocate([6,0,3,0,7,3,0,1,10,0,2,6,18,10,12], "i8", ALLOC_NONE, 5256316);
allocate([4,0,2,0,0,0,9,4,7,4,0,3,12,7,7], "i8", ALLOC_NONE, 5256332);
allocate([0,64,202,69,27,76,255,82,130,90,179,98,162,107,96,117], "i8", ALLOC_NONE, 5256348);
allocate([0,0,157,62,0,64,94,62,0,192,4,62,0,128,237,62,0,64,137,62,0,0,0,0,0,192,76,63,0,0,205,61,0,0,0,0], "i8", ALLOC_NONE, 5256364);
allocate([255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,41,0,41,0,41,0,82,0,82,0,123,0,164,0,200,0,222,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,0,41,0,41,0,41,0,123,0,123,0,123,0,164,0,164,0,240,0,10,1,27,1,39,1,41,0,41,0,41,0,41,0,41,0,41,0,41,0,41,0,123,0,123,0,123,0,123,0,240,0,240,0,240,0,10,1,10,1,49,1,62,1,72,1,80,1,123,0,123,0,123,0,123,0,123,0,123,0,123,0,123,0,240,0,240,0,240,0,240,0,49,1,49,1,49,1,62,1,62,1,87,1,95,1,102,1,108,1,240,0,240,0,240,0,240,0,240,0,240,0,240,0,240,0,49,1,49,1,49,1,49,1,87,1,87,1,87,1,95,1,95,1,114,1,120,1,126,1,131,1], "i8", ALLOC_NONE, 5256400);
allocate([224,224,224,224,224,224,224,224,160,160,160,160,185,185,185,178,178,168,134,61,37,224,224,224,224,224,224,224,224,240,240,240,240,207,207,207,198,198,183,144,66,40,160,160,160,160,160,160,160,160,185,185,185,185,193,193,193,183,183,172,138,64,38,240,240,240,240,240,240,240,240,207,207,207,207,204,204,204,193,193,180,143,66,40,185,185,185,185,185,185,185,185,193,193,193,193,193,193,193,183,183,172,138,65,39,207,207,207,207,207,207,207,207,204,204,204,204,201,201,201,188,188,176,141,66,40,193,193,193,193,193,193,193,193,193,193,193,193,194,194,194,184,184,173,139,65,39,204,204,204,204,204,204,204,204,201,201,201,201,198,198,198,187,187,175,140,66,40] /* \E0\E0\E0\E0\E0\E0\E */, "i8", ALLOC_NONE, 5256612);
allocate([40,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,40,15,23,28,31,34,36,38,39,41,42,43,44,45,46,47,47,49,50,51,52,53,54,55,55,57,58,59,60,61,62,63,63,65,66,67,68,69,70,71,71,40,20,33,41,48,53,57,61,64,66,69,71,73,75,76,78,80,82,85,87,89,91,92,94,96,98,101,103,105,107,108,110,112,114,117,119,121,123,124,126,128,40,23,39,51,60,67,73,79,83,87,91,94,97,100,102,105,107,111,115,118,121,124,126,129,131,135,139,142,145,148,150,153,155,159,163,166,169,172,174,177,179,35,28,49,65,78,89,99,107,114,120,126,132,136,141,145,149,153,159,165,171,176,180,185,189,192,199,205,211,216,220,225,229,232,239,245,251,21,33,58,79,97,112,125,137,148,157,166,174,182,189,195,201,207,217,227,235,243,251,17,35,63,86,106,123,139,152,165,177,187,197,206,214,222,230,237,250,25,31,55,75,91,105,117,128,138,146,154,161,168,174,180,185,190,200,208,215,222,229,235,240,245,255,16,36,65,89,110,128,144,159,173,185,196,207,217,226,234,242,250,11,41,74,103,128,151,172,191,209,225,241,255,9,43,79,110,138,163,186,207,227,246,12,39,71,99,123,144,164,182,198,214,228,241,253,9,44,81,113,142,168,192,214,235,255,7,49,90,127,160,191,220,247,6,51,95,134,170,203,234,7,47,87,123,155,184,212,237,6,52,97,137,174,208,240,5,57,106,151,192,231,5,59,111,158,202,243,5,55,103,147,187,224,5,60,113,161,206,248,4,65,122,175,224,4,67,127,182,234] /* (\07\07\07\07\07\07\ */, "i8", ALLOC_NONE, 5256780);
allocate([0,134,107,63,0,20,46,63,0,112,189,62,0,208,76,62], "i8", ALLOC_NONE, 5257172);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,80,75,69,63,56,49,40,34,29,20,18,10,0,0,0,0,0,0,0,0,110,100,90,84,78,71,65,58,51,45,39,32,26,20,12,0,0,0,0,0,0,118,110,103,93,86,80,75,70,65,59,53,47,40,31,23,15,4,0,0,0,0,126,119,112,104,95,89,83,78,72,66,60,54,47,39,32,25,17,12,1,0,0,134,127,120,114,103,97,91,85,78,72,66,60,54,47,41,35,29,23,16,10,1,144,137,130,124,113,107,101,95,88,82,76,70,64,57,51,45,39,33,26,15,1,152,145,138,132,123,117,111,105,98,92,86,80,74,67,61,55,49,43,36,20,1,162,155,148,142,133,127,121,115,108,102,96,90,84,77,71,65,59,53,46,30,1,172,165,158,152,143,137,131,125,118,112,106,100,94,87,81,75,69,63,56,45,20,200,200,200,200,200,200,200,200,198,193,188,183,178,173,168,163,158,153,148,129,104] /* \00\00\00\00\00\00\0 */, "i8", ALLOC_NONE, 5257188);
allocate(472, "i8", ALLOC_NONE, 5257420);
allocate([154,121,102,102], "i8", ALLOC_NONE, 5257892);
allocate([184,126,51,115], "i8", ALLOC_NONE, 5257896);
allocate([0,8,13,16,19,21,23,24,26,27,28,29,30,31,32,32,33,34,34,35,36,36,37,37] /* \00\08\0D\10\13\15\1 */, "i8", ALLOC_NONE, 5257900);
allocate([184,126,154,121], "i8", ALLOC_NONE, 5257924);
allocate(60, "i8", ALLOC_NONE, 5257928);
allocate([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,3,0,0,0,5,0,0,0,7,0,0,0,9,0,0,0,11,0,0,0,13,0,0,0,15,0,0,0,17,0,0,0,19,0,0,0,21,0,0,0,23,0,0,0,25,0,0,0,27,0,0,0,29,0,0,0,31,0,0,0,33,0,0,0,35,0,0,0,37,0,0,0,39,0,0,0,41,0,0,0,43,0,0,0,45,0,0,0,47,0,0,0,49,0,0,0,51,0,0,0,53,0,0,0,55,0,0,0,57,0,0,0,59,0,0,0,61,0,0,0,63,0,0,0,65,0,0,0,67,0,0,0,69,0,0,0,71,0,0,0,73,0,0,0,75,0,0,0,77,0,0,0,79,0,0,0,81,0,0,0,83,0,0,0,85,0,0,0,87,0,0,0,89,0,0,0,91,0,0,0,93,0,0,0,95,0,0,0,97,0,0,0,99,0,0,0,101,0,0,0,103,0,0,0,105,0,0,0,107,0,0,0,109,0,0,0,111,0,0,0,113,0,0,0,115,0,0,0,117,0,0,0,119,0,0,0,121,0,0,0,123,0,0,0,125,0,0,0,127,0,0,0,129,0,0,0,131,0,0,0,133,0,0,0,135,0,0,0,137,0,0,0,139,0,0,0,141,0,0,0,143,0,0,0,145,0,0,0,147,0,0,0,149,0,0,0,151,0,0,0,153,0,0,0,155,0,0,0,157,0,0,0,159,0,0,0,161,0,0,0,163,0,0,0,165,0,0,0,167,0,0,0,169,0,0,0,171,0,0,0,173,0,0,0,175,0,0,0,177,0,0,0,179,0,0,0,181,0,0,0,183,0,0,0,185,0,0,0,187,0,0,0,189,0,0,0,191,0,0,0,193,0,0,0,195,0,0,0,197,0,0,0,199,0,0,0,201,0,0,0,203,0,0,0,205,0,0,0,207,0,0,0,209,0,0,0,211,0,0,0,213,0,0,0,215,0,0,0,217,0,0,0,219,0,0,0,221,0,0,0,223,0,0,0,225,0,0,0,227,0,0,0,229,0,0,0,231,0,0,0,233,0,0,0,235,0,0,0,237,0,0,0,239,0,0,0,241,0,0,0,243,0,0,0,245,0,0,0,247,0,0,0,249,0,0,0,251,0,0,0,253,0,0,0,255,0,0,0,1,1,0,0,3,1,0,0,5,1,0,0,7,1,0,0,9,1,0,0,11,1,0,0,13,1,0,0,15,1,0,0,17,1,0,0,19,1,0,0,21,1,0,0,23,1,0,0,25,1,0,0,27,1,0,0,29,1,0,0,31,1,0,0,33,1,0,0,35,1,0,0,37,1,0,0,39,1,0,0,41,1,0,0,43,1,0,0,45,1,0,0,47,1,0,0,49,1,0,0,51,1,0,0,53,1,0,0,55,1,0,0,57,1,0,0,59,1,0,0,61,1,0,0,63,1,0,0,65,1,0,0,67,1,0,0,69,1,0,0,71,1,0,0,73,1,0,0,75,1,0,0,77,1,0,0,79,1,0,0,81,1,0,0,83,1,0,0,85,1,0,0,87,1,0,0,89,1,0,0,91,1,0,0,93,1,0,0,95,1,0,0,13,0,0,0,25,0,0,0,41,0,0,0,61,0,0,0,85,0,0,0,113,0,0,0,145,0,0,0,181,0,0,0,221,0,0,0,9,1,0,0,57,1,0,0,109,1,0,0,165,1,0,0,225,1,0,0,33,2,0,0,101,2,0,0,173,2,0,0,249,2,0,0,73,3,0,0,157,3,0,0,245,3,0,0,81,4,0,0,177,4,0,0,21,5,0,0,125,5,0,0,233,5,0,0,89,6,0,0,205,6,0,0,69,7,0,0,193,7,0,0,65,8,0,0,197,8,0,0,77,9,0,0,217,9,0,0,105,10,0,0,253,10,0,0,149,11,0,0,49,12,0,0,209,12,0,0,117,13,0,0,29,14,0,0,201,14,0,0,121,15,0,0,45,16,0,0,229,16,0,0,161,17,0,0,97,18,0,0,37,19,0,0,237,19,0,0,185,20,0,0,137,21,0,0,93,22,0,0,53,23,0,0,17,24,0,0,241,24,0,0,213,25,0,0,189,26,0,0,169,27,0,0,153,28,0,0,141,29,0,0,133,30,0,0,129,31,0,0,129,32,0,0,133,33,0,0,141,34,0,0,153,35,0,0,169,36,0,0,189,37,0,0,213,38,0,0,241,39,0,0,17,41,0,0,53,42,0,0,93,43,0,0,137,44,0,0,185,45,0,0,237,46,0,0,37,48,0,0,97,49,0,0,161,50,0,0,229,51,0,0,45,53,0,0,121,54,0,0,201,55,0,0,29,57,0,0,117,58,0,0,209,59,0,0,49,61,0,0,149,62,0,0,253,63,0,0,105,65,0,0,217,66,0,0,77,68,0,0,197,69,0,0,65,71,0,0,193,72,0,0,69,74,0,0,205,75,0,0,89,77,0,0,233,78,0,0,125,80,0,0,21,82,0,0,177,83,0,0,81,85,0,0,245,86,0,0,157,88,0,0,73,90,0,0,249,91,0,0,173,93,0,0,101,95,0,0,33,97,0,0,225,98,0,0,165,100,0,0,109,102,0,0,57,104,0,0,9,106,0,0,221,107,0,0,181,109,0,0,145,111,0,0,113,113,0,0,85,115,0,0,61,117,0,0,41,119,0,0,25,121,0,0,13,123,0,0,5,125,0,0,1,127,0,0,1,129,0,0,5,131,0,0,13,133,0,0,25,135,0,0,41,137,0,0,61,139,0,0,85,141,0,0,113,143,0,0,145,145,0,0,181,147,0,0,221,149,0,0,9,152,0,0,57,154,0,0,109,156,0,0,165,158,0,0,225,160,0,0,33,163,0,0,101,165,0,0,173,167,0,0,249,169,0,0,73,172,0,0,157,174,0,0,245,176,0,0,81,179,0,0,177,181,0,0,21,184,0,0,125,186,0,0,233,188,0,0,89,191,0,0,205,193,0,0,69,196,0,0,193,198,0,0,65,201,0,0,197,203,0,0,77,206,0,0,217,208,0,0,105,211,0,0,253,213,0,0,149,216,0,0,49,219,0,0,209,221,0,0,117,224,0,0,29,227,0,0,201,229,0,0,121,232,0,0,45,235,0,0,229,237,0,0,161,240,0,0,63,0,0,0,129,0,0,0,231,0,0,0,121,1,0,0,63,2,0,0,65,3,0,0,135,4,0,0,25,6,0,0,255,7,0,0,65,10,0,0,231,12,0,0,249,15,0,0,127,19,0,0,129,23,0,0,7,28,0,0,25,33,0,0,191,38,0,0,1,45,0,0,231,51,0,0,121,59,0,0,191,67,0,0,193,76,0,0,135,86,0,0,25,97,0,0,127,108,0,0,193,120,0,0,231,133,0,0,249,147,0,0,255,162,0,0,1,179,0,0,7,196,0,0,25,214,0,0,63,233,0,0,129,253,0,0,231,18,1,0,121,41,1,0,63,65,1,0,65,90,1,0,135,116,1,0,25,144,1,0,255,172,1,0,65,203,1,0,231,234,1,0,249,11,2,0,127,46,2,0,129,82,2,0,7,120,2,0,25,159,2,0,191,199,2,0,1,242,2,0,231,29,3,0,121,75,3,0,191,122,3,0,193,171,3,0,135,222,3,0,25,19,4,0,127,73,4,0,193,129,4,0,231,187,4,0,249,247,4,0,255,53,5,0,1,118,5,0,7,184,5,0,25,252,5,0,63,66,6,0,129,138,6,0,231,212,6,0,121,33,7,0,63,112,7,0,65,193,7,0,135,20,8,0,25,106,8,0,255,193,8,0,65,28,9,0,231,120,9,0,249,215,9,0,127,57,10,0,129,157,10,0,7,4,11,0,25,109,11,0,191,216,11,0,1,71,12,0,231,183,12,0,121,43,13,0,191,161,13,0,193,26,14,0,135,150,14,0,25,21,15,0,127,150,15,0,193,26,16,0,231,161,16,0,249,43,17,0,255,184,17,0,1,73,18,0,7,220,18,0,25,114,19,0,63,11,20,0,129,167,20,0,231,70,21,0,121,233,21,0,63,143,22,0,65,56,23,0,135,228,23,0,25,148,24,0,255,70,25,0,65,253,25,0,231,182,26,0,249,115,27,0,127,52,28,0,129,248,28,0,7,192,29,0,25,139,30,0,191,89,31,0,1,44,32,0,231,1,33,0,121,219,33,0,191,184,34,0,193,153,35,0,135,126,36,0,25,103,37,0,127,83,38,0,193,67,39,0,231,55,40,0,249,47,41,0,255,43,42,0,1,44,43,0,7,48,44,0,25,56,45,0,63,68,46,0,129,84,47,0,231,104,48,0,121,129,49,0,63,158,50,0,65,191,51,0,135,228,52,0,25,14,54,0,255,59,55,0,65,110,56,0,231,164,57,0,249,223,58,0,127,31,60,0,129,99,61,0,7,172,62,0,25,249,63,0,191,74,65,0,1,161,66,0,231,251,67,0,121,91,69,0,191,191,70,0,193,40,72,0,135,150,73,0,25,9,75,0,127,128,76,0,193,252,77,0,231,125,79,0,249,3,81,0,255,142,82,0,1,31,84,0,7,180,85,0,25,78,87,0,63,237,88,0,129,145,90,0,231,58,92,0,121,233,93,0,63,157,95,0,65,86,97,0,135,20,99,0,25,216,100,0,255,160,102,0,65,111,104,0,231,66,106,0,249,27,108,0,127,250,109,0,65,1,0,0,169,2,0,0,9,5,0,0,193,8,0,0,65,14,0,0,9,22,0,0,169,32,0,0,193,46,0,0,1,65,0,0,41,88,0,0,9,117,0,0,129,152,0,0,129,195,0,0,9,247,0,0,41,52,1,0,1,124,1,0,193,207,1,0,169,48,2,0,9,160,2,0,65,31,3,0,193,175,3,0,9,83,4,0,169,10,5,0,65,216,5,0,129,189,6,0,41,188,7,0,9,214,8,0,1,13,10,0,1,99,11,0,9,218,12,0,41,116,14,0,129,51,16,0,65,26,18,0,169,42,20,0,9,103,22,0,193,209,24,0,65,109,27,0,9,60,30,0,169,64,33,0,193,125,36,0,1,246,39,0,41,172,43,0,9,163,47,0,129,221,51,0,129,94,56,0,9,41,61,0,41,64,66,0,1,167,71,0,193,96,77,0,169,112,83,0,9,218,89,0,65,160,96,0,193,198,103,0,9,81,111,0,169,66,119,0,65,159,127,0,129,106,136,0,41,168,145,0,9,92,155,0,1,138,165,0,1,54,176,0,9,100,187,0,41,24,199,0,129,86,211,0,65,35,224,0,169,130,237,0,9,121,251,0,193,10,10,1,65,60,25,1,9,18,41,1,169,144,57,1,193,188,74,1,1,155,92,1,41,48,111,1,9,129,130,1,129,146,150,1,129,105,171,1,9,11,193,1,41,124,215,1,1,194,238,1,193,225,6,2,169,224,31,2,9,196,57,2,65,145,84,2,193,77,112,2,9,255,140,2,169,170,170,2,65,86,201,2,129,7,233,2,41,196,9,3,9,146,43,3,1,119,78,3,1,121,114,3,9,158,151,3,41,236,189,3,129,105,229,3,65,28,14,4,169,10,56,4,9,59,99,4,193,179,143,4,65,123,189,4,9,152,236,4,169,16,29,5,193,235,78,5,1,48,130,5,41,228,182,5,9,15,237,5,129,183,36,6,129,228,93,6,9,157,152,6,41,232,212,6,1,205,18,7,193,82,82,7,169,128,147,7,9,94,214,7,65,242,26,8,193,68,97,8,9,93,169,8,169,66,243,8,65,253,62,9,129,148,140,9,41,16,220,9,9,120,45,10,1,212,128,10,1,44,214,10,9,136,45,11,41,240,134,11,129,108,226,11,65,5,64,12,169,194,159,12,9,173,1,13,193,204,101,13,65,42,204,13,9,206,52,14,169,192,159,14,193,10,13,15,1,181,124,15,41,200,238,15,9,77,99,16,129,76,218,16,129,207,83,17,9,223,207,17,41,132,78,18,1,200,207,18,193,179,83,19,169,80,218,19,9,168,99,20,65,195,239,20,193,171,126,21,9,107,16,22,169,10,165,22,65,148,60,23,129,17,215,23,41,140,116,24,9,14,21,25,1,161,184,25,1,79,95,26,9,34,9,27,41,36,182,27,129,95,102,28,65,222,25,29,169,170,208,29,9,207,138,30,193,85,72,31,65,73,9,32,9,180,205,32,169,160,149,33,193,25,97,34,1,42,48,35,41,220,2,36,9,59,217,36,129,81,179,37,147,6,0,0,69,14,0,0,15,28,0,0,17,51,0,0,91,87,0,0,13,142,0,0,119,221,0,0,57,77,1,0,99,230,1,0,149,179,2,0,31,193,3,0,33,29,5,0,171,215,6,0,221,2,9,0,7,179,11,0,201,254,14,0,51,255,18,0,229,207,23,0,47,143,29,0,49,94,36,0,251,96,44,0,173,190,53,0,151,161,64,0,89,55,77,0,3,177,91,0,53,67,108,0,63,38,127,0,65,150,148,0,75,211,172,0,125,33,200,0,39,201,230,0,233,22,9,1,211,91,47,1,133,237,89,1,79,38,137,1,81,101,189,1,155,14,247,1,77,139,54,2,183,73,124,2,121,189,200,2,163,95,28,3,213,174,119,3,95,47,219,3,97,107,71,4,235,242,188,4,29,92,60,5,71,67,198,5,9,75,91,6,115,28,252,6,37,103,169,7,111,225,99,8,113,72,44,9,59,96,3,10,237,243,233,10,215,213,224,11,153,223,232,12,67,242,2,14,117,246,47,15,127,220,112,16,129,156,198,17,139,54,50,19,189,178,180,20,103,33,79,22,41,155,2,24,19,65,208,25,197,60,185,27,143,192,190,29,145,7,226,31,219,85,36,34,141,248,134,36,247,69,11,39,185,157,178,41,227,104,126,44,21,26,112,47,159,45,137,50,161,41,203,53,43,158,55,57,93,37,208,60,135,99,150,64,73,7,140,68,179,201,178,72,101,110,12,77,175,195,154,81,177,162,95,86,123,239,92,91,45,153,148,96,23,154,8,102,217,247,186,107,131,195,173,113,181,25,227,119,191,34,93,126,29,35,0,0,113,77,0,0,145,156,0,0,253,38,1,0,101,12,2,0,233,119,3,0,153,162,5,0,53,214,8,0,45,112,13,0,225,228,19,0,33,195,28,0,237,183,40,0,117,146,56,0,89,72,77,0,41,250,103,0,37,248,137,0,61,199,180,0,81,38,234,0,177,19,44,1,221,210,124,1,133,242,222,1,201,82,85,2,185,43,227,2,21,20,140,3,77,8,84,4,193,113,63,5,65,46,83,6,205,151,148,7,149,140,9,9,57,119,184,10,73,87,168,12,5,202,224,14,93,19,106,17,49,39,77,20,209,178,147,23,189,38,72,27,165,192,117,31,169,149,40,36,217,156,109,41,245,185,82,47,109,200,230,53,161,166,57,61,97,65,92,69,173,159,96,78,181,238,89,88,25,142,92,99,105,28,126,111,229,131,213,124,255,189,0,0,1,168,1,0,143,107,3,0,241,158,6,0,63,35,12,0,193,61,21,0,143,182,35,0,241,252,57,0,255,81,91,0,1,250,139,0,15,117,209,0,113,191,50,1,63,154,184,1,193,220,109,2,15,207,95,3,113,142,158,4,255,123,61,6,1,182,83,8,143,156,252,10,241,97,88,14,63,167,140,18,193,37,197,23,143,101,52,30,241,129,20,38,255,251,167,47,1,156,58,59,15,98,34,73,113,134,192,89,63,138,130,109,193,88,227,132,1,14,4,0,145,33,9,0,17,44,19,0,65,238,37,0,65,79,71,0,145,67,128,0,17,247,221,0,1,70,115,1,1,146,90,2,17,1,184,3,145,53,188,5,65,143,167,8,65,6,206,12,17,178,155,18,145,15,154,26,1,26,118,37,1,76,7,52,145,158,87,71,17,157,172,96,65,166,145,129,35,81,22,0,197,158,50,0,23,185,107,0,153,246,216,0,107,137,160,1,13,196,254,2,31,1,80,5,33,217,29,9,51,108,48,15,213,162,164,24,167,103,8,39,41,253,125,60,123,181,231,91,29,119,29,137,175,160,45,201,173,142,123,0,137,230,25,1,57,150,94,2,61,22,216,4,181,99,119,9,225,40,198,17,33,3,52,32,117,72,130,56,125,87,87,96,191,91,175,2,129,216,39,6,247,132,94,13,233,254,173,27,127,139,235,54,129,183,229,104,23,3,156,193,193,12,255,14,57,106,133,34,25,238,145,75,129,120,43,158,51,225,9,84], "i8", ALLOC_NONE, 5257988);
HEAP32[((5245072)>>2)]=((5245968)|0);
HEAP32[((5245076)>>2)]=((5245840)|0);
HEAP32[((5245080)>>2)]=((5244944)|0);
HEAP32[((5245084)>>2)]=((5245280)|0);
HEAP32[((5245088)>>2)]=((5245136)|0);
HEAP32[((5245092)>>2)]=((5245696)|0);
HEAP32[((5245096)>>2)]=((5245004)|0);
HEAP32[((5245108)>>2)]=((5246480)|0);
HEAP32[((5245112)>>2)]=((5245904)|0);
HEAP32[((5245116)>>2)]=((5244976)|0);
HEAP32[((5245120)>>2)]=((5245536)|0);
HEAP32[((5245124)>>2)]=((5245208)|0);
HEAP32[((5245128)>>2)]=((5245768)|0);
HEAP32[((5245132)>>2)]=((5245040)|0);
HEAP32[((5246832)>>2)]=((5247088)|0);
HEAP32[((5246836)>>2)]=((5247008)|0);
HEAP32[((5246840)>>2)]=((5246848)|0);
HEAP32[((5247128)>>2)]=((5247188)|0);
HEAP32[((5247132)>>2)]=((5247172)|0);
HEAP32[((5247136)>>2)]=((5247140)|0);
HEAP32[((5247464)>>2)]=((5247480)|0);
HEAP32[((5247468)>>2)]=((5247472)|0);
HEAP32[((5247932)>>2)]=((5255836)|0);
HEAP32[((5247952)>>2)]=((5257188)|0);
HEAP32[((5247956)>>2)]=((5249932)|0);
HEAP32[((5247960)>>2)]=((5242880)|0);
HEAP32[((5247988)>>2)]=((5248008)|0);
HEAP32[((5247996)>>2)]=((5256400)|0);
HEAP32[((5248000)>>2)]=((5256780)|0);
HEAP32[((5248004)>>2)]=((5256612)|0);
HEAP32[((5253860)>>2)]=((5254024)|0);
HEAP32[((5253864)>>2)]=((5249976)|0);
HEAP32[((5253912)>>2)]=((5255584)|0);
HEAP32[((5253916)>>2)]=((5249976)|0);
HEAP32[((5253964)>>2)]=((5255104)|0);
HEAP32[((5253968)>>2)]=((5249976)|0);
HEAP32[((5254016)>>2)]=((5254144)|0);
HEAP32[((5254020)>>2)]=((5249976)|0);
HEAP32[((5257928)>>2)]=((5257988)|0);
HEAP32[((5257932)>>2)]=(((5258692)|0));
HEAP32[((5257936)>>2)]=(((5259392)|0));
HEAP32[((5257940)>>2)]=(((5260088)|0));
HEAP32[((5257944)>>2)]=(((5260780)|0));
HEAP32[((5257948)>>2)]=(((5261468)|0));
HEAP32[((5257952)>>2)]=(((5262152)|0));
HEAP32[((5257956)>>2)]=(((5262512)|0));
HEAP32[((5257960)>>2)]=(((5262700)|0));
HEAP32[((5257964)>>2)]=(((5262816)|0));
HEAP32[((5257968)>>2)]=(((5262892)|0));
HEAP32[((5257972)>>2)]=(((5262948)|0));
HEAP32[((5257976)>>2)]=(((5262980)|0));
HEAP32[((5257980)>>2)]=(((5263004)|0));
HEAP32[((5257984)>>2)]=(((5263016)|0));
  var _sqrt=Math.sqrt;
  var _exp=Math.exp;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }
  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      Runtime.stackRestore(ret);
    }
  var ctlz_i8 = [8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];function _llvm_ctlz_i32(x) {
      var ret = ctlz_i8[x >>> 24];
      if (ret < 8) return ret;
      var ret = ctlz_i8[(x >> 16)&0xff];
      if (ret < 8) return ret + 8;
      var ret = ctlz_i8[(x >> 8)&0xff];
      if (ret < 8) return ret + 16;
      return ctlz_i8[x&0xff] + 24;
    }
  Module["_memcpy"] = _memcpy; 
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _llvm_va_end() {}
  var _floor=Math.floor;
  var _atan2=Math.atan2;
  var _cos=Math.cos;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  var _sqrtf=Math.sqrt;
  var _floorf=Math.floor;
  function _llvm_lifetime_start() {}
  var _llvm_memset_p0i8_i64=_memset;
  Module["_strlen"] = _strlen;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
___setErrNo(0);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var Math_min = Math.min;
var i64Math_add = function(a, b, c, d) { i64Math.add(a, b, c, d) };
var i64Math_subtract = function(a, b, c, d) { i64Math.subtract(a, b, c, d) };
var i64Math_multiply = function(a, b, c, d) { i64Math.multiply(a, b, c, d) };
var i64Math_divide = function(a, b, c, d, e) { i64Math.divide(a, b, c, d, e) };
var i64Math_modulo = function(a, b, c, d, e) { i64Math.modulo(a, b, c, d, e) };
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0.0;var z=0;var A=0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=global.Math.floor;var K=global.Math.abs;var L=global.Math.sqrt;var M=global.Math.pow;var N=global.Math.cos;var O=global.Math.sin;var P=global.Math.tan;var Q=global.Math.acos;var R=global.Math.asin;var S=global.Math.atan;var T=global.Math.atan2;var U=global.Math.exp;var V=global.Math.log;var W=global.Math.ceil;var X=global.Math.imul;var Y=env.abort;var Z=env.assert;var _=env.asmPrintInt;var $=env.asmPrintFloat;var aa=env.copyTempDouble;var ab=env.copyTempFloat;var ac=env.min;var ad=env.i64Math_add;var ae=env.i64Math_subtract;var af=env.i64Math_multiply;var ag=env.i64Math_divide;var ah=env.i64Math_modulo;var ai=env._llvm_va_end;var aj=env._cos;var ak=env._llvm_stackrestore;var al=env._sysconf;var am=env._llvm_ctlz_i32;var an=env.___setErrNo;var ao=env._llvm_stacksave;var ap=env.___errno_location;var aq=env._sqrt;var ar=env._sbrk;var as=env._atan2;var at=env._floorf;var au=env._abort;var av=env._floor;var aw=env._exp;var ax=env._time;var ay=env._sqrtf;var az=env._llvm_lifetime_start;
// EMSCRIPTEN_START_FUNCS
function aE(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function aF(){return i|0}function aG(a){a=a|0;i=a}function aH(a){a=a|0;o=a}function aI(a){a=a|0;z=a}function aJ(a){a=a|0;A=a}function aK(a){a=a|0;B=a}function aL(a){a=a|0;C=a}function aM(a){a=a|0;D=a}function aN(a){a=a|0;E=a}function aO(a){a=a|0;F=a}function aP(a){a=a|0;G=a}function aQ(a){a=a|0;H=a}function aR(a){a=a|0;I=a}function aS(a,d,e,f,h,i,j,k){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0;l=c[a+32>>2]|0;m=c[a+44>>2]|0;n=X(m,k);o=l+(h<<1)|0;p=(h|0)<(i|0);q=l+(i<<1)|0;r=a+8|0;a=k<<2;s=0;while(1){t=X(s,n);u=e+(t<<2)|0;v=b[o>>1]|0;w=X(v<<16>>16,k);x=d+(w+t<<2)|0;L3:do{if((w|0)>0){t=u;y=0;while(1){z=t+4|0;g[t>>2]=0.0;A=y+1|0;B=b[o>>1]|0;if((A|0)<(X(B<<16>>16,k)|0)){t=z;y=A}else{C=z;D=B;break L3}}}else{C=u;D=v}}while(0);L7:do{if(p){v=C;u=x;w=h;y=D;while(1){E=+g[f+(X(c[r>>2]|0,s)+w<<2)>>2];t=X(y<<16>>16,k);B=w+1|0;z=l+(B<<1)|0;A=X(b[z>>1]<<16>>16,k);F=t+1|0;G=((A|0)>(F|0)?A:F)-t|0;F=u+(G<<2)|0;H=t;t=u;I=v;while(1){g[I>>2]=E*+g[t>>2];J=H+1|0;if((J|0)<(A|0)){H=J;t=t+4|0;I=I+4|0}else{break}}I=v+(G<<2)|0;if((B|0)==(i|0)){K=I;break L7}v=I;u=F;w=B;y=b[z>>1]|0}}else{K=C}}while(0);x=b[q>>1]<<16>>16;if((X(x,k)|0)<(n|0)){b_(K|0,0,X(a,m-x|0)|0)}x=s+1|0;if((x|0)<(j|0)){s=x}else{break}}return}function aT(a,e,f,h,i,j,k,l,m,n,o,p,q){a=a|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0.0,I=0,J=0.0,K=0.0,M=0.0,N=0.0,O=0.0,P=0,Q=0,R=0,S=0,T=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0.0,ac=0,ad=0,ae=0.0;if((k|0)>=(l|0)){return}r=a+32|0;s=a+8|0;a=(i|0)==1;t=(h|0)==3;u=1<<h;v=(u|0)>0;w=k;k=q;while(1){q=w+1|0;x=c[r>>2]|0;y=(b[x+(q<<1)>>1]<<16>>16)-(b[x+(w<<1)>>1]<<16>>16)|0;x=y<<h;z=+U(+(((c[p+(w<<2)>>2]|0)+1|0)/(x|0)&-1|0)*-.125*.6931471805599453)*.5;A=1.0/+L(+(x|0));B=X(w,i);C=k;D=0;while(1){E=c[s>>2]|0;F=X(E,D)+w|0;G=+g[n+(F<<2)>>2];H=+g[o+(F<<2)>>2];if(a){I=E+w|0;J=+g[n+(I<<2)>>2];K=+g[o+(I<<2)>>2];M=H>K?H:K;N=G>J?G:J}else{M=H;N=G}G=+g[m+(F<<2)>>2]-(N<M?N:M);H=+U((-0.0-(G<0.0?0.0:G))*.6931471805599453)*2.0;if(t){O=H*1.4142135381698608}else{O=H}H=A*(z<O?z:O);F=X(D,j);I=(b[(c[r>>2]|0)+(w<<1)>>1]<<16>>16<<h)+F|0;F=e+(I<<2)|0;L33:do{if(v){E=f+(D+B|0)|0;G=-0.0-H;P=0;Q=C;R=0;while(1){S=((d[E]|0)&1<<P|0)!=0;L37:do{if(S|(y|0)<1){T=S?R:1;V=Q}else{W=P+I|0;Y=0;Z=Q;while(1){_=X(Z,1664525)+1013904223|0;g[e+(W+(Y<<h)<<2)>>2]=(_&32768|0)==0?G:H;$=Y+1|0;if(($|0)==(y|0)){T=1;V=_;break L37}else{Y=$;Z=_}}}}while(0);S=P+1|0;if((S|0)==(u|0)){break}else{P=S;Q=V;R=T}}if((T|0)==0|(x|0)<1){aa=V;break}else{ab=1.0000000036274937e-15;ac=0;ad=F}while(1){G=+g[ad>>2];ae=ab+G*G;R=ac+1|0;if((R|0)==(x|0)){break}else{ab=ae;ac=R;ad=ad+4|0}}G=1.0/+L(ae);R=0;Q=F;while(1){g[Q>>2]=G*+g[Q>>2];P=R+1|0;if((P|0)==(x|0)){aa=V;break L33}else{R=P;Q=Q+4|0}}}else{aa=C}}while(0);F=D+1|0;if((F|0)<(i|0)){C=aa;D=F}else{break}}if((q|0)==(l|0)){break}else{w=q;k=aa}}return}function aU(e,f,h,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;u=u|0;v=v|0;w=w|0;x=x|0;y=y|0;z=z|0;var A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0.0,by=0.0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0.0,bX=0.0,bY=0,bZ=0,b_=0,b$=0,b0=0.0,b1=0.0,b2=0.0,b3=0.0,b4=0.0,b5=0,b6=0,b7=0.0,b8=0;A=i;i=i+72|0;B=A|0;C=A+4|0;D=A+8|0;E=A+32|0;F=c[f+32>>2]|0;G=(l|0)!=0;H=G?2:1;I=(e|0)==0;J=(p|0)!=0?1<<x:1;p=F+(h<<1)|0;K=b[p>>1]<<16>>16<<x;M=b[F+((c[f+8>>2]|0)-1<<1)>>1]<<16>>16<<x;N=M-K|0;O=X(N,H);P=i;i=i+(O*4&-1)|0;i=i+3>>2<<2;c[E+32>>2]=n;n=E+24|0;c[n>>2]=w;O=E|0;c[O>>2]=e;c[E+12>>2]=s;c[E+4>>2]=f;e=c[z>>2]|0;Q=E+36|0;c[Q>>2]=e;c[E+16>>2]=q;if((h|0)>=(j|0)){R=e;c[z>>2]=R;i=A;return}e=E+8|0;S=j-1|0;T=w+20|0;U=w+28|0;w=E+28|0;V=y-1|0;W=E+20|0;Y=f+12|0;f=(1<<J)-1|0;Z=I^1;_=N-K|0;$=D|0;aa=D+4|0;ab=D+8|0;ac=D+16|0;ad=D+20|0;ae=D+12|0;af=H-1|0;ag=(q|0)!=3|(J|0)>1;q=1;ah=0;ai=k+(M<<2)|0;M=h;aj=v;v=r;while(1){c[e>>2]=M;r=(M|0)==(S|0);ak=F+(M<<1)|0;al=b[ak>>1]<<16>>16<<x;an=k+(al<<2)|0;if(G){ao=l+(al<<2)|0}else{ao=0}ap=M+1|0;aq=(b[F+(ap<<1)>>1]<<16>>16<<x)-al|0;al=c[T>>2]|0;ar=c[U>>2]|0;as=32-(am(ar|0,1)|0)|0;at=ar>>>((as-16|0)>>>0);ar=X(at,at);at=ar>>>31;au=ar>>>15>>>(at>>>0);ar=X(au,au);au=ar>>>31;av=ar>>>15>>>(au>>>0);ar=(al<<3)-(X(av,av)>>>31|(au|(at|as<<1)<<1)<<1)|0;as=aj-((M|0)==(h|0)?0:ar)|0;at=u-ar|0;au=at-1|0;c[w>>2]=au;do{if((M|0)>(V|0)){aw=0}else{av=y-M|0;al=(c[o+(M<<2)>>2]|0)+((as|0)/(((av|0)>3?3:av)|0)&-1)|0;av=(at|0)<(al|0)?at:al;if((av|0)<0){aw=0;break}aw=(av|0)>16383?16383:av}}while(0);do{if(I){if(((b[ak>>1]<<16>>16<<x)-aq|0)<(b[p>>1]<<16>>16<<x|0)){ax=ah;break}ax=(q|0)!=0|(ah|0)==0?M:ah}else{ax=ah}}while(0);at=c[t+(M<<2)>>2]|0;c[W>>2]=at;if((M|0)<(c[Y>>2]|0)){ay=ao;az=an;aA=ai}else{ay=G?P:ao;az=P;aA=0}av=r?0:aA;L71:do{if((ax|0)==0){aB=f;aC=f;aD=-1}else{if(!(ag|(at|0)<0)){aB=f;aC=f;aD=-1;break}al=((b[F+(ax<<1)>>1]<<16>>16<<x)-K|0)-aq|0;aE=(al|0)<0?0:al;al=aE+K|0;aF=ax;while(1){aG=aF-1|0;if((b[F+(aG<<1)>>1]<<16>>16<<x|0)>(al|0)){aF=aG}else{break}}aF=al+aq|0;aH=ax-1|0;while(1){aI=aH+1|0;if((b[F+(aI<<1)>>1]<<16>>16<<x|0)<(aF|0)){aH=aI}else{aJ=aG;aK=0;aL=0;break}}while(1){aH=X(aJ,H);aF=d[m+aH|0]|0|aL;al=d[m+(af+aH|0)|0]|0|aK;aH=aJ+1|0;if((aH|0)<(aI|0)){aJ=aH;aK=al;aL=aF}else{aB=al;aC=aF;aD=aE;break L71}}}}while(0);at=(M|0)!=(s|0)|(v|0)==0;an=at?v:0;L82:do{if(at|Z){if((an|0)==0){aM=67;break}aE=(aw|0)/2&-1;aF=(aD|0)!=-1;if(aF){aN=P+(aD<<2)|0}else{aN=0}if(r){aO=0}else{aO=P+((b[ak>>1]<<16>>16<<x)-K<<2)|0}al=aV(E,az,aq,aE,J,aN,x,aO,1.0,av,aC)|0;if(aF){aP=P+(aD+N<<2)|0}else{aP=0}if(r){aQ=0}else{aQ=P+(_+(b[ak>>1]<<16>>16<<x)<<2)|0}aR=aV(E,ay,aq,aE,J,aP,x,aQ,1.0,av,aB)|0;aS=al;aT=an;break}else{if(((b[ak>>1]<<16>>16<<x)-K|0)>0){aU=0}else{aM=67;break}while(1){al=P+(aU<<2)|0;g[al>>2]=(+g[al>>2]+ +g[P+(aU+N<<2)>>2])*.5;al=aU+1|0;if((al|0)<((b[ak>>1]<<16>>16<<x)-K|0)){aU=al}else{aM=67;break L82}}}}while(0);L100:do{if((aM|0)==67){aM=0;an=(aD|0)==-1;if((ay|0)==0){if(an){aX=0}else{aX=P+(aD<<2)|0}if(r){aY=0}else{aY=P+((b[ak>>1]<<16>>16<<x)-K<<2)|0}at=aV(E,az,aq,aw,J,aX,x,aY,1.0,av,aB|aC)|0;aR=at;aS=at;aT=0;break}if(an){aZ=0}else{aZ=P+(aD<<2)|0}if(r){a_=0}else{a_=P+((b[ak>>1]<<16>>16<<x)-K<<2)|0}an=aB|aC;c[B>>2]=aw;c[C>>2]=an;at=(c[O>>2]|0)!=0;al=c[n>>2]|0;if((aq|0)==1){aE=al+12|0;aF=al+16|0;aH=al+24|0;a$=al+8|0;a0=al+4|0;a1=al|0;a2=al+44|0;a3=al+20|0;a4=1;a5=az;a6=au;while(1){if((a6|0)>7){if(at){a7=+g[a5>>2]<0.0&1;a8=c[aE>>2]|0;a9=c[aF>>2]|0;if((a9+1|0)>>>0>32){ba=7-a9|0;bb=(ba|0)>-8?ba:-8;ba=a9;bc=a8;while(1){bd=c[a$>>2]|0;be=c[a0>>2]|0;if((bd+(c[aH>>2]|0)|0)>>>0<be>>>0){bf=bd+1|0;c[a$>>2]=bf;a[(c[a1>>2]|0)+(be-bf|0)|0]=bc&255;bg=0}else{bg=-1}c[a2>>2]=c[a2>>2]|bg;bh=bc>>>8;bf=ba-8|0;if((bf|0)>7){ba=bf;bc=bh}else{break}}bi=(a9-8|0)-(bb+a9&-8)|0;bj=bh}else{bi=a9;bj=a8}bk=a7;bl=bi+1|0;bm=a7<<bi|bj}else{bc=c[aE>>2]|0;ba=c[aF>>2]|0;if((ba|0)==0){bf=c[a$>>2]|0;be=c[a0>>2]|0;if(bf>>>0<be>>>0){bd=bf+1|0;c[a$>>2]=bd;bn=d[(c[a1>>2]|0)+(be-bd|0)|0]|0;bo=bd}else{bn=0;bo=bf}if(bo>>>0<be>>>0){bf=bo+1|0;c[a$>>2]=bf;bp=(d[(c[a1>>2]|0)+(be-bf|0)|0]|0)<<8;bq=bf}else{bp=0;bq=bo}if(bq>>>0<be>>>0){bf=bq+1|0;c[a$>>2]=bf;br=(d[(c[a1>>2]|0)+(be-bf|0)|0]|0)<<16;bs=bf}else{br=0;bs=bq}if(bs>>>0<be>>>0){bf=bs+1|0;c[a$>>2]=bf;bt=(d[(c[a1>>2]|0)+(be-bf|0)|0]|0)<<24}else{bt=0}bu=bn|bc|bp|br|bt;bv=32}else{bu=bc;bv=ba}bk=bu&1;bl=bv-1|0;bm=bu>>>1}c[aE>>2]=bm;c[aF>>2]=bl;c[a3>>2]=(c[a3>>2]|0)+1|0;c[w>>2]=(c[w>>2]|0)-8|0;bw=bk}else{bw=0}if(!at){g[a5>>2]=(bw|0)!=0?-1.0:1.0}if((a4|0)>=2){break}a4=a4+1|0;a5=ay;a6=c[w>>2]|0}if((a_|0)==0){aR=1;aS=1;aT=0;break}g[a_>>2]=+g[az>>2];aR=1;aS=1;aT=0;break}aW(E,D,az,ay,aq,B,J,J,x,1,C);a6=c[$>>2]|0;a5=c[ac>>2]|0;a4=c[ad>>2]|0;bx=+(c[aa>>2]|0)*30517578125.0e-15;by=+(c[ab>>2]|0)*30517578125.0e-15;a3=(aq|0)==2;aF=c[B>>2]|0;if(a3){if((a5|0)==16384|(a5|0)==0){bz=0}else{bz=8}aE=aF-bz|0;a1=(a5|0)>8192;c[w>>2]=(c[w>>2]|0)-(bz+a4|0)|0;a$=a1?ay:az;a0=a1?az:ay;do{if((bz|0)==0){bA=0}else{if(at){a1=+g[a$>>2]*+g[a0+4>>2]- +g[a$+4>>2]*+g[a0>>2]<0.0&1;a2=al+12|0;aH=c[a2>>2]|0;ba=al+16|0;bc=c[ba>>2]|0;if((bc+1|0)>>>0>32){bf=al+24|0;be=al+8|0;bd=al+4|0;bB=al|0;bC=al+44|0;bD=7-bc|0;bE=(bD|0)>-8?bD:-8;bD=bc;bF=aH;while(1){bG=c[be>>2]|0;bH=c[bd>>2]|0;if((bG+(c[bf>>2]|0)|0)>>>0<bH>>>0){bI=bG+1|0;c[be>>2]=bI;a[(c[bB>>2]|0)+(bH-bI|0)|0]=bF&255;bJ=0}else{bJ=-1}c[bC>>2]=c[bC>>2]|bJ;bK=bF>>>8;bI=bD-8|0;if((bI|0)>7){bD=bI;bF=bK}else{break}}bL=(bc-8|0)-(bE+bc&-8)|0;bM=bK}else{bL=bc;bM=aH}c[a2>>2]=a1<<bL|bM;c[ba>>2]=bL+1|0;bF=al+20|0;c[bF>>2]=(c[bF>>2]|0)+1|0;bA=a1;break}bF=al+12|0;bD=c[bF>>2]|0;bC=al+16|0;bB=c[bC>>2]|0;if((bB|0)==0){be=al+8|0;bf=al|0;bd=c[be>>2]|0;a7=c[al+4>>2]|0;if(bd>>>0<a7>>>0){a8=bd+1|0;c[be>>2]=a8;bN=d[(c[bf>>2]|0)+(a7-a8|0)|0]|0;bO=a8}else{bN=0;bO=bd}if(bO>>>0<a7>>>0){bd=bO+1|0;c[be>>2]=bd;bP=(d[(c[bf>>2]|0)+(a7-bd|0)|0]|0)<<8;bQ=bd}else{bP=0;bQ=bO}if(bQ>>>0<a7>>>0){bd=bQ+1|0;c[be>>2]=bd;bR=(d[(c[bf>>2]|0)+(a7-bd|0)|0]|0)<<16;bS=bd}else{bR=0;bS=bQ}if(bS>>>0<a7>>>0){bd=bS+1|0;c[be>>2]=bd;bT=(d[(c[bf>>2]|0)+(a7-bd|0)|0]|0)<<24}else{bT=0}bU=bN|bD|bP|bR|bT;bV=32}else{bU=bD;bV=bB}c[bF>>2]=bU>>>1;c[bC>>2]=bV-1|0;bC=al+20|0;c[bC>>2]=(c[bC>>2]|0)+1|0;bA=bU&1}}while(0);al=1-(bA<<1)|0;bC=aV(E,a$,2,aE,J,aZ,x,a_,1.0,av,an)|0;g[a0>>2]=+g[a$+4>>2]*+(-al|0);g[a0+4>>2]=+(al|0)*+g[a$>>2];if(at){aR=bC;aS=bC;aT=0;break}g[az>>2]=bx*+g[az>>2];al=az+4|0;g[al>>2]=bx*+g[al>>2];bW=by*+g[ay>>2];g[ay>>2]=bW;bF=ay+4|0;g[bF>>2]=by*+g[bF>>2];bX=+g[az>>2];g[az>>2]=bX-bW;g[ay>>2]=bX+ +g[ay>>2];bX=+g[al>>2];g[al>>2]=bX- +g[bF>>2];g[bF>>2]=bX+ +g[bF>>2];bY=bC}else{bC=(aF-(c[ae>>2]|0)|0)/2&-1;bF=(aF|0)<(bC|0)?aF:bC;bC=(bF|0)<0?0:bF;bF=aF-bC|0;al=(c[w>>2]|0)-a4|0;c[w>>2]=al;bB=c[C>>2]|0;if((bC|0)<(bF|0)){bD=aV(E,ay,aq,bF,J,0,x,0,by,0,bB>>J)|0;bd=((c[w>>2]|0)-al|0)+bF|0;if((bd|0)<25|(a5|0)==16384){bZ=bC}else{bZ=(bC-24|0)+bd|0}b_=aV(E,az,aq,bZ,J,aZ,x,a_,1.0,av,bB)|bD}else{bD=aV(E,az,aq,bC,J,aZ,x,a_,1.0,av,bB)|0;bd=((c[w>>2]|0)-al|0)+bC|0;if((bd|0)<25|(a5|0)==0){b$=bF}else{b$=(bF-24|0)+bd|0}b_=aV(E,ay,aq,b$,J,0,x,0,by,0,bB>>J)|bD}if(at){aR=b_;aS=b_;aT=0;break}else{bY=b_}}L207:do{if(!a3){bD=(aq|0)>0;L209:do{if(bD){bX=0.0;bW=0.0;bB=0;while(1){b0=+g[ay+(bB<<2)>>2];b1=bW+ +g[az+(bB<<2)>>2]*b0;b2=bX+b0*b0;bd=bB+1|0;if((bd|0)==(aq|0)){b3=b2;b4=b1;break L209}else{bX=b2;bW=b1;bB=bd}}}else{b3=0.0;b4=0.0}}while(0);bW=bx*bx+b3;bX=bx*b4*2.0;b1=bW-bX;b2=bW+bX;if(b2<.0006000000284984708|b1<.0006000000284984708){if(bD){b5=0}else{aR=bY;aS=bY;aT=0;break L100}while(1){g[ay+(b5<<2)>>2]=+g[az+(b5<<2)>>2];a1=b5+1|0;if((a1|0)==(aq|0)){break L207}else{b5=a1}}}else{bX=1.0/+L(b1);bW=1.0/+L(b2);if(bD){b6=0}else{aR=bY;aS=bY;aT=0;break L100}while(1){a1=az+(b6<<2)|0;b0=bx*+g[a1>>2];ba=ay+(b6<<2)|0;b7=+g[ba>>2];g[a1>>2]=bX*(b0-b7);g[ba>>2]=bW*(b0+b7);ba=b6+1|0;if((ba|0)==(aq|0)){break L207}else{b6=ba}}}}}while(0);if((a6|0)!=0&(aq|0)>0){b8=0}else{aR=bY;aS=bY;aT=0;break}while(1){a3=ay+(b8<<2)|0;g[a3>>2]=-0.0- +g[a3>>2];a3=b8+1|0;if((a3|0)==(aq|0)){aR=bY;aS=bY;aT=0;break L100}else{b8=a3}}}}while(0);au=X(M,H);a[m+au|0]=aS&255;a[m+(af+au|0)|0]=aR&255;au=(as+ar|0)+(c[o+(M<<2)>>2]|0)|0;if((ap|0)==(j|0)){break}else{q=(aw|0)>(aq<<3|0)&1;ah=ax;ai=av;M=ap;aj=au;v=aT}}R=c[Q>>2]|0;c[z>>2]=R;i=A;return}function aV(b,e,f,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=+m;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0.0,ag=0.0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;p=(c[b>>2]|0)!=0;q=c[b+20>>2]|0;r=(i|0)==1&1;s=(f|0)/(i|0)&-1;if((f|0)==1){t=c[b+24>>2]|0;u=b+28|0;v=t+12|0;w=t+16|0;x=t+24|0;y=t+8|0;z=t+4|0;A=t|0;B=t+44|0;C=t+20|0;if((c[u>>2]|0)>7){if(p){t=+g[e>>2]<0.0&1;D=c[v>>2]|0;E=c[w>>2]|0;if((E+1|0)>>>0>32){F=7-E|0;G=((F|0)>-8?F:-8)+E|0;F=E;H=D;while(1){I=c[y>>2]|0;J=c[z>>2]|0;if((I+(c[x>>2]|0)|0)>>>0<J>>>0){K=I+1|0;c[y>>2]=K;a[(c[A>>2]|0)+(J-K|0)|0]=H&255;M=0}else{M=-1}c[B>>2]=c[B>>2]|M;N=H>>>8;K=F-8|0;if((K|0)>7){F=K;H=N}else{break}}O=(E-8|0)-(G&-8)|0;P=N}else{O=E;P=D}Q=t;R=O+1|0;S=t<<O|P}else{P=c[v>>2]|0;O=c[w>>2]|0;if((O|0)==0){t=c[y>>2]|0;D=c[z>>2]|0;if(t>>>0<D>>>0){z=t+1|0;c[y>>2]=z;T=d[(c[A>>2]|0)+(D-z|0)|0]|0;U=z}else{T=0;U=t}if(U>>>0<D>>>0){t=U+1|0;c[y>>2]=t;V=(d[(c[A>>2]|0)+(D-t|0)|0]|0)<<8;W=t}else{V=0;W=U}if(W>>>0<D>>>0){U=W+1|0;c[y>>2]=U;Y=(d[(c[A>>2]|0)+(D-U|0)|0]|0)<<16;Z=U}else{Y=0;Z=W}if(Z>>>0<D>>>0){W=Z+1|0;c[y>>2]=W;_=(d[(c[A>>2]|0)+(D-W|0)|0]|0)<<24}else{_=0}$=_|(Y|(V|(T|P)));aa=32}else{$=P;aa=O}Q=$&1;R=aa-1|0;S=$>>>1}c[v>>2]=S;c[w>>2]=R;c[C>>2]=(c[C>>2]|0)+1|0;c[u>>2]=(c[u>>2]|0)-8|0;ab=Q}else{ab=0}if(!p){g[e>>2]=(ab|0)!=0?-1.0:1.0}if((l|0)==0){ac=1;return ac|0}g[l>>2]=+g[e>>2];ac=1;return ac|0}ab=(q|0)>0;Q=ab?q:0;L268:do{if((n|0)==0|(j|0)==0){ad=j}else{if((Q|0)==0){if(!((s&1|0)==0&(q|0)<0|(i|0)>1)){ad=j;break}}if((f|0)>0){ae=0}else{ad=n;break}while(1){g[n+(ae<<2)>>2]=+g[j+(ae<<2)>>2];u=ae+1|0;if((u|0)==(f|0)){ad=n;break L268}else{ae=u}}}}while(0);L276:do{if(ab){ae=(ad|0)==0;n=o;j=0;while(1){L280:do{if(p){u=1<<j;C=f>>j>>1;if((u|0)<=0){break}R=(C|0)>0;w=u<<1;S=0;while(1){L285:do{if(R){v=0;while(1){$=e+(X(w,v)+S<<2)|0;af=+g[$>>2]*.7071067690849304;aa=e+(((v<<1|1)<<j)+S<<2)|0;ag=+g[aa>>2]*.7071067690849304;g[$>>2]=af+ag;g[aa>>2]=af-ag;aa=v+1|0;if((aa|0)==(C|0)){break L285}else{v=aa}}}}while(0);v=S+1|0;if((v|0)==(u|0)){break L280}else{S=v}}}}while(0);L290:do{if(!ae){S=1<<j;u=f>>j>>1;if((S|0)<=0){break}C=(u|0)>0;w=S<<1;R=0;while(1){L295:do{if(C){v=0;while(1){aa=ad+(X(w,v)+R<<2)|0;ag=+g[aa>>2]*.7071067690849304;$=ad+(((v<<1|1)<<j)+R<<2)|0;af=+g[$>>2]*.7071067690849304;g[aa>>2]=ag+af;g[$>>2]=ag-af;$=v+1|0;if(($|0)==(u|0)){break L295}else{v=$}}}}while(0);v=R+1|0;if((v|0)==(S|0)){break L290}else{R=v}}}}while(0);R=(d[5247708+(n>>4)|0]|0)<<2|(d[5247708+(n&15)|0]|0);S=j+1|0;if((S|0)<(Q|0)){n=R;j=S}else{ah=R;break L276}}}else{ah=o}}while(0);o=i>>Q;i=s<<Q;L301:do{if((i&1|0)==0&(q|0)<0){s=(ad|0)!=0;j=i;n=0;ae=ah;R=o;S=q;while(1){L305:do{if(p){u=j>>1;if((R|0)<=0){break}w=(u|0)>0;C=R<<1;v=0;while(1){L310:do{if(w){$=0;while(1){aa=e+(X(C,$)+v<<2)|0;af=+g[aa>>2]*.7071067690849304;O=e+(X($<<1|1,R)+v<<2)|0;ag=+g[O>>2]*.7071067690849304;g[aa>>2]=af+ag;g[O>>2]=af-ag;O=$+1|0;if((O|0)==(u|0)){break L310}else{$=O}}}}while(0);$=v+1|0;if(($|0)==(R|0)){break L305}else{v=$}}}}while(0);v=j>>1;L315:do{if(s&(R|0)>0){u=(v|0)>0;C=R<<1;w=0;while(1){L319:do{if(u){$=0;while(1){O=ad+(X(C,$)+w<<2)|0;ag=+g[O>>2]*.7071067690849304;aa=ad+(X($<<1|1,R)+w<<2)|0;af=+g[aa>>2]*.7071067690849304;g[O>>2]=ag+af;g[aa>>2]=ag-af;aa=$+1|0;if((aa|0)==(v|0)){break L319}else{$=aa}}}}while(0);$=w+1|0;if(($|0)==(R|0)){break L315}else{w=$}}}}while(0);w=ae<<R|ae;C=R<<1;u=n+1|0;$=S+1|0;if((v&1|0)==0&($|0)<0){j=v;n=u;ae=w;R=C;S=$}else{ai=v;aj=u;ak=w;al=C;break L301}}}else{ai=i;aj=0;ak=ah;al=o}}while(0);o=(al|0)>1;do{if(o){if(p){aX(e,ai>>Q,al<<Q,r)}if((ad|0)==0){break}aX(ad,ai>>Q,al<<Q,r)}}while(0);ah=aY(b,e,f,h,al,ad,k,m,ak)|0;if(p){ac=ah;return ac|0}if(o){aZ(e,ai>>Q,al<<Q,r)}L338:do{if((aj|0)>0){r=ai;o=ah;p=0;ak=al;while(1){k=ak>>1;ad=r<<1;h=o>>>(k>>>0)|o;b=ad>>1;L341:do{if((k|0)>0){i=(ad|0)>0;q=k<<1;S=0;while(1){L345:do{if(i){R=0;while(1){ae=e+(X(q,R)+S<<2)|0;m=+g[ae>>2]*.7071067690849304;n=e+(X(R<<1|1,k)+S<<2)|0;af=+g[n>>2]*.7071067690849304;g[ae>>2]=m+af;g[n>>2]=m-af;n=R+1|0;if((n|0)==(b|0)){break L345}else{R=n}}}}while(0);R=S+1|0;if((R|0)==(k|0)){break L341}else{S=R}}}}while(0);b=p+1|0;if((b|0)==(aj|0)){am=h;an=k;break L338}else{r=ad;o=h;p=b;ak=k}}}else{am=ah;an=al}}while(0);L351:do{if(ab){al=am;ah=0;while(1){aj=d[al+5247724|0]|0;ai=1<<ah;ak=f>>ah>>1;L354:do{if((ai|0)>0){p=(ak|0)>0;o=ai<<1;r=0;while(1){L358:do{if(p){b=0;while(1){v=e+(X(o,b)+r<<2)|0;af=+g[v>>2]*.7071067690849304;S=e+(((b<<1|1)<<ah)+r<<2)|0;m=+g[S>>2]*.7071067690849304;g[v>>2]=af+m;g[S>>2]=af-m;S=b+1|0;if((S|0)==(ak|0)){break L358}else{b=S}}}}while(0);b=r+1|0;if((b|0)==(ai|0)){break L354}else{r=b}}}}while(0);ai=ah+1|0;if((ai|0)<(Q|0)){al=aj;ah=ai}else{ao=aj;break L351}}}else{ao=am}}while(0);am=an<<Q;L364:do{if((l|0)!=0){m=+L(+(f|0));if((f|0)>0){ap=0}else{break}while(1){g[l+(ap<<2)>>2]=m*+g[e+(ap<<2)>>2];Q=ap+1|0;if((Q|0)==(f|0)){break L364}else{ap=Q}}}}while(0);ac=ao&(1<<am)-1;return ac|0}function aW(a,e,f,h,i,j,k,l,m,n,o){a=a|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0.0,E=0,F=0.0,G=0.0,H=0.0,I=0.0,K=0.0,M=0.0,N=0.0,O=0,P=0.0,Q=0,R=0,S=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;p=c[a>>2]|0;q=c[a+4>>2]|0;r=c[a+8>>2]|0;s=c[a+12>>2]|0;t=c[a+24>>2]|0;u=c[a+32>>2]|0;v=(b[(c[q+56>>2]|0)+(r<<1)>>1]<<16>>16)+(m<<3)|0;m=(n|0)!=0;if(m){w=(i|0)==2?16:4}else{w=4}x=c[j>>2]|0;y=(m&(i|0)==2?-2:-1)+(i<<1)|0;z=(x-v|0)-32|0;A=(X((v>>1)-w|0,y)+x|0)/(y|0)&-1;y=(z|0)<(A|0)?z:A;A=(y|0)>64?64:y;if((A|0)<4){B=1}else{B=(b[5256348+((A&7)<<1)>>1]<<16>>16>>14-(A>>3))+1&-2}A=m^1;y=(r|0)<(s|0)|A?B:1;B=(p|0)!=0;if(B){p=(i|0)>0;L379:do{if((n|0)==0){if(p){C=1.0000000036274937e-15;D=1.0000000036274937e-15;E=0}else{F=1.0000000036274937e-15;G=1.0000000036274937e-15;break}while(1){H=+g[f+(E<<2)>>2];I=+g[h+(E<<2)>>2];K=D+H*H;H=C+I*I;s=E+1|0;if((s|0)==(i|0)){F=K;G=H;break L379}else{C=H;D=K;E=s}}}else{if(p){M=1.0000000036274937e-15;N=1.0000000036274937e-15;O=0}else{F=1.0000000036274937e-15;G=1.0000000036274937e-15;break}while(1){K=+g[f+(O<<2)>>2];H=+g[h+(O<<2)>>2];I=K+H;P=K-H;H=N+I*I;I=M+P*P;s=O+1|0;if((s|0)==(i|0)){F=H;G=I;break L379}else{M=I;N=H;O=s}}}}while(0);N=+L(F);Q=~~+J(+T(+L(G),N)*10430.3818359375+.5)}else{Q=0}O=t+20|0;p=c[O>>2]|0;E=t+28|0;n=c[E>>2]|0;s=32-(am(n|0,1)|0)|0;z=n>>>((s-16|0)>>>0);x=X(z,z);z=x>>>31;w=x>>>15>>>(z>>>0);x=X(w,w);w=x>>>31;v=x>>>15>>>(w>>>0);x=X(v,v)>>>31|(w|(z|s<<1)<<1)<<1;s=p<<3;L388:do{if((y|0)==1){if(!m){R=Q;S=0;break}L471:do{if(B){z=(Q|0)>8192;w=z&1;L473:do{if(z&(i|0)>0){v=0;while(1){U=h+(v<<2)|0;g[U>>2]=-0.0- +g[U>>2];U=v+1|0;if((U|0)==(i|0)){break L473}else{v=U}}}}while(0);N=+g[u+(r<<2)>>2];G=+g[u+((c[q+8>>2]|0)+r<<2)>>2];F=+L(N*N+1.0000000036274937e-15+G*G)+1.0000000036274937e-15;M=N/F;N=G/F;if((i|0)>0){V=0}else{W=w;break}while(1){z=f+(V<<2)|0;g[z>>2]=M*+g[z>>2]+N*+g[h+(V<<2)>>2];z=V+1|0;if((z|0)==(i|0)){W=w;break L471}else{V=z}}}else{W=0}}while(0);if((c[j>>2]|0)<=16){R=0;S=0;break}if((c[a+28>>2]|0)<=16){R=0;S=0;break}if(B){a2(t,W,2);R=0;S=W;break}w=c[E>>2]|0;z=t+32|0;v=c[z>>2]|0;U=w>>>2;Y=v>>>0<U>>>0;Z=Y&1;if(Y){_=U;$=v}else{Y=v-U|0;c[z>>2]=Y;_=w-U|0;$=Y}c[E>>2]=_;if(_>>>0>=8388609){R=0;S=Z;break}Y=t+40|0;U=t+24|0;w=t|0;v=c[t+4>>2]|0;aa=c[O>>2]|0;ab=_;ac=c[Y>>2]|0;ad=c[U>>2]|0;ae=$;while(1){af=aa+8|0;c[O>>2]=af;ag=ab<<8;c[E>>2]=ag;if(ad>>>0<v>>>0){ah=ad+1|0;c[U>>2]=ah;ai=d[(c[w>>2]|0)+ad|0]|0;aj=ah}else{ai=0;aj=ad}c[Y>>2]=ai;ah=((ai|ac<<8)>>>1&255|ae<<8&2147483392)^255;c[z>>2]=ah;if(ag>>>0<8388609){aa=af;ab=ag;ac=ai;ad=aj;ae=ah}else{R=0;S=Z;break L388}}}else{if(B){ak=X(Q,y)+8192>>14}else{ak=Q}L393:do{if(m&(i|0)>2){Z=(y|0)/2&-1;ae=Z+1|0;ad=ae*3&-1;ac=ad+Z|0;if(B){if((ak|0)>(Z|0)){al=(ak-Z|0)+ad|0;an=((ak-1|0)-Z|0)+ad|0}else{ab=ak*3&-1;al=ab+3|0;an=ab}a1(t,an,al,ac);ao=ak;break}ab=(n>>>0)/(ac>>>0)>>>0;c[t+36>>2]=ab;aa=t+32|0;z=c[aa>>2]|0;Y=(z>>>0)/(ab>>>0)>>>0;w=Y+1|0;U=(ac+(Y^-1)|0)-(ac-w&-(w>>>0>ac>>>0&1))|0;if((U|0)<(ad|0)){ap=(U|0)/3&-1}else{ap=(ae-ad|0)+U|0}if((ap|0)>(Z|0)){aq=(ad-Z|0)+ap|0;ar=(ad+(Z^-1)|0)+ap|0}else{Z=ap*3&-1;aq=Z+3|0;ar=Z}Z=X(ab,ac-aq|0);ac=z-Z|0;c[aa>>2]=ac;if((ar|0)==0){as=n-Z|0}else{as=X(ab,aq-ar|0)}c[E>>2]=as;if(as>>>0>=8388609){ao=ap;break}ab=t+40|0;Z=t+24|0;z=t|0;ad=c[t+4>>2]|0;U=p;ae=as;w=c[ab>>2]|0;Y=c[Z>>2]|0;v=ac;while(1){ac=U+8|0;c[O>>2]=ac;ah=ae<<8;c[E>>2]=ah;if(Y>>>0<ad>>>0){ag=Y+1|0;c[Z>>2]=ag;at=d[(c[z>>2]|0)+Y|0]|0;au=ag}else{at=0;au=Y}c[ab>>2]=at;ag=((at|w<<8)>>>1&255|v<<8&2147483392)^255;c[aa>>2]=ag;if(ah>>>0<8388609){U=ac;ae=ah;w=at;Y=au;v=ag}else{ao=ap;break L393}}}else{if((l|0)>1|m){v=y+1|0;if(B){a9(t,ak,v);ao=ak;break}else{R=(a6(t,v)<<14|0)/(y|0)&-1;S=0;break L388}}v=y>>1;Y=v+1|0;w=X(Y,Y);if(B){if((ak|0)>(v|0)){ae=(y+1|0)-ak|0;av=w-(X(ae,(y+2|0)-ak|0)>>1)|0;aw=ae}else{ae=ak+1|0;av=X(ae,ak)>>1;aw=ae}a1(t,av,av+aw|0,w);ao=ak;break}ae=(n>>>0)/(w>>>0)>>>0;c[t+36>>2]=ae;U=t+32|0;aa=c[U>>2]|0;ab=(aa>>>0)/(ae>>>0)>>>0;z=ab+1|0;Z=(w+(ab^-1)|0)-(w-z&-(z>>>0>w>>>0&1))|0;if((Z|0)<(X(Y,v)>>1|0)){v=Z<<3|1;Y=(am(v|0,1)|0)>>>1^15;z=v;v=Y;ab=0;ad=1<<Y;while(1){Y=(ab<<1)+ad<<v;if(Y>>>0>z>>>0){ax=z;ay=ab}else{ax=z-Y|0;ay=ab+ad|0}if((v|0)>0){z=ax;v=v-1|0;ab=ay;ad=ad>>>1}else{break}}ad=(ay-1|0)>>>1;ab=ad+1|0;az=X(ab,ad)>>>1;aA=ad;aB=ab}else{ab=y+1|0;ad=(w-Z<<3)-7|0;v=(am(ad|0,1)|0)>>>1^15;z=ad;ad=v;Y=0;ag=1<<v;while(1){v=(Y<<1)+ag<<ad;if(v>>>0>z>>>0){aC=z;aD=Y}else{aC=z-v|0;aD=Y+ag|0}if((ad|0)>0){z=aC;ad=ad-1|0;Y=aD;ag=ag>>>1}else{break}}ag=((ab<<1)-aD|0)>>>1;Y=ab-ag|0;az=w-(X(Y,(y+2|0)-ag|0)>>1)|0;aA=ag;aB=Y}Y=X(ae,(w-aB|0)-az|0);ag=aa-Y|0;c[U>>2]=ag;if((az|0)==0){aE=n-Y|0}else{aE=X(ae,aB)}c[E>>2]=aE;if(aE>>>0>=8388609){ao=aA;break}Y=t+40|0;ad=t+24|0;z=t|0;Z=c[t+4>>2]|0;v=p;ah=aE;ac=c[Y>>2]|0;af=c[ad>>2]|0;aF=ag;while(1){ag=v+8|0;c[O>>2]=ag;aG=ah<<8;c[E>>2]=aG;if(af>>>0<Z>>>0){aH=af+1|0;c[ad>>2]=aH;aI=d[(c[z>>2]|0)+af|0]|0;aJ=aH}else{aI=0;aJ=af}c[Y>>2]=aI;aH=((aI|ac<<8)>>>1&255|aF<<8&2147483392)^255;c[U>>2]=aH;if(aG>>>0<8388609){v=ag;ah=aG;ac=aI;af=aJ;aF=aH}else{ao=aA;break L393}}}}while(0);aF=(ao<<14|0)/(y|0)&-1;if(B^1|A){R=aF;S=0;break}if((aF|0)==0){N=+g[u+(r<<2)>>2];M=+g[u+((c[q+8>>2]|0)+r<<2)>>2];F=+L(N*N+1.0000000036274937e-15+M*M)+1.0000000036274937e-15;G=N/F;N=M/F;if((i|0)>0){aK=0}else{R=0;S=0;break}while(1){af=f+(aK<<2)|0;g[af>>2]=G*+g[af>>2]+N*+g[h+(aK<<2)>>2];af=aK+1|0;if((af|0)==(i|0)){R=0;S=0;break L388}else{aK=af}}}else{if((i|0)>0){aL=0}else{R=aF;S=0;break}while(1){af=f+(aL<<2)|0;N=+g[af>>2]*.7071067690849304;ac=h+(aL<<2)|0;G=+g[ac>>2]*.7071067690849304;g[af>>2]=N+G;g[ac>>2]=G-N;ac=aL+1|0;if((ac|0)==(i|0)){R=aF;S=0;break L388}else{aL=ac}}}}}while(0);aL=c[O>>2]|0;O=c[E>>2]|0;E=32-(am(O|0,1)|0)|0;h=O>>>((E-16|0)>>>0);O=X(h,h);h=O>>>31;f=O>>>15>>>(h>>>0);O=X(f,f);f=O>>>31;aK=O>>>15>>>(f>>>0);O=((aL<<3)-(X(aK,aK)>>>31|(f|(h|E<<1)<<1)<<1)|0)+(x-s|0)|0;c[j>>2]=(c[j>>2]|0)-O|0;if((R|0)==0){c[o>>2]=c[o>>2]&(1<<k)-1;j=-16384;s=32767;x=0;E=e|0;c[E>>2]=S;h=e+4|0;c[h>>2]=s;f=e+8|0;c[f>>2]=x;aK=e+12|0;c[aK>>2]=j;aL=e+16|0;c[aL>>2]=R;r=e+20|0;c[r>>2]=O;return}else if((R|0)==16384){c[o>>2]=c[o>>2]&(1<<k)-1<<k;j=16384;s=0;x=32767;E=e|0;c[E>>2]=S;h=e+4|0;c[h>>2]=s;f=e+8|0;c[f>>2]=x;aK=e+12|0;c[aK>>2]=j;aL=e+16|0;c[aL>>2]=R;r=e+20|0;c[r>>2]=O;return}else{k=R<<16>>16;o=(X(k,k)+4096|0)>>>13<<16>>16;k=(32768-o|0)+((X(((X((((o*-626&-1)+16384|0)>>>15<<16)+542441472>>16,o)+16384|0)>>>15<<16)-501415936>>16,o)+16384|0)>>>15)<<16>>16;o=16384-R<<16>>16;q=(X(o,o)+4096|0)>>>13<<16>>16;o=(32768-q|0)+((X(((X((((q*-626&-1)+16384|0)>>>15<<16)+542441472>>16,q)+16384|0)>>>15<<16)-501415936>>16,q)+16384|0)>>>15)<<16>>16;q=32-(am(k|0,1)|0)|0;u=32-(am(o|0,1)|0)|0;A=o<<15-u<<16>>16;B=(X((((A*-2597&-1)+16384|0)>>>15<<16)+519831552>>16,A)+16384|0)>>>15;A=k<<15-q<<16>>16;j=X(((u-q<<11)-((X((((A*-2597&-1)+16384|0)>>>15<<16)+519831552>>16,A)+16384|0)>>>15)|0)+B<<16>>16,(i<<23)-8388608>>16)+16384>>15;s=k;x=o;E=e|0;c[E>>2]=S;h=e+4|0;c[h>>2]=s;f=e+8|0;c[f>>2]=x;aK=e+12|0;c[aK>>2]=j;aL=e+16|0;c[aL>>2]=R;r=e+20|0;c[r>>2]=O;return}}function aX(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;h=a;j=X(d,b);k=i;i=i+(j*4&-1)|0;i=i+3>>2<<2;l=k;L503:do{if((e|0)==0){if((d|0)>0&(b|0)>0){m=0}else{break}while(1){n=X(m,b);o=0;while(1){g[k+(o+n<<2)>>2]=+g[a+(X(o,d)+m<<2)>>2];p=o+1|0;if((p|0)==(b|0)){break}else{o=p}}o=m+1|0;if((o|0)==(d|0)){break L503}else{m=o}}}else{o=d-2|0;if((d|0)<=0){break}n=(b|0)>0;p=0;while(1){L514:do{if(n){q=X(c[5247756+(o+p<<2)>>2]|0,b);r=0;while(1){g[k+(q+r<<2)>>2]=+g[a+(X(r,d)+p<<2)>>2];s=r+1|0;if((s|0)==(b|0)){break L514}else{r=s}}}}while(0);r=p+1|0;if((r|0)==(d|0)){break L503}else{p=r}}}}while(0);if((j|0)<=0){i=f;return}b$(h,l,j<<2);i=f;return}function aY(e,f,h,j,k,l,m,n,o){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=+n;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0,N=0.0,O=0.0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0.0,ah=0,ai=0,aj=0.0;p=i;q=f;r=i;i=i+4|0;s=i;i=i+4|0;t=i;i=i+24|0;c[r>>2]=j;c[s>>2]=o;u=(c[e>>2]|0)!=0;v=c[e+4>>2]|0;w=c[e+8>>2]|0;x=c[e+16>>2]|0;y=c[e+24>>2]|0;z=v+100|0;A=c[z>>2]|0;B=m+1|0;C=v+8|0;D=X(c[C>>2]|0,B)+w|0;E=v+96|0;v=b[(c[E>>2]|0)+(D<<1)>>1]<<16>>16;D=a[A+v|0]|0;do{if((m|0)!=-1){if(!(((d[A+((D&255)+v|0)|0]|0)+12|0)<(j|0)&(h|0)>2)){break}F=h>>1;G=f+(F<<2)|0;H=m-1|0;if((k|0)==1){c[s>>2]=o&1|o<<1}I=k+1>>1;aW(e,t,f,G,F,r,I,k,H,0,s);J=c[t+12>>2]|0;K=c[t+16>>2]|0;M=c[t+20>>2]|0;N=+(c[t+4>>2]|0)*30517578125.0e-15;O=+(c[t+8>>2]|0)*30517578125.0e-15;do{if((k|0)>1){if((K&16383|0)==0){P=J;break}if((K|0)>8192){P=J-(J>>5-m)|0;break}else{Q=J+(F<<3>>6-m)|0;P=(Q|0)>0?0:Q;break}}else{P=J}}while(0);J=c[r>>2]|0;Q=(J-P|0)/2&-1;R=(J|0)<(Q|0)?J:Q;Q=(R|0)<0?0:R;R=J-Q|0;J=e+28|0;S=(c[J>>2]|0)-M|0;c[J>>2]=S;if((l|0)==0){T=0}else{T=l+(F<<2)|0}if((Q|0)<(R|0)){U=c[s>>2]|0;V=aY(e,G,F,R,I,T,H,O*n,U>>I)<<(k>>1);W=((c[J>>2]|0)-S|0)+R|0;if((W|0)<25|(K|0)==16384){Y=Q}else{Y=(Q-24|0)+W|0}Z=aY(e,f,F,Y,I,l,H,N*n,U)|V;i=p;return Z|0}else{V=c[s>>2]|0;U=aY(e,f,F,Q,I,l,H,N*n,V)|0;W=((c[J>>2]|0)-S|0)+Q|0;if((W|0)<25|(K|0)==0){_=R}else{_=(R-24|0)+W|0}Z=aY(e,G,F,_,I,T,H,O*n,V>>I)<<(k>>1)|U;i=p;return Z|0}}}while(0);T=D&255;D=j-1|0;j=(T+1|0)>>>1;_=(d[A+(j+v|0)|0]|0|0)<(D|0);Y=_?j:0;P=_?T:j;j=(Y+1|0)+P>>1;T=(d[A+(j+v|0)|0]|0|0)<(D|0);_=T?j:Y;Y=T?P:j;j=(_+1|0)+Y>>1;P=(d[A+(j+v|0)|0]|0|0)<(D|0);T=P?j:_;_=P?Y:j;j=(T+1|0)+_>>1;Y=(d[A+(j+v|0)|0]|0|0)<(D|0);P=Y?j:T;T=Y?_:j;j=(P+1|0)+T>>1;_=(d[A+(j+v|0)|0]|0|0)<(D|0);Y=_?j:P;P=_?T:j;j=(Y+1|0)+P>>1;T=(d[A+(j+v|0)|0]|0|0)<(D|0);_=T?j:Y;Y=T?P:j;if((_|0)==0){$=-1}else{$=d[A+(_+v|0)|0]|0}j=(D-$|0)>((d[A+(Y+v|0)|0]|0)-D|0)?Y:_;if((j|0)==0){aa=0}else{aa=(d[A+(v+j|0)|0]|0)+1|0}v=e+28|0;A=(c[v>>2]|0)-aa|0;c[v>>2]=A;L559:do{if((A|0)<0&(j|0)>0){_=A;Y=aa;D=j;while(1){ab=Y+_|0;c[v>>2]=ab;$=D-1|0;if(($|0)==0){break}P=X(c[C>>2]|0,B);T=(d[(c[z>>2]|0)+((b[(c[E>>2]|0)+(P+w<<1)>>1]<<16>>16)+$|0)|0]|0)+1|0;P=ab-T|0;c[v>>2]=P;if((P|0)<0&($|0)>0){_=P;Y=T;D=$}else{ac=$;ad=381;break L559}}c[v>>2]=ab;break}else{if((j|0)==0){break}else{ac=j;ad=381;break}}}while(0);if((ad|0)==381){if((ac|0)<8){ae=ac}else{ae=(ac&7|8)<<(ac>>3)-1}if(u){Z=bm(f,h,ae,x,k,y)|0;i=p;return Z|0}else{Z=bo(f,h,ae,x,k,y,n)|0;i=p;return Z|0}}if(u){Z=0;i=p;return Z|0}u=(1<<k)-1|0;k=u&o;c[s>>2]=k;if((k|0)==0){if((h|0)<=0){Z=0;i=p;return Z|0}b_(q|0,0,h<<2|0);Z=0;i=p;return Z|0}q=(h|0)>0;L586:do{if((l|0)==0){if(!q){Z=u;i=p;return Z|0}s=e+36|0;o=0;while(1){y=X(c[s>>2]|0,1664525)+1013904223|0;c[s>>2]=y;g[f+(o<<2)>>2]=+(y>>20|0);y=o+1|0;if((y|0)==(h|0)){af=u;break L586}else{o=y}}}else{if(!q){Z=k;i=p;return Z|0}o=e+36|0;s=0;while(1){y=X(c[o>>2]|0,1664525)+1013904223|0;c[o>>2]=y;g[f+(s<<2)>>2]=+g[l+(s<<2)>>2]+((y&32768|0)==0?-.00390625:.00390625);y=s+1|0;if((y|0)==(h|0)){af=k;break L586}else{s=y}}}}while(0);if((h|0)>0){ag=1.0000000036274937e-15;ah=0;ai=f}else{Z=af;i=p;return Z|0}while(1){O=+g[ai>>2];aj=ag+O*O;k=ah+1|0;if((k|0)==(h|0)){break}else{ag=aj;ah=k;ai=ai+4|0}}ag=1.0/+L(aj)*n;ai=0;ah=f;while(1){g[ah>>2]=ag*+g[ah>>2];f=ai+1|0;if((f|0)==(h|0)){Z=af;break}else{ai=f;ah=ah+4|0}}i=p;return Z|0}function aZ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0;f=i;h=a;j=X(d,b);k=i;i=i+(j*4&-1)|0;i=i+3>>2<<2;l=k;L609:do{if((e|0)==0){if((d|0)<=0){break}m=(b|0)>0;n=0;while(1){L614:do{if(m){o=X(n,b);p=0;while(1){q=+g[a+(p+o<<2)>>2];g[k+(X(p,d)+n<<2)>>2]=q;r=p+1|0;if((r|0)==(b|0)){break L614}else{p=r}}}}while(0);p=n+1|0;if((p|0)==(d|0)){break L609}else{n=p}}}else{n=d-2|0;if((d|0)<=0){break}m=(b|0)>0;p=0;while(1){L623:do{if(m){o=X(c[5247756+(n+p<<2)>>2]|0,b);r=0;while(1){q=+g[a+(o+r<<2)>>2];g[k+(X(r,d)+p<<2)>>2]=q;s=r+1|0;if((s|0)==(b|0)){break L623}else{r=s}}}}while(0);r=p+1|0;if((r|0)==(d|0)){break L609}else{p=r}}}}while(0);if((j|0)<=0){i=f;return}b$(h,l,j<<2);i=f;return}function a_(a,b,c,d,e,f,h,i,j,k,l){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;h=+h;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0;m=h==0.0;if(f==0.0&m){if((b|0)==(a|0)){return}b0(a,b,e<<2);return}n=+g[5256364+(i*12&-1)>>2]*f;o=+g[5256368+(i*12&-1)>>2]*f;p=+g[5256372+(i*12&-1)>>2]*f;f=+g[5256364+(j*12&-1)>>2]*h;q=+g[5256368+(j*12&-1)>>2]*h;r=+g[5256372+(j*12&-1)>>2]*h;h=+g[b+(1-d<<2)>>2];s=+g[b+(-d<<2)>>2];t=+g[b+((d^-1)<<2)>>2];u=+g[b+(-2-d<<2)>>2];L641:do{if((l|0)>0){j=2-d|0;v=h;w=s;x=t;y=u;i=0;while(1){z=+g[b+(j+i<<2)>>2];A=+g[k+(i<<2)>>2];B=A*A;A=1.0-B;C=i-c|0;g[a+(i<<2)>>2]=(y+z)*r*B+((v+x)*q*B+(w*f*B+(+g[b+(i<<2)>>2]+ +g[b+(C<<2)>>2]*n*A+o*A*(+g[b+(C+1<<2)>>2]+ +g[b+(C-1<<2)>>2])+p*A*(+g[b+(C+2<<2)>>2]+ +g[b+(C-2<<2)>>2]))));C=i+1|0;if((C|0)==(l|0)){D=z;E=v;F=w;G=x;H=l;break L641}else{y=x;x=w;w=v;v=z;i=C}}}else{D=h;E=s;F=t;G=u;H=0}}while(0);if(m){if((b|0)==(a|0)){return}b0(a+(l<<2)|0,b+(l<<2)|0,e-l<<2);return}if((H|0)>=(e|0)){return}l=2-d|0;u=D;D=E;E=F;F=G;d=H;while(1){G=+g[b+(l+d<<2)>>2];g[a+(d<<2)>>2]=r*(F+G)+(q*(u+E)+(f*D+ +g[b+(d<<2)>>2]));H=d+1|0;if((H|0)==(e|0)){break}else{F=E;E=D;D=u;u=G;d=H}}return}function a$(e,f,h,j,k,l){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,al=0.0,an=0.0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0.0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a$=0,a1=0,a2=0,a3=0,a4=0,a5=0,a7=0,a8=0,a9=0,ba=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0.0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b$=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0,cM=0,cN=0,cO=0,cP=0.0,cQ=0.0,cR=0,cS=0.0,cT=0,cU=0,cV=0;m=i;i=i+84|0;n=m|0;o=m+48|0;p=m+56|0;q=m+64|0;r=m+72|0;s=m+76|0;t=m+80|0;u=c[e+8>>2]|0;c[r>>2]=0;c[s>>2]=0;v=c[e+12>>2]|0;w=c[e>>2]|0;x=w+8|0;y=c[x>>2]|0;z=w+4|0;A=c[z>>2]|0;B=w+32|0;C=c[B>>2]|0;D=e+16|0;E=c[D>>2]|0;F=A+2048|0;G=0;while(1){H=X(G,F);c[p+(G<<2)>>2]=e+80+(H<<2)|0;c[o+(G<<2)>>2]=e+80+(H+1024<<2)|0;H=G+1|0;if((H|0)<(u|0)){G=H}else{break}}G=X(E,k);k=X(A+2072|0,u);E=e+80+(k<<2)|0;F=y<<1;H=k+F|0;I=e+80+(H<<2)|0;J=H+F|0;K=e+80+(J<<2)|0;L=J+F|0;M=w+44|0;N=w+36|0;O=c[N>>2]|0;P=0;while(1){if((P|0)>(O|0)){Q=-1;R=699;break}if((c[M>>2]<<P|0)==(G|0)){break}else{P=P+1|0}}if((R|0)==699){i=m;return Q|0}O=1<<P;if(h>>>0>1275|(j|0)==0){Q=-1;i=m;return Q|0}S=c[M>>2]<<P;T=e+24|0;V=c[T>>2]|0;W=c[w+12>>2]|0;Y=(V|0)>(W|0)?W:V;if((f|0)==0|(h|0)<2){a0(e,j,S,P);Q=(G|0)/(c[D>>2]|0)&-1;i=m;return Q|0}if((l|0)==0){c[n>>2]=f;c[n+4>>2]=h;c[n+8>>2]=0;c[n+12>>2]=0;c[n+16>>2]=0;V=n+20|0;c[V>>2]=9;W=n+24|0;c[W>>2]=0;Z=n+28|0;c[Z>>2]=128;if((h|0)==0){_=0;$=0}else{c[W>>2]=1;_=d[f]|0;$=1}aa=n+40|0;c[aa>>2]=_;ab=_>>>1^127;ac=n+32|0;c[ac>>2]=ab;c[n+44>>2]=0;if($>>>0<h>>>0){ad=$+1|0;c[W>>2]=ad;ae=d[f+$|0]|0;af=ad}else{ae=0;af=$}if(af>>>0<h>>>0){$=af+1|0;c[W>>2]=$;ag=d[f+af|0]|0;ah=$}else{ag=0;ah=af}if(ah>>>0<h>>>0){c[W>>2]=ah+1|0;ai=d[f+ah|0]|0}else{ai=0}c[V>>2]=33;c[Z>>2]=-2147483648;c[aa>>2]=ai;c[ac>>2]=((((ae|_<<8)>>>1&255|ab<<8)<<8|(ag|ae<<8)>>>1&255)<<8&2147483392|(ai|ag<<8)>>>1&255)^16777215;aj=n}else{aj=l}l=(v|0)==1;L691:do{if(l&(y|0)>0){n=k+y|0;ag=0;while(1){ai=e+80+(ag+k<<2)|0;al=+g[ai>>2];an=+g[e+80+(n+ag<<2)>>2];g[ai>>2]=al>an?al:an;ai=ag+1|0;if((ai|0)==(y|0)){break L691}else{ag=ai}}}}while(0);ag=h<<3;n=aj+20|0;ai=c[n>>2]|0;ae=aj+28|0;ab=c[ae>>2]|0;_=(am(ab|0,1)|-32)+ai|0;do{if((_|0)<(ag|0)){if((_|0)!=1){ap=_;aq=0;ar=ab;as=ai;break}ac=aj+32|0;aa=c[ac>>2]|0;Z=ab>>>15;V=aa>>>0<Z>>>0;if(V){c[ae>>2]=Z;at=aa;au=Z}else{ah=aa-Z|0;c[ac>>2]=ah;aa=ab-Z|0;c[ae>>2]=aa;if(aa>>>0<8388609){at=ah;au=aa}else{ap=1;aq=0;ar=aa;as=ai;break}}aa=aj+40|0;ah=aj+24|0;Z=aj|0;f=c[aj+4>>2]|0;W=ai;af=au;$=c[aa>>2]|0;ad=c[ah>>2]|0;av=at;while(1){aw=W+8|0;c[n>>2]=aw;ax=af<<8;c[ae>>2]=ax;if(ad>>>0<f>>>0){ay=ad+1|0;c[ah>>2]=ay;az=d[(c[Z>>2]|0)+ad|0]|0;aA=ay}else{az=0;aA=ad}c[aa>>2]=az;ay=((az|$<<8)>>>1&255|av<<8&2147483392)^255;c[ac>>2]=ay;if(ax>>>0<8388609){W=aw;af=ax;$=az;ad=aA;av=ay}else{break}}if(V){aB=aw;aC=ax;R=477;break}else{ap=1;aq=0;ar=ax;as=aw;break}}else{aB=ai;aC=ab;R=477}}while(0);if((R|0)==477){ab=((ag-aB|0)-(am(aC|0,1)|-32)|0)+aB|0;c[n>>2]=ab;ap=ag;aq=1;ar=aC;as=ab}ab=e+20|0;do{if((c[ab>>2]|0)==0){if((ap+16|0)>(ag|0)){aD=0;aE=0;aF=ap;aG=0.0;aH=ar;aI=as;break}aC=aj+32|0;aB=c[aC>>2]|0;ai=ar>>>1;aw=aB>>>0<ai>>>0;if(aw){aJ=ai;aK=aB}else{ax=aB-ai|0;c[aC>>2]=ax;aJ=ar-ai|0;aK=ax}c[ae>>2]=aJ;L718:do{if(aJ>>>0<8388609){ax=aj+40|0;ai=aj+24|0;aB=aj|0;aA=c[aj+4>>2]|0;az=as;at=aJ;au=c[ax>>2]|0;_=c[ai>>2]|0;av=aK;while(1){ad=az+8|0;c[n>>2]=ad;$=at<<8;c[ae>>2]=$;if(_>>>0<aA>>>0){af=_+1|0;c[ai>>2]=af;aL=d[(c[aB>>2]|0)+_|0]|0;aM=af}else{aL=0;aM=_}c[ax>>2]=aL;af=((aL|au<<8)>>>1&255|av<<8&2147483392)^255;c[aC>>2]=af;if($>>>0<8388609){az=ad;at=$;au=aL;_=aM;av=af}else{aN=ad;aO=$;break L718}}}else{aN=as;aO=aJ}}while(0);if(aw){V=a6(aj,6)|0;av=16<<V;_=V+4|0;V=aj+12|0;au=c[V>>2]|0;at=aj+16|0;az=c[at>>2]|0;if(az>>>0<_>>>0){ax=aj+8|0;aB=aj|0;ai=az+8|0;aA=((ai|0)>25?az+7|0:24)-az|0;$=c[aj+4>>2]|0;ad=au;af=az;W=c[ax>>2]|0;while(1){if(W>>>0<$>>>0){ac=W+1|0;c[ax>>2]=ac;aP=d[(c[aB>>2]|0)+($-ac|0)|0]|0;aQ=ac}else{aP=0;aQ=W}aR=aP<<af|ad;ac=af+8|0;if((ac|0)<25){ad=aR;af=ac;W=aQ}else{break}}aV=aR;aW=ai+(aA&-8)|0}else{aV=au;aW=az}W=aV>>>(_>>>0);af=aW-_|0;c[V>>2]=W;c[at>>2]=af;ad=(c[n>>2]|0)+_|0;c[n>>2]=ad;$=(av-1|0)+(aV&(1<<_)-1)|0;if(af>>>0<3){aB=aj+8|0;ax=aj|0;aw=af+8|0;ac=((aw|0)>25?af+7|0:24)-af|0;aa=c[aj+4>>2]|0;Z=W;ah=af;f=c[aB>>2]|0;while(1){if(f>>>0<aa>>>0){ay=f+1|0;c[aB>>2]=ay;aX=d[(c[ax>>2]|0)+(aa-ay|0)|0]|0;aY=ay}else{aX=0;aY=f}aZ=aX<<ah|Z;ay=ah+8|0;if((ay|0)<25){Z=aZ;ah=ay;f=aY}else{break}}a$=aZ;a1=aw+(ac&-8)|0}else{a$=W;a1=af}f=a$&7;c[V>>2]=a$>>>3;c[at>>2]=a1-3|0;ah=ad+3|0;c[n>>2]=ah;Z=c[ae>>2]|0;L746:do{if(((ad+5|0)+(am(Z|0,1)|-32)|0)>(ag|0)){a2=0;a3=ah;a4=Z}else{aa=c[aC>>2]|0;ax=Z>>>2;aB=-1;_=Z;while(1){a5=aB+1|0;a7=X(d[a5+5243404|0]|0,ax);if(aa>>>0<a7>>>0){aB=a5;_=a7}else{break}}aB=aa-a7|0;c[aC>>2]=aB;ax=_-a7|0;c[ae>>2]=ax;if(ax>>>0>=8388609){a2=a5;a3=ah;a4=ax;break}av=aj+40|0;az=aj+24|0;au=aj|0;aA=c[aj+4>>2]|0;ai=ah;ay=ax;ax=c[av>>2]|0;a8=c[az>>2]|0;a9=aB;while(1){aB=ai+8|0;c[n>>2]=aB;ba=ay<<8;c[ae>>2]=ba;if(a8>>>0<aA>>>0){bc=a8+1|0;c[az>>2]=bc;bd=d[(c[au>>2]|0)+a8|0]|0;be=bc}else{bd=0;be=a8}c[av>>2]=bd;bc=((bd|ax<<8)>>>1&255|a9<<8&2147483392)^255;c[aC>>2]=bc;if(ba>>>0<8388609){ai=aB;ay=ba;ax=bd;a8=be;a9=bc}else{a2=a5;a3=aB;a4=ba;break L746}}}}while(0);bf=$;bg=a2;bh=+(f+1|0)*.09375;bm=a3;bn=a4}else{bf=0;bg=0;bh=0.0;bm=aN;bn=aO}aD=bf;aE=bg;aF=(am(bn|0,1)|-32)+bm|0;aG=bh;aH=bn;aI=bm}else{aD=0;aE=0;aF=ap;aG=0.0;aH=ar;aI=as}}while(0);as=(P|0)>0;do{if(as){if((aF+3|0)>(ag|0)){bo=0;bp=aF;bq=aH;br=aI;break}ar=aj+32|0;ap=c[ar>>2]|0;bm=aH>>>3;bn=ap>>>0<bm>>>0;bg=bn&1;if(bn){bs=bm;bt=ap}else{bn=ap-bm|0;c[ar>>2]=bn;bs=aH-bm|0;bt=bn}c[ae>>2]=bs;L766:do{if(bs>>>0<8388609){bn=aj+40|0;bm=aj+24|0;ap=aj|0;bf=c[aj+4>>2]|0;aO=aI;aN=bs;a4=c[bn>>2]|0;a3=c[bm>>2]|0;a2=bt;while(1){a5=aO+8|0;c[n>>2]=a5;be=aN<<8;c[ae>>2]=be;if(a3>>>0<bf>>>0){bd=a3+1|0;c[bm>>2]=bd;bu=d[(c[ap>>2]|0)+a3|0]|0;bv=bd}else{bu=0;bv=a3}c[bn>>2]=bu;bd=((bu|a4<<8)>>>1&255|a2<<8&2147483392)^255;c[ar>>2]=bd;if(be>>>0<8388609){aO=a5;aN=be;a4=bu;a3=bv;a2=bd}else{bw=a5;bx=be;break L766}}}else{bw=aI;bx=bs}}while(0);bo=bg;bp=(am(bx|0,1)|-32)+bw|0;bq=bx;br=bw}else{bo=0;bp=aF;bq=aH;br=aI}}while(0);aI=(bo|0)!=0;aH=aI?O:0;L775:do{if((bp+3|0)>(ag|0)){by=0}else{aF=aj+32|0;bw=c[aF>>2]|0;bx=bq>>>3;bs=bw>>>0<bx>>>0;bv=bs&1;if(bs){bz=bx;bA=bw}else{bs=bw-bx|0;c[aF>>2]=bs;bz=bq-bx|0;bA=bs}c[ae>>2]=bz;if(bz>>>0>=8388609){by=bv;break}bs=aj+40|0;bx=aj+24|0;bw=aj|0;bu=c[aj+4>>2]|0;bt=br;ar=bz;f=c[bs>>2]|0;$=c[bx>>2]|0;a2=bA;while(1){a3=bt+8|0;c[n>>2]=a3;a4=ar<<8;c[ae>>2]=a4;if($>>>0<bu>>>0){aN=$+1|0;c[bx>>2]=aN;bB=d[(c[bw>>2]|0)+$|0]|0;bC=aN}else{bB=0;bC=$}c[bs>>2]=bB;aN=((bB|f<<8)>>>1&255|a2<<8&2147483392)^255;c[aF>>2]=aN;if(a4>>>0<8388609){bt=a3;ar=a4;f=bB;$=bC;a2=aN}else{by=bv;break L775}}}}while(0);bi(w,c[ab>>2]|0,c[T>>2]|0,E,by,aj,v,P);by=ao()|0;bC=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;bB=c[ab>>2]|0;bA=c[T>>2]|0;bz=aj+4|0;br=c[bz>>2]|0;bq=br<<3;bp=c[n>>2]|0;bv=c[ae>>2]|0;a2=(am(bv|0,1)|-32)+bp|0;$=aI?2:4;if(as){bD=(a2+($|1)|0)>>>0<=bq>>>0}else{bD=0}as=bq-(bD&1)|0;bq=(bB|0)<(bA|0);L790:do{if(bq){f=aI?4:5;ar=aj+32|0;bt=aj+40|0;aF=aj+24|0;bs=aj|0;bw=0;bx=bB;bu=0;bg=$;aN=a2;a4=bv;a3=bp;while(1){if((bg+aN|0)>>>0>as>>>0){bE=aN;bF=bu;bG=bw;bH=a4;bI=a3}else{aO=c[ar>>2]|0;bn=a4>>>(bg>>>0);ap=aO>>>0<bn>>>0;bm=ap&1;if(ap){bJ=bn;bK=aO}else{ap=aO-bn|0;c[ar>>2]=ap;bJ=a4-bn|0;bK=ap}c[ae>>2]=bJ;L799:do{if(bJ>>>0<8388609){ap=a3;bn=bJ;aO=c[bt>>2]|0;bf=c[aF>>2]|0;be=bK;while(1){a5=ap+8|0;c[n>>2]=a5;bd=bn<<8;c[ae>>2]=bd;if(bf>>>0<br>>>0){a7=bf+1|0;c[aF>>2]=a7;bL=d[(c[bs>>2]|0)+bf|0]|0;bM=a7}else{bL=0;bM=bf}c[bt>>2]=bL;a7=((bL|aO<<8)>>>1&255|be<<8&2147483392)^255;c[ar>>2]=a7;if(bd>>>0<8388609){ap=a5;bn=bd;aO=bL;bf=bM;be=a7}else{bN=bd;bO=a5;break L799}}}else{bN=bJ;bO=a3}}while(0);be=bm^bw;bE=(am(bN|0,1)|-32)+bO|0;bF=be|bu;bG=be;bH=bN;bI=bO}c[bC+(bx<<2)>>2]=bG;be=bx+1|0;if((be|0)==(bA|0)){bP=bF;bQ=bH;bR=bI;break L790}else{bw=bG;bx=be;bu=bF;bg=f;aN=bE;a4=bH;a3=bI}}}else{bP=0;bQ=bv;bR=bp}}while(0);do{if(bD){bp=bo<<2;if(a[(bP+bp|0)+(5243372+(P<<3))|0]<<24>>24==a[(bP+(bp|2)|0)+(5243372+(P<<3))|0]<<24>>24){bS=0;bT=bR;bU=bQ;break}bp=aj+32|0;bv=c[bp>>2]|0;bI=bQ>>>1;bH=bv>>>0<bI>>>0;bE=bH&1;if(bH){bV=bI;bW=bv}else{bH=bv-bI|0;c[bp>>2]=bH;bV=bQ-bI|0;bW=bH}c[ae>>2]=bV;L815:do{if(bV>>>0<8388609){bH=aj+40|0;bI=aj+24|0;bv=aj|0;bF=bR;bG=bV;bO=c[bH>>2]|0;bN=c[bI>>2]|0;bJ=bW;while(1){bM=bF+8|0;c[n>>2]=bM;bL=bG<<8;c[ae>>2]=bL;if(bN>>>0<br>>>0){bK=bN+1|0;c[bI>>2]=bK;bX=d[(c[bv>>2]|0)+bN|0]|0;bY=bK}else{bX=0;bY=bN}c[bH>>2]=bX;bK=((bX|bO<<8)>>>1&255|bJ<<8&2147483392)^255;c[bp>>2]=bK;if(bL>>>0<8388609){bF=bM;bG=bL;bO=bX;bN=bY;bJ=bK}else{bZ=bM;b$=bL;break L815}}}else{bZ=bR;b$=bV}}while(0);bS=bE<<1;bT=bZ;bU=b$}else{bS=0;bT=bR;bU=bQ}}while(0);L824:do{if(bq){bQ=bS+(bo<<2)|0;bR=bB;while(1){b$=bC+(bR<<2)|0;c[b$>>2]=a[(bQ+(c[b$>>2]|0)|0)+(5243372+(P<<3))|0]<<24>>24;b$=bR+1|0;if((b$|0)==(bA|0)){break L824}else{bR=b$}}}}while(0);L829:do{if(((bT+4|0)+(am(bU|0,1)|-32)|0)>(ag|0)){b1=2;b2=bT;b3=bU}else{bA=aj+32|0;bB=c[bA>>2]|0;bo=bU>>>5;bS=-1;bq=bU;while(1){b4=bS+1|0;b5=X(d[b4+5243408|0]|0,bo);if(bB>>>0<b5>>>0){bS=b4;bq=b5}else{break}}bS=bB-b5|0;c[bA>>2]=bS;bo=bq-b5|0;c[ae>>2]=bo;if(bo>>>0>=8388609){b1=b4;b2=bT;b3=bo;break}bR=aj+40|0;bQ=aj+24|0;bE=aj|0;b$=bT;bZ=bo;bo=c[bR>>2]|0;bV=c[bQ>>2]|0;bY=bS;while(1){bS=b$+8|0;c[n>>2]=bS;bX=bZ<<8;c[ae>>2]=bX;if(bV>>>0<br>>>0){bW=bV+1|0;c[bQ>>2]=bW;b6=d[(c[bE>>2]|0)+bV|0]|0;b7=bW}else{b6=0;b7=bV}c[bR>>2]=b6;bW=((b6|bo<<8)>>>1&255|bY<<8&2147483392)^255;c[bA>>2]=bW;if(bX>>>0<8388609){b$=bS;bZ=bX;bo=b6;bV=b7;bY=bW}else{b1=b4;b2=bS;b3=bX;break L829}}}}while(0);b4=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;b7=c[x>>2]|0;L841:do{if((b7|0)>0){b6=(v-1|0)+(P<<1)|0;bT=c[B>>2]|0;b5=c[w+104>>2]|0;bU=0;bY=b[bT>>1]|0;while(1){bV=bU+1|0;bo=b[bT+(bV<<1)>>1]|0;bZ=(d[b5+(X(b7,b6)+bU|0)|0]|0)+64|0;c[b4+(bU<<2)>>2]=X(X((bo<<16>>16)-(bY<<16>>16)<<P,v),bZ)>>2;if((bV|0)<(b7|0)){bU=bV;bY=bo}else{break L841}}}}while(0);b7=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;B=h<<6;h=32-(am(b3|0,1)|0)|0;bY=b3>>>((h-16|0)>>>0);bU=X(bY,bY);bY=bU>>>31;b6=bU>>>15>>>(bY>>>0);bU=X(b6,b6);b6=bU>>>31;b5=bU>>>15>>>(b6>>>0);bU=(b2<<3)-(X(b5,b5)>>>31|(b6|(bY|h<<1)<<1)<<1)|0;h=aj+32|0;bY=aj+40|0;b6=aj+24|0;b5=aj|0;bT=c[ab>>2]|0;bo=6;bV=bU;bU=B;bZ=b3;b3=b2;L846:while(1){b2=bo<<3;b$=bT;b8=bV;b9=bU;ca=bZ;cb=b3;while(1){if((b$|0)>=(c[T>>2]|0)){break L846}cc=b$+1|0;bA=X((b[C+(cc<<1)>>1]<<16>>16)-(b[C+(b$<<1)>>1]<<16>>16)|0,v)<<P;bR=bA<<3;bE=(bA|0)<48?48:bA;bA=(bR|0)<(bE|0)?bR:bE;if((b2+b8|0)>=(b9|0)){c[b7+(b$<<2)>>2]=0;b$=cc;b8=b8;b9=b9;ca=ca;cb=cb;continue}bE=c[b4+(b$<<2)>>2]|0;bR=b9;bQ=b8;bq=bo;bB=0;bX=ca;bS=cb;while(1){if((bB|0)>=(bE|0)){cd=bQ;ce=bR;cf=bB;cg=bX;ch=bS;break}bW=c[h>>2]|0;bP=bX>>>(bq>>>0);bD=bW>>>0<bP>>>0;if(bD){ci=bP;cj=bW}else{bp=bW-bP|0;c[h>>2]=bp;ci=bX-bP|0;cj=bp}c[ae>>2]=ci;L860:do{if(ci>>>0<8388609){bp=bS;bP=ci;bW=c[bY>>2]|0;bJ=c[b6>>2]|0;bN=cj;while(1){bO=bp+8|0;c[n>>2]=bO;bG=bP<<8;c[ae>>2]=bG;if(bJ>>>0<br>>>0){bF=bJ+1|0;c[b6>>2]=bF;ck=d[(c[b5>>2]|0)+bJ|0]|0;cl=bF}else{ck=0;cl=bJ}c[bY>>2]=ck;bF=((ck|bW<<8)>>>1&255|bN<<8&2147483392)^255;c[h>>2]=bF;if(bG>>>0<8388609){bp=bO;bP=bG;bW=ck;bJ=cl;bN=bF}else{cm=bO;cn=bG;break L860}}}else{cm=bS;cn=ci}}while(0);bN=32-(am(cn|0,1)|0)|0;bJ=cn>>>((bN-16|0)>>>0);bW=X(bJ,bJ);bJ=bW>>>31;bP=bW>>>15>>>(bJ>>>0);bW=X(bP,bP);bP=bW>>>31;bp=bW>>>15>>>(bP>>>0);bW=(cm<<3)-(X(bp,bp)>>>31|(bP|(bJ|bN<<1)<<1)<<1)|0;if(!bD){cd=bW;ce=bR;cf=bB;cg=cn;ch=cm;break}bN=bB+bA|0;bJ=bR-bA|0;if((bW+8|0)<(bJ|0)){bR=bJ;bQ=bW;bq=1;bB=bN;bX=cn;bS=cm}else{cd=bW;ce=bJ;cf=bN;cg=cn;ch=cm;break}}c[b7+(b$<<2)>>2]=cf;if((cf|0)>0){break}else{b$=cc;b8=cd;b9=ce;ca=cg;cb=ch}}b$=bo-1|0;bT=cc;bo=(b$|0)<2?2:b$;bV=cd;bU=ce;bZ=cg;b3=ch}ch=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;L872:do{if((b8+48|0)>(b9|0)){co=5;cp=cb;cq=ca}else{b3=c[h>>2]|0;cg=ca>>>7;bZ=-1;ce=ca;while(1){cr=bZ+1|0;cs=X(d[cr+5243360|0]|0,cg);if(b3>>>0<cs>>>0){bZ=cr;ce=cs}else{break}}bZ=b3-cs|0;c[h>>2]=bZ;cg=ce-cs|0;c[ae>>2]=cg;if(cg>>>0>=8388609){co=cr;cp=cb;cq=cg;break}bU=cb;cd=cg;cg=c[bY>>2]|0;bV=c[b6>>2]|0;bo=bZ;while(1){bZ=bU+8|0;c[n>>2]=bZ;cc=cd<<8;c[ae>>2]=cc;if(bV>>>0<br>>>0){bT=bV+1|0;c[b6>>2]=bT;ct=d[(c[b5>>2]|0)+bV|0]|0;cu=bT}else{ct=0;cu=bV}c[bY>>2]=ct;bT=((ct|cg<<8)>>>1&255|bo<<8&2147483392)^255;c[h>>2]=bT;if(cc>>>0<8388609){bU=bZ;cd=cc;cg=ct;bV=cu;bo=bT}else{co=cr;cp=bZ;cq=cc;break L872}}}}while(0);cr=32-(am(cq|0,1)|0)|0;cu=cq>>>((cr-16|0)>>>0);cq=X(cu,cu);cu=cq>>>31;ct=cq>>>15>>>(cu>>>0);cq=X(ct,ct);ct=cq>>>31;h=cq>>>15>>>(ct>>>0);cq=((B-1|0)-(cp<<3)|0)+(X(h,h)>>>31|(ct|(cu|cr<<1)<<1)<<1)|0;if(aI&(P|0)>1){cv=(cq|0)>=((P<<3)+16|0)}else{cv=0}cr=cv?8:0;cu=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;ct=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;h=bl(w,c[ab>>2]|0,c[T>>2]|0,b7,b4,co,r,s,cq-cr|0,t,cu,ch,ct,v,P,aj,0,0,0)|0;bj(w,c[ab>>2]|0,c[T>>2]|0,E,ch,aj,v);cq=X(y,v);co=i;i=i+cq|0;i=i+3>>2<<2;b4=X(S,v);b7=i;i=i+(b4*4&-1)|0;i=i+3>>2<<2;b4=(v|0)==2;if(b4){cw=b7+(S<<2)|0}else{cw=0}cp=e+32|0;aU(0,w,c[ab>>2]|0,c[T>>2]|0,b7,cw,co,0,cu,aH,b1,c[s>>2]|0,c[r>>2]|0,bC,B-cr|0,c[t>>2]|0,aj,P,h,cp);do{if(cv){h=aj+12|0;t=c[h>>2]|0;cr=aj+16|0;B=c[cr>>2]|0;if((B|0)==0){bC=aj+8|0;r=c[bC>>2]|0;s=c[bz>>2]|0;if(r>>>0<s>>>0){b1=r+1|0;c[bC>>2]=b1;cx=d[(c[b5>>2]|0)+(s-b1|0)|0]|0;cy=b1}else{cx=0;cy=r}if(cy>>>0<s>>>0){r=cy+1|0;c[bC>>2]=r;cz=(d[(c[b5>>2]|0)+(s-r|0)|0]|0)<<8;cA=r}else{cz=0;cA=cy}if(cA>>>0<s>>>0){r=cA+1|0;c[bC>>2]=r;cB=(d[(c[b5>>2]|0)+(s-r|0)|0]|0)<<16;cC=r}else{cB=0;cC=cA}if(cC>>>0<s>>>0){r=cC+1|0;c[bC>>2]=r;cD=(d[(c[b5>>2]|0)+(s-r|0)|0]|0)<<24}else{cD=0}cE=cD|(cB|(cz|(cx|t)));cF=32}else{cE=t;cF=B}c[h>>2]=cE>>>1;c[cr>>2]=cF-1|0;cr=c[n>>2]|0;c[n>>2]=cr+1|0;h=c[ab>>2]|0;B=c[T>>2]|0;bk(w,h,B,E,ch,ct,(ag+(cr^-1)|0)-(am(c[ae>>2]|0,1)|-32)|0,aj,v);if((cE&1|0)==0){break}aT(w,b7,co,P,v,S,c[ab>>2]|0,c[T>>2]|0,E,I,K,cu,c[cp>>2]|0)}else{cr=c[ab>>2]|0;B=c[T>>2]|0;h=c[n>>2]|0;bk(w,cr,B,E,ch,ct,(ag-h|0)-(am(c[ae>>2]|0,1)|-32)|0,aj,v)}}while(0);ct=i;i=i+(cq*4&-1)|0;i=i+3>>2<<2;ch=ct;E=c[ab>>2]|0;cu=c[T>>2]|0;K=(E|0)>0;I=c[x>>2]|0;x=E<<2;co=0;while(1){if(K){b_(ch+X(I,co<<2)|0,0,x|0);cG=E}else{cG=0}L915:do{if((cG|0)<(cu|0)){cE=X(I,co);cF=cG;while(1){cx=cE+cF|0;g[ct+(cx<<2)>>2]=+U((+g[e+80+(cx+k<<2)>>2]+ +g[5256216+(cF<<2)>>2])*.6931471805599453);cx=cF+1|0;if((cx|0)==(cu|0)){cH=cu;break L915}else{cF=cx}}}else{cH=cG}}while(0);L920:do{if((cH|0)<(I|0)){cF=cH;while(1){g[ct+(X(I,co)+cF<<2)>>2]=0.0;cE=cF+1|0;if((cE|0)<(I|0)){cF=cE}else{break L920}}}}while(0);cF=co+1|0;if((cF|0)<(v|0)){co=cF}else{break}}if(aq&(cq|0)>0){b_(ch|0,0,cq<<2|0);ch=0;while(1){g[e+80+(ch+k<<2)>>2]=-28.0;aq=ch+1|0;if((aq|0)==(cq|0)){break}else{ch=aq}}cI=c[ab>>2]|0}else{cI=E}E=X(S,(u|0)>(v|0)?u:v);ch=i;i=i+(E*4&-1)|0;i=i+3>>2<<2;aS(w,b7,ch,ct,cI,Y,v,O);cI=(2048-S|0)+((A|0)/2&-1)<<2;ct=0;while(1){b7=c[p+(ct<<2)>>2]|0;b0(b7,b7+(S<<2)|0,cI);b7=ct+1|0;if((b7|0)<(u|0)){ct=b7}else{break}}ct=b[C+(Y<<1)>>1]<<16>>16<<P;Y=c[D>>2]|0;C=(Y|0)==1;cI=0;while(1){p=X(S,cI);if(C){cJ=ct}else{b7=(S|0)/(Y|0)&-1;cJ=(ct|0)<(b7|0)?ct:b7}if((cJ|0)<(S|0)){b_(ch+(cJ+p<<2)|0,0,S-cJ<<2|0)}p=cI+1|0;if((p|0)<(v|0)){cI=p}else{break}}cI=1024-S|0;v=0;while(1){c[q+(v<<2)>>2]=(c[o+(v<<2)>>2]|0)+(cI<<2)|0;cJ=v+1|0;if((cJ|0)<(u|0)){v=cJ}else{break}}L946:do{if(l&(u|0)==2&(S|0)>0){v=0;while(1){g[ch+(v+S<<2)>>2]=+g[ch+(v<<2)>>2];cI=v+1|0;if((cI|0)==(S|0)){break L946}else{v=cI}}}}while(0);L950:do{if(b4&(u|0)==1&(S|0)>0){v=0;while(1){cI=ch+(v<<2)|0;g[cI>>2]=(+g[cI>>2]+ +g[ch+(v+S<<2)>>2])*.5;cI=v+1|0;if((cI|0)==(S|0)){break L950}else{v=cI}}}}while(0);b4=c[z>>2]|0;z=c[M>>2]|0;if((aH|0)==0){cK=(c[N>>2]|0)-P|0;cL=z<<P;cM=1}else{cK=c[N>>2]|0;cL=z;cM=aH}aH=(cM|0)>0;z=w+64|0;N=X(cL,cM);v=w+60|0;cI=0;while(1){L960:do{if(aH){o=X(N,cI);cJ=c[q+(cI<<2)>>2]|0;ct=0;while(1){Y=cJ+(X(ct,cL)<<2)|0;bb(z,ch+(ct+o<<2)|0,Y,c[v>>2]|0,b4,cK,cM);Y=ct+1|0;if((Y|0)==(cM|0)){break L960}else{ct=Y}}}}while(0);ct=cI+1|0;if((ct|0)<(u|0)){cI=ct}else{break}}cI=e+48|0;cM=e+52|0;cK=e+60|0;b4=e+56|0;z=e+68|0;cL=e+64|0;N=(P|0)!=0;P=0;while(1){aH=c[cI>>2]|0;ct=(aH|0)>15?aH:15;c[cI>>2]=ct;aH=c[cM>>2]|0;o=(aH|0)>15?aH:15;c[cM>>2]=o;aH=c[q+(P<<2)>>2]|0;a_(aH,aH,o,ct,c[M>>2]|0,+g[cK>>2],+g[b4>>2],c[z>>2]|0,c[cL>>2]|0,c[v>>2]|0,A);if(N){ct=c[M>>2]|0;o=aH+(ct<<2)|0;a_(o,o,c[cI>>2]|0,aD,S-ct|0,+g[b4>>2],aG,c[cL>>2]|0,aE,c[v>>2]|0,A)}ct=P+1|0;if((ct|0)<(u|0)){P=ct}else{break}}c[cM>>2]=c[cI>>2]|0;g[cK>>2]=+g[b4>>2];c[z>>2]=c[cL>>2]|0;c[cI>>2]=aD;g[b4>>2]=aG;c[cL>>2]=aE;if(N){c[cM>>2]=aD;g[cK>>2]=aG;c[z>>2]=aE}L975:do{if(l&(y|0)>0){aE=k+y|0;z=0;while(1){g[e+80+(aE+z<<2)>>2]=+g[e+80+(z+k<<2)>>2];cK=z+1|0;if((cK|0)==(y|0)){break L975}else{z=cK}}}}while(0);l=(F|0)>0;L980:do{if(aI){if(!l){break}F=y<<1;z=0;while(1){aE=e+80+(z+H<<2)|0;aG=+g[aE>>2];bh=+g[e+80+(z+k<<2)>>2];g[aE>>2]=aG<bh?aG:bh;aE=z+1|0;if((aE|0)==(F|0)){break L980}else{z=aE}}}else{if(!l){break}z=y<<1;F=0;while(1){g[e+80+(F+J<<2)>>2]=+g[e+80+(F+H<<2)>>2];aE=F+1|0;if((aE|0)==(z|0)){break}else{F=aE}}if(!l){break}F=y<<1;z=0;while(1){g[e+80+(z+H<<2)>>2]=+g[e+80+(z+k<<2)>>2];aE=z+1|0;if((aE|0)==(F|0)){break}else{z=aE}}if(!l){break}bh=+(O|0)*.0010000000474974513;z=y<<1;F=0;while(1){aE=e+80+(L+F<<2)|0;aG=bh+ +g[aE>>2];an=+g[e+80+(F+k<<2)>>2];g[aE>>2]=aG<an?aG:an;aE=F+1|0;if((aE|0)==(z|0)){break L980}else{F=aE}}}}while(0);L=c[ab>>2]|0;L998:do{if((L|0)>0){O=0;while(1){g[e+80+(O+k<<2)>>2]=0.0;g[e+80+(O+J<<2)>>2]=-28.0;g[e+80+(O+H<<2)>>2]=-28.0;l=O+1|0;aI=c[ab>>2]|0;if((l|0)<(aI|0)){O=l}else{cN=aI;break L998}}}else{cN=L}}while(0);L=c[T>>2]|0;if((L|0)<(y|0)){O=L;while(1){g[e+80+(O+k<<2)>>2]=0.0;g[e+80+(O+J<<2)>>2]=-28.0;g[e+80+(O+H<<2)>>2]=-28.0;L=O+1|0;if((L|0)==(y|0)){break}else{O=L}}cO=c[ab>>2]|0}else{cO=cN}L1007:do{if((cO|0)>0){cN=0;while(1){O=cN+y|0;g[e+80+(O+k<<2)>>2]=0.0;g[e+80+(O+J<<2)>>2]=-28.0;g[e+80+(O+H<<2)>>2]=-28.0;O=cN+1|0;if((O|0)<(c[ab>>2]|0)){cN=O}else{break L1007}}}}while(0);ab=c[T>>2]|0;L1011:do{if((ab|0)<(y|0)){T=ab;while(1){cO=T+y|0;g[e+80+(cO+k<<2)>>2]=0.0;g[e+80+(cO+J<<2)>>2]=-28.0;g[e+80+(cO+H<<2)>>2]=-28.0;cO=T+1|0;if((cO|0)==(y|0)){break L1011}else{T=cO}}}}while(0);c[cp>>2]=c[ae>>2]|0;cp=c[D>>2]|0;bh=+g[w+16>>2];w=(S|0)/(cp|0)&-1;y=(cp|0)>1;H=(S|0)>0;J=(w|0)>0;k=0;ab=0;while(1){T=e+72+(k<<2)|0;an=+g[T>>2];cO=c[q+(k<<2)>>2]|0;do{if(y){L1019:do{if(H){cN=0;aG=an;while(1){al=aG+ +g[cO+(cN<<2)>>2];cP=bh*al;g[ch+(cN<<2)>>2]=al;O=cN+1|0;if((O|0)==(S|0)){cQ=cP;break L1019}else{cN=O;aG=cP}}}else{cQ=an}}while(0);g[T>>2]=cQ;cR=1;R=674;break}else{L1024:do{if(H){cN=0;aG=an;while(1){cP=aG+ +g[cO+(cN<<2)>>2];al=bh*cP;g[j+(X(cN,u)+k<<2)>>2]=cP*30517578125.0e-15;bD=cN+1|0;if((bD|0)==(S|0)){cS=al;break L1024}else{cN=bD;aG=al}}}else{cS=an}}while(0);g[T>>2]=cS;if((ab|0)==0){cT=0;break}else{cR=ab;R=674;break}}}while(0);L1028:do{if((R|0)==674){R=0;if(J){cU=0}else{cT=cR;break}while(1){an=+g[ch+(X(cU,cp)<<2)>>2]*30517578125.0e-15;g[j+(X(cU,u)+k<<2)>>2]=an;T=cU+1|0;if((T|0)==(w|0)){cT=cR;break L1028}else{cU=T}}}}while(0);T=k+1|0;if((T|0)<(u|0)){k=T;ab=cT}else{break}}c[e+44>>2]=0;cT=c[n>>2]|0;if(((am(c[ae>>2]|0,1)|-32)+cT|0)>(ag|0)){cV=-3}else{if((c[aj+44>>2]|0)!=0){c[e+36>>2]=1}cV=(G|0)/(c[D>>2]|0)&-1}ak(by|0);Q=cV;i=m;return Q|0}function a0(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,V=0,W=0,Y=0,Z=0,_=0,$=0.0,aa=0,ab=0,ac=0,ad=0.0,ae=0,af=0,ag=0,ah=0.0,ai=0,aj=0,al=0,am=0,an=0.0,ap=0,aq=0,ar=0,as=0,at=0.0,au=0,av=0.0,aw=0,ax=0,ay=0.0,az=0,aA=0.0,aB=0.0,aC=0.0,aD=0,aE=0.0,aF=0.0,aG=0.0,aH=0,aI=0.0,aJ=0,aK=0,aL=0.0,aM=0,aN=0;h=i;i=i+8504|0;j=h|0;k=h+8|0;l=h+16|0;m=h+20|0;n=h+4116|0;o=h+8212|0;p=h+8312|0;q=h+8408|0;r=c[a+8>>2]|0;s=c[a>>2]|0;t=s+8|0;u=c[t>>2]|0;v=s+4|0;w=c[v>>2]|0;x=c[s+32>>2]|0;y=w+2048|0;z=2048-e|0;A=0;while(1){B=X(A,y);c[j+(A<<2)>>2]=a+80+(B<<2)|0;c[k+(A<<2)>>2]=a+80+(z+B<<2)|0;B=A+1|0;if((B|0)<(r|0)){A=B}else{break}}A=n;B=X(y,r);y=X(w+2072|0,r);C=a+44|0;D=c[C>>2]|0;E=c[a+20>>2]|0;F=c[a+16>>2]|0;G=(D|0)>4;if(G|(E|0)!=0){H=X(r,e);I=i;i=i+(H*4&-1)|0;i=i+3>>2<<2;J=c[a+24>>2]|0;K=c[s+12>>2]|0;M=(J|0)<(K|0)?J:K;K=(E|0)>(M|0)?E:M;M=ao()|0;N=i;i=i+(H*4&-1)|0;i=i+3>>2<<2;H=X(u,r);O=i;i=i+(H*4&-1)|0;i=i+3>>2<<2;H=O;L1112:do{if(G){P=(E|0)>0;Q=c[t>>2]|0;R=u*6&-1;S=E<<2;T=0;while(1){if(P){b_(H+X(Q,T<<2)|0,0,S|0);V=E}else{V=0}L1142:do{if((V|0)<(J|0)){W=X(Q,T);Y=V;while(1){Z=W+Y|0;g[O+(Z<<2)>>2]=+U((+g[a+80+((Z+y|0)+R<<2)>>2]+ +g[5256216+(Y<<2)>>2])*.6931471805599453);Z=Y+1|0;if((Z|0)==(J|0)){_=J;break L1142}else{Y=Z}}}else{_=V}}while(0);L1147:do{if((_|0)<(Q|0)){Y=_;while(1){g[O+(X(Q,T)+Y<<2)>>2]=0.0;W=Y+1|0;if((W|0)<(Q|0)){Y=W}else{break L1147}}}}while(0);Y=T+1|0;if((Y|0)<(r|0)){T=Y}else{break L1112}}}else{$=(D|0)==0?1.5:.5;T=(E|0)<(J|0);Q=0;while(1){L1116:do{if(T){R=X(Q,u)+y|0;S=E;while(1){P=a+80+(R+S<<2)|0;g[P>>2]=+g[P>>2]-$;P=S+1|0;if((P|0)==(J|0)){break L1116}else{S=P}}}}while(0);S=Q+1|0;if((S|0)<(r|0)){Q=S}else{break}}Q=(E|0)>0;T=c[t>>2]|0;S=E<<2;R=0;while(1){if(Q){b_(H+X(T,R<<2)|0,0,S|0);aa=E}else{aa=0}L1127:do{if((aa|0)<(J|0)){P=X(T,R);Y=aa;while(1){W=P+Y|0;g[O+(W<<2)>>2]=+U((+g[a+80+(W+y<<2)>>2]+ +g[5256216+(Y<<2)>>2])*.6931471805599453);W=Y+1|0;if((W|0)==(J|0)){ab=J;break L1127}else{Y=W}}}else{ab=aa}}while(0);L1132:do{if((ab|0)<(T|0)){Y=ab;while(1){g[O+(X(T,R)+Y<<2)>>2]=0.0;P=Y+1|0;if((P|0)<(T|0)){Y=P}else{break L1132}}}}while(0);Y=R+1|0;if((Y|0)<(r|0)){R=Y}else{break L1112}}}}while(0);ab=a+32|0;aa=c[ab>>2]|0;L1152:do{if((r|0)>0){J=(E|0)<(K|0);y=aa;H=0;while(1){L1156:do{if(J){t=X(H,e);u=y;_=E;while(1){V=b[x+(_<<1)>>1]<<16>>16;G=(V<<f)+t|0;R=_+1|0;T=(b[x+(R<<1)>>1]<<16>>16)-V<<f;V=(T|0)>0;L1160:do{if(V){S=0;Q=u;while(1){ac=X(Q,1664525)+1013904223|0;g[N+(S+G<<2)>>2]=+(ac>>20|0);Y=S+1|0;if((Y|0)==(T|0)){break}else{S=Y;Q=ac}}Q=N+(G<<2)|0;if(V){ad=1.0000000036274937e-15;ae=0;af=Q}else{ag=ac;break}while(1){$=+g[af>>2];ah=ad+$*$;S=ae+1|0;if((S|0)==(T|0)){break}else{ad=ah;ae=S;af=af+4|0}}$=1.0/+L(ah);S=0;Y=Q;while(1){g[Y>>2]=$*+g[Y>>2];P=S+1|0;if((P|0)==(T|0)){ag=ac;break L1160}else{S=P;Y=Y+4|0}}}else{ag=u}}while(0);if((R|0)<(K|0)){u=ag;_=R}else{ai=ag;break L1156}}}else{ai=y}}while(0);_=H+1|0;if((_|0)==(r|0)){aj=ai;break L1152}else{y=ai;H=_}}}else{aj=aa}}while(0);c[ab>>2]=aj;aS(s,N,I,O,E,K,r,1<<f);E=b[x+(K<<1)>>1]<<16>>16<<f;K=(F|0)==1;x=0;while(1){O=X(x,e);if(K){al=E}else{N=(e|0)/(F|0)&-1;al=(E|0)<(N|0)?E:N}if((al|0)<(e|0)){b_(I+(al+O<<2)|0,0,e-al<<2|0)}O=x+1|0;if((O|0)<(r|0)){x=O}else{break}}x=z+(w>>>1)<<2;al=0;while(1){E=c[j+(al<<2)>>2]|0;b0(E,E+(e<<2)|0,x);E=al+1|0;if((E|0)<(r|0)){al=E}else{break}}al=c[v>>2]|0;v=c[s+44>>2]<<f;x=(c[s+36>>2]|0)-f|0;f=s+64|0;E=s+60|0;K=0;while(1){O=X(K,v);bb(f,I+(O<<2)|0,c[k+(K<<2)>>2]|0,c[E>>2]|0,al,x,1);O=K+1|0;if((O|0)<(r|0)){K=O}else{break}}ak(M|0);am=I}else{I=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;M=(D|0)==0;if(M){K=m|0;bc(j|0,K,2048,r);bd(m+1440|0,K,1328,620,l);K=720-(c[l>>2]|0)|0;c[l>>2]=K;c[a+40>>2]=K;an=1.0;ap=K}else{K=c[a+40>>2]|0;c[l>>2]=K;an=.800000011920929;ap=K}K=ao()|0;l=i;i=i+(w*4&-1)|0;i=i+3>>2<<2;m=c[s+60>>2]|0;x=n|0;al=o|0;E=ap<<1;f=(E|0)<1024?E:1024;E=2047-f|0;v=1024-f|0;O=n+(v<<2)|0;N=p|0;aj=f>>1;ab=(f|0)>0;aa=z<<2;ai=1024-ap|0;ag=w+e|0;ac=(ag|0)>0;af=z-1|0;ae=q|0;H=(w|0)>0;y=(e|0)>0;J=a+48|0;_=a+56|0;u=a+64|0;t=(w|0)/2&-1;T=(w|0)>1;V=w-1|0;G=(1024-e|0)+ai|0;Y=1024-aj|0;S=ag<<2;Q=0;while(1){P=c[j+(Q<<2)>>2]|0;b$(A,P+4096|0,4096);L1053:do{if(M){bh(x,al,m,w,24,1024);g[al>>2]=+g[al>>2]*1.000100016593933;W=1;while(1){Z=o+(W<<2)|0;ah=+g[Z>>2];ad=+(W|0);g[Z>>2]=ah-ad*ad*ah*6400000711437315.0e-20;Z=W+1|0;if((Z|0)==25){break}else{W=Z}}W=(Q*24&-1)+B|0;ah=+g[al>>2];b_(a+80+(W<<2)|0,0,96);if(ah==0.0){aq=0;break}Z=W-1|0;ad=ah*.0010000000474974513;$=ah;ar=0;while(1){if((ar|0)>=24){aq=0;break L1053}L1062:do{if((ar|0)>0){ah=0.0;as=0;while(1){at=ah+ +g[a+80+(as+W<<2)>>2]*+g[o+(ar-as<<2)>>2];au=as+1|0;if((au|0)==(ar|0)){av=at;break L1062}else{ah=at;as=au}}}else{av=0.0}}while(0);as=ar+1|0;ah=(av+ +g[o+(as<<2)>>2])/$;at=-0.0-ah;g[a+80+(ar+W<<2)>>2]=at;R=as>>1;L1066:do{if((R|0)>0){au=Z+ar|0;aw=0;while(1){ax=a+80+(aw+W<<2)|0;ay=+g[ax>>2];az=a+80+(au-aw<<2)|0;aA=+g[az>>2];g[ax>>2]=ay+aA*at;g[az>>2]=aA+ay*at;az=aw+1|0;if((az|0)==(R|0)){break L1066}else{aw=az}}}}while(0);at=$-$*ah*ah;if(at<ad){aq=0;break L1053}else{$=at;ar=as}}}else{aq=0}}while(0);while(1){g[p+(aq<<2)>>2]=+g[P+(E-aq<<2)>>2];ar=aq+1|0;if((ar|0)==24){break}else{aq=ar}}ar=a+80+((Q*24&-1)+B<<2)|0;bf(O,ar,O,f,24,N);L1074:do{if(ab){$=1.0;ad=1.0;W=0;while(1){at=+g[n+(Y+W<<2)>>2];ay=$+at*at;at=+g[n+(v+W<<2)>>2];aA=ad+at*at;Z=W+1|0;if((Z|0)<(aj|0)){$=ay;ad=aA;W=Z}else{aB=ay;aC=aA;break L1074}}}else{aB=1.0;aC=1.0}}while(0);ad=+L((aB<aC?aB:aC)/aC);b0(P,P+(e<<2)|0,aa);L1078:do{if(ac){$=0.0;aA=an*ad;W=0;Z=0;while(1){if((W|0)<(ap|0)){aD=W;aE=aA}else{aD=W-ap|0;aE=ad*aA}g[P+(Z+z<<2)>>2]=aE*+g[n+(aD+ai<<2)>>2];ay=+g[P+(G+aD<<2)>>2];at=$+ay*ay;R=Z+1|0;if((R|0)==(ag|0)){aF=at;break L1078}else{$=at;aA=aE;W=aD+1|0;Z=R}}}else{aF=0.0}}while(0);Z=0;while(1){g[q+(Z<<2)>>2]=+g[P+(af-Z<<2)>>2];W=Z+1|0;if((W|0)==24){break}else{Z=W}}Z=P+8192|0;W=P+(z<<2)|0;bg(W,ar,W,ag,24,ae);L1089:do{if(ac){ad=0.0;R=0;while(1){aA=+g[P+(R+z<<2)>>2];$=ad+aA*aA;aw=R+1|0;if((aw|0)==(ag|0)){aG=$;break L1089}else{ad=$;R=aw}}}else{aG=0.0}}while(0);L1093:do{if(aF>aG*.20000000298023224){if(aF>=aG){break}ad=+L((aF+1.0)/(aG+1.0));L1098:do{if(H){$=1.0-ad;ar=0;while(1){R=P+(ar+z<<2)|0;g[R>>2]=+g[R>>2]*(1.0-$*+g[m+(ar<<2)>>2]);R=ar+1|0;if((R|0)==(w|0)){break L1098}else{ar=R}}}}while(0);if(y){aH=w}else{break}while(1){ar=P+(aH+z<<2)|0;g[ar>>2]=ad*+g[ar>>2];ar=aH+1|0;if((ar|0)<(ag|0)){aH=ar}else{break L1093}}}else{if(!ac){break}b_(W|0,0,S|0)}}while(0);W=c[J>>2]|0;ad=-0.0- +g[_>>2];ar=c[u>>2]|0;a_(l,Z,W,W,w,ad,ad,ar,ar,0,0);L1106:do{if(T){ar=0;W=0;while(1){as=V+W|0;g[P+(ar+2048<<2)>>2]=+g[m+(ar<<2)>>2]*+g[l+(as<<2)>>2]+ +g[m+(as<<2)>>2]*+g[l+(ar<<2)>>2];as=ar+1|0;R=ar^-1;if((as|0)<(t|0)){ar=as;W=R}else{break L1106}}}}while(0);P=Q+1|0;if((P|0)<(r|0)){Q=P}else{break}}ak(K|0);am=I}aG=+g[s+16>>2];s=(e|0)/(F|0)&-1;I=(F|0)>1;K=(e|0)>0;Q=(s|0)>0;t=0;l=0;while(1){m=a+72+(t<<2)|0;aF=+g[m>>2];V=c[k+(t<<2)>>2]|0;do{if(I){L1192:do{if(K){T=0;aE=aF;while(1){an=aE+ +g[V+(T<<2)>>2];aC=aG*an;g[am+(T<<2)>>2]=an;w=T+1|0;if((w|0)==(e|0)){aI=aC;break L1192}else{T=w;aE=aC}}}else{aI=aF}}while(0);g[m>>2]=aI;aJ=1;aK=800;break}else{L1197:do{if(K){T=0;aE=aF;while(1){aC=aE+ +g[V+(T<<2)>>2];an=aG*aC;g[d+(X(T,r)+t<<2)>>2]=aC*30517578125.0e-15;w=T+1|0;if((w|0)==(e|0)){aL=an;break L1197}else{T=w;aE=an}}}else{aL=aF}}while(0);g[m>>2]=aL;if((l|0)==0){aM=0;break}else{aJ=l;aK=800;break}}}while(0);L1201:do{if((aK|0)==800){aK=0;if(Q){aN=0}else{aM=aJ;break}while(1){aF=+g[am+(X(aN,F)<<2)>>2]*30517578125.0e-15;g[d+(X(aN,r)+t<<2)>>2]=aF;m=aN+1|0;if((m|0)==(s|0)){aM=aJ;break L1201}else{aN=m}}}}while(0);m=t+1|0;if((m|0)<(r|0)){t=m;l=aM}else{break}}c[C>>2]=D+1|0;i=h;return}function a1(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=b+28|0;h=c[g>>2]|0;i=(h>>>0)/(f>>>0)>>>0;if((d|0)==0){j=h-X(i,f-e|0)|0}else{k=h-X(i,f-d|0)|0;f=b+32|0;c[f>>2]=k+(c[f>>2]|0)|0;j=X(i,e-d|0)}c[g>>2]=j;if(j>>>0>=8388609){return}d=b+32|0;e=b+20|0;i=b+36|0;f=b+40|0;k=b+24|0;h=b+8|0;l=b+4|0;m=b|0;n=b+44|0;b=c[d>>2]|0;o=j;while(1){j=b>>>23;if((j|0)==255){c[i>>2]=(c[i>>2]|0)+1|0;p=b;q=o}else{r=b>>>31;s=c[f>>2]|0;if((s|0)>-1){t=c[k>>2]|0;if(((c[h>>2]|0)+t|0)>>>0<(c[l>>2]|0)>>>0){c[k>>2]=t+1|0;a[(c[m>>2]|0)+t|0]=s+r&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u}s=c[i>>2]|0;L1225:do{if((s|0)!=0){t=r+255&255;v=s;while(1){w=c[k>>2]|0;if(((c[h>>2]|0)+w|0)>>>0<(c[l>>2]|0)>>>0){c[k>>2]=w+1|0;a[(c[m>>2]|0)+w|0]=t;x=0;y=c[i>>2]|0}else{x=-1;y=v}c[n>>2]=c[n>>2]|x;w=y-1|0;c[i>>2]=w;if((w|0)==0){break L1225}else{v=w}}}}while(0);c[f>>2]=j&255;p=c[d>>2]|0;q=c[g>>2]|0}s=p<<8&2147483392;c[d>>2]=s;r=q<<8;c[g>>2]=r;c[e>>2]=(c[e>>2]|0)+8|0;if(r>>>0<8388609){b=s;o=r}else{break}}return}function a2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=b+28|0;g=c[f>>2]|0;h=b+32|0;i=g>>>(e>>>0);e=g-i|0;g=(d|0)!=0;if(g){c[h>>2]=(c[h>>2]|0)+e|0}d=g?i:e;c[f>>2]=d;if(d>>>0>=8388609){return}e=b+20|0;i=b+36|0;g=b+40|0;j=b+24|0;k=b+8|0;l=b+4|0;m=b|0;n=b+44|0;b=c[h>>2]|0;o=d;while(1){d=b>>>23;if((d|0)==255){c[i>>2]=(c[i>>2]|0)+1|0;p=b;q=o}else{r=b>>>31;s=c[g>>2]|0;if((s|0)>-1){t=c[j>>2]|0;if(((c[k>>2]|0)+t|0)>>>0<(c[l>>2]|0)>>>0){c[j>>2]=t+1|0;a[(c[m>>2]|0)+t|0]=s+r&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u}s=c[i>>2]|0;L1253:do{if((s|0)!=0){t=r+255&255;v=s;while(1){w=c[j>>2]|0;if(((c[k>>2]|0)+w|0)>>>0<(c[l>>2]|0)>>>0){c[j>>2]=w+1|0;a[(c[m>>2]|0)+w|0]=t;x=0;y=c[i>>2]|0}else{x=-1;y=v}c[n>>2]=c[n>>2]|x;w=y-1|0;c[i>>2]=w;if((w|0)==0){break L1253}else{v=w}}}}while(0);c[g>>2]=d&255;p=c[h>>2]|0;q=c[f>>2]|0}s=p<<8&2147483392;c[h>>2]=s;r=q<<8;c[f>>2]=r;c[e>>2]=(c[e>>2]|0)+8|0;if(r>>>0<8388609){b=s;o=r}else{break}}return}function a3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+4|0;f=e|0;c[f>>2]=d;L1265:do{if((b|0)==10010){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if((h|0)<0){j=868;break}if((h|0)>=(c[(c[a>>2]|0)+8>>2]|0)){j=868;break}c[a+20>>2]=h;j=867;break}else if((b|0)==10012){h=c[f>>2]|0;c[f>>2]=h+4|0;d=c[h>>2]|0;if((d|0)<1){j=868;break}if((d|0)>(c[(c[a>>2]|0)+8>>2]|0)){j=868;break}c[a+24>>2]=d;j=867;break}else if((b|0)==10008){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if((h-1|0)>>>0>1){j=868;break}c[a+12>>2]=h;j=867;break}else if((b|0)==10007){h=c[f>>2]|0;c[f>>2]=h+4|0;d=c[h>>2]|0;if((d|0)==0){j=868;break}h=a+36|0;c[d>>2]=c[h>>2]|0;c[h>>2]=0;j=867;break}else if((b|0)==4027){h=c[f>>2]|0;c[f>>2]=h+4|0;d=c[h>>2]|0;if((d|0)==0){j=868;break}c[d>>2]=(c[a+4>>2]|0)/(c[a+16>>2]|0)&-1;j=867;break}else if((b|0)==4028){d=c[a+8>>2]|0;h=X((c[a+4>>2]|0)+2072|0,d);k=a|0;l=c[k>>2]|0;m=c[l+8>>2]|0;n=m<<1;o=n+h|0;h=o+n|0;b_(a+32|0,0,((m<<5)+48|0)+X((c[l+4>>2]<<2)+8288|0,d)|0);if((n|0)>0){p=0}else{j=867;break}while(1){g[a+80+(h+p<<2)>>2]=-28.0;g[a+80+(p+o<<2)>>2]=-28.0;n=p+1|0;if((n|0)<(c[(c[k>>2]|0)+8>>2]<<1|0)){p=n}else{j=867;break L1265}}}else if((b|0)==4033){k=c[f>>2]|0;c[f>>2]=k+4|0;o=c[k>>2]|0;if((o|0)==0){j=868;break}c[o>>2]=c[a+48>>2]|0;j=867;break}else if((b|0)==10015){o=c[f>>2]|0;c[f>>2]=o+4|0;k=c[o>>2]|0;if((k|0)==0){j=868;break}c[k>>2]=c[a>>2]|0;j=867;break}else if((b|0)==10016){k=c[f>>2]|0;c[f>>2]=k+4|0;c[a+28>>2]=c[k>>2]|0;j=867;break}else if((b|0)==4031){k=c[f>>2]|0;c[f>>2]=k+4|0;o=c[k>>2]|0;if((o|0)==0){j=868;break}c[o>>2]=c[a+32>>2]|0;j=867;break}else{q=-5;i=e;return q|0}}while(0);if((j|0)==867){q=0;i=e;return q|0}else if((j|0)==868){q=-1;i=e;return q|0}return 0}function a4(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b-1|0;g=c[a+(f<<2)>>2]|0;h=(g|0)>-1?g:-g|0;i=f;f=g>>>31;while(1){g=i-1|0;j=b-g|0;k=(c[(c[5257928+(((j|0)<(h|0)?j:h)<<2)>>2]|0)+(((j|0)>(h|0)?j:h)<<2)>>2]|0)+f|0;l=c[a+(g<<2)>>2]|0;m=((l|0)>-1?l:-l|0)+h|0;if((l|0)<0){l=m+1|0;n=(c[(c[5257928+(((j|0)<(l|0)?j:l)<<2)>>2]|0)+(((j|0)>(l|0)?j:l)<<2)>>2]|0)+k|0}else{n=k}if((g|0)>0){h=m;i=g;f=n}else{break}}f=d+1|0;a9(e,n,(c[(c[5257928+(((f|0)>(b|0)?b:f)<<2)>>2]|0)+(((f|0)<(b|0)?b:f)<<2)>>2]|0)+(c[(c[5257928+(((b|0)<(d|0)?b:d)<<2)>>2]|0)+(((b|0)>(d|0)?b:d)<<2)>>2]|0)|0);return}function a5(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=d+1|0;g=b;h=d;i=a;a=a6(e,(c[(c[5257928+(((f|0)>(b|0)?b:f)<<2)>>2]|0)+(((f|0)<(b|0)?b:f)<<2)>>2]|0)+(c[(c[5257928+(((b|0)<(d|0)?b:d)<<2)>>2]|0)+(((b|0)>(d|0)?b:d)<<2)>>2]|0)|0)|0;while(1){d=h+1|0;b=c[(c[5257928+(((g|0)<(d|0)?g:d)<<2)>>2]|0)+(((g|0)>(d|0)?g:d)<<2)>>2]|0;d=a>>>0>=b>>>0&1;f=-d|0;e=a-(b&f)|0;b=c[(c[5257928+(((g|0)<(h|0)?g:h)<<2)>>2]|0)+(((g|0)>(h|0)?g:h)<<2)>>2]|0;L1305:do{if(b>>>0>e>>>0){j=h;while(1){k=j-1|0;l=c[(c[5257928+(((g|0)<(k|0)?g:k)<<2)>>2]|0)+(((g|0)>(k|0)?g:k)<<2)>>2]|0;if(l>>>0>e>>>0){j=k}else{m=k;n=l;break L1305}}}else{m=h;n=b}}while(0);c[i>>2]=(h-d|0)-m^f;b=g-1|0;if((b|0)>0){g=b;h=m;i=i+4|0;a=e-n|0}else{break}}return}function a6(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=b-1|0;f=32-(am(e|0,1)|0)|0;if(f>>>0<=8){g=a+28|0;h=c[g>>2]|0;i=(h>>>0)/(b>>>0)>>>0;c[a+36>>2]=i;j=a+32|0;k=c[j>>2]|0;l=(k>>>0)/(i>>>0)>>>0;m=l+1|0;n=b-m&-(m>>>0>b>>>0&1);m=(l^-1)+b|0;b=m-n|0;l=X(e-b|0,i);o=k-l|0;c[j>>2]=o;k=(m|0)==(n|0)?h-l|0:i;c[g>>2]=k;if(k>>>0>=8388609){p=b;return p|0}i=a+20|0;l=a+40|0;h=a+24|0;n=a|0;m=c[a+4>>2]|0;q=c[i>>2]|0;r=k;k=c[l>>2]|0;s=c[h>>2]|0;t=o;while(1){o=q+8|0;c[i>>2]=o;u=r<<8;c[g>>2]=u;if(s>>>0<m>>>0){v=s+1|0;c[h>>2]=v;w=d[(c[n>>2]|0)+s|0]|0;x=v}else{w=0;x=s}c[l>>2]=w;v=((w|k<<8)>>>1&255|t<<8&2147483392)^255;c[j>>2]=v;if(u>>>0<8388609){q=o;r=u;k=w;s=x;t=v}else{p=b;break}}return p|0}b=f-8|0;f=e>>>(b>>>0);t=f+1|0;x=a+28|0;s=c[x>>2]|0;w=(s>>>0)/(t>>>0)>>>0;c[a+36>>2]=w;k=a+32|0;r=c[k>>2]|0;q=(r>>>0)/(w>>>0)>>>0;j=q+1|0;l=t-j&-(j>>>0>t>>>0&1);j=t+(q^-1)|0;q=j-l|0;t=X(f-q|0,w);f=r-t|0;c[k>>2]=f;r=(j|0)==(l|0)?s-t|0:w;c[x>>2]=r;L1323:do{if(r>>>0<8388609){w=a+20|0;t=a+40|0;s=a+24|0;l=a|0;j=c[a+4>>2]|0;n=c[w>>2]|0;h=r;m=c[t>>2]|0;g=c[s>>2]|0;i=f;while(1){v=n+8|0;c[w>>2]=v;u=h<<8;c[x>>2]=u;if(g>>>0<j>>>0){o=g+1|0;c[s>>2]=o;y=d[(c[l>>2]|0)+g|0]|0;z=o}else{y=0;z=g}c[t>>2]=y;o=((y|m<<8)>>>1&255|i<<8&2147483392)^255;c[k>>2]=o;if(u>>>0<8388609){n=v;h=u;m=y;g=z;i=o}else{break L1323}}}}while(0);z=q<<b;q=a+12|0;y=c[q>>2]|0;k=a+16|0;x=c[k>>2]|0;if(x>>>0<b>>>0){f=a+8|0;r=a|0;i=x+8|0;g=((i|0)>25?x+7|0:24)-x|0;m=c[a+4>>2]|0;h=y;n=x;t=c[f>>2]|0;while(1){if(t>>>0<m>>>0){l=t+1|0;c[f>>2]=l;A=d[(c[r>>2]|0)+(m-l|0)|0]|0;B=l}else{A=0;B=t}C=A<<n|h;l=n+8|0;if((l|0)<25){h=C;n=l;t=B}else{break}}D=C;E=i+(g&-8)|0}else{D=y;E=x}c[q>>2]=D>>>(b>>>0);c[k>>2]=E-b|0;E=a+20|0;c[E>>2]=(c[E>>2]|0)+b|0;E=D&(1<<b)-1|z;if(E>>>0<=e>>>0){p=E;return p|0}c[a+44>>2]=1;p=e;return p|0}function a7(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0,J=0,K=0.0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0.0,W=0.0,Y=0,Z=0.0,_=0.0,$=0,aa=0,ab=0.0,ac=0.0,ad=0,ae=0,af=0.0,ag=0.0;f=i;i=i+32|0;h=f|0;j=c[a+8>>2]|0;k=(j|0)>0?j:0;j=a|0;L1345:do{if((c[j>>2]|0)>0){l=a+44|0;m=0;while(1){n=d+(m<<3)|0;o=e+(b[(c[l>>2]|0)+(m<<1)>>1]<<16>>16<<3)|0;p=c[n+4>>2]|0;c[o>>2]=c[n>>2]|0;c[o+4>>2]=p;p=m+1|0;if((p|0)<(c[j>>2]|0)){m=p}else{break L1345}}}}while(0);c[h>>2]=1;j=0;d=1;while(1){m=j<<1;l=b[a+12+((m|1)<<1)>>1]|0;p=X(d,b[a+12+(m<<1)>>1]<<16>>16);q=j+1|0;c[h+(q<<2)>>2]=p;if(l<<16>>16==1){break}else{j=q;d=p}}if((j|0)<=-1){i=f;return}d=a+48|0;p=b[a+12+((q<<1)-1<<1)>>1]<<16>>16;q=j;while(1){if((q|0)==0){r=1;s=0}else{j=q<<1;r=b[a+12+(j-1<<1)>>1]<<16>>16;s=j}j=b[a+12+(s<<1)>>1]<<16>>16;L1361:do{if((j|0)==3){l=c[h+(q<<2)>>2]|0;m=l<<k;o=p<<1;if((l|0)<=0){break}n=c[d>>2]|0;t=m<<1;u=-0.0- +g[n+(X(m,p)<<3)+4>>2];v=0;w=n;while(1){n=e+(X(v,r)<<3)|0;x=p;y=w;z=w;while(1){A=n+(p<<3)|0;B=+g[A>>2];C=+g[y>>2];D=n+(p<<3)+4|0;E=+g[D>>2];F=+g[y+4>>2];G=B*C+E*F;H=C*E-B*F;I=n+(o<<3)|0;F=+g[I>>2];B=+g[z>>2];J=n+(o<<3)+4|0;E=+g[J>>2];C=+g[z+4>>2];K=F*B+E*C;L=B*E-F*C;C=G+K;F=H+L;M=n|0;g[A>>2]=+g[M>>2]-C*.5;N=n+4|0;g[D>>2]=+g[N>>2]-F*.5;E=(G-K)*u;K=(H-L)*u;g[M>>2]=+g[M>>2]+C;g[N>>2]=F+ +g[N>>2];g[I>>2]=K+ +g[A>>2];g[J>>2]=+g[D>>2]-E;g[A>>2]=+g[A>>2]-K;g[D>>2]=E+ +g[D>>2];D=x-1|0;if((D|0)==0){break}else{n=n+8|0;x=D;y=y+(m<<3)|0;z=z+(t<<3)|0}}z=v+1|0;if((z|0)==(l|0)){break L1361}v=z;w=c[d>>2]|0}}else if((j|0)==4){w=c[h+(q<<2)>>2]|0;v=w<<k;l=p<<1;t=p*3&-1;if((w|0)<=0){break}m=(p|0)>0;o=v<<1;z=v*3&-1;y=0;while(1){x=c[d>>2]|0;L1374:do{if(m){n=x;D=x;A=x;J=0;I=e+(X(y,r)<<3)|0;while(1){N=I+(p<<3)|0;u=+g[N>>2];E=+g[A>>2];M=I+(p<<3)+4|0;K=+g[M>>2];F=+g[A+4>>2];C=u*E+K*F;L=E*K-u*F;O=I+(l<<3)|0;F=+g[O>>2];u=+g[D>>2];P=I+(l<<3)+4|0;K=+g[P>>2];E=+g[D+4>>2];H=F*u+K*E;G=u*K-F*E;Q=I+(t<<3)|0;E=+g[Q>>2];F=+g[n>>2];R=I+(t<<3)+4|0;K=+g[R>>2];u=+g[n+4>>2];B=E*F+K*u;S=F*K-E*u;T=I|0;u=+g[T>>2];E=u-H;U=I+4|0;K=+g[U>>2];F=K-G;V=H+u;g[T>>2]=V;u=G+K;g[U>>2]=u;K=C+B;G=L+S;H=C-B;B=L-S;g[O>>2]=V-K;g[P>>2]=u-G;g[T>>2]=K+ +g[T>>2];g[U>>2]=G+ +g[U>>2];g[N>>2]=E-B;g[M>>2]=F+H;g[Q>>2]=E+B;g[R>>2]=F-H;R=J+1|0;if((R|0)==(p|0)){break L1374}else{n=n+(z<<3)|0;D=D+(o<<3)|0;A=A+(v<<3)|0;J=R;I=I+8|0}}}}while(0);x=y+1|0;if((x|0)==(w|0)){break L1361}else{y=x}}}else if((j|0)==5){y=c[h+(q<<2)>>2]|0;w=y<<k;v=c[d>>2]|0;o=X(w,p);H=+g[v+(o<<3)>>2];F=+g[v+(o<<3)+4>>2];o=X(w<<1,p);B=+g[v+(o<<3)>>2];E=+g[v+(o<<3)+4>>2];if((y|0)<=0){break}o=p<<1;z=p*3&-1;t=p<<2;l=(p|0)>0;m=w*3&-1;x=0;while(1){I=X(x,r);L1383:do{if(l){J=0;A=e+(I+t<<3)|0;D=e+(I+z<<3)|0;n=e+(I+o<<3)|0;R=e+(I+p<<3)|0;Q=e+(I<<3)|0;while(1){M=Q|0;G=+g[M>>2];N=Q+4|0;K=+g[N>>2];U=R|0;u=+g[U>>2];T=X(J,w);V=+g[v+(T<<3)>>2];P=R+4|0;S=+g[P>>2];L=+g[v+(T<<3)+4>>2];C=u*V+S*L;W=V*S-u*L;T=n|0;L=+g[T>>2];O=X(J<<1,w);u=+g[v+(O<<3)>>2];Y=n+4|0;S=+g[Y>>2];V=+g[v+(O<<3)+4>>2];Z=L*u+S*V;_=u*S-L*V;O=D|0;V=+g[O>>2];$=X(m,J);L=+g[v+($<<3)>>2];aa=D+4|0;S=+g[aa>>2];u=+g[v+($<<3)+4>>2];ab=V*L+S*u;ac=L*S-V*u;$=A|0;u=+g[$>>2];ad=X(J<<2,w);V=+g[v+(ad<<3)>>2];ae=A+4|0;S=+g[ae>>2];L=+g[v+(ad<<3)+4>>2];af=u*V+S*L;ag=V*S-u*L;L=C+af;u=W+ag;S=C-af;af=W-ag;ag=Z+ab;W=_+ac;C=Z-ab;ab=_-ac;g[M>>2]=G+(ag+L);g[N>>2]=K+(W+u);ac=B*ag+(G+H*L);_=B*W+(K+H*u);Z=-0.0-F*af-E*ab;V=E*C+F*S;g[U>>2]=ac-Z;g[P>>2]=_-V;g[$>>2]=ac+Z;g[ae>>2]=V+_;_=H*ag+(G+B*L);L=H*W+(K+B*u);u=E*af-F*ab;ab=F*C-E*S;g[T>>2]=u+_;g[Y>>2]=ab+L;g[O>>2]=_-u;g[aa>>2]=L-ab;aa=J+1|0;if((aa|0)==(p|0)){break L1383}else{J=aa;A=A+8|0;D=D+8|0;n=n+8|0;R=R+8|0;Q=Q+8|0}}}}while(0);I=x+1|0;if((I|0)==(y|0)){break L1361}else{x=I}}}else if((j|0)==2){x=c[h+(q<<2)>>2]|0;y=x<<k;if((x|0)<=0){break}v=(p|0)>0;w=0;while(1){m=X(w,r);L1392:do{if(v){o=c[d>>2]|0;z=e+(m+p<<3)|0;t=0;l=e+(m<<3)|0;while(1){I=z|0;E=+g[I>>2];F=+g[o>>2];Q=z+4|0;B=+g[Q>>2];H=+g[o+4>>2];ab=E*F+B*H;L=F*B-E*H;R=l|0;g[I>>2]=+g[R>>2]-ab;I=l+4|0;g[Q>>2]=+g[I>>2]-L;g[R>>2]=ab+ +g[R>>2];g[I>>2]=L+ +g[I>>2];I=t+1|0;if((I|0)==(p|0)){break L1392}else{o=o+(y<<3)|0;z=z+8|0;t=I;l=l+8|0}}}}while(0);m=w+1|0;if((m|0)==(x|0)){break L1361}else{w=m}}}}while(0);if((q|0)>0){p=r;q=q-1|0}else{break}}i=f;return}function a8(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=a+28|0;g=c[f>>2]|0;h=g>>>15;c[a+36>>2]=h;i=a+32|0;j=c[i>>2]|0;k=(j>>>0)/(h>>>0)>>>0;l=32767-k&((k+1|0)>>>0<32769)<<31>>31;do{if(l>>>0<b>>>0){m=b;n=0;o=0}else{k=(X(16384-e|0,32736-b|0)>>>15)+1|0;L1402:do{if(k>>>0>1){p=b;q=1;r=k;while(1){s=r<<1;t=s+p|0;if(l>>>0<t>>>0){u=q;v=p;w=r;break L1402}x=q+1|0;y=(X(s-2|0,e)>>>15)+1|0;if(y>>>0>1){p=t;q=x;r=y}else{z=t;A=x;B=y;C=950;break L1402}}}else{z=b;A=1;B=k;C=950}}while(0);if((C|0)==950){k=(l-z|0)>>>1;u=k+A|0;v=(k<<1)+z|0;w=B}k=v+w|0;if(l>>>0>=k>>>0){m=w;n=u;o=k;break}m=w;n=-u|0;o=v}}while(0);v=m+o|0;m=v>>>0<32768?v:32768;v=X(32768-m|0,h);u=j-v|0;c[i>>2]=u;if((o|0)==0){D=g-v|0}else{D=X(m-o|0,h)}c[f>>2]=D;if(D>>>0>=8388609){return n|0}h=a+20|0;o=a+40|0;m=a+24|0;v=a|0;g=c[a+4>>2]|0;a=c[h>>2]|0;j=D;D=c[o>>2]|0;w=c[m>>2]|0;l=u;while(1){u=a+8|0;c[h>>2]=u;B=j<<8;c[f>>2]=B;if(w>>>0<g>>>0){z=w+1|0;c[m>>2]=z;E=d[(c[v>>2]|0)+w|0]|0;F=z}else{E=0;F=w}c[o>>2]=E;z=((E|D<<8)>>>1&255|l<<8&2147483392)^255;c[i>>2]=z;if(B>>>0<8388609){a=u;j=B;D=E;w=F;l=z}else{break}}return n|0}function a9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=e-1|0;g=32-(am(f|0,1)|0)|0;if(g>>>0<=8){a1(b,d,d+1|0,e);return}e=g-8|0;g=d>>>(e>>>0);a1(b,g,g+1|0,(f>>>(e>>>0))+1|0);f=(1<<e)-1&d;d=b+12|0;g=c[d>>2]|0;h=b+16|0;i=c[h>>2]|0;if((i+e|0)>>>0>32){j=b+24|0;k=b+8|0;l=b+4|0;m=b|0;n=b+44|0;o=7-i|0;p=((o|0)>-8?o:-8)+i|0;o=i;q=g;while(1){r=c[k>>2]|0;s=c[l>>2]|0;if((r+(c[j>>2]|0)|0)>>>0<s>>>0){t=r+1|0;c[k>>2]=t;a[(c[m>>2]|0)+(s-t|0)|0]=q&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u;v=q>>>8;t=o-8|0;if((t|0)>7){o=t;q=v}else{break}}w=(i-8|0)-(p&-8)|0;x=v}else{w=i;x=g}c[d>>2]=f<<w|x;c[h>>2]=w+e|0;w=b+20|0;c[w>>2]=(c[w>>2]|0)+e|0;return}function ba(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0,I=0.0,J=0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0,V=0,W=0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0,aa=0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0,ah=0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0.0,ar=0,as=0.0;f=e-3|0;L1440:do{if((f|0)>0){h=d-3|0;i=(h|0)>0;j=0;while(1){k=j|1;l=+g[b+(j<<2)>>2];m=j|2;n=+g[b+(k<<2)>>2];o=j|3;p=b+(o<<2)|0;q=+g[b+(m<<2)>>2];L1444:do{if(i){r=n;s=q;t=l;u=0;v=p;w=a;x=0.0;y=0.0;z=0.0;A=0.0;while(1){B=+g[w>>2];C=+g[v>>2];D=+g[w+4>>2];E=+g[v+4>>2];F=+g[w+8>>2];G=+g[v+8>>2];H=w+16|0;I=+g[w+12>>2];J=v+16|0;K=+g[v+12>>2];L=x+t*B+r*D+s*F+C*I;M=y+r*B+s*D+C*F+E*I;N=z+s*B+C*D+E*F+G*I;O=A+B*C+D*E+F*G+I*K;P=u+4|0;if((P|0)<(h|0)){r=G;s=K;t=E;u=P;v=J;w=H;x=L;y=M;z=N;A=O}else{Q=G;R=K;S=C;T=E;U=P;V=J;W=H;X=L;Y=M;Z=N;_=O;break L1444}}}else{Q=n;R=q;S=0.0;T=l;U=0;V=p;W=a;X=0.0;Y=0.0;Z=0.0;_=0.0}}while(0);p=U|1;if((U|0)<(d|0)){l=+g[W>>2];q=+g[V>>2];$=W+4|0;aa=V+4|0;ab=q;ac=X+T*l;ad=Y+Q*l;ae=Z+R*l;af=_+l*q}else{$=W;aa=V;ab=S;ac=X;ad=Y;ae=Z;af=_}if((p|0)<(d|0)){q=+g[$>>2];l=+g[aa>>2];ag=$+4|0;ah=aa+4|0;ai=l;aj=ac+Q*q;ak=ad+R*q;al=ae+ab*q;am=af+q*l}else{ag=$;ah=aa;ai=T;aj=ac;ak=ad;al=ae;am=af}if((p+1|0)<(d|0)){l=+g[ag>>2];an=aj+R*l;ao=ak+ab*l;ap=al+ai*l;aq=am+l*+g[ah>>2]}else{an=aj;ao=ak;ap=al;aq=am}g[c+(j<<2)>>2]=an;g[c+(k<<2)>>2]=ao;g[c+(m<<2)>>2]=ap;g[c+(o<<2)>>2]=aq;p=j+4|0;if((p|0)<(f|0)){j=p}else{ar=p;break L1440}}}else{ar=0}}while(0);if((ar|0)>=(e|0)){return}f=(d|0)>0;ah=ar;while(1){L1463:do{if(f){ar=0;aq=0.0;while(1){ap=aq+ +g[a+(ar<<2)>>2]*+g[b+(ar+ah<<2)>>2];ag=ar+1|0;if((ag|0)==(d|0)){as=ap;break L1463}else{ar=ag;aq=ap}}}else{as=0.0}}while(0);g[c+(ah<<2)>>2]=as;ar=ah+1|0;if((ar|0)==(e|0)){break}else{ah=ar}}return}function bb(a,b,d,e,f,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0;k=i;l=c[a>>2]>>h;m=l>>1;n=l>>2;o=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;p=.7853981852531433/+(l|0);l=a+24|0;q=c[l>>2]|0;L1469:do{if((n|0)>0){r=j<<1;s=-r|0;t=o;u=b+(X(m-1|0,j)<<2)|0;v=b;w=0;while(1){x=+g[u>>2];y=+g[q+(w<<h<<2)>>2];z=+g[v>>2];A=+g[q+(n-w<<h<<2)>>2];B=z*A-x*y;C=-0.0-x*A-y*z;g[t>>2]=B-p*C;g[t+4>>2]=C+p*B;D=w+1|0;if((D|0)==(n|0)){break L1469}else{t=t+8|0;u=u+(s<<2)|0;v=v+(r<<2)|0;w=D}}}}while(0);q=f>>1;b=d+(q<<2)|0;a7(c[a+8+(h<<2)>>2]|0,o,b);o=c[l>>2]|0;l=n+1>>1;L1474:do{if((l|0)>0){a=d+((q-2|0)+m<<2)|0;j=b;w=0;while(1){B=+g[j>>2];r=j+4|0;C=+g[r>>2];z=+g[o+(w<<h<<2)>>2];v=n-w|0;y=+g[o+(v<<h<<2)>>2];A=B*z-C*y;x=C*z+B*y;y=+g[a>>2];s=a+4|0;B=+g[s>>2];g[j>>2]=-0.0-(A-p*x);g[s>>2]=x+p*A;A=+g[o+(v-1<<h<<2)>>2];v=w+1|0;x=+g[o+(v<<h<<2)>>2];z=y*A-B*x;C=B*A+y*x;g[a>>2]=-0.0-(z-p*C);g[r>>2]=C+p*z;if((v|0)==(l|0)){break L1474}else{a=a-8|0;j=j+8|0;w=v}}}}while(0);l=f-1|0;h=(f|0)/2&-1;if((f|0)<=1){i=k;return}f=d+(l<<2)|0;o=d;d=e;n=e+(l<<2)|0;l=0;while(1){p=+g[f>>2];z=+g[o>>2];C=+g[n>>2];x=+g[d>>2];g[o>>2]=z*C-p*x;g[f>>2]=z*x+p*C;e=l+1|0;if((e|0)<(h|0)){f=f-4|0;o=o+4|0;d=d+4|0;n=n-4|0;l=e}else{break}}i=k;return}function bc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0;f=i;i=i+36|0;h=f|0;j=f+20|0;k=d>>1;d=(k|0)>1;l=c[a>>2]|0;L1486:do{if(d){m=1;while(1){n=m<<1;g[b+(m<<2)>>2]=(+g[l+(n<<2)>>2]+(+g[l+(n-1<<2)>>2]+ +g[l+((n|1)<<2)>>2])*.5)*.5;n=m+1|0;if((n|0)==(k|0)){break L1486}else{m=n}}}}while(0);o=(+g[l+4>>2]*.5+ +g[l>>2])*.5;g[b>>2]=o;if((e|0)==2){e=c[a+4>>2]|0;if(d){d=1;while(1){a=d<<1;l=b+(d<<2)|0;g[l>>2]=+g[l>>2]+(+g[e+(a<<2)>>2]+(+g[e+(a-1<<2)>>2]+ +g[e+((a|1)<<2)>>2])*.5)*.5;a=d+1|0;if((a|0)==(k|0)){break}else{d=a}}p=+g[b>>2]}else{p=o}g[b>>2]=p+(+g[e+4>>2]*.5+ +g[e>>2])*.5}e=h|0;bh(b,e,0,0,4,k);p=+g[e>>2]*1.000100016593933;g[e>>2]=p;e=h+4|0;o=+g[e>>2];g[e>>2]=o-o*.00800000037997961*.00800000037997961;e=h+8|0;o=+g[e>>2];g[e>>2]=o-o*.01600000075995922*.01600000075995922;e=h+12|0;o=+g[e>>2];g[e>>2]=o-o*.024000000208616257*.024000000208616257;e=h+16|0;o=+g[e>>2];g[e>>2]=o-o*.03200000151991844*.03200000151991844;e=j|0;d=j;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;if(p!=0.0){o=p*.0010000000474974513;q=p;d=0;while(1){if((d|0)>=4){break}L1504:do{if((d|0)>0){p=0.0;a=0;while(1){r=p+ +g[j+(a<<2)>>2]*+g[h+(d-a<<2)>>2];l=a+1|0;if((l|0)==(d|0)){s=r;break L1504}else{p=r;a=l}}}else{s=0.0}}while(0);a=d+1|0;p=(s+ +g[h+(a<<2)>>2])/q;r=-0.0-p;g[j+(d<<2)>>2]=r;l=a>>1;L1508:do{if((l|0)>0){m=d-1|0;n=0;while(1){t=j+(n<<2)|0;u=+g[t>>2];v=j+(m-n<<2)|0;w=+g[v>>2];g[t>>2]=u+w*r;g[v>>2]=w+u*r;v=n+1|0;if((v|0)==(l|0)){break L1508}else{n=v}}}}while(0);r=q-q*p*p;if(r<o){break}else{q=r;d=a}}d=j+4|0;h=j+8|0;l=j+12|0;x=+g[e>>2]*.8999999761581421;y=+g[d>>2]*.809999942779541;z=+g[h>>2]*.7289999127388;A=+g[l>>2]*.6560999155044556;B=d;C=h;D=l}else{x=0.0;y=0.0;z=0.0;A=0.0;B=j+4|0;C=j+8|0;D=j+12|0}g[e>>2]=x;g[B>>2]=y;g[C>>2]=z;g[D>>2]=A;q=x+.800000011920929;o=y+x*.800000011920929;x=z+y*.800000011920929;y=A+z*.800000011920929;z=A*.800000011920929;if((k|0)>0){E=0.0;F=0.0;G=0.0;H=0.0;I=0.0;J=0}else{i=f;return}while(1){D=b+(J<<2)|0;A=+g[D>>2];g[D>>2]=z*I+(y*H+(x*G+(o*F+(q*E+A))));D=J+1|0;if((D|0)==(k|0)){break}else{I=H;H=G;G=F;F=E;E=A;J=D}}i=f;return}function bd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0.0,L=0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0.0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0;h=i;j=d>>2;k=i;i=i+(j*4&-1)|0;i=i+3>>2<<2;l=e+d>>2;m=i;i=i+(l*4&-1)|0;i=i+3>>2<<2;n=e>>1;o=i;i=i+(n*4&-1)|0;i=i+3>>2<<2;p=(j|0)>0;L1521:do{if(p){q=0;while(1){g[k+(q<<2)>>2]=+g[a+(q<<1<<2)>>2];r=q+1|0;if((r|0)==(j|0)){break L1521}else{q=r}}}}while(0);L1525:do{if((l|0)>0){q=0;while(1){g[m+(q<<2)>>2]=+g[b+(q<<1<<2)>>2];r=q+1|0;if((r|0)==(l|0)){break L1525}else{q=r}}}}while(0);l=e>>2;ba(k,m,o,j,l);L1529:do{if(p){s=1.0;k=0;while(1){t=+g[m+(k<<2)>>2];u=s+t*t;e=k+1|0;if((e|0)==(j|0)){v=u;break L1529}else{s=u;k=e}}}else{v=1.0}}while(0);L1533:do{if((l|0)>0){s=v;u=-1.0;t=-1.0;w=0.0;x=0.0;p=0;k=0;e=1;while(1){y=+g[o+(p<<2)>>2];do{if(y>0.0){z=y*9.999999960041972e-13;A=z*z;if(w*A<=u*s){B=x;C=w;D=t;E=u;F=k;G=e;break}if(x*A>t*s){B=s;C=x;D=A;E=t;F=p;G=k;break}B=x;C=s;D=t;E=A;F=k;G=p}else{B=x;C=w;D=t;E=u;F=k;G=e}}while(0);y=+g[m+(p+j<<2)>>2];A=+g[m+(p<<2)>>2];z=s+(y*y-A*A);q=p+1|0;if((q|0)==(l|0)){H=F;I=G;break L1533}else{s=z<1.0?1.0:z;u=E;t=D;w=C;x=B;p=q;k=F;e=G}}}else{H=0;I=1}}while(0);G=(n|0)>0;L1542:do{if(G){F=H<<1;l=I<<1;m=d>>1;j=(m|0)>0;e=0;while(1){k=o+(e<<2)|0;g[k>>2]=0.0;p=e-F|0;do{if((((p|0)>-1?p:-p|0)|0)>2){q=e-l|0;if((((q|0)>-1?q:-q|0)|0)>2){break}else{J=1047;break}}else{J=1047}}while(0);if((J|0)==1047){J=0;L1551:do{if(j){B=0.0;p=0;while(1){C=B+ +g[a+(p<<2)>>2]*+g[b+(p+e<<2)>>2];q=p+1|0;if((q|0)==(m|0)){K=C;break L1551}else{B=C;p=q}}}else{K=0.0}}while(0);g[k>>2]=K<-1.0?-1.0:K}p=e+1|0;if((p|0)==(n|0)){L=m;break L1542}else{e=p}}}else{L=d>>1}}while(0);L1557:do{if((L|0)>0){K=1.0;d=0;while(1){B=+g[b+(d<<2)>>2];C=K+B*B;a=d+1|0;if((a|0)==(L|0)){M=C;break L1557}else{K=C;d=a}}}else{M=1.0}}while(0);if(G){N=M;O=-1.0;P=-1.0;Q=0.0;R=0.0;S=0;T=0}else{U=0;V=0;W=V<<1;X=W-U|0;c[f>>2]=X;i=h;return}while(1){M=+g[o+(S<<2)>>2];do{if(M>0.0){K=M*9.999999960041972e-13;C=K*K;if(Q*C<=O*N){Y=R;Z=Q;_=P;$=O;aa=T;break}if(R*C>P*N){Y=N;Z=R;_=C;$=P;aa=S;break}Y=R;Z=N;_=P;$=C;aa=T}else{Y=R;Z=Q;_=P;$=O;aa=T}}while(0);M=+g[b+(S+L<<2)>>2];C=+g[b+(S<<2)>>2];K=N+(M*M-C*C);G=S+1|0;if((G|0)==(n|0)){break}else{N=K<1.0?1.0:K;O=$;P=_;Q=Z;R=Y;S=G;T=aa}}if((aa|0)<=0){U=0;V=aa;W=V<<1;X=W-U|0;c[f>>2]=X;i=h;return}if((aa|0)>=(n-1|0)){U=0;V=aa;W=V<<1;X=W-U|0;c[f>>2]=X;i=h;return}Y=+g[o+(aa-1<<2)>>2];R=+g[o+(aa<<2)>>2];Z=+g[o+(aa+1<<2)>>2];if(Z-Y>(R-Y)*.699999988079071){U=1;V=aa;W=V<<1;X=W-U|0;c[f>>2]=X;i=h;return}U=(Y-Z>(R-Z)*.699999988079071)<<31>>31;V=aa;W=V<<1;X=W-U|0;c[f>>2]=X;i=h;return}function be(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0.0,f=0.0,h=0,i=0.0,j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0,G=0,H=0.0,I=0,J=0.0,K=0.0,L=0.0,M=0.0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0.0;e=+g[b>>2];f=+g[b+4>>2];h=b+12|0;i=+g[b+8>>2];b=d-3|0;L1582:do{if((b|0)>0){j=c+4|0;k=c+8|0;l=c+12|0;m=f;n=i;o=e;p=0;q=h;r=a;s=+g[c>>2];t=+g[j>>2];u=+g[k>>2];v=+g[l>>2];while(1){w=+g[r>>2];x=+g[q>>2];y=o*w+s;g[c>>2]=y;z=m*w+t;g[j>>2]=z;A=n*w+u;g[k>>2]=A;B=w*x+v;g[l>>2]=B;w=+g[r+4>>2];C=+g[q+4>>2];D=m*w+y;g[c>>2]=D;y=n*w+z;g[j>>2]=y;z=x*w+A;g[k>>2]=z;A=w*C+B;g[l>>2]=A;B=+g[r+8>>2];w=+g[q+8>>2];E=n*B+D;g[c>>2]=E;D=x*B+y;g[j>>2]=D;y=C*B+z;g[k>>2]=y;z=B*w+A;g[l>>2]=z;F=r+16|0;A=+g[r+12>>2];G=q+16|0;B=+g[q+12>>2];H=x*A+E;g[c>>2]=H;E=C*A+D;g[j>>2]=E;D=w*A+y;g[k>>2]=D;y=A*B+z;g[l>>2]=y;I=p+4|0;if((I|0)<(b|0)){m=w;n=B;o=C;p=I;q=G;r=F;s=H;t=E;u=D;v=y}else{J=w;K=B;L=x;M=C;N=I;O=G;P=F;break L1582}}}else{J=f;K=i;L=0.0;M=e;N=0;O=h;P=a}}while(0);a=N|1;if((N|0)<(d|0)){e=+g[P>>2];i=+g[O>>2];g[c>>2]=M*e+ +g[c>>2];N=c+4|0;g[N>>2]=J*e+ +g[N>>2];N=c+8|0;g[N>>2]=K*e+ +g[N>>2];N=c+12|0;g[N>>2]=e*i+ +g[N>>2];Q=P+4|0;R=O+4|0;S=i}else{Q=P;R=O;S=L}if((a|0)<(d|0)){L=+g[Q>>2];i=+g[R>>2];g[c>>2]=J*L+ +g[c>>2];O=c+4|0;g[O>>2]=K*L+ +g[O>>2];O=c+8|0;g[O>>2]=S*L+ +g[O>>2];O=c+12|0;g[O>>2]=L*i+ +g[O>>2];T=Q+4|0;U=R+4|0;V=i}else{T=Q;U=R;V=M}if((a+1|0)>=(d|0)){return}M=+g[T>>2];i=+g[U>>2];g[c>>2]=K*M+ +g[c>>2];U=c+4|0;g[U>>2]=S*M+ +g[U>>2];U=c+8|0;g[U>>2]=V*M+ +g[U>>2];U=c+12|0;g[U>>2]=M*i+ +g[U>>2];return}function bf(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0.0;j=i;k=a;l=i;i=i+16|0;m=i;i=i+(f*4&-1)|0;i=i+3>>2<<2;n=i;i=i+((f+e|0)*4&-1)|0;i=i+3>>2<<2;o=(f|0)>0;L1598:do{if(o){p=f-1|0;q=0;while(1){g[m+(q<<2)>>2]=+g[b+(p-q<<2)>>2];r=q+1|0;if((r|0)==(f|0)){break}else{q=r}}if(!o){break}q=f-1|0;p=0;while(1){g[n+(p<<2)>>2]=+g[h+(q-p<<2)>>2];r=p+1|0;if((r|0)==(f|0)){break L1598}else{p=r}}}}while(0);if((e|0)>0){b$(n+(f<<2)|0,k,e<<2)}L1610:do{if(o){k=e-1|0;b=0;while(1){g[h+(b<<2)>>2]=+g[a+(k-b<<2)>>2];p=b+1|0;if((p|0)==(f|0)){break L1610}else{b=p}}}}while(0);h=e-3|0;L1615:do{if((h|0)>0){b=l;k=l|0;p=l+4|0;q=l+8|0;r=l+12|0;s=0;while(1){c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;be(m,n+(s<<2)|0,k,f);g[d+(s<<2)>>2]=+g[a+(s<<2)>>2]+ +g[k>>2];t=s|1;g[d+(t<<2)>>2]=+g[a+(t<<2)>>2]+ +g[p>>2];t=s|2;g[d+(t<<2)>>2]=+g[a+(t<<2)>>2]+ +g[q>>2];t=s|3;g[d+(t<<2)>>2]=+g[a+(t<<2)>>2]+ +g[r>>2];t=s+4|0;if((t|0)<(h|0)){s=t}else{u=t;break L1615}}}else{u=0}}while(0);if((u|0)<(e|0)){v=u}else{i=j;return}while(1){L1624:do{if(o){u=0;w=0.0;while(1){x=w+ +g[m+(u<<2)>>2]*+g[n+(u+v<<2)>>2];h=u+1|0;if((h|0)==(f|0)){y=x;break L1624}else{u=h;w=x}}}else{y=0.0}}while(0);g[d+(v<<2)>>2]=y+ +g[a+(v<<2)>>2];u=v+1|0;if((u|0)==(e|0)){break}else{v=u}}i=j;return}function bg(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0,B=0.0,C=0.0,D=0,E=0.0;h=i;i=i+16|0;j=h|0;k=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;l=e+d|0;m=i;i=i+(l*4&-1)|0;i=i+3>>2<<2;n=(e|0)>0;L1630:do{if(n){o=e-1|0;p=0;while(1){g[k+(p<<2)>>2]=+g[b+(o-p<<2)>>2];q=p+1|0;if((q|0)==(e|0)){break}else{p=q}}if(!n){r=0;break}p=e-1|0;o=0;while(1){g[m+(o<<2)>>2]=-0.0- +g[f+(p-o<<2)>>2];q=o+1|0;if((q|0)==(e|0)){r=e;break L1630}else{o=q}}}else{r=0}}while(0);if((r|0)<(l|0)){b_(m+(r<<2)|0,0,l-r<<2|0)}r=d-3|0;L1642:do{if((r|0)>0){l=j|0;o=j+4|0;p=j+8|0;q=j+12|0;s=b+4|0;t=b+8|0;u=0;while(1){g[l>>2]=+g[a+(u<<2)>>2];v=u|1;g[o>>2]=+g[a+(v<<2)>>2];w=u|2;g[p>>2]=+g[a+(w<<2)>>2];x=u|3;g[q>>2]=+g[a+(x<<2)>>2];be(k,m+(u<<2)|0,l,e);y=+g[l>>2];z=-0.0-y;A=u+e|0;g[m+(A<<2)>>2]=z;g[c+(u<<2)>>2]=y;y=+g[o>>2]+ +g[b>>2]*z;g[o>>2]=y;B=-0.0-y;g[m+(A+1<<2)>>2]=B;g[c+(v<<2)>>2]=y;y=+g[p>>2]+ +g[b>>2]*B+ +g[s>>2]*z;g[p>>2]=y;C=-0.0-y;g[m+(A+2<<2)>>2]=C;g[c+(w<<2)>>2]=y;y=+g[q>>2]+ +g[b>>2]*C+ +g[s>>2]*B+ +g[t>>2]*z;g[q>>2]=y;g[m+(A+3<<2)>>2]=-0.0-y;g[c+(x<<2)>>2]=y;x=u+4|0;if((x|0)<(r|0)){u=x}else{D=x;break L1642}}}else{D=0}}while(0);L1647:do{if((D|0)<(d|0)){r=D;while(1){y=+g[a+(r<<2)>>2];L1650:do{if(n){b=0;z=y;while(1){B=z- +g[k+(b<<2)>>2]*+g[m+(b+r<<2)>>2];j=b+1|0;if((j|0)==(e|0)){E=B;break L1650}else{b=j;z=B}}}else{E=y}}while(0);g[m+(r+e<<2)>>2]=E;g[c+(r<<2)>>2]=E;b=r+1|0;if((b|0)==(d|0)){break L1647}else{r=b}}}}while(0);if(!n){i=h;return}n=d-1|0;d=0;while(1){g[f+(d<<2)>>2]=+g[c+(n-d<<2)>>2];m=d+1|0;if((m|0)==(e|0)){break}else{d=m}}i=h;return}function bh(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0.0,n=0,o=0,p=0.0,q=0.0,r=0.0,s=0.0;h=i;j=f-e|0;k=i;i=i+(f*4&-1)|0;i=i+3>>2<<2;if((f|0)>0){b$(k,a,f<<2)}L1665:do{if((d|0)>0){l=0;while(1){m=+g[c+(l<<2)>>2];g[k+(l<<2)>>2]=+g[a+(l<<2)>>2]*m;n=(f-l|0)-1|0;g[k+(n<<2)>>2]=+g[a+(n<<2)>>2]*m;n=l+1|0;if((n|0)==(d|0)){break L1665}else{l=n}}}}while(0);ba(k,k,b,j,e+1|0);if((e|0)>-1){o=e}else{p=+g[b>>2];q=p+10.0;g[b>>2]=q;i=h;return}while(1){e=o+j|0;L1673:do{if((e|0)<(f|0)){d=e;m=0.0;while(1){r=m+ +g[k+(d<<2)>>2]*+g[k+(d-o<<2)>>2];a=d+1|0;if((a|0)==(f|0)){s=r;break L1673}else{d=a;m=r}}}else{s=0.0}}while(0);e=b+(o<<2)|0;g[e>>2]=s+ +g[e>>2];if((o|0)>0){o=o-1|0}else{break}}p=+g[b>>2];q=p+10.0;g[b>>2]=q;i=h;return}function bi(a,b,e,f,h,j,k,l){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0.0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0.0,aa=0.0;m=i;i=i+8|0;n=m|0;o=n;c[o>>2]=0;c[o+4>>2]=0;if((h|0)==0){p=+g[5247740+(l<<2)>>2];q=+g[5257172+(l<<2)>>2]}else{p=0.0;q=.149993896484375}o=j+4|0;r=c[o>>2]<<3;if((b|0)>=(e|0)){i=m;return}s=j+20|0;t=j+28|0;u=a+8|0;a=j+32|0;v=j+40|0;w=j+24|0;x=j|0;y=b;while(1){b=(y|0)<20?y<<1:40;z=5255880+(l*84&-1)+(h*42&-1)+b|0;A=(b|1)+(5255880+(l*84&-1)+(h*42&-1))|0;b=0;while(1){B=c[s>>2]|0;C=c[t>>2]|0;D=(r-B|0)-(am(C|0,1)|-32)|0;do{if((D|0)>14){E=a8(j,(d[z]|0)<<7,(d[A]|0)<<6)|0}else{if((D|0)>1){F=c[a>>2]|0;G=C>>>2;H=-1;I=C;while(1){J=H+1|0;K=X(d[J+5243412|0]|0,G);if(F>>>0<K>>>0){H=J;I=K}else{break}}H=F-K|0;c[a>>2]=H;G=I-K|0;c[t>>2]=G;L1697:do{if(G>>>0<8388609){L=c[o>>2]|0;M=B;N=G;O=c[v>>2]|0;P=c[w>>2]|0;Q=H;while(1){R=M+8|0;c[s>>2]=R;S=N<<8;c[t>>2]=S;if(P>>>0<L>>>0){T=P+1|0;c[w>>2]=T;U=d[(c[x>>2]|0)+P|0]|0;V=T}else{U=0;V=P}c[v>>2]=U;T=((U|O<<8)>>>1&255|Q<<8&2147483392)^255;c[a>>2]=T;if(S>>>0<8388609){M=R;N=S;O=U;P=V;Q=T}else{break L1697}}}}while(0);E=J>>1^-(J&1);break}if((D|0)<=0){E=-1;break}H=c[a>>2]|0;G=C>>>1;I=H>>>0<G>>>0;F=I&1;if(I){W=G;Y=H}else{I=H-G|0;c[a>>2]=I;W=C-G|0;Y=I}c[t>>2]=W;L1710:do{if(W>>>0<8388609){I=c[o>>2]|0;G=B;H=W;Q=c[v>>2]|0;P=c[w>>2]|0;O=Y;while(1){N=G+8|0;c[s>>2]=N;M=H<<8;c[t>>2]=M;if(P>>>0<I>>>0){L=P+1|0;c[w>>2]=L;Z=d[(c[x>>2]|0)+P|0]|0;_=L}else{Z=0;_=P}c[v>>2]=Z;L=((Z|Q<<8)>>>1&255|O<<8&2147483392)^255;c[a>>2]=L;if(M>>>0<8388609){G=N;H=M;Q=Z;P=_;O=L}else{break L1710}}}}while(0);E=-F|0}}while(0);$=+(E|0);B=f+(X(c[u>>2]|0,b)+y<<2)|0;aa=+g[B>>2];g[B>>2]=aa<-9.0?-9.0:aa;B=f+(X(c[u>>2]|0,b)+y<<2)|0;C=n+(b<<2)|0;aa=+g[C>>2];g[B>>2]=$+(p*+g[B>>2]+aa);g[C>>2]=$+aa-q*$;C=b+1|0;if((C|0)<(k|0)){b=C}else{break}}b=y+1|0;if((b|0)==(e|0)){break}else{y=b}}i=m;return}function bj(a,b,e,f,h,i,j){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0.0;if((b|0)>=(e|0)){return}k=i+12|0;l=i+16|0;m=i+8|0;n=i+4|0;o=i|0;p=i+20|0;i=a+8|0;a=b;while(1){b=h+(a<<2)|0;q=c[b>>2]|0;L1727:do{if((q|0)>=1){r=0;s=q;while(1){t=c[k>>2]|0;u=c[l>>2]|0;if(u>>>0<s>>>0){v=u+8|0;w=((v|0)>25?u+7|0:24)-u|0;x=c[n>>2]|0;y=t;z=u;A=c[m>>2]|0;while(1){if(A>>>0<x>>>0){B=A+1|0;c[m>>2]=B;C=d[(c[o>>2]|0)+(x-B|0)|0]|0;D=B}else{C=0;D=A}E=C<<z|y;B=z+8|0;if((B|0)<25){y=E;z=B;A=D}else{break}}F=E;G=v+(w&-8)|0}else{F=t;G=u}c[k>>2]=F>>>(s>>>0);c[l>>2]=G-s|0;c[p>>2]=(c[p>>2]|0)+s|0;H=(+(F&(1<<s)-1|0)+.5)*+(1<<14-(c[b>>2]|0)|0)*6103515625.0e-14+-.5;A=f+(X(c[i>>2]|0,r)+a<<2)|0;g[A>>2]=+g[A>>2]+H;A=r+1|0;if((A|0)>=(j|0)){break L1727}r=A;s=c[b>>2]|0}}}while(0);b=a+1|0;if((b|0)==(e|0)){break}else{a=b}}return}function bk(a,b,e,f,h,i,j,k,l){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0;m=(b|0)>=(e|0);n=k+12|0;o=k+16|0;p=k+8|0;q=k+4|0;r=k|0;s=k+20|0;k=a+8|0;a=(l|0)>1?-l|0:-1;t=0;u=j;while(1){L1745:do{if(m|(u|0)<(l|0)){v=u}else{j=b;w=u;while(1){x=h+(j<<2)|0;do{if((c[x>>2]|0)>7){y=w}else{if((c[i+(j<<2)>>2]|0)==(t|0)){z=0}else{y=w;break}while(1){A=c[n>>2]|0;B=c[o>>2]|0;if((B|0)==0){C=c[p>>2]|0;D=c[q>>2]|0;if(C>>>0<D>>>0){E=C+1|0;c[p>>2]=E;F=d[(c[r>>2]|0)+(D-E|0)|0]|0;G=E}else{F=0;G=C}if(G>>>0<D>>>0){C=G+1|0;c[p>>2]=C;H=(d[(c[r>>2]|0)+(D-C|0)|0]|0)<<8;I=C}else{H=0;I=G}if(I>>>0<D>>>0){C=I+1|0;c[p>>2]=C;J=(d[(c[r>>2]|0)+(D-C|0)|0]|0)<<16;K=C}else{J=0;K=I}if(K>>>0<D>>>0){C=K+1|0;c[p>>2]=C;L=(d[(c[r>>2]|0)+(D-C|0)|0]|0)<<24}else{L=0}M=L|(J|(H|(F|A)));N=32}else{M=A;N=B}c[n>>2]=M>>>1;c[o>>2]=N-1|0;c[s>>2]=(c[s>>2]|0)+1|0;O=(+(M&1|0)+-.5)*+(1<<13-(c[x>>2]|0)|0)*6103515625.0e-14;B=f+(X(c[k>>2]|0,z)+j<<2)|0;g[B>>2]=+g[B>>2]+O;B=z+1|0;if((B|0)<(l|0)){z=B}else{break}}y=a+w|0}}while(0);x=j+1|0;if((x|0)>=(e|0)|(y|0)<(l|0)){v=y;break L1745}else{j=x;w=y}}}}while(0);w=t+1|0;if((w|0)==2){break}else{t=w;u=v}}return}function bl(a,e,f,g,h,j,k,l,m,n,o,p,q,r,s,t,u,v,w){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;u=u|0;v=v|0;w=w|0;var x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0;x=i;y=(m|0)>0?m:0;m=c[a+8>>2]|0;z=(y|0)>7?8:0;A=y-z|0;y=(r|0)==2;do{if(y){B=d[5257900+(f-e|0)|0]|0;if((B|0)>(A|0)){C=A;D=0;E=0;break}F=A-B|0;G=(F|0)>7?8:0;C=F-G|0;D=G;E=B}else{C=A;D=0;E=0}}while(0);A=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;B=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;G=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;F=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;H=(e|0)<(f|0);L1776:do{if(H){I=r<<3;J=a+32|0;K=c[J>>2]|0;L=f-1|0;M=X((j-5|0)-s|0,r);N=s+3|0;O=e;P=b[K+(e<<1)>>1]|0;while(1){Q=O+1|0;R=b[K+(Q<<1)>>1]|0;S=(R<<16>>16)-(P<<16>>16)|0;T=(S*3&-1)<<s<<3>>4;c[G+(O<<2)>>2]=(I|0)>(T|0)?I:T;c[F+(O<<2)>>2]=(X(X(M,L-O|0),S)<<N>>6)-((S<<s|0)==1?I:0)|0;if((Q|0)==(f|0)){U=J;V=I;break L1776}else{O=Q;P=R}}}else{U=a+32|0;V=r<<3}}while(0);j=c[a+48>>2]|0;P=a+52|0;O=1;I=j-1|0;while(1){J=O+I>>1;L1784:do{if(H){N=c[U>>2]|0;L=X(J,m);M=c[P>>2]|0;K=1;R=0;Q=f;S=b[N+(f<<1)>>1]|0;while(1){T=R;W=Q;Y=S;while(1){Z=W-1|0;_=b[N+(Z<<1)>>1]|0;$=X((Y<<16>>16)-(_<<16>>16)|0,r);aa=X($,d[M+(Z+L|0)|0]|0)<<s>>2;if((aa|0)>0){$=(c[F+(Z<<2)>>2]|0)+aa|0;ab=($|0)<0?0:$}else{ab=aa}ac=(c[g+(Z<<2)>>2]|0)+ab|0;if(!((ac|0)<(c[G+(Z<<2)>>2]|0)&K)){break}aa=((ac|0)<(V|0)?0:V)+T|0;if((Z|0)>(e|0)){T=aa;W=Z;Y=_}else{ad=aa;break L1784}}Y=c[h+(Z<<2)>>2]|0;W=((ac|0)<(Y|0)?ac:Y)+T|0;if((Z|0)>(e|0)){K=0;R=W;Q=Z;S=_}else{ad=W;break L1784}}}else{ad=0}}while(0);S=(ad|0)>(C|0);Q=S?J-1|0:I;ae=S?O:J+1|0;if((ae|0)>(Q|0)){break}else{O=ae;I=Q}}I=ae-1|0;L1797:do{if(H){O=c[U>>2]|0;ad=X(I,m);_=c[P>>2]|0;Z=(ae|0)<(j|0);ac=X(ae,m);ab=(I|0)>0;Q=e;S=e;R=b[O+(e<<1)>>1]|0;while(1){K=S+1|0;L=b[O+(K<<1)>>1]|0;M=X((L<<16>>16)-(R<<16>>16)|0,r);N=X(M,d[_+(S+ad|0)|0]|0)<<s>>2;if(Z){af=X(d[_+(S+ac|0)|0]|0,M)<<s>>2}else{af=c[h+(S<<2)>>2]|0}if((N|0)>0){M=(c[F+(S<<2)>>2]|0)+N|0;ag=(M|0)<0?0:M}else{ag=N}if((af|0)>0){N=(c[F+(S<<2)>>2]|0)+af|0;ah=(N|0)<0?0:N}else{ah=af}N=c[g+(S<<2)>>2]|0;M=ag+(ab?N:0)|0;W=(N|0)>0?S:Q;Y=(ah-M|0)+N|0;c[A+(S<<2)>>2]=M;c[B+(S<<2)>>2]=(Y|0)<0?0:Y;if((K|0)==(f|0)){ai=W;break L1797}else{Q=W;S=K;R=L}}}else{ai=e}}while(0);ah=(r|0)>1;ag=0;g=64;af=0;while(1){F=g+af>>1;L1814:do{if(H){I=1;m=0;ae=f;while(1){j=m;P=ae;while(1){aj=P-1|0;R=c[A+(aj<<2)>>2]|0;ak=(X(c[B+(aj<<2)>>2]|0,F)>>6)+R|0;if(!((ak|0)<(c[G+(aj<<2)>>2]|0)&I)){break}R=((ak|0)<(V|0)?0:V)+j|0;if((aj|0)>(e|0)){j=R;P=aj}else{al=R;break L1814}}P=c[h+(aj<<2)>>2]|0;T=((ak|0)<(P|0)?ak:P)+j|0;if((aj|0)>(e|0)){I=0;m=T;ae=aj}else{al=T;break L1814}}}else{al=0}}while(0);ae=(al|0)>(C|0);am=ae?af:F;m=ag+1|0;if((m|0)==6){break}else{ag=m;g=ae?F:g;af=am}}af=ah&1;g=s<<3;L1823:do{if(H){ag=0;al=0;aj=f;while(1){ak=aj-1|0;ae=c[A+(ak<<2)>>2]|0;m=(X(c[B+(ak<<2)>>2]|0,am)>>6)+ae|0;if((m|0)<(c[G+(ak<<2)>>2]|0)&(ag|0)==0){an=(m|0)<(V|0)?0:V;ao=0}else{an=m;ao=1}m=c[h+(ak<<2)>>2]|0;ae=(an|0)<(m|0)?an:m;c[o+(ak<<2)>>2]=ae;m=ae+al|0;if((ak|0)>(e|0)){ag=ao;al=m;aj=ak}else{ap=m;break L1823}}}else{ap=0}}while(0);ao=f-1|0;L1830:do{if((ao|0)>(ai|0)){an=V+8|0;am=(u|0)==0;B=t+28|0;A=t+32|0;H=t+20|0;aj=t+40|0;al=t+24|0;ag=t+4|0;F=t|0;m=e+2|0;ak=f;ae=ap;I=E;T=ao;while(1){P=C-ae|0;R=c[U>>2]|0;S=b[R+(ak<<1)>>1]<<16>>16;Q=b[R+(e<<1)>>1]<<16>>16;ab=S-Q|0;ac=(P|0)/(ab|0)&-1;_=P-X(ab,ac)|0;ab=b[R+(T<<1)>>1]<<16>>16;R=_+(Q-ab|0)|0;Q=S-ab|0;ab=o+(T<<2)|0;S=c[ab>>2]|0;_=(X(Q,ac)+S|0)+((R|0)>0?R:0)|0;R=c[G+(T<<2)>>2]|0;if((_|0)<(((R|0)>(an|0)?R:an)|0)){aq=ae;ar=_;as=S}else{if(am){S=c[B>>2]|0;R=c[A>>2]|0;ac=S>>>1;P=R>>>0<ac>>>0;if(P){at=ac;au=R}else{Z=R-ac|0;c[A>>2]=Z;at=S-ac|0;au=Z}c[B>>2]=at;L1844:do{if(at>>>0<8388609){Z=c[ag>>2]|0;ac=c[H>>2]|0;S=at;R=c[aj>>2]|0;ad=c[al>>2]|0;O=au;while(1){J=ac+8|0;c[H>>2]=J;L=S<<8;c[B>>2]=L;if(ad>>>0<Z>>>0){K=ad+1|0;c[al>>2]=K;av=d[(c[F>>2]|0)+ad|0]|0;aw=K}else{av=0;aw=ad}c[aj>>2]=av;K=((av|R<<8)>>>1&255|O<<8&2147483392)^255;c[A>>2]=K;if(L>>>0<8388609){ac=J;S=L;R=av;ad=aw;O=K}else{break L1844}}}}while(0);if(P){ax=C;ay=ak;az=ae;aA=I;break L1830}}else{if((ak|0)<=(m|0)){break}if(!((_|0)<=(X(Q,(T|0)<(v|0)?7:9)<<s<<3>>4|0)|(T|0)>(w|0))){break}a2(t,0,1)}aq=ae+8|0;ar=_-8|0;as=c[ab>>2]|0}if((I|0)>0){aB=d[5257900+(T-e|0)|0]|0}else{aB=I}O=(ar|0)<(V|0)?0:V;ad=((aq-(as+I|0)|0)+O|0)+aB|0;c[ab>>2]=O;O=T-1|0;if((O|0)>(ai|0)){ak=T;ae=ad;I=aB;T=O}else{aC=T;aD=ad;aE=aB;aF=1238;break L1830}}a2(t,1,1);ax=C;ay=ak;az=ae;aA=I;break}else{aC=f;aD=ap;aE=E;aF=1238}}while(0);if((aF|0)==1238){ax=C+z|0;ay=aC;az=aD;aA=aE}do{if((aA|0)>0){if((u|0)==0){aE=(a6(t,(1-e|0)+ay|0)|0)+e|0;c[k>>2]=aE;aG=aE;break}else{aE=c[k>>2]|0;aD=(aE|0)<(ay|0)?aE:ay;c[k>>2]=aD;a9(t,aD-e|0,(1-e|0)+ay|0);aG=c[k>>2]|0;break}}else{c[k>>2]=0;aG=0}}while(0);aA=(aG|0)>(e|0);aG=aA?0:D;do{if(aA&(D|0)!=0){if((u|0)!=0){a2(t,c[l>>2]|0,1);break}aD=t+28|0;aE=c[aD>>2]|0;aC=t+32|0;z=c[aC>>2]|0;C=aE>>>1;aF=z>>>0<C>>>0;E=aF&1;if(aF){aH=C;aI=z}else{aF=z-C|0;c[aC>>2]=aF;aH=aE-C|0;aI=aF}c[aD>>2]=aH;L1877:do{if(aH>>>0<8388609){aF=t+20|0;C=t+40|0;aE=t+24|0;z=t|0;ap=c[t+4>>2]|0;aB=c[aF>>2]|0;ai=aH;as=c[C>>2]|0;aq=c[aE>>2]|0;ar=aI;while(1){w=aB+8|0;c[aF>>2]=w;v=ai<<8;c[aD>>2]=v;if(aq>>>0<ap>>>0){aw=aq+1|0;c[aE>>2]=aw;aJ=d[(c[z>>2]|0)+aq|0]|0;aK=aw}else{aJ=0;aK=aq}c[C>>2]=aJ;aw=((aJ|as<<8)>>>1&255|ar<<8&2147483392)^255;c[aC>>2]=aw;if(v>>>0<8388609){aB=w;ai=v;as=aJ;aq=aK;ar=aw}else{break L1877}}}}while(0);c[l>>2]=E}else{c[l>>2]=0}}while(0);aK=aG+(ax-az|0)|0;az=c[U>>2]|0;ax=b[az+(e<<1)>>1]<<16>>16;aG=(b[az+(ay<<1)>>1]<<16>>16)-ax|0;aJ=(aK|0)/(aG|0)&-1;aI=aK-X(aG,aJ)|0;L1886:do{if((ay|0)>(e|0)){aG=e+1|0;aK=X((b[az+(aG<<1)>>1]<<16>>16)-ax|0,aJ);aH=o+(e<<2)|0;c[aH>>2]=aK+(c[aH>>2]|0)|0;L1888:do{if((aG|0)==(ay|0)){aL=aI;aM=e}else{aH=aG;while(1){aK=c[U>>2]|0;t=aH+1|0;u=X((b[aK+(t<<1)>>1]<<16>>16)-(b[aK+(aH<<1)>>1]<<16>>16)|0,aJ);aK=o+(aH<<2)|0;c[aK>>2]=u+(c[aK>>2]|0)|0;if((t|0)==(ay|0)){aL=aI;aM=e;break L1888}else{aH=t}}}}while(0);while(1){aG=aM+1|0;E=c[U>>2]|0;aH=(b[E+(aG<<1)>>1]<<16>>16)-(b[E+(aM<<1)>>1]<<16>>16)|0;E=(aL|0)<(aH|0)?aL:aH;aH=o+(aM<<2)|0;c[aH>>2]=E+(c[aH>>2]|0)|0;if((aG|0)==(ay|0)){break}aL=aL-E|0;aM=aG}aG=a+56|0;E=ah?4:3;aH=0;t=e;while(1){aK=t+1|0;u=c[U>>2]|0;D=(b[u+(aK<<1)>>1]<<16>>16)-(b[u+(t<<1)>>1]<<16>>16)<<s;u=o+(t<<2)|0;aA=(c[u>>2]|0)+aH|0;if((D|0)>1){aC=aA-(c[h+(t<<2)>>2]|0)|0;aD=(aC|0)>0?aC:0;aC=aA-aD|0;c[u>>2]=aC;I=X(D,r);do{if(y&(D|0)>2){if((c[l>>2]|0)!=0){aN=0;break}aN=(t|0)<(c[k>>2]|0)}else{aN=0}}while(0);ae=(aN&1)+I|0;ak=X((b[(c[aG>>2]|0)+(t<<1)>>1]<<16>>16)+g|0,ae);ar=(ak>>1)+(ae*-21&-1)|0;if((D|0)==2){aO=ar+(ae<<3>>2)|0}else{aO=ar}ar=aO+aC|0;do{if((ar|0)<(ae<<4|0)){aP=aO+(ak>>2)|0}else{if((ar|0)>=(ae*24&-1|0)){aP=aO;break}aP=aO+(ak>>3)|0}}while(0);ak=ae<<3;ar=(((ae<<2)+aC|0)+aP|0)/(ak|0)&-1;D=(ar|0)<0?0:ar;ar=p+(t<<2)|0;c[ar>>2]=D;I=X(D,r);aq=c[u>>2]|0;if((I|0)>(aq>>3|0)){I=aq>>af>>3;c[ar>>2]=I;aQ=I}else{aQ=D}D=(aQ|0)<8?aQ:8;c[ar>>2]=D;I=X(D,ak);c[q+(t<<2)>>2]=(I|0)>=((c[u>>2]|0)+aP|0)&1;I=X(c[ar>>2]|0,V);c[u>>2]=(c[u>>2]|0)-I|0;aR=aD}else{I=aA-V|0;ar=(I|0)<0?0:I;c[u>>2]=aA-ar|0;c[p+(t<<2)>>2]=0;c[q+(t<<2)>>2]=1;aR=ar}if((aR|0)>0){ar=aR>>E;I=p+(t<<2)|0;ak=c[I>>2]|0;D=8-ak|0;aq=(ar|0)<(D|0)?ar:D;c[I>>2]=aq+ak|0;ak=X(aq,V);c[q+(t<<2)>>2]=(ak|0)>=(aR-aH|0)&1;aS=aR-ak|0}else{aS=aR}if((aK|0)==(ay|0)){aT=aS;aU=ay;break L1886}else{aH=aS;t=aK}}}else{aT=0;aU=e}}while(0);c[n>>2]=aT;if((aU|0)<(f|0)){aV=aU}else{i=x;return ay|0}while(1){aU=o+(aV<<2)|0;aT=p+(aV<<2)|0;c[aT>>2]=c[aU>>2]>>af>>3;c[aU>>2]=0;c[q+(aV<<2)>>2]=(c[aT>>2]|0)<1&1;aT=aV+1|0;if((aT|0)==(f|0)){break}else{aV=aT}}i=x;return ay|0}function bm(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0,G=0,H=0,I=0;j=i;k=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;l=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;m=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;bn(a,b,1,f,d,e);e=(b|0)>1?b<<2:4;b_(l|0,0,e|0);b_(k|0,0,e|0);e=0;while(1){n=a+(e<<2)|0;o=+g[n>>2];p=m+(e<<2)|0;if(o>0.0){g[p>>2]=1.0}else{g[p>>2]=-1.0;g[n>>2]=-0.0-o}n=e+1|0;if((n|0)<(b|0)){e=n}else{break}}L1933:do{if((b>>1|0)<(d|0)){e=0;o=0.0;while(1){q=o+ +g[a+(e<<2)>>2];n=e+1|0;if((n|0)<(b|0)){e=n;o=q}else{break}}if(q>1.0000000036274937e-15&q<64.0){r=q}else{g[a>>2]=1.0;b_(a+4|0,0,((b|0)>2?(b<<2)-4|0:4)|0);r=1.0}o=+(d-1|0)*(1.0/r);e=0;n=d;s=0.0;t=0.0;while(1){u=+g[a+(e<<2)>>2];p=~~+J(o*u);c[l+(e<<2)>>2]=p;v=+(p|0);w=t+v*v;x=s+u*v;g[k+(e<<2)>>2]=v*2.0;y=n-p|0;p=e+1|0;if((p|0)<(b|0)){e=p;n=y;s=x;t=w}else{z=y;A=x;B=w;break L1933}}}else{z=d;A=0.0;B=0.0}}while(0);L1943:do{if((z|0)>(b+3|0)){c[l>>2]=(c[l>>2]|0)+z|0;C=0;break}else{if((z|0)>0){D=B;E=A;F=0}else{C=0;break}while(1){r=D+1.0;n=0;q=0.0;t=-999999986991104.0;e=0;while(1){s=E+ +g[a+(n<<2)>>2];o=r+ +g[k+(n<<2)>>2];w=s*s;y=q*w>t*o;G=y?n:e;p=n+1|0;if((p|0)>=(b|0)){break}n=p;q=y?o:q;t=y?w:t;e=G}t=E+ +g[a+(G<<2)>>2];e=k+(G<<2)|0;q=+g[e>>2];g[e>>2]=q+2.0;e=l+(G<<2)|0;c[e>>2]=(c[e>>2]|0)+1|0;e=F+1|0;if((e|0)==(z|0)){C=0;break L1943}else{D=r+q;E=t;F=e}}}}while(0);while(1){E=+g[m+(C<<2)>>2];F=a+(C<<2)|0;g[F>>2]=E*+g[F>>2];if(E<0.0){F=l+(C<<2)|0;c[F>>2]=-(c[F>>2]|0)|0}F=C+1|0;if((F|0)<(b|0)){C=F}else{break}}a4(l,b,d,h);if((f|0)<2){H=1;i=j;return H|0}h=(b|0)/(f|0)&-1;b=0;d=0;while(1){C=X(b,h);a=0;m=d;while(1){I=((c[l+(a+C<<2)>>2]|0)!=0&1)<<b|m;F=a+1|0;if((F|0)<(h|0)){a=F;m=I}else{break}}m=b+1|0;if((m|0)==(f|0)){H=I;break}else{b=m;d=I}}i=j;return H|0}function bn(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0.0,j=0.0,k=0.0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0.0,z=0,A=0.0,B=0.0,C=0,D=0;if((f<<1|0)>=(b|0)|(h|0)==0){return}i=+(b|0)/+(X(c[5255824+(h-1<<2)>>2]|0,f)+b|0);j=i*i*.5;i=+N(j*1.5707963705062866);k=+N((1.0-j)*1.5707963705062866);L1971:do{if((e<<3|0)>(b|0)){l=0}else{f=e>>2;h=1;while(1){if((X(X(h,h)+h|0,e)+f|0)<(b|0)){h=h+1|0}else{l=h;break L1971}}}}while(0);h=(b|0)/(e|0)&-1;if((e|0)<=0){return}b=(d|0)<0;d=(l|0)==0;f=h-1|0;m=(f|0)>0;n=h-3|0;o=(h-2|0)>0;p=h-l|0;q=(p|0)>0;r=h-(l<<1)|0;s=r-1|0;t=(r|0)>0;j=-0.0-k;u=-0.0-i;r=0;while(1){v=X(r,h);L1981:do{if(b){L1983:do{if(!d){L1985:do{if(q){w=a+(v<<2)|0;x=0;while(1){y=+g[w>>2];z=w+(l<<2)|0;A=+g[z>>2];g[z>>2]=i*y+k*A;g[w>>2]=k*y-i*A;z=x+1|0;if((z|0)==(p|0)){break L1985}else{w=w+4|0;x=z}}}}while(0);if(!t){break}x=a+(v+s<<2)|0;w=s;while(1){A=+g[x>>2];z=x+(l<<2)|0;y=+g[z>>2];g[z>>2]=i*A+k*y;g[x>>2]=k*A-i*y;if((w|0)>0){x=x-4|0;w=w-1|0}else{break L1983}}}}while(0);L1994:do{if(m){w=a+(v<<2)|0;x=w;z=0;y=+g[w>>2];while(1){w=x+4|0;A=+g[w>>2];B=k*y+i*A;g[w>>2]=B;g[x>>2]=i*y-k*A;C=z+1|0;if((C|0)==(f|0)){break L1994}else{x=w;z=C;y=B}}}}while(0);if(!o){break}z=a+(v+n<<2)|0;x=n;while(1){y=+g[z>>2];C=z+4|0;B=+g[C>>2];g[C>>2]=k*y+i*B;g[z>>2]=i*y-k*B;if((x|0)>0){z=z-4|0;x=x-1|0}else{break L1981}}}else{x=a+(v<<2)|0;L2003:do{if(m){z=x;C=0;B=+g[x>>2];while(1){w=z+4|0;y=+g[w>>2];A=B*j+i*y;g[w>>2]=A;g[z>>2]=i*B-y*j;D=C+1|0;if((D|0)==(f|0)){break L2003}else{z=w;C=D;B=A}}}}while(0);L2008:do{if(o){C=a+(v+n<<2)|0;z=n;while(1){B=+g[C>>2];D=C+4|0;A=+g[D>>2];g[D>>2]=B*j+i*A;g[C>>2]=i*B-A*j;if((z|0)>0){C=C-4|0;z=z-1|0}else{break L2008}}}}while(0);if(d){break}L2014:do{if(q){z=x;C=0;while(1){A=+g[z>>2];D=z+(l<<2)|0;B=+g[D>>2];g[D>>2]=A*u+k*B;g[z>>2]=k*A-B*u;D=C+1|0;if((D|0)==(p|0)){break L2014}else{z=z+4|0;C=D}}}}while(0);if(!t){break}x=a+(v+s<<2)|0;C=s;while(1){B=+g[x>>2];z=x+(l<<2)|0;A=+g[z>>2];g[z>>2]=B*u+k*A;g[x>>2]=k*B-A*u;if((C|0)>0){x=x-4|0;C=C-1|0}else{break L1981}}}}while(0);v=r+1|0;if((v|0)==(e|0)){break}else{r=v}}return}function bo(a,b,d,e,f,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=+j;var k=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0;k=i;l=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;a5(l,b,d,h);h=0;m=0.0;while(1){n=+(c[l+(h<<2)>>2]|0);o=m+n*n;p=h+1|0;if((p|0)<(b|0)){h=p;m=o}else{break}}m=1.0/+L(o)*j;h=0;while(1){g[a+(h<<2)>>2]=m*+(c[l+(h<<2)>>2]|0);p=h+1|0;if((p|0)<(b|0)){h=p}else{break}}bn(a,b,-1,f,d,e);if((f|0)<2){q=1;i=k;return q|0}e=(b|0)/(f|0)&-1;b=0;d=0;while(1){a=X(b,e);h=0;p=d;while(1){r=((c[l+(h+a<<2)>>2]|0)!=0&1)<<b|p;s=h+1|0;if((s|0)<(e|0)){h=s;p=r}else{break}}p=b+1|0;if((p|0)==(f|0)){q=r;break}else{b=p;d=r}}i=k;return q|0}function bp(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;k=i;i=i+4|0;l=k|0;a[l+1|0]=0;m=((g<<1)+h<<16>>16)*7&-1;h=f+8>>4;if((h|0)<=0){i=k;return}f=l|0;g=b+28|0;n=b+32|0;o=b+20|0;p=b+40|0;q=b+24|0;r=b+4|0;s=b|0;b=0;t=e;while(1){e=c[j+(b<<2)>>2]|0;L2045:do{if((e|0)>0){u=e&31;a[f]=a[5243520+((u>>>0<6?u:6)+m|0)|0]|0;u=0;while(1){v=t+(u<<2)|0;if((c[v>>2]|0)>0){w=c[g>>2]|0;x=c[n>>2]|0;y=w>>>8;z=0;A=w;while(1){B=X(d[l+z|0]|0,y);if(x>>>0>=B>>>0){break}z=z+1|0;A=B}y=x-B|0;c[n>>2]=y;w=A-B|0;c[g>>2]=w;L2055:do{if(w>>>0<8388609){C=c[r>>2]|0;D=c[o>>2]|0;E=w;F=c[p>>2]|0;G=c[q>>2]|0;H=y;while(1){I=D+8|0;c[o>>2]=I;J=E<<8;c[g>>2]=J;if(G>>>0<C>>>0){K=G+1|0;c[q>>2]=K;L=d[(c[s>>2]|0)+G|0]|0;M=K}else{L=0;M=G}c[p>>2]=L;K=((L|F<<8)>>>1&255|H<<8&2147483392)^255;c[n>>2]=K;if(J>>>0<8388609){D=I;E=J;F=L;G=M;H=K}else{break L2055}}}}while(0);c[v>>2]=X(c[v>>2]|0,(z<<1)-1|0)}y=u+1|0;if((y|0)==16){break L2045}else{u=y}}}}while(0);e=b+1|0;if((e|0)==(h|0)){break}else{b=e;t=t+64|0}}i=k;return}function bq(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,al=0;g=i;i=i+32|0;h=g|0;j=a+2772|0;k=a+2316|0;l=c[k>>2]|0;m=a+4156|0;if((l|0)!=(c[m>>2]|0)){n=a+2340|0;o=c[n>>2]|0;p=32767/(o+1|0)&-1;if((o|0)>0){o=0;q=0;while(1){r=q+p|0;b[a+4052+(o<<1)>>1]=r&65535;s=o+1|0;if((s|0)<(c[n>>2]|0)){o=s;q=r}else{break}}t=c[k>>2]|0}else{t=l}c[a+4148>>2]=0;c[a+4152>>2]=3176576;c[m>>2]=t}t=a+4160|0;do{if((c[t>>2]|0)==0){if((c[a+4164>>2]|0)==0){m=a+2340|0;L2079:do{if((c[m>>2]|0)>0){l=0;while(1){k=a+4052+(l<<1)|0;q=b[k>>1]<<16>>16;o=(b[a+2344+(l<<1)>>1]<<16>>16)-q|0;b[k>>1]=(((o>>16)*16348&-1)+q|0)+(((o&65535)*16348&-1)>>>16)&65535;o=l+1|0;if((o|0)<(c[m>>2]|0)){l=o}else{break L2079}}}}while(0);m=a+2324|0;l=c[m>>2]|0;L2083:do{if((l|0)>0){o=0;q=0;k=0;while(1){n=c[d+16+(k<<2)>>2]|0;p=(n|0)>(o|0);r=p?k:q;s=k+1|0;if((s|0)<(l|0)){o=p?n:o;q=r;k=s}else{u=r;break L2083}}}else{u=0}}while(0);k=a+2332|0;q=c[k>>2]|0;o=j;b0(a+2772+(q<<2)|0,o,X((l<<2)-4|0,q));q=c[k>>2]|0;b$(o,a+4+(X(q,u)<<2)|0,q<<2);q=c[m>>2]|0;L2087:do{if((q|0)>0){o=a+4148|0;k=0;r=c[o>>2]|0;while(1){s=(c[d+16+(k<<2)>>2]|0)-r|0;n=(((s>>16)*4634&-1)+r|0)+(((s&65535)*4634&-1)>>>16)|0;c[o>>2]=n;s=k+1|0;if((s|0)<(q|0)){k=s;r=n}else{break L2087}}}}while(0);if((c[t>>2]|0)!=0){break}}b_(a+4084|0,0,c[a+2340>>2]<<2|0);i=g;return}}while(0);t=ao()|0;d=i;i=i+((f+16|0)*4&-1)|0;i=i+3>>2<<2;u=c[a+4148>>2]|0;j=255;while(1){if((j|0)>(f|0)){j=j>>1}else{break}}q=a+4152|0;m=c[q>>2]|0;l=(f|0)>0;L2098:do{if(l){r=u>>>4<<16>>16;k=(u>>19)+1>>1;o=0;n=m;while(1){s=X(n,196314165)+907633515|0;p=c[a+2772+((s>>24&j)<<2)>>2]|0;v=X(p>>16,r);w=X(p&65535,r)>>16;x=(v+X(p,k)|0)+w|0;do{if((x|0)>32767){y=32767}else{if((x|0)<-32768){y=-32768;break}y=x<<16>>16}}while(0);c[d+(o+16<<2)>>2]=y;x=o+1|0;if((x|0)==(f|0)){z=s;break L2098}else{o=x;n=s}}}else{z=m}}while(0);c[q>>2]=z;z=h|0;q=a+2340|0;bJ(z,a+4052|0,c[q>>2]|0);m=a+4084|0;b$(d,m,64);L2107:do{if(l){a=b[z>>1]<<16>>16;y=b[h+2>>1]<<16>>16;j=b[h+4>>1]<<16>>16;u=b[h+6>>1]<<16>>16;n=b[h+8>>1]<<16>>16;o=b[h+10>>1]<<16>>16;k=b[h+12>>1]<<16>>16;r=b[h+14>>1]<<16>>16;x=b[h+16>>1]<<16>>16;w=b[h+18>>1]<<16>>16;p=b[h+20>>1]<<16>>16;v=b[h+22>>1]<<16>>16;A=b[h+24>>1]<<16>>16;B=b[h+26>>1]<<16>>16;C=b[h+28>>1]<<16>>16;D=b[h+30>>1]<<16>>16;E=0;F=c[d+60>>2]|0;G=c[d+52>>2]|0;H=c[d+44>>2]|0;I=c[d+36>>2]|0;J=c[d+28>>2]|0;while(1){K=c[q>>2]|0;L=X(a,F>>16);M=X(a,F&65535)>>16;N=c[d+(E+14<<2)>>2]|0;O=X(y,N>>16);P=X(y,N&65535)>>16;Q=X(j,G>>16);R=X(j,G&65535)>>16;S=c[d+(E+12<<2)>>2]|0;T=X(u,S>>16);U=X(u,S&65535)>>16;V=X(n,H>>16);W=X(n,H&65535)>>16;Y=c[d+(E+10<<2)>>2]|0;Z=X(o,Y>>16);_=X(o,Y&65535)>>16;$=X(k,I>>16);aa=X(k,I&65535)>>16;ab=c[d+(E+8<<2)>>2]|0;ac=X(r,ab>>16);ad=X(r,ab&65535)>>16;ae=X(x,J>>16);af=X(x,J&65535)>>16;ag=c[d+(E+6<<2)>>2]|0;ah=X(w,ag>>16);ai=(((((((((((((((((((L+(K>>1)|0)+M|0)+O|0)+P|0)+Q|0)+R|0)+T|0)+U|0)+V|0)+W|0)+Z|0)+_|0)+$|0)+aa|0)+ac|0)+ad|0)+ae|0)+af|0)+ah|0)+(X(w,ag&65535)>>16)|0;if((K|0)==16){K=c[d+(E+5<<2)>>2]|0;ag=X(p,K>>16);ah=X(p,K&65535)>>16;K=c[d+(E+4<<2)>>2]|0;af=X(v,K>>16);ae=X(v,K&65535)>>16;K=c[d+(E+3<<2)>>2]|0;ad=X(A,K>>16);ac=X(A,K&65535)>>16;K=c[d+(E+2<<2)>>2]|0;aa=X(B,K>>16);$=X(B,K&65535)>>16;K=c[d+(E+1<<2)>>2]|0;_=X(C,K>>16);Z=X(C,K&65535)>>16;K=c[d+(E<<2)>>2]|0;W=X(D,K>>16);aj=(((((((((((ag+ai|0)+ah|0)+af|0)+ae|0)+ad|0)+ac|0)+aa|0)+$|0)+_|0)+Z|0)+W|0)+(X(D,K&65535)>>16)|0}else{aj=ai}ai=d+(E+16<<2)|0;K=(c[ai>>2]|0)+(aj<<4)|0;c[ai>>2]=K;ai=e+(E<<1)|0;W=(b[ai>>1]<<16>>16)+((aj>>5)+1>>1)|0;if((W|0)>32767){al=32767}else{al=(W|0)<-32768?-32768:W&65535}b[ai>>1]=al;ai=E+1|0;if((ai|0)==(f|0)){break L2107}else{E=ai;F=K;G=N;H=S;I=Y;J=ab}}}}while(0);b$(m,d+(f<<2)|0,64);ak(t|0);i=g;return}function br(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0;h=i;i=i+32|0;j=h|0;l=d+2336|0;m=c[l>>2]|0;n=i;i=i+(m*2&-1)|0;i=i+3>>2<<2;o=d+2328|0;p=c[o>>2]|0;q=i;i=i+((p+m|0)*4&-1)|0;i=i+3>>2<<2;m=d+2332|0;r=c[m>>2]|0;s=i;i=i+(r*4&-1)|0;i=i+3>>2<<2;t=i;i=i+((r+16|0)*4&-1)|0;i=i+3>>2<<2;r=d+2765|0;u=a[d+2767|0]|0;L2120:do{if((p|0)>0){v=b[5244928+(a[r]<<24>>24>>1<<2)+(a[d+2766|0]<<24>>24<<1)>>1]<<16>>16<<4;w=a[d+2770|0]<<24>>24;x=0;while(1){y=X(w,196314165)+907633515|0;z=g+(x<<2)|0;A=c[z>>2]<<14;B=d+4+(x<<2)|0;c[B>>2]=A;do{if((A|0)>0){C=A-1280|0;c[B>>2]=C;D=C}else{if((A|0)>=0){D=0;break}C=A|1280;c[B>>2]=C;D=C}}while(0);A=D+v|0;c[B>>2]=(y|0)<0?-A|0:A;A=x+1|0;if((A|0)<(c[o>>2]|0)){w=(c[z>>2]|0)+y|0;x=A}else{break L2120}}}}while(0);o=t;D=d+1284|0;b$(o,D,64);g=d+2324|0;if((c[g>>2]|0)<=0){b$(D,o,64);i=h;return}p=d+2340|0;x=j;w=d|0;v=d+4160|0;A=e+136|0;C=u<<24>>24>3;u=f;E=j|0;F=j+2|0;G=j+4|0;H=j+6|0;I=j+8|0;J=j+10|0;K=j+12|0;L=j+14|0;M=j+16|0;N=j+18|0;O=j+20|0;P=j+22|0;Q=j+24|0;R=j+26|0;S=j+28|0;T=j+30|0;j=d+4164|0;U=d+2308|0;V=f;f=c[l>>2]|0;W=0;Y=d+4|0;while(1){Z=e+32+(W>>1<<5)|0;b$(x,Z,c[p>>2]<<1);_=W*5&-1;$=e+96+(_<<1)|0;aa=a[r]|0;ab=c[e+16+(W<<2)>>2]|0;ac=ab>>>6;ad=(ab|0)>0?ab:-ab|0;ae=(ad|0)==0;if(ae){ag=32}else{ag=am(ad|0,1)|0}ah=ab<<ag-1;ai=ah>>16;aj=536870911/(ai|0)&-1;ak=aj<<16;al=ak>>16;an=X(ai,al);ai=(536870912-an|0)-(X(ah&65535,al)>>16)<<3;ah=X(ai>>16,al);an=X(ai&65528,al)>>16;al=((X(ai,(aj>>15)+1>>1)+ak|0)+ah|0)+an|0;an=62-ag|0;ah=an-47|0;if((ah|0)<1){ak=47-an|0;an=-2147483648>>ak;aj=2147483647>>>(ak>>>0);do{if((an|0)>(aj|0)){if((al|0)>(an|0)){ao=an;break}ao=(al|0)<(aj|0)?aj:al}else{if((al|0)>(aj|0)){ao=aj;break}ao=(al|0)<(an|0)?an:al}}while(0);ap=ao<<ak}else{ap=(ah|0)<32?al>>ah:0}an=c[w>>2]|0;L2148:do{if((ab|0)==(an|0)){aq=65536}else{aj=(an|0)>0?an:-an|0;if((aj|0)==0){ar=32}else{ar=am(aj|0,1)|0}aj=an<<ar-1;if(ae){as=31}else{as=(am(ad|0,1)|0)-1|0}ai=ab<<as;at=(536870911/(ai>>16|0)&-1)<<16>>16;au=X(at,aj>>16);av=(X(at,aj&65535)>>16)+au|0;af(av|0,((av|0)<0?-1:0)|0,ai|0,((ai|0)<0?-1:0)|0),c[k>>2]|0;ai=c[k+4>>2]|0;au=aj-(ai<<3|0>>>29)|0;ai=X(au>>16,at);aj=(ai+av|0)+(X(au&65535,at)>>16)|0;at=(ar+28|0)-as|0;au=at-16|0;if((au|0)<0){av=16-at|0;at=-2147483648>>av;ai=2147483647>>>(av>>>0);do{if((at|0)>(ai|0)){if((aj|0)>(at|0)){aw=at;break}aw=(aj|0)<(ai|0)?ai:aj}else{if((aj|0)>(ai|0)){aw=ai;break}aw=(aj|0)<(at|0)?at:aj}}while(0);ax=aw<<av}else{ax=(au|0)<32?aj>>au:0}at=ax>>16;ai=ax&65535;y=0;while(1){z=t+(y<<2)|0;B=c[z>>2]|0;ay=B<<16>>16;az=X(ay,at);aA=(X(ay,ai)>>16)+az|0;c[z>>2]=aA+X((B>>15)+1>>1,ax)|0;B=y+1|0;if((B|0)==16){aq=ax;break L2148}else{y=B}}}}while(0);c[w>>2]=ab;do{if((c[v>>2]|0)==0){aB=1472}else{if((c[j>>2]|0)!=2){aB=1472;break}if(!(aa<<24>>24!=2&(W|0)<2)){aB=1472;break}ad=$;b[ad>>1]=0;b[ad+2>>1]=0;b[ad+4>>1]=0;b[ad+6>>1]=0;b[ad+8>>1]=0;b[e+96+(_+2<<1)>>1]=4096;ad=c[U>>2]|0;c[e+(W<<2)>>2]=ad;aC=ad;aB=1475;break}}while(0);do{if((aB|0)==1472){aB=0;if(aa<<24>>24==2){aC=c[e+(W<<2)>>2]|0;aB=1475;break}else{aD=Y;aE=f;aF=c[m>>2]|0;aB=1491;break}}}while(0);L2178:do{if((aB|0)==1475){aB=0;aa=(W|0)==0;L2180:do{if(aa){ad=c[l>>2]|0;ae=c[p>>2]|0;aG=((-2-aC|0)+ad|0)-ae|0;aH=ad;aI=ae;aB=1479;break}else{if(!((W|0)!=2|C)){ae=c[l>>2]|0;ad=((-2-aC|0)+ae|0)-(c[p>>2]|0)|0;b$(d+1348+(ae<<1)|0,u,c[m>>2]<<2);aG=ad;aH=c[l>>2]|0;aI=c[p>>2]|0;aB=1479;break}if((aq|0)==65536){break}ad=aC+2|0;if((ad|0)<=0){break}ae=aq>>16;an=f-1|0;ah=aq&65535;al=0;while(1){ak=q+(an-al<<2)|0;y=c[ak>>2]|0;ai=y<<16>>16;at=X(ai,ae);au=(X(ai,ah)>>16)+at|0;c[ak>>2]=au+X((y>>15)+1>>1,aq)|0;y=al+1|0;if((y|0)==(ad|0)){break L2180}else{al=y}}}}while(0);L2190:do{if((aB|0)==1479){aB=0;bF(n+(aG<<1)|0,d+1348+(X(c[m>>2]|0,W)+aG<<1)|0,Z,aH-aG|0,aI);if(aa){al=c[A>>2]<<16>>16;ad=X(al,ap>>16);aJ=(X(al,ap&65535)>>16)+ad<<2}else{aJ=ap}ad=aC+2|0;if((ad|0)<=0){break}al=aJ>>16;ah=c[l>>2]|0;ae=aJ&65535;an=f-1|0;y=0;au=0;while(1){ak=b[n+((au-1|0)+ah<<1)>>1]<<16>>16;at=X(ak,al);c[q+(an+au<<2)>>2]=(X(ak,ae)>>16)+at|0;at=y+1|0;ak=y^-1;if((at|0)==(ad|0)){break L2190}else{y=at;au=ak}}}}while(0);aa=c[m>>2]|0;if((aa|0)<=0){aK=aa;aL=f;break}au=b[$>>1]|0;y=b[e+96+(_+1<<1)>>1]|0;ad=b[e+96+(_+2<<1)>>1]|0;ae=b[e+96+(_+3<<1)>>1]|0;an=b[e+96+(_+4<<1)>>1]|0;al=f;ah=q+((f+2|0)-aC<<2)|0;ak=0;while(1){at=c[ah>>2]|0;ai=au<<16>>16;aj=X(ai,at>>16);av=X(ai,at&65535)>>16;at=c[ah-4>>2]|0;ai=y<<16>>16;B=X(ai,at>>16);aA=X(ai,at&65535)>>16;at=c[ah-8>>2]|0;ai=ad<<16>>16;z=X(ai,at>>16);az=X(ai,at&65535)>>16;at=c[ah-12>>2]|0;ai=ae<<16>>16;ay=X(ai,at>>16);aM=X(ai,at&65535)>>16;at=c[ah-16>>2]|0;ai=an<<16>>16;aN=X(ai,at>>16);aO=(((((((((aj+2|0)+av|0)+B|0)+aA|0)+z|0)+az|0)+ay|0)+aM|0)+aN|0)+(X(ai,at&65535)>>16)|0;at=(aO<<1)+(c[Y+(ak<<2)>>2]|0)|0;c[s+(ak<<2)>>2]=at;c[q+(al<<2)>>2]=at<<1;at=al+1|0;aO=ak+1|0;if((aO|0)<(aa|0)){al=at;ah=ah+4|0;ak=aO}else{aD=s;aE=at;aF=aa;aB=1491;break L2178}}}}while(0);L2202:do{if((aB|0)==1491){aB=0;if((aF|0)<=0){aK=aF;aL=aE;break}_=ac<<16>>16;$=(ab>>21)+1>>1;Z=0;while(1){aa=c[p>>2]|0;ak=c[t+(Z+15<<2)>>2]|0;ah=b[E>>1]<<16>>16;al=X(ah,ak>>16);an=X(ah,ak&65535)>>16;ak=c[t+(Z+14<<2)>>2]|0;ah=b[F>>1]<<16>>16;ae=X(ah,ak>>16);ad=X(ah,ak&65535)>>16;ak=c[t+(Z+13<<2)>>2]|0;ah=b[G>>1]<<16>>16;y=X(ah,ak>>16);au=X(ah,ak&65535)>>16;ak=c[t+(Z+12<<2)>>2]|0;ah=b[H>>1]<<16>>16;at=X(ah,ak>>16);aO=X(ah,ak&65535)>>16;ak=c[t+(Z+11<<2)>>2]|0;ah=b[I>>1]<<16>>16;ai=X(ah,ak>>16);aN=X(ah,ak&65535)>>16;ak=c[t+(Z+10<<2)>>2]|0;ah=b[J>>1]<<16>>16;aM=X(ah,ak>>16);ay=X(ah,ak&65535)>>16;ak=c[t+(Z+9<<2)>>2]|0;ah=b[K>>1]<<16>>16;az=X(ah,ak>>16);z=X(ah,ak&65535)>>16;ak=c[t+(Z+8<<2)>>2]|0;ah=b[L>>1]<<16>>16;aA=X(ah,ak>>16);B=X(ah,ak&65535)>>16;ak=c[t+(Z+7<<2)>>2]|0;ah=b[M>>1]<<16>>16;av=X(ah,ak>>16);aj=X(ah,ak&65535)>>16;ak=c[t+(Z+6<<2)>>2]|0;ah=b[N>>1]<<16>>16;aP=X(ah,ak>>16);aQ=(((((((((((((((((((al+(aa>>1)|0)+an|0)+ae|0)+ad|0)+y|0)+au|0)+at|0)+aO|0)+ai|0)+aN|0)+aM|0)+ay|0)+az|0)+z|0)+aA|0)+B|0)+av|0)+aj|0)+aP|0)+(X(ah,ak&65535)>>16)|0;if((aa|0)==16){aa=c[t+(Z+5<<2)>>2]|0;ak=b[O>>1]<<16>>16;ah=X(ak,aa>>16);aP=X(ak,aa&65535)>>16;aa=c[t+(Z+4<<2)>>2]|0;ak=b[P>>1]<<16>>16;aj=X(ak,aa>>16);av=X(ak,aa&65535)>>16;aa=c[t+(Z+3<<2)>>2]|0;ak=b[Q>>1]<<16>>16;B=X(ak,aa>>16);aA=X(ak,aa&65535)>>16;aa=c[t+(Z+2<<2)>>2]|0;ak=b[R>>1]<<16>>16;z=X(ak,aa>>16);az=X(ak,aa&65535)>>16;aa=c[t+(Z+1<<2)>>2]|0;ak=b[S>>1]<<16>>16;ay=X(ak,aa>>16);aM=X(ak,aa&65535)>>16;aa=c[t+(Z<<2)>>2]|0;ak=b[T>>1]<<16>>16;aN=X(ak,aa>>16);aR=(((((((((((ah+aQ|0)+aP|0)+aj|0)+av|0)+B|0)+aA|0)+z|0)+az|0)+ay|0)+aM|0)+aN|0)+(X(ak,aa&65535)>>16)|0}else{aR=aQ}aQ=(c[aD+(Z<<2)>>2]|0)+(aR<<4)|0;c[t+(Z+16<<2)>>2]=aQ;aa=X(aQ>>16,_);ak=X(aQ&65535,_)>>16;aN=((aa+X(aQ,$)|0)+ak>>7)+1>>1;if((aN|0)>32767){aS=32767}else{aS=(aN|0)<-32768?-32768:aN&65535}b[V+(Z<<1)>>1]=aS;aN=Z+1|0;ak=c[m>>2]|0;if((aN|0)<(ak|0)){Z=aN}else{aK=ak;aL=aE;break L2202}}}}while(0);b$(o,t+(aK<<2)|0,64);ab=W+1|0;if((ab|0)>=(c[g>>2]|0)){break}V=V+(aK<<1)|0;f=aL;W=ab;Y=Y+(aK<<2)|0}b$(D,o,64);i=h;return}function bs(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;i=i+140|0;k=j|0;l=b+2328|0;m=c[l>>2]|0;n=i;i=i+((m+15&-16)*4&-1)|0;i=i+3>>2<<2;o=k|0;c[k+136>>2]=0;do{if((g|0)==2){p=c[b+2388>>2]|0;if((c[b+2420+(p<<2)>>2]|0)==1){q=p;r=1506;break}else{r=1507;break}}else if((g|0)==0){q=c[b+2388>>2]|0;r=1506;break}else{r=1507}}while(0);if((r|0)==1506){bu(b,d,q,g,h);g=b+2765|0;bv(d,n,a[g]<<24>>24,a[b+2766|0]<<24>>24,c[l>>2]|0);bt(b,o,h);br(b,o,e,n);bA(b,o,e,0);c[b+4160>>2]=0;c[b+4164>>2]=a[g]<<24>>24;c[b+2376>>2]=0}else if((r|0)==1507){r=c[b+2316>>2]|0;g=b+4248|0;if((r|0)!=(c[g>>2]|0)){c[b+4168>>2]=m<<7;c[b+4240>>2]=65536;c[b+4244>>2]=65536;c[b+4256>>2]=20;c[b+4252>>2]=2;c[g>>2]=r}bB(b,o,e);r=b+4160|0;c[r>>2]=(c[r>>2]|0)+1|0}r=c[l>>2]|0;g=(c[b+2336>>2]|0)-r|0;b0(b+1348|0,b+1348+(r<<1)|0,g<<1);b$(b+1348+(g<<1)|0,e,c[l>>2]<<1);bC(b,e,m);bq(b,o,e,m);c[b+2308>>2]=c[k+((c[b+2324>>2]|0)-1<<2)>>2]|0;c[f>>2]=m;i=j;return 0}function bt(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+64|0;h=g|0;j=g+32|0;k=d+2324|0;by(e+16|0,d+2736|0,d+2312|0,(f|0)==2&1,c[k>>2]|0);f=h|0;bz(f,d+2744|0,c[d+2732>>2]|0);l=e+32|0;m=e+64|0;n=d+2340|0;bJ(m|0,f,c[n>>2]|0);f=d+2767|0;do{if((c[d+2376>>2]|0)==1){a[f]=4;o=1518;break}else{p=a[f]|0;if(p<<24>>24>=4){o=1518;break}q=c[n>>2]|0;L2231:do{if((q|0)>0){r=p<<24>>24;s=0;while(1){t=b[d+2344+(s<<1)>>1]<<16>>16;b[j+(s<<1)>>1]=(X((b[h+(s<<1)>>1]<<16>>16)-t|0,r)>>>2)+t&65535;t=s+1|0;if((t|0)<(q|0)){s=t}else{break L2231}}}}while(0);bJ(l|0,j|0,q);break}}while(0);if((o|0)==1518){b$(l,m,c[n>>2]<<1)}m=c[n>>2]|0;b$(d+2344|0,h,m<<1);if((c[d+4160>>2]|0)!=0){h=m-1|0;L2242:do{if((h|0)>0){m=0;l=63570;while(1){o=e+32+(m<<1)|0;b[o>>1]=((X(b[o>>1]<<16>>16,l)>>>15)+1|0)>>>1&65535;o=(((l*-1966&-1)>>15)+1>>1)+l|0;j=m+1|0;if((j|0)==(h|0)){u=o;break L2242}else{m=j;l=o}}}else{u=63570}}while(0);l=e+32+(h<<1)|0;b[l>>1]=((X(b[l>>1]<<16>>16,u)>>>15)+1|0)>>>1&65535;u=(c[n>>2]|0)-1|0;L2246:do{if((u|0)>0){n=0;l=63570;while(1){h=e+64+(n<<1)|0;b[h>>1]=((X(b[h>>1]<<16>>16,l)>>>15)+1|0)>>>1&65535;h=(((l*-1966&-1)>>15)+1>>1)+l|0;m=n+1|0;if((m|0)==(u|0)){v=h;break L2246}else{n=m;l=h}}}else{v=63570}}while(0);l=e+64+(u<<1)|0;b[l>>1]=((X(b[l>>1]<<16>>16,v)>>>15)+1|0)>>>1&65535}if(a[d+2765|0]<<24>>24!=2){b_(e|0,0,c[k>>2]<<2|0);b_(e+96|0,0,(c[k>>2]|0)*10&-1|0);a[d+2768|0]=0;c[e+136>>2]=0;i=g;return}v=c[d+2316>>2]|0;l=c[k>>2]|0;u=(l|0)==4;if((v|0)==8){w=u?5247664:5247656;x=u?11:3}else{w=u?5247520:5247496;x=u?34:12}u=v<<16;v=u>>15;n=(u>>16)*18&-1;u=v+(b[d+2762>>1]<<16>>16)|0;L2259:do{if((l|0)>0){h=a[d+2764|0]<<24>>24;m=(v|0)>(n|0);q=0;while(1){o=u+(a[w+(X(q,x)+h|0)|0]<<24>>24)|0;j=e+(q<<2)|0;c[j>>2]=o;do{if(m){if((o|0)>(v|0)){y=v;break}y=(o|0)<(n|0)?n:o}else{if((o|0)>(n|0)){y=n;break}y=(o|0)<(v|0)?v:o}}while(0);c[j>>2]=y;o=q+1|0;if((o|0)==(l|0)){break}else{q=o}}q=c[5246832+(a[d+2768|0]<<24>>24<<2)>>2]|0;if((c[k>>2]|0)>0){z=0}else{break}while(1){m=(a[z+(d+2740)|0]<<24>>24)*5&-1;h=z*5&-1;b[e+96+(h<<1)>>1]=a[q+m|0]<<24>>24<<7;b[e+96+(h+1<<1)>>1]=a[q+(m+1|0)|0]<<24>>24<<7;b[e+96+(h+2<<1)>>1]=a[q+(m+2|0)|0]<<24>>24<<7;b[e+96+(h+3<<1)>>1]=a[q+(m+3|0)|0]<<24>>24<<7;b[e+96+(h+4<<1)>>1]=a[q+(m+4|0)|0]<<24>>24<<7;m=z+1|0;if((m|0)<(c[k>>2]|0)){z=m}else{break L2259}}}}while(0);c[e+136>>2]=b[5247196+(a[d+2769|0]<<24>>24<<1)>>1]<<16>>16;i=g;return}function bu(f,g,h,j,k){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0;l=i;i=i+32|0;m=l|0;L2275:do{if((j|0)==0){if((c[f+2404+(h<<2)>>2]|0)!=0){n=1546;break}o=g+28|0;p=c[o>>2]|0;q=g+32|0;r=c[q>>2]|0;s=p>>>8;t=-1;u=p;while(1){v=t+1|0;w=X(d[v+5243448|0]|0,s);if(r>>>0<w>>>0){t=v;u=w}else{break}}t=r-w|0;c[q>>2]=t;s=u-w|0;c[o>>2]=s;if(s>>>0>=8388609){x=v;break}p=g+20|0;y=g+40|0;z=g+24|0;A=g|0;B=c[g+4>>2]|0;C=c[p>>2]|0;D=s;s=c[y>>2]|0;E=c[z>>2]|0;F=t;while(1){t=C+8|0;c[p>>2]=t;G=D<<8;c[o>>2]=G;if(E>>>0<B>>>0){H=E+1|0;c[z>>2]=H;I=d[(c[A>>2]|0)+E|0]|0;J=H}else{I=0;J=E}c[y>>2]=I;H=((I|s<<8)>>>1&255|F<<8&2147483392)^255;c[q>>2]=H;if(G>>>0<8388609){C=t;D=G;s=I;E=J;F=H}else{x=v;break L2275}}}else{n=1546}}while(0);if((n|0)==1546){v=g+28|0;J=c[v>>2]|0;I=g+32|0;w=c[I>>2]|0;h=J>>>8;j=-1;F=J;while(1){J=j+1|0;K=X(d[J+5243452|0]|0,h);if(w>>>0<K>>>0){j=J;F=K}else{break}}h=w-K|0;c[I>>2]=h;w=F-K|0;c[v>>2]=w;L2292:do{if(w>>>0<8388609){K=g+20|0;F=g+40|0;J=g+24|0;E=g|0;s=c[g+4>>2]|0;D=c[K>>2]|0;C=w;q=c[F>>2]|0;y=c[J>>2]|0;A=h;while(1){z=D+8|0;c[K>>2]=z;B=C<<8;c[v>>2]=B;if(y>>>0<s>>>0){o=y+1|0;c[J>>2]=o;L=d[(c[E>>2]|0)+y|0]|0;M=o}else{L=0;M=y}c[F>>2]=L;o=((L|q<<8)>>>1&255|A<<8&2147483392)^255;c[I>>2]=o;if(B>>>0<8388609){D=z;C=B;q=L;y=M;A=o}else{break L2292}}}}while(0);x=j+3|0}j=x>>>1;M=f+2736|0;L=f+2765|0;a[L]=j&255;a[f+2766|0]=x&1;x=(k|0)==2;if(x){I=g+28|0;v=c[I>>2]|0;h=g+32|0;w=c[h>>2]|0;A=v>>>8;y=-1;q=v;while(1){N=y+1|0;O=X(d[N+5244636|0]|0,A);if(w>>>0<O>>>0){y=N;q=O}else{break}}y=w-O|0;c[h>>2]=y;w=q-O|0;c[I>>2]=w;L2329:do{if(w>>>0<8388609){O=g+20|0;q=g+40|0;A=g+24|0;v=g|0;C=c[g+4>>2]|0;D=c[O>>2]|0;F=w;E=c[q>>2]|0;J=c[A>>2]|0;s=y;while(1){K=D+8|0;c[O>>2]=K;o=F<<8;c[I>>2]=o;if(J>>>0<C>>>0){B=J+1|0;c[A>>2]=B;P=d[(c[v>>2]|0)+J|0]|0;Q=B}else{P=0;Q=J}c[q>>2]=P;B=((P|E<<8)>>>1&255|s<<8&2147483392)^255;c[h>>2]=B;if(o>>>0<8388609){D=K;F=o;E=P;J=Q;s=B}else{break L2329}}}}while(0);a[M|0]=N&255}else{N=j<<24>>24;j=g+28|0;Q=c[j>>2]|0;P=g+32|0;h=c[P>>2]|0;I=Q>>>8;y=-1;w=Q;while(1){R=y+1|0;S=X(d[5244612+(N<<3)+R|0]|0,I);if(h>>>0<S>>>0){y=R;w=S}else{break}}y=h-S|0;c[P>>2]=y;h=w-S|0;c[j>>2]=h;L2306:do{if(h>>>0<8388609){S=g+20|0;w=g+40|0;I=g+24|0;N=g|0;Q=c[g+4>>2]|0;s=c[S>>2]|0;J=h;E=c[w>>2]|0;F=c[I>>2]|0;D=y;while(1){q=s+8|0;c[S>>2]=q;v=J<<8;c[j>>2]=v;if(F>>>0<Q>>>0){A=F+1|0;c[I>>2]=A;T=d[(c[N>>2]|0)+F|0]|0;U=A}else{T=0;U=F}c[w>>2]=T;A=((T|E<<8)>>>1&255|D<<8&2147483392)^255;c[P>>2]=A;if(v>>>0<8388609){s=q;J=v;E=T;F=U;D=A}else{break L2306}}}}while(0);U=M|0;a[U]=R<<3&255;R=c[j>>2]|0;M=c[P>>2]|0;T=R>>>8;y=-1;h=R;while(1){V=y+1|0;W=X(d[V+5243416|0]|0,T);if(M>>>0<W>>>0){y=V;h=W}else{break}}y=M-W|0;c[P>>2]=y;M=h-W|0;c[j>>2]=M;L2317:do{if(M>>>0<8388609){W=g+20|0;h=g+40|0;T=g+24|0;R=g|0;D=c[g+4>>2]|0;F=c[W>>2]|0;E=M;J=c[h>>2]|0;s=c[T>>2]|0;w=y;while(1){N=F+8|0;c[W>>2]=N;I=E<<8;c[j>>2]=I;if(s>>>0<D>>>0){Q=s+1|0;c[T>>2]=Q;Y=d[(c[R>>2]|0)+s|0]|0;Z=Q}else{Y=0;Z=s}c[h>>2]=Y;Q=((Y|J<<8)>>>1&255|w<<8&2147483392)^255;c[P>>2]=Q;if(I>>>0<8388609){F=N;E=I;J=Y;s=Z;w=Q}else{break L2317}}}}while(0);a[U]=(d[U]|0)+V&255}V=f+2324|0;U=g+28|0;Z=g+32|0;L2338:do{if((c[V>>2]|0)>1){Y=g+20|0;P=g+40|0;j=g+24|0;y=g+4|0;M=g|0;w=1;while(1){s=c[U>>2]|0;J=c[Z>>2]|0;E=s>>>8;F=-1;h=s;while(1){_=F+1|0;$=X(d[_+5244636|0]|0,E);if(J>>>0<$>>>0){F=_;h=$}else{break}}F=J-$|0;c[Z>>2]=F;E=h-$|0;c[U>>2]=E;L2345:do{if(E>>>0<8388609){s=c[y>>2]|0;R=c[Y>>2]|0;T=E;D=c[P>>2]|0;W=c[j>>2]|0;Q=F;while(1){I=R+8|0;c[Y>>2]=I;N=T<<8;c[U>>2]=N;if(W>>>0<s>>>0){S=W+1|0;c[j>>2]=S;aa=d[(c[M>>2]|0)+W|0]|0;ab=S}else{aa=0;ab=W}c[P>>2]=aa;S=((aa|D<<8)>>>1&255|Q<<8&2147483392)^255;c[Z>>2]=S;if(N>>>0<8388609){R=I;T=N;D=aa;W=ab;Q=S}else{break L2345}}}}while(0);a[w+(f+2736)|0]=_&255;F=w+1|0;if((F|0)<(c[V>>2]|0)){w=F}else{break L2338}}}}while(0);_=f+2732|0;ab=c[_>>2]|0;aa=X(b[ab>>1]<<16>>16,a[L]<<24>>24>>1);$=c[ab+12>>2]|0;ab=c[U>>2]|0;w=c[Z>>2]|0;P=ab>>>8;M=-1;j=ab;while(1){ac=M+1|0;ad=X(d[$+(ac+aa|0)|0]|0,P);if(w>>>0<ad>>>0){M=ac;j=ad}else{break}}M=w-ad|0;c[Z>>2]=M;w=j-ad|0;c[U>>2]=w;L2357:do{if(w>>>0<8388609){ad=g+20|0;j=g+40|0;P=g+24|0;aa=g|0;$=c[g+4>>2]|0;ab=c[ad>>2]|0;Y=w;y=c[j>>2]|0;F=c[P>>2]|0;E=M;while(1){h=ab+8|0;c[ad>>2]=h;J=Y<<8;c[U>>2]=J;if(F>>>0<$>>>0){Q=F+1|0;c[P>>2]=Q;ae=d[(c[aa>>2]|0)+F|0]|0;af=Q}else{ae=0;af=F}c[j>>2]=ae;Q=((ae|y<<8)>>>1&255|E<<8&2147483392)^255;c[Z>>2]=Q;if(J>>>0<8388609){ab=h;Y=J;y=ae;F=af;E=Q}else{break L2357}}}}while(0);a[f+2744|0]=ac&255;af=c[_>>2]|0;ae=b[af+2>>1]|0;M=ae<<16>>16>0;L2365:do{if(M){w=ae<<16>>16;E=X(w,ac<<24>>24);F=0;y=(c[af+20>>2]|0)+((E|0)/2&-1)|0;while(1){E=a[y]|0;b[m+(F<<1)>>1]=((E&255)>>>1&7)*9&65535;b[m+((F|1)<<1)>>1]=((E&255)>>>5&255)*9&65535;E=F+2|0;if((E|0)<(w|0)){F=E;y=y+1|0}else{break}}if(!M){break}y=g+20|0;F=g+40|0;w=g+24|0;E=g+4|0;Y=g|0;ab=0;j=af;while(1){aa=b[m+(ab<<1)>>1]<<16>>16;P=c[j+24>>2]|0;$=c[U>>2]|0;ad=c[Z>>2]|0;Q=$>>>8;J=-1;h=$;while(1){ag=J+1|0;ah=X(d[P+(ag+aa|0)|0]|0,Q);if(ad>>>0<ah>>>0){J=ag;h=ah}else{break}}Q=ad-ah|0;c[Z>>2]=Q;aa=h-ah|0;c[U>>2]=aa;L2376:do{if(aa>>>0<8388609){P=c[E>>2]|0;$=c[y>>2]|0;W=aa;D=c[F>>2]|0;T=c[w>>2]|0;R=Q;while(1){s=$+8|0;c[y>>2]=s;S=W<<8;c[U>>2]=S;if(T>>>0<P>>>0){N=T+1|0;c[w>>2]=N;ai=d[(c[Y>>2]|0)+T|0]|0;aj=N}else{ai=0;aj=T}c[F>>2]=ai;N=((ai|D<<8)>>>1&255|R<<8&2147483392)^255;c[Z>>2]=N;if(S>>>0<8388609){$=s;W=S;D=ai;T=aj;R=N}else{ak=S;al=N;break L2376}}}else{ak=aa;al=Q}}while(0);if((J|0)==(-1|0)){Q=ak>>>8;aa=-1;h=ak;while(1){am=aa+1|0;an=X(d[am+5244996|0]|0,Q);if(al>>>0<an>>>0){aa=am;h=an}else{break}}aa=al-an|0;c[Z>>2]=aa;Q=h-an|0;c[U>>2]=Q;L2389:do{if(Q>>>0<8388609){ad=c[E>>2]|0;R=c[y>>2]|0;T=Q;D=c[F>>2]|0;W=c[w>>2]|0;$=aa;while(1){P=R+8|0;c[y>>2]=P;N=T<<8;c[U>>2]=N;if(W>>>0<ad>>>0){S=W+1|0;c[w>>2]=S;ao=d[(c[Y>>2]|0)+W|0]|0;ap=S}else{ao=0;ap=W}c[F>>2]=ao;S=((ao|D<<8)>>>1&255|$<<8&2147483392)^255;c[Z>>2]=S;if(N>>>0<8388609){R=P;T=N;D=ao;W=ap;$=S}else{break L2389}}}}while(0);aq=ag-am|0}else if((J|0)==7){aa=ak>>>8;Q=-1;h=ak;while(1){ar=Q+1|0;as=X(d[ar+5244996|0]|0,aa);if(al>>>0<as>>>0){Q=ar;h=as}else{break}}Q=al-as|0;c[Z>>2]=Q;aa=h-as|0;c[U>>2]=aa;L2401:do{if(aa>>>0<8388609){J=c[E>>2]|0;$=c[y>>2]|0;W=aa;D=c[F>>2]|0;T=c[w>>2]|0;R=Q;while(1){ad=$+8|0;c[y>>2]=ad;S=W<<8;c[U>>2]=S;if(T>>>0<J>>>0){N=T+1|0;c[w>>2]=N;at=d[(c[Y>>2]|0)+T|0]|0;au=N}else{at=0;au=T}c[F>>2]=at;N=((at|D<<8)>>>1&255|R<<8&2147483392)^255;c[Z>>2]=N;if(S>>>0<8388609){$=ad;W=S;D=at;T=au;R=N}else{break L2401}}}}while(0);aq=ar+ag|0}else{aq=ag}Q=ab+1|0;a[Q+(f+2744)|0]=aq+252&255;aa=c[_>>2]|0;if((Q|0)<(b[aa+2>>1]<<16>>16|0)){ab=Q;j=aa}else{break L2365}}}}while(0);if((c[V>>2]|0)==4){_=c[U>>2]|0;aq=c[Z>>2]|0;ag=_>>>8;ar=-1;au=_;while(1){av=ar+1|0;aw=X(d[av+5244936|0]|0,ag);if(aq>>>0<aw>>>0){ar=av;au=aw}else{break}}ar=aq-aw|0;c[Z>>2]=ar;aq=au-aw|0;c[U>>2]=aq;L2416:do{if(aq>>>0<8388609){aw=g+20|0;au=g+40|0;ag=g+24|0;_=g|0;at=c[g+4>>2]|0;as=c[aw>>2]|0;al=aq;ak=c[au>>2]|0;am=c[ag>>2]|0;ap=ar;while(1){ao=as+8|0;c[aw>>2]=ao;an=al<<8;c[U>>2]=an;if(am>>>0<at>>>0){aj=am+1|0;c[ag>>2]=aj;ax=d[(c[_>>2]|0)+am|0]|0;ay=aj}else{ax=0;ay=am}c[au>>2]=ax;aj=((ax|ak<<8)>>>1&255|ap<<8&2147483392)^255;c[Z>>2]=aj;if(an>>>0<8388609){as=ao;al=an;ak=ax;am=ay;ap=aj}else{break L2416}}}}while(0);a[f+2767|0]=av&255}else{a[f+2767|0]=4}do{if(a[L]<<24>>24==2){do{if(x){if((c[f+2396>>2]|0)!=2){n=1654;break}av=c[U>>2]|0;ay=c[Z>>2]|0;ax=av>>>8;ar=-1;aq=av;while(1){az=ar+1|0;aA=X(d[az+5244520|0]|0,ax);if(ay>>>0<aA>>>0){ar=az;aq=aA}else{break}}ax=ay-aA|0;c[Z>>2]=ax;av=aq-aA|0;c[U>>2]=av;L2434:do{if(av>>>0<8388609){ap=g+20|0;am=g+40|0;ak=g+24|0;al=g|0;as=c[g+4>>2]|0;au=c[ap>>2]|0;_=av;ag=c[am>>2]|0;at=c[ak>>2]|0;aw=ax;while(1){aj=au+8|0;c[ap>>2]=aj;an=_<<8;c[U>>2]=an;if(at>>>0<as>>>0){ao=at+1|0;c[ak>>2]=ao;aB=d[(c[al>>2]|0)+at|0]|0;aC=ao}else{aB=0;aC=at}c[am>>2]=aB;ao=((aB|ag<<8)>>>1&255|aw<<8&2147483392)^255;c[Z>>2]=ao;if(an>>>0<8388609){au=aj;_=an;ag=aB;at=aC;aw=ao}else{break L2434}}}}while(0);if((az<<16|0)<=0){n=1654;break}ax=f+2400|0;av=(ar+65528|0)+(e[ax>>1]|0)&65535;b[f+2762>>1]=av;aD=av;aE=ax;break}else{n=1654}}while(0);if((n|0)==1654){ax=c[U>>2]|0;av=c[Z>>2]|0;aq=ax>>>8;ay=-1;aw=ax;while(1){aF=ay+1|0;aG=X(d[aF+5244488|0]|0,aq);if(av>>>0<aG>>>0){ay=aF;aw=aG}else{break}}ay=av-aG|0;c[Z>>2]=ay;aq=aw-aG|0;c[U>>2]=aq;L2448:do{if(aq>>>0<8388609){ax=g+20|0;at=g+40|0;ag=g+24|0;_=g|0;au=c[g+4>>2]|0;am=c[ax>>2]|0;al=aq;ak=c[at>>2]|0;as=c[ag>>2]|0;ap=ay;while(1){ao=am+8|0;c[ax>>2]=ao;an=al<<8;c[U>>2]=an;if(as>>>0<au>>>0){aj=as+1|0;c[ag>>2]=aj;aH=d[(c[_>>2]|0)+as|0]|0;aI=aj}else{aH=0;aI=as}c[at>>2]=aH;aj=((aH|ak<<8)>>>1&255|ap<<8&2147483392)^255;c[Z>>2]=aj;if(an>>>0<8388609){am=ao;al=an;ak=aH;as=aI;ap=aj}else{break L2448}}}}while(0);ay=f+2762|0;b[ay>>1]=X(c[f+2316>>2]>>1,aF<<16>>16)&65535;aq=c[f+2380>>2]|0;aw=c[U>>2]|0;av=c[Z>>2]|0;ap=aw>>>8;as=-1;ak=aw;while(1){aJ=as+1|0;aK=X(d[aq+aJ|0]|0,ap);if(av>>>0<aK>>>0){as=aJ;ak=aK}else{break}}as=av-aK|0;c[Z>>2]=as;ap=ak-aK|0;c[U>>2]=ap;L2459:do{if(ap>>>0<8388609){aq=g+20|0;aw=g+40|0;al=g+24|0;am=g|0;at=c[g+4>>2]|0;_=c[aq>>2]|0;ag=ap;au=c[aw>>2]|0;ax=c[al>>2]|0;ar=as;while(1){aj=_+8|0;c[aq>>2]=aj;an=ag<<8;c[U>>2]=an;if(ax>>>0<at>>>0){ao=ax+1|0;c[al>>2]=ao;aL=d[(c[am>>2]|0)+ax|0]|0;aM=ao}else{aL=0;aM=ax}c[aw>>2]=aL;ao=((aL|au<<8)>>>1&255|ar<<8&2147483392)^255;c[Z>>2]=ao;if(an>>>0<8388609){_=aj;ag=an;au=aL;ax=aM;ar=ao}else{break L2459}}}}while(0);as=(e[ay>>1]|0)+aJ&65535;b[ay>>1]=as;aD=as;aE=f+2400|0}b[aE>>1]=aD;as=c[f+2384>>2]|0;ap=c[U>>2]|0;ak=c[Z>>2]|0;av=ap>>>8;ar=-1;ax=ap;while(1){aN=ar+1|0;aO=X(d[as+aN|0]|0,av);if(ak>>>0<aO>>>0){ar=aN;ax=aO}else{break}}ar=ak-aO|0;c[Z>>2]=ar;av=ax-aO|0;c[U>>2]=av;L2471:do{if(av>>>0<8388609){as=g+20|0;ay=g+40|0;ap=g+24|0;au=g|0;ag=c[g+4>>2]|0;_=c[as>>2]|0;aw=av;am=c[ay>>2]|0;al=c[ap>>2]|0;at=ar;while(1){aq=_+8|0;c[as>>2]=aq;ao=aw<<8;c[U>>2]=ao;if(al>>>0<ag>>>0){an=al+1|0;c[ap>>2]=an;aP=d[(c[au>>2]|0)+al|0]|0;aQ=an}else{aP=0;aQ=al}c[ay>>2]=aP;an=((aP|am<<8)>>>1&255|at<<8&2147483392)^255;c[Z>>2]=an;if(ao>>>0<8388609){_=aq;aw=ao;am=aP;al=aQ;at=an}else{break L2471}}}}while(0);a[f+2764|0]=aN&255;ar=c[U>>2]|0;av=c[Z>>2]|0;ax=ar>>>8;ak=-1;at=ar;while(1){aR=ak+1|0;aS=X(d[aR+5246844|0]|0,ax);if(av>>>0<aS>>>0){ak=aR;at=aS}else{break}}ak=av-aS|0;c[Z>>2]=ak;ax=at-aS|0;c[U>>2]=ax;L2482:do{if(ax>>>0<8388609){ar=g+20|0;al=g+40|0;am=g+24|0;aw=g|0;_=c[g+4>>2]|0;ay=c[ar>>2]|0;au=ax;ap=c[al>>2]|0;ag=c[am>>2]|0;as=ak;while(1){an=ay+8|0;c[ar>>2]=an;ao=au<<8;c[U>>2]=ao;if(ag>>>0<_>>>0){aq=ag+1|0;c[am>>2]=aq;aT=d[(c[aw>>2]|0)+ag|0]|0;aU=aq}else{aT=0;aU=ag}c[al>>2]=aT;aq=((aT|ap<<8)>>>1&255|as<<8&2147483392)^255;c[Z>>2]=aq;if(ao>>>0<8388609){ay=an;au=ao;ap=aT;ag=aU;as=aq}else{break L2482}}}}while(0);ak=aR&255;ax=f+2768|0;a[ax]=ak;L2490:do{if((c[V>>2]|0)>0){at=g+20|0;av=g+40|0;as=g+24|0;ag=g+4|0;ap=g|0;au=0;ay=ak;while(1){al=c[5247128+(ay<<24>>24<<2)>>2]|0;aw=c[U>>2]|0;am=c[Z>>2]|0;_=aw>>>8;ar=-1;aq=aw;while(1){aV=ar+1|0;aW=X(d[al+aV|0]|0,_);if(am>>>0<aW>>>0){ar=aV;aq=aW}else{break}}ar=am-aW|0;c[Z>>2]=ar;_=aq-aW|0;c[U>>2]=_;L2497:do{if(_>>>0<8388609){al=c[ag>>2]|0;aw=c[at>>2]|0;ao=_;an=c[av>>2]|0;aj=c[as>>2]|0;ai=ar;while(1){ah=aw+8|0;c[at>>2]=ah;m=ao<<8;c[U>>2]=m;if(aj>>>0<al>>>0){af=aj+1|0;c[as>>2]=af;aX=d[(c[ap>>2]|0)+aj|0]|0;aY=af}else{aX=0;aY=aj}c[av>>2]=aX;af=((aX|an<<8)>>>1&255|ai<<8&2147483392)^255;c[Z>>2]=af;if(m>>>0<8388609){aw=ah;ao=m;an=aX;aj=aY;ai=af}else{break L2497}}}}while(0);a[au+(f+2740)|0]=aV&255;ar=au+1|0;if((ar|0)>=(c[V>>2]|0)){break L2490}au=ar;ay=a[ax]|0}}}while(0);if((k|0)!=0){a[f+2769|0]=0;break}ax=c[U>>2]|0;ak=c[Z>>2]|0;ay=ax>>>8;au=-1;av=ax;while(1){aZ=au+1|0;a_=X(d[aZ+5246828|0]|0,ay);if(ak>>>0<a_>>>0){au=aZ;av=a_}else{break}}au=ak-a_|0;c[Z>>2]=au;ay=av-a_|0;c[U>>2]=ay;L2513:do{if(ay>>>0<8388609){ax=g+20|0;ap=g+40|0;as=g+24|0;at=g|0;ag=c[g+4>>2]|0;ar=c[ax>>2]|0;_=ay;aq=c[ap>>2]|0;am=c[as>>2]|0;ai=au;while(1){aj=ar+8|0;c[ax>>2]=aj;an=_<<8;c[U>>2]=an;if(am>>>0<ag>>>0){ao=am+1|0;c[as>>2]=ao;a$=d[(c[at>>2]|0)+am|0]|0;a0=ao}else{a$=0;a0=am}c[ap>>2]=a$;ao=((a$|aq<<8)>>>1&255|ai<<8&2147483392)^255;c[Z>>2]=ao;if(an>>>0<8388609){ar=aj;_=an;aq=a$;am=a0;ai=ao}else{break L2513}}}}while(0);a[f+2769|0]=aZ&255}}while(0);c[f+2396>>2]=a[L]<<24>>24;L=c[U>>2]|0;aZ=c[Z>>2]|0;a0=L>>>8;a$=-1;a_=L;while(1){a1=a$+1|0;a2=X(d[a1+5243440|0]|0,a0);if(aZ>>>0<a2>>>0){a$=a1;a_=a2}else{break}}a$=aZ-a2|0;c[Z>>2]=a$;aZ=a_-a2|0;c[U>>2]=aZ;if(aZ>>>0>=8388609){a3=a1&255;a4=f+2770|0;a[a4]=a3;i=l;return}a2=g+20|0;a_=g+40|0;a0=g+24|0;L=g|0;k=c[g+4>>2]|0;g=c[a2>>2]|0;V=aZ;aZ=c[a_>>2]|0;aV=c[a0>>2]|0;aY=a$;while(1){a$=g+8|0;c[a2>>2]=a$;aX=V<<8;c[U>>2]=aX;if(aV>>>0<k>>>0){aW=aV+1|0;c[a0>>2]=aW;a5=d[(c[L>>2]|0)+aV|0]|0;a6=aW}else{a5=0;a6=aV}c[a_>>2]=a5;aW=((a5|aZ<<8)>>>1&255|aY<<8&2147483392)^255;c[Z>>2]=aW;if(aX>>>0<8388609){g=a$;V=aX;aZ=a5;aV=a6;aY=aW}else{break}}a3=a1&255;a4=f+2770|0;a[a4]=a3;i=l;return}function bv(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0;h=i;i=i+160|0;j=h|0;k=h+80|0;l=e>>1;m=a+28|0;n=c[m>>2]|0;o=a+32|0;p=c[o>>2]|0;q=n>>>8;r=-1;s=n;while(1){t=r+1|0;u=X(d[5244288+(l*9&-1)+t|0]|0,q);if(p>>>0<u>>>0){r=t;s=u}else{break}}r=p-u|0;c[o>>2]=r;p=s-u|0;c[m>>2]=p;L2538:do{if(p>>>0<8388609){u=a+20|0;s=a+40|0;q=a+24|0;l=a|0;n=c[a+4>>2]|0;v=c[u>>2]|0;w=p;x=c[s>>2]|0;y=c[q>>2]|0;z=r;while(1){A=v+8|0;c[u>>2]=A;B=w<<8;c[m>>2]=B;if(y>>>0<n>>>0){C=y+1|0;c[q>>2]=C;D=d[(c[l>>2]|0)+y|0]|0;E=C}else{D=0;E=y}c[s>>2]=D;C=((D|x<<8)>>>1&255|z<<8&2147483392)^255;c[o>>2]=C;if(B>>>0<8388609){v=A;w=B;x=D;y=E;z=C}else{F=B;G=C;break L2538}}}else{F=p;G=r}}while(0);r=g>>4;p=((r<<4|0)<(g|0)&1)+r|0;r=(p|0)>0;if(!r){H=j|0;bp(a,b,g,e,f,H);i=h;return}E=a+20|0;D=a+40|0;z=a+24|0;y=a+4|0;x=a|0;w=0;v=F;F=G;while(1){G=k+(w<<2)|0;c[G>>2]=0;s=v>>>8;l=-1;q=v;while(1){I=l+1|0;J=X(d[5244308+(t*18&-1)+I|0]|0,s);if(F>>>0<J>>>0){l=I;q=J}else{break}}l=F-J|0;c[o>>2]=l;s=q-J|0;c[m>>2]=s;L2554:do{if(s>>>0<8388609){n=c[y>>2]|0;u=c[E>>2]|0;C=s;B=c[D>>2]|0;A=c[z>>2]|0;K=l;while(1){L=u+8|0;c[E>>2]=L;M=C<<8;c[m>>2]=M;if(A>>>0<n>>>0){N=A+1|0;c[z>>2]=N;O=d[(c[x>>2]|0)+A|0]|0;P=N}else{O=0;P=A}c[D>>2]=O;N=((O|B<<8)>>>1&255|K<<8&2147483392)^255;c[o>>2]=N;if(M>>>0<8388609){u=L;C=M;B=O;A=P;K=N}else{Q=M;R=N;break L2554}}}else{Q=s;R=l}}while(0);l=j+(w<<2)|0;c[l>>2]=I;if((I|0)==17){s=0;q=Q;K=R;while(1){S=s+1|0;A=(S|0)==10&1;B=q>>>8;C=-1;u=q;while(1){T=C+1|0;U=X(d[5244470+(T+A|0)|0]|0,B);if(K>>>0<U>>>0){C=T;u=U}else{break}}C=K-U|0;c[o>>2]=C;B=u-U|0;c[m>>2]=B;L2568:do{if(B>>>0<8388609){A=c[y>>2]|0;n=c[E>>2]|0;N=B;M=c[D>>2]|0;L=c[z>>2]|0;V=C;while(1){W=n+8|0;c[E>>2]=W;Y=N<<8;c[m>>2]=Y;if(L>>>0<A>>>0){Z=L+1|0;c[z>>2]=Z;_=d[(c[x>>2]|0)+L|0]|0;$=Z}else{_=0;$=L}c[D>>2]=_;Z=((_|M<<8)>>>1&255|V<<8&2147483392)^255;c[o>>2]=Z;if(Y>>>0<8388609){n=W;N=Y;M=_;L=$;V=Z}else{aa=Y;ab=Z;break L2568}}}else{aa=B;ab=C}}while(0);if((T|0)==17){s=S;q=aa;K=ab}else{break}}c[G>>2]=S;c[l>>2]=T;ac=aa;ad=ab}else{ac=Q;ad=R}K=w+1|0;if((K|0)==(p|0)){break}else{w=K;v=ac;F=ad}}if(r){ae=0}else{H=j|0;bp(a,b,g,e,f,H);i=h;return}while(1){ad=c[j+(ae<<2)>>2]|0;F=b+(ae<<16>>12<<2)|0;if((ad|0)>0){bD(F,a,ad)}else{b_(F|0,0,64)}F=ae+1|0;if((F|0)==(p|0)){break}else{ae=F}}if(!r){H=j|0;bp(a,b,g,e,f,H);i=h;return}r=a+20|0;ae=a+40|0;F=a+24|0;ad=a+4|0;ac=a|0;v=0;while(1){w=c[k+(v<<2)>>2]|0;if((w|0)>0){R=v<<16>>12;Q=0;while(1){ab=b+(Q+R<<2)|0;aa=c[ab>>2]|0;T=0;S=c[m>>2]|0;$=c[o>>2]|0;while(1){_=S>>>8;D=-1;x=S;while(1){af=D+1|0;ag=X(d[af+5244608|0]|0,_);if($>>>0<ag>>>0){D=af;x=ag}else{break}}D=aa<<1;_=$-ag|0;c[o>>2]=_;z=x-ag|0;c[m>>2]=z;L2602:do{if(z>>>0<8388609){E=c[ad>>2]|0;y=c[r>>2]|0;U=z;I=c[ae>>2]|0;P=c[F>>2]|0;O=_;while(1){J=y+8|0;c[r>>2]=J;t=U<<8;c[m>>2]=t;if(P>>>0<E>>>0){K=P+1|0;c[F>>2]=K;ah=d[(c[ac>>2]|0)+P|0]|0;ai=K}else{ah=0;ai=P}c[ae>>2]=ah;K=((ah|I<<8)>>>1&255|O<<8&2147483392)^255;c[o>>2]=K;if(t>>>0<8388609){y=J;U=t;I=ah;P=ai;O=K}else{aj=t;ak=K;break L2602}}}else{aj=z;ak=_}}while(0);al=af+D|0;_=T+1|0;if((_|0)==(w|0)){break}else{aa=al;T=_;S=aj;$=ak}}c[ab>>2]=al;$=Q+1|0;if(($|0)==16){break}else{Q=$}}Q=j+(v<<2)|0;c[Q>>2]=c[Q>>2]|w<<5}Q=v+1|0;if((Q|0)==(p|0)){break}else{v=Q}}H=j|0;bp(a,b,g,e,f,H);i=h;return}function bw(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=d<<16>>16;c[b+2332>>2]=f*5&-1;g=b+2324|0;h=X(c[g>>2]<<16>>16,(f*327680&-1)>>16);i=b+2316|0;j=b+2320|0;do{if((c[i>>2]|0)==(d|0)){if((c[j>>2]|0)==(e|0)){k=0;l=1770;break}else{l=1769;break}}else{l=1769}}while(0);do{if((l|0)==1769){m=bK(b+2432|0,f*1e3&-1,e,0)|0;c[j>>2]=e;if((c[i>>2]|0)==(d|0)){k=m;l=1770;break}else{n=m;o=0;break}}}while(0);do{if((l|0)==1770){if((h|0)==(c[b+2328>>2]|0)){p=k}else{n=k;o=1;break}return p|0}}while(0);k=(d|0)==8;l=(c[g>>2]|0)==4;g=b+2384|0;do{if(k){if(l){c[g>>2]=5244580;break}else{c[g>>2]=5244604;break}}else{if(l){c[g>>2]=5244544;break}else{c[g>>2]=5244592;break}}}while(0);if(!o){c[b+2336>>2]=f*20&-1;f=b+2340|0;if((d|0)==12|(d|0)==8){c[f>>2]=10;c[b+2732>>2]=5245100}else{c[f>>2]=16;c[b+2732>>2]=5245064}do{if((d|0)==16){c[b+2380>>2]=5243416}else if((d|0)==12){c[b+2380>>2]=5243424}else{if(!k){break}c[b+2380>>2]=5243440}}while(0);c[b+2376>>2]=1;c[b+2308>>2]=100;a[b+2312|0]=10;c[b+4164>>2]=0;b_(b+1284|0,0,1024)}c[i>>2]=d;c[b+2328>>2]=h;p=n;return p|0}function bx(f,g,h,j,k,l,m){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,al=0,am=0,an=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0;n=i;i=i+1300|0;o=n|0;p=n+4|0;q=n+12|0;s=n+20|0;t=q;c[t>>2]=0;c[t+4>>2]=0;t=f;u=f;v=g+4|0;w=c[v>>2]|0;L2648:do{if((j|0)!=0&(w|0)>0){x=0;while(1){c[u+(x*4260&-1)+2388>>2]=0;y=x+1|0;z=c[v>>2]|0;if((y|0)<(z|0)){x=y}else{A=z;break L2648}}}else{A=w}}while(0);w=g+4|0;v=f+8536|0;j=c[v>>2]|0;if((A|0)>(j|0)){x=f+4260|0;b_(x|0,0,4252);c[f+6636>>2]=1;c[x>>2]=65536;c[f+8408>>2]=0;c[f+8412>>2]=3176576;c[f+8428>>2]=0;c[f+8500>>2]=65536;c[f+8504>>2]=65536;c[f+8516>>2]=20;c[f+8512>>2]=2;B=c[w>>2]|0}else{B=A}if((B|0)==1&(j|0)==2){C=(c[g+12>>2]|0)==((c[f+2316>>2]|0)*1e3&-1|0)}else{C=0}j=f+2388|0;L2658:do{if((c[j>>2]|0)==0&(B|0)>0){A=g+16|0;x=g+12|0;z=g+8|0;y=0;D=0;while(1){E=c[A>>2]|0;if((E|0)==0){c[u+(D*4260&-1)+2392>>2]=1;c[u+(D*4260&-1)+2324>>2]=2}else if((E|0)==10){c[u+(D*4260&-1)+2392>>2]=1;c[u+(D*4260&-1)+2324>>2]=2}else if((E|0)==20){c[u+(D*4260&-1)+2392>>2]=1;c[u+(D*4260&-1)+2324>>2]=4}else if((E|0)==40){c[u+(D*4260&-1)+2392>>2]=2;c[u+(D*4260&-1)+2324>>2]=4}else if((E|0)==60){c[u+(D*4260&-1)+2392>>2]=3;c[u+(D*4260&-1)+2324>>2]=4}else{F=-203;G=1928;break}E=c[x>>2]>>10;if(!((E|0)==15|(E|0)==11|(E|0)==7)){F=-200;G=1929;break}H=(bw(u+(D*4260&-1)|0,E+1|0,c[z>>2]|0)|0)+y|0;E=D+1|0;I=c[w>>2]|0;if((E|0)<(I|0)){y=H;D=E}else{J=H;K=I;break L2658}}if((G|0)==1928){i=n;return F|0}else if((G|0)==1929){i=n;return F|0}}else{J=0;K=B}}while(0);B=g|0;D=c[B>>2]|0;do{if((D|0)==2){if((K|0)!=2){L=2;break}if((c[f+8532>>2]|0)!=1){if((c[v>>2]|0)!=1){L=2;break}}y=f+8520|0;r=0;b[y>>1]=r&65535;b[y+2>>1]=r>>16;y=f+8528|0;r=0;b[y>>1]=r&65535;b[y+2>>1]=r>>16;b$(f+6692|0,f+2432|0,300);L=c[B>>2]|0}else{L=D}}while(0);c[f+8532>>2]=L;c[v>>2]=c[w>>2]|0;L=g+8|0;if(((c[L>>2]|0)-8e3|0)>>>0>4e4){F=-200;i=n;return F|0}D=(h|0)==1;L2684:do{if(D){M=0}else{if((c[j>>2]|0)!=0){M=0;break}K=c[w>>2]|0;L2687:do{if((K|0)>0){y=k+28|0;z=k+32|0;x=k+20|0;A=k+40|0;I=k+24|0;H=k+4|0;E=k|0;N=0;while(1){O=u+(N*4260&-1)+2392|0;P=0;while(1){Q=(P|0)<(c[O>>2]|0);R=c[y>>2]|0;S=c[z>>2]|0;T=R>>>1;U=S>>>0<T>>>0;V=U&1;if(U){W=T;Y=S}else{U=S-T|0;c[z>>2]=U;W=R-T|0;Y=U}c[y>>2]=W;L2696:do{if(W>>>0<8388609){U=c[H>>2]|0;T=c[x>>2]|0;R=W;S=c[A>>2]|0;Z=c[I>>2]|0;_=Y;while(1){$=T+8|0;c[x>>2]=$;aa=R<<8;c[y>>2]=aa;if(Z>>>0<U>>>0){ab=Z+1|0;c[I>>2]=ab;ac=d[(c[E>>2]|0)+Z|0]|0;ad=ab}else{ac=0;ad=Z}c[A>>2]=ac;ab=((ac|S<<8)>>>1&255|_<<8&2147483392)^255;c[z>>2]=ab;if(aa>>>0<8388609){T=$;R=aa;S=ac;Z=ad;_=ab}else{break L2696}}}}while(0);if(!Q){break}c[u+(N*4260&-1)+2404+(P<<2)>>2]=V;P=P+1|0}c[u+(N*4260&-1)+2416>>2]=V;P=N+1|0;ae=c[w>>2]|0;if((P|0)<(ae|0)){N=P}else{break}}if((ae|0)<=0){af=ae;break}N=k+28|0;z=k+32|0;A=k+20|0;E=k+40|0;I=k+24|0;y=k+4|0;x=k|0;H=0;while(1){P=u+(H*4260&-1)+2420|0;O=P;c[O>>2]=0;c[O+4>>2]=0;c[O+8>>2]=0;L2710:do{if((c[u+(H*4260&-1)+2416>>2]|0)!=0){O=u+(H*4260&-1)+2392|0;_=c[O>>2]|0;if((_|0)==1){c[P>>2]=1;break}Z=c[5247464+(_-2<<2)>>2]|0;_=c[N>>2]|0;S=c[z>>2]|0;R=_>>>8;T=-1;U=_;while(1){_=T+1|0;ag=X(d[Z+_|0]|0,R);if(S>>>0<ag>>>0){T=_;U=ag}else{break}}R=S-ag|0;c[z>>2]=R;Z=U-ag|0;c[N>>2]=Z;L2718:do{if(Z>>>0<8388609){Q=c[y>>2]|0;_=c[A>>2]|0;ab=Z;aa=c[E>>2]|0;$=c[I>>2]|0;ah=R;while(1){ai=_+8|0;c[A>>2]=ai;aj=ab<<8;c[N>>2]=aj;if($>>>0<Q>>>0){al=$+1|0;c[I>>2]=al;am=d[(c[x>>2]|0)+$|0]|0;an=al}else{am=0;an=$}c[E>>2]=am;al=((am|aa<<8)>>>1&255|ah<<8&2147483392)^255;c[z>>2]=al;if(aj>>>0<8388609){_=ai;ab=aj;aa=am;$=an;ah=al}else{break L2718}}}}while(0);R=T+2|0;if((c[O>>2]|0)>0){ap=0}else{break}while(1){c[u+(H*4260&-1)+2420+(ap<<2)>>2]=R>>>(ap>>>0)&1;Z=ap+1|0;if((Z|0)<(c[O>>2]|0)){ap=Z}else{break L2710}}}}while(0);P=H+1|0;O=c[w>>2]|0;if((P|0)<(O|0)){H=P}else{af=O;break L2687}}}else{af=K}}while(0);if((h|0)!=0){M=0;break}K=f+2392|0;H=c[K>>2]|0;if((H|0)<=0){M=0;break}z=q|0;E=f+6680|0;x=k+28|0;I=k+32|0;N=k+20|0;A=k+40|0;y=k+24|0;O=k+4|0;P=k|0;R=s|0;T=0;Z=0;U=af;S=H;while(1){if((U|0)>0){H=E+(Z<<2)|0;ah=(Z|0)>0;$=Z-1|0;aa=T;ab=0;_=U;while(1){Q=u+(ab*4260&-1)|0;if((c[u+(ab*4260&-1)+2420+(Z<<2)>>2]|0)==0){aq=aa;ar=_}else{L2740:do{if((_|0)==2&(ab|0)==0){bO(k,z);if((c[H>>2]|0)!=0){as=aa;break}al=c[x>>2]|0;aj=c[I>>2]|0;ai=al>>>8;at=-1;au=al;while(1){av=at+1|0;aw=X(d[av+5243516|0]|0,ai);if(aj>>>0<aw>>>0){at=av;au=aw}else{break}}at=aj-aw|0;c[I>>2]=at;ai=au-aw|0;c[x>>2]=ai;if(ai>>>0>=8388609){as=av;break}al=c[O>>2]|0;ax=c[N>>2]|0;ay=ai;ai=c[A>>2]|0;az=c[y>>2]|0;aA=at;while(1){at=ax+8|0;c[N>>2]=at;aB=ay<<8;c[x>>2]=aB;if(az>>>0<al>>>0){aC=az+1|0;c[y>>2]=aC;aD=d[(c[P>>2]|0)+az|0]|0;aE=aC}else{aD=0;aE=az}c[A>>2]=aD;aC=((aD|ai<<8)>>>1&255|aA<<8&2147483392)^255;c[I>>2]=aC;if(aB>>>0<8388609){ax=at;ay=aB;ai=aD;az=aE;aA=aC}else{as=av;break L2740}}}else{as=aa}}while(0);do{if(ah){if((c[u+(ab*4260&-1)+2420+($<<2)>>2]|0)==0){G=1861;break}else{aF=2;break}}else{G=1861}}while(0);if((G|0)==1861){G=0;aF=0}bu(Q,k,Z,1,aF);bv(k,R,a[u+(ab*4260&-1)+2765|0]<<24>>24,a[u+(ab*4260&-1)+2766|0]<<24>>24,c[u+(ab*4260&-1)+2328>>2]|0);aq=as;ar=c[w>>2]|0}aA=ab+1|0;if((aA|0)<(ar|0)){aa=aq;ab=aA;_=ar}else{break}}aG=aq;aH=ar;aI=c[K>>2]|0}else{aG=T;aH=U;aI=S}_=Z+1|0;if((_|0)<(aI|0)){T=aG;Z=_;U=aH;S=aI}else{M=aG;break L2684}}}}while(0);aG=c[w>>2]|0;do{if((aG|0)==2){do{if((h|0)==2){if((c[(f+2420|0)+(c[j>>2]<<2)>>2]|0)!=1){G=1868;break}bO(k,q|0);if((c[(f+6680|0)+(c[j>>2]<<2)>>2]|0)==0){G=1872;break}else{aJ=0;break}}else if((h|0)==0){bO(k,q|0);if((c[(f+6664|0)+(c[j>>2]<<2)>>2]|0)==0){G=1872;break}else{aJ=0;break}}else{G=1868}}while(0);L2768:do{if((G|0)==1868){c[q>>2]=b[f+8520>>1]<<16>>16;c[q+4>>2]=b[f+8522>>1]<<16>>16;aJ=M}else if((G|0)==1872){aI=k+28|0;aH=c[aI>>2]|0;ar=k+32|0;aq=c[ar>>2]|0;as=aH>>>8;aF=-1;av=aH;while(1){aK=aF+1|0;aL=X(d[aK+5243516|0]|0,as);if(aq>>>0<aL>>>0){aF=aK;av=aL}else{break}}aF=aq-aL|0;c[ar>>2]=aF;as=av-aL|0;c[aI>>2]=as;if(as>>>0>=8388609){aJ=aK;break}aH=k+20|0;aE=k+40|0;aD=k+24|0;aw=k|0;af=c[k+4>>2]|0;s=c[aH>>2]|0;ap=as;as=c[aE>>2]|0;an=c[aD>>2]|0;am=aF;while(1){aF=s+8|0;c[aH>>2]=aF;ag=ap<<8;c[aI>>2]=ag;if(an>>>0<af>>>0){ae=an+1|0;c[aD>>2]=ae;aM=d[(c[aw>>2]|0)+an|0]|0;aN=ae}else{aM=0;aN=an}c[aE>>2]=aM;ae=((aM|as<<8)>>>1&255|am<<8&2147483392)^255;c[ar>>2]=ae;if(ag>>>0<8388609){s=aF;ap=ag;as=aM;an=aN;am=ae}else{aJ=aK;break L2768}}}}while(0);am=c[w>>2]|0;if(!((am|0)==2&(aJ|0)==0)){aO=aJ;aP=am;break}if((c[f+8540>>2]|0)!=1){aO=0;aP=2;break}b_(f+5544|0,0,1024);c[f+6568>>2]=100;a[f+6572|0]=10;c[f+8424>>2]=0;c[f+6636>>2]=1;aO=0;aP=c[w>>2]|0}else{aO=M;aP=aG}}while(0);aG=f+2328|0;M=X((c[aG>>2]|0)+2|0,aP);aP=ao()|0;aJ=i;i=i+(M*2&-1)|0;i=i+3>>2<<2;c[p>>2]=aJ;M=aJ+((c[aG>>2]|0)+2<<1)|0;c[p+4>>2]=M;do{if((h|0)==0){aQ=(aO|0)==0;G=1887;break}else{if((c[f+8540>>2]|0)==0){aQ=1;G=1887;break}aG=c[w>>2]|0;if(!((aG|0)==2&(h|0)==2)){aR=0;aS=aG;break}aQ=(c[(f+6680|0)+(c[f+6648>>2]<<2)>>2]|0)==1;G=1887;break}}while(0);if((G|0)==1887){aR=aQ;aS=c[w>>2]|0}do{if((aS|0)>0){aQ=aR^1;aG=(h|0)==2;aK=f+8540|0;aN=0;while(1){if((aN|0)!=0&aQ){b_((c[p+(aN<<2)>>2]|0)+4|0,0,c[o>>2]<<1|0)}else{aM=(c[j>>2]|0)-aN|0;do{if((aM|0)<1){aT=0}else{if(aG){aT=(c[u+(aN*4260&-1)+2420+(aM-1<<2)>>2]|0)!=0?2:0;break}if((aN|0)>0){if((c[aK>>2]|0)!=0){aT=1;break}}aT=2}}while(0);bs(u+(aN*4260&-1)|0,k,(c[p+(aN<<2)>>2]|0)+4|0,o,h,aT)}aM=u+(aN*4260&-1)+2388|0;c[aM>>2]=(c[aM>>2]|0)+1|0;aM=aN+1|0;aU=c[w>>2]|0;if((aM|0)<(aU|0)){aN=aM}else{break}}if(!((c[B>>2]|0)==2&(aU|0)==2)){G=1902;break}aN=f+2316|0;aK=c[o>>2]|0;bE(f+8520|0,aJ,M,q|0,c[aN>>2]|0,aK);aV=aK;aW=aN;break}else{G=1902}}while(0);if((G|0)==1902){G=f+8524|0;c[aJ>>2]=e[G>>1]|e[G+2>>1]<<16;q=c[o>>2]|0;o=aJ+(q<<1)|0;r=e[o>>1]|e[o+2>>1]<<16;b[G>>1]=r&65535;b[G+2>>1]=r>>16;aV=q;aW=f+2316|0}q=X(c[L>>2]|0,aV);L=(q|0)/((c[aW>>2]<<16>>16)*1e3&-1|0)&-1;c[m>>2]=L;q=c[B>>2]|0;if((q|0)==2){G=i;i=i+(L*2&-1)|0;i=i+3>>2<<2;aX=G}else{aX=l}G=c[w>>2]|0;L2817:do{if((((q|0)<(G|0)?q:G)|0)>0){L=0;o=aJ;while(1){bL(u+(L*4260&-1)+2432|0,aX,o+2|0,aV);M=c[B>>2]|0;do{if((M|0)==2){if((c[m>>2]|0)>0){aY=0}else{aZ=2;break}while(1){b[l+((aY<<1)+L<<1)>>1]=b[aX+(aY<<1)>>1]|0;aU=aY+1|0;if((aU|0)<(c[m>>2]|0)){aY=aU}else{break}}aZ=c[B>>2]|0}else{aZ=M}}while(0);M=L+1|0;Q=c[w>>2]|0;if((M|0)>=(((aZ|0)<(Q|0)?aZ:Q)|0)){a_=aZ;a$=Q;break L2817}L=M;o=c[p+(M<<2)>>2]|0}}else{a_=q;a$=G}}while(0);L2828:do{if((a_|0)==2&(a$|0)==1){if(C){G=f+6692|0;q=aJ+2|0;bL(G,aX,q,aV);if((c[m>>2]|0)>0){a0=0}else{break}while(1){b[l+((a0<<1|1)<<1)>>1]=b[aX+(a0<<1)>>1]|0;q=a0+1|0;if((q|0)<(c[m>>2]|0)){a0=q}else{break L2828}}}else{if((c[m>>2]|0)>0){a1=0}else{break}while(1){q=a1<<1;b[l+((q|1)<<1)>>1]=b[l+(q<<1)>>1]|0;q=a1+1|0;if((q|0)<(c[m>>2]|0)){a1=q}else{break L2828}}}}}while(0);if((c[f+4164>>2]|0)==2){c[g+20>>2]=X(c[5247484+((c[aW>>2]|0)-8>>2<<2)>>2]|0,c[f+2308>>2]|0)}else{c[g+20>>2]=0}L2842:do{if(D){if((c[v>>2]|0)>0){a2=0}else{break}while(1){a[t+(a2*4260&-1)+2312|0]=10;g=a2+1|0;if((g|0)<(c[v>>2]|0)){a2=g}else{break L2842}}}else{c[f+8540>>2]=aO}}while(0);ak(aP|0);F=J;i=n;return F|0}function by(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((g|0)>0){h=0}else{return}while(1){i=a[d+h|0]<<24>>24;do{if((h|f|0)==0){j=(a[e]<<24>>24)-16|0;k=((i|0)>(j|0)?i:j)&255;a[e]=k;l=k}else{k=i-4|0;j=a[e]<<24>>24;if((k|0)>(j+8|0)){m=(k<<1)+248&255;a[e]=m;l=m;break}else{m=j+k&255;a[e]=m;l=m;break}}}while(0);if(l<<24>>24>63){n=63}else{n=l<<24>>24<0?0:l}a[e]=n;i=n<<24>>24;m=((i*29&-1)+2090|0)+((i*7281&-1)>>16)|0;i=(m|0)<3967?m:3967;if((i|0)<0){o=0}else{m=i>>7;k=1<<m;j=i&127;if((i|0)<2048){p=(X(j*-174&-1,128-j|0)>>16)+j<<m>>7}else{p=X((X(j*-174&-1,128-j|0)>>16)+j|0,k>>7)}o=p+k|0}c[b+(h<<2)>>2]=o;k=h+1|0;if((k|0)==(g|0)){break}else{h=k}}return}function bz(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;j=i;i=i+80|0;k=j|0;l=j+16|0;m=j+48|0;n=h+2|0;o=b[n>>1]|0;p=X(o<<16>>16,a[g]<<24>>24);q=c[h+8>>2]|0;L2873:do{if(o<<16>>16>0){r=0;while(1){b[f+(r<<1)>>1]=(d[q+(r+p|0)|0]|0)<<7;s=r+1|0;t=b[n>>1]|0;u=t<<16>>16;if((s|0)<(u|0)){r=s}else{break}}L2877:do{if(t<<16>>16>0){r=X(a[g]<<24>>24,u);s=c[h+16>>2]|0;v=0;w=(c[h+20>>2]|0)+((r|0)/2&-1)|0;while(1){r=d[w]|0;x=t<<16>>16;y=x-1|0;a[k+v|0]=a[s+((y&-(r&1))+v|0)|0]|0;z=v|1;a[k+z|0]=a[s+((y&-(r>>>4&1))+z|0)|0]|0;z=v+2|0;if((z|0)<(x|0)){v=z;w=w+1|0}else{break L2877}}}}while(0);if(t<<16>>16<=0){A=t;B=1954;break}w=t<<16>>16;v=b[h+4>>1]<<16>>16;s=0;z=w;while(1){x=z-1|0;r=X(d[k+x|0]|0,s)>>8;y=a[g+z|0]<<24>>24<<10;if((y|0)>0){C=y-102|0}else{C=(y|0)<0?y|102:y}y=X(C>>16,v);D=(y+r|0)+(X(C&65535,v)>>16)|0;b[l+(x<<1)>>1]=D&65535;if((x|0)>0){s=D<<16>>16;z=x}else{E=w;break L2873}}}else{A=o;B=1954}}while(0);if((B|0)==1954){E=A<<16>>16}bI(m|0,f,E);E=b[n>>1]|0;if(E<<16>>16>0){F=0}else{G=E<<16>>16;H=h+32|0;I=c[H>>2]|0;bH(f,I,G);i=j;return}while(1){E=(e[m+(F<<1)>>1]|0)<<16;if((E|0)<1){J=0}else{A=am(E|0,1)|0;B=24-A|0;do{if((A|0)==24){K=E;L=24}else{if((B|0)<0){K=E>>>((B+32|0)>>>0)|E<<-B;L=A;break}else{K=E<<32-B|E>>>(B>>>0);L=A;break}}}while(0);A=((L&1|0)==0?46214:32768)>>>(L>>>1>>>0);B=X(K&127,13959168)>>>16;E=X(A>>16,B);J=(E+A|0)+(X(A&65535,B)>>>16)|0}B=f+(F<<1)|0;A=((b[l+(F<<1)>>1]<<16>>16<<14|0)/(J|0)&-1)+(b[B>>1]<<16>>16)|0;if((A|0)>32767){M=32767}else{M=(A|0)<0?0:A&65535}b[B>>1]=M;B=F+1|0;A=b[n>>1]<<16>>16;if((B|0)<(A|0)){F=B}else{G=A;break}}H=h+32|0;I=c[H>>2]|0;bH(f,I,G);i=j;return}function bA(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;h=c[d+2316>>2]|0;i=d+4248|0;if((h|0)!=(c[i>>2]|0)){c[d+4168>>2]=c[d+2328>>2]<<7;c[d+4240>>2]=65536;c[d+4244>>2]=65536;c[d+4256>>2]=20;c[d+4252>>2]=2;c[i>>2]=h}if((g|0)!=0){bB(d,e,f);f=d+4160|0;c[f>>2]=(c[f>>2]|0)+1|0;return}f=d+4168|0;g=a[d+2765|0]|0;c[d+4164>>2]=g<<24>>24;L2917:do{if(g<<24>>24==2){i=d+2332|0;j=c[d+2324>>2]|0;k=j-1|0;l=e+(k<<2)|0;m=c[l>>2]|0;n=d+4172|0;o=n;do{if((m|0)<1|(j|0)==0){p=n;b[p>>1]=0;b[p+2>>1]=0;b[p+4>>1]=0;b[p+6>>1]=0;b[p+8>>1]=0;q=0;r=d+4176|0}else{p=f|0;s=j+65535|0;t=0;u=0;v=0;w=m;while(1){x=k+v|0;y=x*5&-1;z=((((b[e+96+(y+1<<1)>>1]<<16>>16)+(b[e+96+(y<<1)>>1]<<16>>16)|0)+(b[e+96+(y+2<<1)>>1]<<16>>16)|0)+(b[e+96+(y+3<<1)>>1]<<16>>16)|0)+(b[e+96+(y+4<<1)>>1]<<16>>16)|0;if((z|0)>(u|0)){y=e+96+(((s+v<<16>>16)*5&-1)<<1)|0;b[o>>1]=b[y>>1]|0;b[o+2>>1]=b[y+2>>1]|0;b[o+4>>1]=b[y+4>>1]|0;b[o+6>>1]=b[y+6>>1]|0;b[o+8>>1]=b[y+8>>1]|0;c[p>>2]=c[e+(x<<2)>>2]<<8;A=z;B=c[l>>2]|0}else{A=u;B=w}z=t+1|0;x=t^-1;if((X(c[i>>2]|0,z)|0)>=(B|0)|(z|0)==(j|0)){break}else{t=z;u=A;v=x;w=B}}b[o>>1]=0;b[o+2>>1]=0;b[o+4>>1]=0;b[o+6>>1]=0;b[o+8>>1]=0;w=d+4176|0;b[w>>1]=A&65535;if((A|0)<11469){q=A;r=w;break}if((A|0)<=15565){C=j;D=i;break L2917}b[d+4172>>1]=0;b[d+4174>>1]=0;b[w>>1]=X((255016960/(A|0)&-1)<<16>>16,A<<16>>16)>>>14&65535;b[d+4178>>1]=0;b[d+4180>>1]=0;C=j;D=i;break L2917}}while(0);b[d+4172>>1]=0;b[d+4174>>1]=0;b[r>>1]=X((11744256/(((q|0)>1?q:1)|0)&-1)<<16>>16,q<<16>>16)>>>10&65535;b[d+4178>>1]=0;b[d+4180>>1]=0;C=j;D=i}else{c[f>>2]=(h<<16>>16)*4608&-1;o=d+4172|0;b[o>>1]=0;b[o+2>>1]=0;b[o+4>>1]=0;b[o+6>>1]=0;b[o+8>>1]=0;C=c[d+2324>>2]|0;D=d+2332|0}}while(0);b$(d+4182|0,e+64|0,c[d+2340>>2]<<1);b[d+4236>>1]=c[e+136>>2]&65535;h=e+16+(C-2<<2)|0;e=d+4240|0;f=c[h+4>>2]|0;c[e>>2]=c[h>>2]|0;c[e+4>>2]=f;c[d+4256>>2]=c[D>>2]|0;c[d+4252>>2]=C;return}function bB(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;f=i;i=i+32|0;g=f|0;h=c[a+4256>>2]|0;j=i;i=i+((h<<1)*2&-1)|0;i=i+3>>2<<2;k=a+2336|0;l=c[k>>2]|0;m=i;i=i+(l*2&-1)|0;i=i+3>>2<<2;n=a+2328|0;o=i;i=i+(((c[n>>2]|0)+l|0)*4&-1)|0;i=i+3>>2<<2;l=c[a+4240>>2]|0;p=l>>>6;q=a+4244|0;r=c[q>>2]|0;s=r>>6;if((c[a+2376>>2]|0)!=0){b_(a+4182|0,0,32)}t=a+4252|0;u=(h|0)>0;L2938:do{if(u){v=c[t>>2]|0;w=0;while(1){x=c[a+4+(X(v-2|0,h)+w<<2)>>2]|0;y=p<<16>>16;z=X(y,x>>16);A=(X(y,x&65535)>>16)+z|0;z=A+X((l>>21)+1>>1,x)>>8;if((z|0)>32767){B=32767}else{B=(z|0)<-32768?-32768:z&65535}b[j+(w<<1)>>1]=B;z=w+1|0;if((z|0)<(h|0)){w=z}else{break}}if(!u){break}w=c[t>>2]|0;v=0;while(1){z=c[a+4+(X(w-1|0,h)+v<<2)>>2]|0;x=s<<16>>16;A=X(x,z>>16);y=(X(x,z&65535)>>16)+A|0;A=y+X((r>>21)+1>>1,z)>>8;if((A|0)>32767){C=32767}else{C=(A|0)<-32768?-32768:A&65535}b[j+(h+v<<1)>>1]=C;A=v+1|0;if((A|0)<(h|0)){v=A}else{break L2938}}}}while(0);C=h-1|0;u=0;B=0;while(1){if((B|0)>=(C|0)){D=B;E=0;F=u;break}G=b[j+(B<<1)>>1]|0;l=G<<16>>16;p=X(l,l)+u|0;l=b[j+((B|1)<<1)>>1]<<16>>16;H=p+X(l,l)|0;if((H|0)<0){I=2002;break}else{u=H;B=B+2|0}}L2956:do{if((I|0)==2002){u=B;l=2;p=H>>>2;v=G;while(1){w=v<<16>>16;A=X(w,w);w=b[j+((u|1)<<1)>>1]<<16>>16;z=((X(w,w)+A|0)>>>(l>>>0))+p|0;if((z|0)<0){J=z>>>2;K=l+2|0}else{J=z;K=l}z=u+2|0;if((z|0)>=(C|0)){D=z;E=K;F=J;break L2956}u=z;l=K;p=J;v=b[j+(z<<1)>>1]|0}}}while(0);if((D|0)==(C|0)){D=b[j+(C<<1)>>1]<<16>>16;L=(X(D,D)>>>(E>>>0))+F|0}else{L=F}if(L>>>0>1073741823){M=L>>>2;N=E+2|0}else{M=L;N=E}E=0;L=0;while(1){if((L|0)>=(C|0)){O=L;P=0;Q=E;break}F=b[j+(L+h<<1)>>1]<<16>>16;D=X(F,F)+E|0;F=b[j+((L|1)+h<<1)>>1]<<16>>16;R=D+X(F,F)|0;if((R|0)<0){I=2014;break}else{E=R;L=L+2|0}}L2974:do{if((I|0)==2014){E=L;F=2;D=R>>>2;while(1){J=b[j+(E+h<<1)>>1]<<16>>16;K=X(J,J);J=b[j+((E|1)+h<<1)>>1]<<16>>16;G=((X(J,J)+K|0)>>>(F>>>0))+D|0;if((G|0)<0){S=G>>>2;T=F+2|0}else{S=G;T=F}G=E+2|0;if((G|0)<(C|0)){E=G;F=T;D=S}else{O=G;P=T;Q=S;break L2974}}}}while(0);if((O|0)==(C|0)){O=b[j+(C+h<<1)>>1]<<16>>16;U=(X(O,O)>>>(P>>>0))+Q|0}else{U=Q}if(U>>>0>1073741823){V=U>>>2;W=P+2|0}else{V=U;W=P}P=c[t>>2]|0;if((M>>W|0)<(V>>N|0)){N=X(h,P-1|0)-128|0;Y=(N|0)<0?0:N}else{N=X(h,P)-128|0;Y=(N|0)<0?0:N}N=a+4172|0;P=a+4224|0;h=b[P>>1]|0;V=a+4160|0;W=c[V>>2]|0;M=(W|0)>1?1:W;W=b[5257924+(M<<1)>>1]|0;t=a+4164|0;U=b[((c[t>>2]|0)==2?5257892:5257896)+(M<<1)>>1]<<16>>16;M=a+4182|0;Q=M|0;O=a+2340|0;C=(c[O>>2]|0)-1|0;L2992:do{if((C|0)>0){j=0;S=64881;while(1){T=a+4182+(j<<1)|0;b[T>>1]=((X(b[T>>1]<<16>>16,S)>>>15)+1|0)>>>1&65535;T=(((S*-655&-1)>>15)+1>>1)+S|0;R=j+1|0;if((R|0)==(C|0)){Z=T;break L2992}else{j=R;S=T}}}else{Z=64881}}while(0);S=a+4182+(C<<1)|0;b[S>>1]=((X(b[S>>1]<<16>>16,Z)>>>15)+1|0)>>>1&65535;Z=c[O>>2]|0;b$(g,M,Z<<1);do{if((c[V>>2]|0)==0){if((c[t>>2]|0)==2){M=((((16384-(b[N>>1]|0)&65535)-(b[a+4174>>1]|0)&65535)-(b[a+4176>>1]|0)&65535)-(b[a+4178>>1]|0)&65535)-(b[a+4180>>1]|0)&65535;_=X(b[a+4236>>1]<<16>>16,M<<16>>16<3277?3277:M<<16>>16)>>>14&65535;$=U;break}else{M=bG(Q,Z)|0;S=(M|0)>134217728?134217728:M;M=(S|0)<4194304?33554432:S<<3;S=X(M>>16,U);_=16384;$=(X(M&65528,U)>>16)+S>>14;break}}else{_=h;$=U}}while(0);U=a+4220|0;h=c[U>>2]|0;Q=a+4168|0;t=(c[Q>>2]>>7)+1>>1;V=c[k>>2]|0;S=((V-2|0)-Z|0)-t|0;M=g|0;bF(m+(S<<1)|0,a+1348+(S<<1)|0,M,V-S|0,Z);Z=c[q>>2]|0;q=(Z|0)>0?Z:-Z|0;if((q|0)==0){aa=32}else{aa=am(q|0,1)|0}q=Z<<aa-1;Z=q>>16;C=536870911/(Z|0)&-1;j=C<<16;T=j>>16;R=X(Z,T);Z=(536870912-R|0)-(X(q&65535,T)>>16)<<3;q=X(Z>>16,T);R=X(Z&65528,T)>>16;T=((X(Z,(C>>15)+1>>1)+j|0)+q|0)+R|0;R=62-aa|0;aa=R-46|0;if((aa|0)<1){q=46-R|0;R=-2147483648>>q;j=2147483647>>>(q>>>0);do{if((R|0)>(j|0)){if((T|0)>(R|0)){ab=R;break}ab=(T|0)<(j|0)?j:T}else{if((T|0)>(j|0)){ab=j;break}ab=(T|0)<(R|0)?R:T}}while(0);ac=ab<<q}else{ac=(aa|0)<32?T>>aa:0}aa=(ac|0)<1073741823?ac:1073741823;ac=c[O>>2]|0;T=ac+S|0;S=c[k>>2]|0;L3015:do{if((T|0)<(S|0)){k=aa>>16;q=aa&65535;ab=T;while(1){R=b[m+(ab<<1)>>1]<<16>>16;j=X(R,k);c[o+(ab<<2)>>2]=(X(R,q)>>16)+j|0;j=ab+1|0;if((j|0)<(S|0)){ab=j}else{break L3015}}}}while(0);m=c[a+2324>>2]|0;L3020:do{if((m|0)>0){T=W<<16>>16;aa=$<<16>>16;ab=a+2316|0;q=a+4174|0;k=a+4176|0;j=a+4178|0;R=a+4180|0;C=c[a+2332>>2]|0;Z=h;L=_;I=V;D=t;F=0;while(1){L3024:do{if((C|0)>0){E=L<<16>>16;G=b[N>>1]|0;K=b[q>>1]|0;J=b[k>>1]|0;H=b[j>>1]|0;B=b[R>>1]|0;v=o+((I+2|0)-D<<2)|0;p=Z;l=I;u=0;while(1){z=c[v>>2]|0;A=G<<16>>16;w=X(A,z>>16);y=X(A,z&65535)>>16;z=c[v-4>>2]|0;A=K<<16>>16;x=X(A,z>>16);ad=X(A,z&65535)>>16;z=c[v-8>>2]|0;A=J<<16>>16;ae=X(A,z>>16);af=X(A,z&65535)>>16;z=c[v-12>>2]|0;A=H<<16>>16;ag=X(A,z>>16);ah=X(A,z&65535)>>16;z=c[v-16>>2]|0;A=B<<16>>16;ai=X(A,z>>16);aj=X(A,z&65535)>>16;z=X(p,196314165)+907633515|0;A=c[a+4+((z>>>25)+Y<<2)>>2]|0;ak=X(A>>16,E);c[o+(l<<2)>>2]=(((((((((((w+2|0)+y|0)+x|0)+ad|0)+ae|0)+af|0)+ag|0)+ah|0)+ai|0)+aj|0)+ak|0)+(X(A&65535,E)>>16)<<2;A=l+1|0;ak=u+1|0;if((ak|0)<(C|0)){v=v+4|0;p=z;l=A;u=ak}else{al=z;an=A;ao=G;ap=K;aq=J;ar=H;as=B;at=E;break L3024}}}else{al=Z;an=I;ao=b[N>>1]|0;ap=b[q>>1]|0;aq=b[k>>1]|0;ar=b[j>>1]|0;as=b[R>>1]|0;at=L<<16>>16}}while(0);b[N>>1]=X(ao<<16>>16,T)>>>15&65535;b[q>>1]=X(ap<<16>>16,T)>>>15&65535;b[k>>1]=X(aq<<16>>16,T)>>>15&65535;b[j>>1]=X(ar<<16>>16,T)>>>15&65535;b[R>>1]=X(as<<16>>16,T)>>>15&65535;E=X(at,aa)>>>15&65535;B=c[Q>>2]|0;H=(((B>>16)*655&-1)+B|0)+(((B&65535)*655&-1)>>>16)|0;B=(c[ab>>2]<<16>>16)*4608&-1;J=(H|0)<(B|0)?H:B;c[Q>>2]=J;B=(J>>7)+1>>1;J=F+1|0;if((J|0)<(m|0)){Z=al;L=E;I=an;D=B;F=J}else{au=al;av=E;aw=B;break L3020}}}else{au=h;av=_;aw=t}}while(0);t=S-16|0;_=a+1284|0;b$(o+(t<<2)|0,_,64);a=c[n>>2]|0;if((a|0)<=0){ax=a;ay=ax+t|0;az=o+(ay<<2)|0;aA=az;b$(_,aA,64);c[U>>2]=au;b[P>>1]=av;aB=d|0;c[aB>>2]=aw;aC=d+4|0;c[aC>>2]=aw;aD=d+8|0;c[aD>>2]=aw;aE=d+12|0;c[aE>>2]=aw;i=f;return}a=S-1|0;h=b[M>>1]<<16>>16;M=S-2|0;al=b[g+2>>1]<<16>>16;an=S-3|0;m=b[g+4>>1]<<16>>16;Q=S-4|0;at=b[g+6>>1]<<16>>16;as=S-5|0;ar=b[g+8>>1]<<16>>16;aq=S-6|0;ap=b[g+10>>1]<<16>>16;ao=S-7|0;N=b[g+12>>1]<<16>>16;Y=S-8|0;V=b[g+14>>1]<<16>>16;$=S-9|0;W=b[g+16>>1]<<16>>16;F=S-10|0;D=b[g+18>>1]<<16>>16;I=s<<16>>16;s=(r>>21)+1>>1;r=0;L=ac;while(1){ac=a+r|0;Z=c[o+(ac<<2)>>2]|0;ab=X(h,Z>>16);aa=X(h,Z&65535)>>16;Z=c[o+(M+r<<2)>>2]|0;T=X(al,Z>>16);R=X(al,Z&65535)>>16;Z=c[o+(an+r<<2)>>2]|0;j=X(m,Z>>16);k=X(m,Z&65535)>>16;Z=c[o+(Q+r<<2)>>2]|0;q=X(at,Z>>16);C=X(at,Z&65535)>>16;Z=c[o+(as+r<<2)>>2]|0;B=X(ar,Z>>16);E=X(ar,Z&65535)>>16;Z=c[o+(aq+r<<2)>>2]|0;J=X(ap,Z>>16);H=X(ap,Z&65535)>>16;Z=c[o+(ao+r<<2)>>2]|0;K=X(N,Z>>16);G=X(N,Z&65535)>>16;Z=c[o+(Y+r<<2)>>2]|0;u=X(V,Z>>16);l=X(V,Z&65535)>>16;Z=c[o+($+r<<2)>>2]|0;p=X(W,Z>>16);v=X(W,Z&65535)>>16;Z=c[o+(F+r<<2)>>2]|0;A=X(D,Z>>16);z=(((((((((((((((((((ab+(L>>1)|0)+aa|0)+T|0)+R|0)+j|0)+k|0)+q|0)+C|0)+B|0)+E|0)+J|0)+H|0)+K|0)+G|0)+u|0)+l|0)+p|0)+v|0)+A|0)+(X(D,Z&65535)>>16)|0;L3036:do{if((L|0)>10){Z=z;A=10;while(1){v=c[o+(ac-A<<2)>>2]|0;p=b[g+(A<<1)>>1]<<16>>16;l=X(p,v>>16);u=(l+Z|0)+(X(p,v&65535)>>16)|0;v=A+1|0;if((v|0)<(L|0)){Z=u;A=v}else{aF=u;break L3036}}}else{aF=z}}while(0);z=o+(r+S<<2)|0;ac=(c[z>>2]|0)+(aF<<4)|0;c[z>>2]=ac;z=X(I,ac>>16);A=(X(I,ac&65535)>>16)+z|0;z=(A+X(s,ac)>>7)+1>>1;if((z|0)>32767){aG=32767}else{aG=(z|0)<-32768?-32768:z&65535}b[e+(r<<1)>>1]=aG;z=r+1|0;ac=c[n>>2]|0;if((z|0)>=(ac|0)){ax=ac;break}r=z;L=c[O>>2]|0}ay=ax+t|0;az=o+(ay<<2)|0;aA=az;b$(_,aA,64);c[U>>2]=au;b[P>>1]=av;aB=d|0;c[aB>>2]=aw;aC=d+4|0;c[aC>>2]=aw;aD=d+8|0;c[aD>>2]=aw;aE=d+12|0;c[aE>>2]=aw;i=f;return}function bC(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;if((c[a+4160>>2]|0)!=0){f=a+4228|0;g=a+4232|0;h=e-1|0;i=0;j=0;while(1){if((j|0)>=(h|0)){k=j;l=0;m=i;break}n=b[d+(j<<1)>>1]|0;o=n<<16>>16;p=X(o,o)+i|0;o=b[d+((j|1)<<1)>>1]<<16>>16;q=p+X(o,o)|0;if((q|0)<0){r=2071;break}else{i=q;j=j+2|0}}L3051:do{if((r|0)==2071){i=j;o=2;p=q>>>2;s=n;while(1){t=s<<16>>16;u=X(t,t);t=b[d+((i|1)<<1)>>1]<<16>>16;v=((X(t,t)+u|0)>>>(o>>>0))+p|0;if((v|0)<0){w=v>>>2;x=o+2|0}else{w=v;x=o}v=i+2|0;if((v|0)>=(h|0)){k=v;l=x;m=w;break L3051}i=v;o=x;p=w;s=b[d+(v<<1)>>1]|0}}}while(0);if((k|0)==(h|0)){k=b[d+(h<<1)>>1]<<16>>16;y=(X(k,k)>>>(l>>>0))+m|0}else{y=m}if(y>>>0>1073741823){z=y>>>2;A=l+2|0}else{z=y;A=l}c[g>>2]=A;c[f>>2]=z;c[a+4216>>2]=1;return}z=a+4216|0;L3068:do{if((c[z>>2]|0)!=0){f=e-1|0;A=0;g=0;while(1){if((g|0)>=(f|0)){B=g;C=0;D=A;break}E=b[d+(g<<1)>>1]|0;l=E<<16>>16;y=X(l,l)+A|0;l=b[d+((g|1)<<1)>>1]<<16>>16;F=y+X(l,l)|0;if((F|0)<0){r=2085;break}else{A=F;g=g+2|0}}L3073:do{if((r|0)==2085){A=g;l=2;y=F>>>2;m=E;while(1){k=m<<16>>16;h=X(k,k);k=b[d+((A|1)<<1)>>1]<<16>>16;w=((X(k,k)+h|0)>>>(l>>>0))+y|0;if((w|0)<0){G=w>>>2;H=l+2|0}else{G=w;H=l}w=A+2|0;if((w|0)>=(f|0)){B=w;C=H;D=G;break L3073}A=w;l=H;y=G;m=b[d+(w<<1)>>1]|0}}}while(0);if((B|0)==(f|0)){g=b[d+(f<<1)>>1]<<16>>16;I=(X(g,g)>>>(C>>>0))+D|0}else{I=D}if(I>>>0>1073741823){J=I>>>2;K=C+2|0}else{J=I;K=C}g=c[a+4232>>2]|0;do{if((K|0)>(g|0)){m=a+4228|0;c[m>>2]=c[m>>2]>>K-g;L=J}else{if((K|0)>=(g|0)){L=J;break}L=J>>g-K}}while(0);g=a+4228|0;f=c[g>>2]|0;if((L|0)<=(f|0)){break}if((f|0)==0){M=32}else{M=am(f|0,1)|0}m=f<<M-1;c[g>>2]=m;g=25-M|0;f=L>>((g|0)>0?g:0);g=(m|0)/(((f|0)>1?f:1)|0)&-1;if((g|0)<1){N=0}else{f=am(g|0,1)|0;m=24-f|0;do{if((f|0)==24){O=g;P=24}else{if((m|0)<0){O=g>>>((m+32|0)>>>0)|g<<-m;P=f;break}else{O=g<<32-m|g>>>(m>>>0);P=f;break}}}while(0);f=((P&1|0)==0?46214:32768)>>>(P>>>1>>>0);m=X(O&127,13959168)>>>16;g=X(f>>16,m);N=(g+f|0)+(X(f&65535,m)>>>16)<<4}m=((65536-N|0)/(e|0)&-1)<<2;f=N;g=0;while(1){if((g|0)>=(e|0)){break L3068}y=d+(g<<1)|0;l=b[y>>1]<<16>>16;A=X(l,f>>16);b[y>>1]=(X(l,f&65532)>>>16)+A&65535;A=f+m|0;if((A|0)>65536){break L3068}else{f=A;g=g+1|0}}}}while(0);c[z>>2]=0;return}function bD(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0;do{if((e|0)>0){f=d[e+5243564|0]|0;g=b+28|0;h=c[g>>2]|0;i=b+32|0;j=c[i>>2]|0;k=h>>>8;l=-1;m=h;while(1){n=l+1|0;o=X(d[5243584+(n+f|0)|0]|0,k);if(j>>>0<o>>>0){l=n;m=o}else{break}}l=j-o|0;c[i>>2]=l;k=m-o|0;c[g>>2]=k;L3117:do{if(k>>>0<8388609){f=b+20|0;h=b+40|0;p=b+24|0;q=b|0;r=c[b+4>>2]|0;s=c[f>>2]|0;t=k;u=c[h>>2]|0;v=c[p>>2]|0;w=l;while(1){x=s+8|0;c[f>>2]=x;y=t<<8;c[g>>2]=y;if(v>>>0<r>>>0){z=v+1|0;c[p>>2]=z;A=d[(c[q>>2]|0)+v|0]|0;B=z}else{A=0;B=v}c[h>>2]=A;z=((A|u<<8)>>>1&255|w<<8&2147483392)^255;c[i>>2]=z;if(y>>>0<8388609){s=x;t=y;u=A;v=B;w=z}else{C=y;D=z;break L3117}}}else{C=k;D=l}}while(0);l=e-n|0;if((n|0)<=0){E=l;F=0;G=2139;break}k=d[n+5243564|0]|0;m=C>>>8;j=-1;w=C;while(1){H=j+1|0;I=X(d[5243736+(H+k|0)|0]|0,m);if(D>>>0<I>>>0){j=H;w=I}else{break}}j=D-I|0;c[i>>2]=j;m=w-I|0;c[g>>2]=m;L3129:do{if(m>>>0<8388609){k=b+20|0;v=b+40|0;u=b+24|0;t=b|0;s=c[b+4>>2]|0;h=c[k>>2]|0;q=m;p=c[v>>2]|0;r=c[u>>2]|0;f=j;while(1){z=h+8|0;c[k>>2]=z;y=q<<8;c[g>>2]=y;if(r>>>0<s>>>0){x=r+1|0;c[u>>2]=x;J=d[(c[t>>2]|0)+r|0]|0;K=x}else{J=0;K=r}c[v>>2]=J;x=((J|p<<8)>>>1&255|f<<8&2147483392)^255;c[i>>2]=x;if(y>>>0<8388609){h=z;q=y;p=J;r=K;f=x}else{L=y;M=x;break L3129}}}else{L=m;M=j}}while(0);j=n-H|0;if((H|0)<=0){E=l;F=j;G=2139;break}m=d[H+5243564|0]|0;w=L>>>8;f=-1;r=L;while(1){N=f+1|0;O=X(d[5243888+(N+m|0)|0]|0,w);if(M>>>0<O>>>0){f=N;r=O}else{break}}f=M-O|0;c[i>>2]=f;w=r-O|0;c[g>>2]=w;L3141:do{if(w>>>0<8388609){m=b+20|0;p=b+40|0;q=b+24|0;h=b|0;v=c[b+4>>2]|0;t=c[m>>2]|0;u=w;s=c[p>>2]|0;k=c[q>>2]|0;x=f;while(1){y=t+8|0;c[m>>2]=y;z=u<<8;c[g>>2]=z;if(k>>>0<v>>>0){P=k+1|0;c[q>>2]=P;Q=d[(c[h>>2]|0)+k|0]|0;R=P}else{Q=0;R=k}c[p>>2]=Q;P=((Q|s<<8)>>>1&255|x<<8&2147483392)^255;c[i>>2]=P;if(z>>>0<8388609){t=y;u=z;s=Q;k=R;x=P}else{S=z;T=P;break L3141}}}else{S=w;T=f}}while(0);f=H-N|0;w=a+4|0;if((N|0)<=0){U=j;V=l;W=f;Y=w;G=2149;break}r=d[N+5243564|0]|0;x=S>>>8;k=-1;s=S;while(1){Z=k+1|0;_=X(d[5244040+(Z+r|0)|0]|0,x);if(T>>>0<_>>>0){k=Z;s=_}else{break}}k=T-_|0;c[i>>2]=k;x=s-_|0;c[g>>2]=x;L3153:do{if(x>>>0<8388609){r=b+20|0;u=b+40|0;t=b+24|0;p=b|0;h=c[b+4>>2]|0;q=c[r>>2]|0;v=x;m=c[u>>2]|0;P=c[t>>2]|0;z=k;while(1){y=q+8|0;c[r>>2]=y;$=v<<8;c[g>>2]=$;if(P>>>0<h>>>0){aa=P+1|0;c[t>>2]=aa;ab=d[(c[p>>2]|0)+P|0]|0;ac=aa}else{ab=0;ac=P}c[u>>2]=ab;aa=((ab|m<<8)>>>1&255|z<<8&2147483392)^255;c[i>>2]=aa;if($>>>0<8388609){q=y;v=$;m=ab;P=ac;z=aa}else{break L3153}}}}while(0);c[a>>2]=Z;ad=N-Z|0;ae=j;af=l;ag=f;ah=w;break}else{E=0;F=0;G=2139}}while(0);do{if((G|0)==2139){U=F;V=E;W=0;Y=a+4|0;G=2149;break}}while(0);if((G|0)==2149){c[a>>2]=0;ad=0;ae=U;af=V;ag=W;ah=Y}c[ah>>2]=ad;ad=a+8|0;ah=a+12|0;if((ag|0)>0){Y=d[ag+5243564|0]|0;W=b+28|0;V=c[W>>2]|0;U=b+32|0;E=c[U>>2]|0;F=V>>>8;Z=-1;N=V;while(1){ai=Z+1|0;aj=X(d[5244040+(ai+Y|0)|0]|0,F);if(E>>>0<aj>>>0){Z=ai;N=aj}else{break}}Z=E-aj|0;c[U>>2]=Z;E=N-aj|0;c[W>>2]=E;L3171:do{if(E>>>0<8388609){aj=b+20|0;N=b+40|0;F=b+24|0;Y=b|0;V=c[b+4>>2]|0;ac=c[aj>>2]|0;ab=E;_=c[N>>2]|0;T=c[F>>2]|0;S=Z;while(1){H=ac+8|0;c[aj>>2]=H;R=ab<<8;c[W>>2]=R;if(T>>>0<V>>>0){Q=T+1|0;c[F>>2]=Q;ak=d[(c[Y>>2]|0)+T|0]|0;al=Q}else{ak=0;al=T}c[N>>2]=ak;Q=((ak|_<<8)>>>1&255|S<<8&2147483392)^255;c[U>>2]=Q;if(R>>>0<8388609){ac=H;ab=R;_=ak;T=al;S=Q}else{break L3171}}}}while(0);c[ad>>2]=ai;am=ag-ai|0}else{c[ad>>2]=0;am=0}c[ah>>2]=am;do{if((ae|0)>0){am=d[ae+5243564|0]|0;ah=b+28|0;ad=c[ah>>2]|0;ai=b+32|0;ag=c[ai>>2]|0;al=ad>>>8;ak=-1;U=ad;while(1){an=ak+1|0;ao=X(d[5243888+(an+am|0)|0]|0,al);if(ag>>>0<ao>>>0){ak=an;U=ao}else{break}}ak=ag-ao|0;c[ai>>2]=ak;al=U-ao|0;c[ah>>2]=al;L3187:do{if(al>>>0<8388609){am=b+20|0;ad=b+40|0;W=b+24|0;Z=b|0;E=c[b+4>>2]|0;S=c[am>>2]|0;T=al;_=c[ad>>2]|0;ab=c[W>>2]|0;ac=ak;while(1){N=S+8|0;c[am>>2]=N;Y=T<<8;c[ah>>2]=Y;if(ab>>>0<E>>>0){F=ab+1|0;c[W>>2]=F;ap=d[(c[Z>>2]|0)+ab|0]|0;aq=F}else{ap=0;aq=ab}c[ad>>2]=ap;F=((ap|_<<8)>>>1&255|ac<<8&2147483392)^255;c[ai>>2]=F;if(Y>>>0<8388609){S=N;T=Y;_=ap;ab=aq;ac=F}else{ar=Y;as=F;break L3187}}}else{ar=al;as=ak}}while(0);ak=ae-an|0;al=a+16|0;U=a+20|0;if((an|0)<=0){at=ak;au=al;av=U;G=2178;break}ag=d[an+5243564|0]|0;ac=ar>>>8;ab=-1;_=ar;while(1){aw=ab+1|0;ax=X(d[5244040+(aw+ag|0)|0]|0,ac);if(as>>>0<ax>>>0){ab=aw;_=ax}else{break}}ab=as-ax|0;c[ai>>2]=ab;ac=_-ax|0;c[ah>>2]=ac;L3199:do{if(ac>>>0<8388609){ag=b+20|0;T=b+40|0;S=b+24|0;ad=b|0;Z=c[b+4>>2]|0;W=c[ag>>2]|0;E=ac;am=c[T>>2]|0;F=c[S>>2]|0;Y=ab;while(1){N=W+8|0;c[ag>>2]=N;V=E<<8;c[ah>>2]=V;if(F>>>0<Z>>>0){aj=F+1|0;c[S>>2]=aj;ay=d[(c[ad>>2]|0)+F|0]|0;az=aj}else{ay=0;az=F}c[T>>2]=ay;aj=((ay|am<<8)>>>1&255|Y<<8&2147483392)^255;c[ai>>2]=aj;if(V>>>0<8388609){W=N;E=V;am=ay;F=az;Y=aj}else{break L3199}}}}while(0);c[al>>2]=aw;aA=an-aw|0;aB=ak;aC=U;break}else{at=0;au=a+16|0;av=a+20|0;G=2178;break}}while(0);if((G|0)==2178){c[au>>2]=0;aA=0;aB=at;aC=av}c[aC>>2]=aA;aA=a+24|0;aC=a+28|0;if((aB|0)>0){av=d[aB+5243564|0]|0;at=b+28|0;au=c[at>>2]|0;aw=b+32|0;an=c[aw>>2]|0;az=au>>>8;ay=-1;ax=au;while(1){aD=ay+1|0;aE=X(d[5244040+(aD+av|0)|0]|0,az);if(an>>>0<aE>>>0){ay=aD;ax=aE}else{break}}ay=an-aE|0;c[aw>>2]=ay;an=ax-aE|0;c[at>>2]=an;L3215:do{if(an>>>0<8388609){aE=b+20|0;ax=b+40|0;az=b+24|0;av=b|0;au=c[b+4>>2]|0;as=c[aE>>2]|0;ar=an;ae=c[ax>>2]|0;aq=c[az>>2]|0;ap=ay;while(1){ao=as+8|0;c[aE>>2]=ao;ai=ar<<8;c[at>>2]=ai;if(aq>>>0<au>>>0){ah=aq+1|0;c[az>>2]=ah;aF=d[(c[av>>2]|0)+aq|0]|0;aG=ah}else{aF=0;aG=aq}c[ax>>2]=aF;ah=((aF|ae<<8)>>>1&255|ap<<8&2147483392)^255;c[aw>>2]=ah;if(ai>>>0<8388609){as=ao;ar=ai;ae=aF;aq=aG;ap=ah}else{break L3215}}}}while(0);c[aA>>2]=aD;aH=aB-aD|0}else{c[aA>>2]=0;aH=0}c[aC>>2]=aH;do{if((af|0)>0){aH=d[af+5243564|0]|0;aC=b+28|0;aA=c[aC>>2]|0;aD=b+32|0;aB=c[aD>>2]|0;aG=aA>>>8;aF=-1;aw=aA;while(1){aI=aF+1|0;aJ=X(d[5243736+(aI+aH|0)|0]|0,aG);if(aB>>>0<aJ>>>0){aF=aI;aw=aJ}else{break}}aF=aB-aJ|0;c[aD>>2]=aF;aG=aw-aJ|0;c[aC>>2]=aG;L3230:do{if(aG>>>0<8388609){aH=b+20|0;aA=b+40|0;at=b+24|0;ay=b|0;an=c[b+4>>2]|0;ap=c[aH>>2]|0;aq=aG;ae=c[aA>>2]|0;ar=c[at>>2]|0;as=aF;while(1){ax=ap+8|0;c[aH>>2]=ax;av=aq<<8;c[aC>>2]=av;if(ar>>>0<an>>>0){az=ar+1|0;c[at>>2]=az;aK=d[(c[ay>>2]|0)+ar|0]|0;aL=az}else{aK=0;aL=ar}c[aA>>2]=aK;az=((aK|ae<<8)>>>1&255|as<<8&2147483392)^255;c[aD>>2]=az;if(av>>>0<8388609){ap=ax;aq=av;ae=aK;ar=aL;as=az}else{aM=av;aN=az;break L3230}}}else{aM=aG;aN=aF}}while(0);aF=af-aI|0;if((aI|0)<=0){aO=aF;G=2205;break}aG=d[aI+5243564|0]|0;aw=aM>>>8;aB=-1;as=aM;while(1){aP=aB+1|0;aQ=X(d[5243888+(aP+aG|0)|0]|0,aw);if(aN>>>0<aQ>>>0){aB=aP;as=aQ}else{break}}aB=aN-aQ|0;c[aD>>2]=aB;aw=as-aQ|0;c[aC>>2]=aw;L3242:do{if(aw>>>0<8388609){aG=b+20|0;ar=b+40|0;ae=b+24|0;aq=b|0;ap=c[b+4>>2]|0;aA=c[aG>>2]|0;ay=aw;at=c[ar>>2]|0;an=c[ae>>2]|0;aH=aB;while(1){az=aA+8|0;c[aG>>2]=az;av=ay<<8;c[aC>>2]=av;if(an>>>0<ap>>>0){ax=an+1|0;c[ae>>2]=ax;aR=d[(c[aq>>2]|0)+an|0]|0;aS=ax}else{aR=0;aS=an}c[ar>>2]=aR;ax=((aR|at<<8)>>>1&255|aH<<8&2147483392)^255;c[aD>>2]=ax;if(av>>>0<8388609){aA=az;ay=av;at=aR;an=aS;aH=ax}else{aT=av;aU=ax;break L3242}}}else{aT=aw;aU=aB}}while(0);aB=aI-aP|0;aw=a+32|0;as=a+36|0;if((aP|0)<=0){aV=aF;aW=aB;aX=aw;aY=as;G=2215;break}aH=d[aP+5243564|0]|0;an=aT>>>8;at=-1;ay=aT;while(1){aZ=at+1|0;a_=X(d[5244040+(aZ+aH|0)|0]|0,an);if(aU>>>0<a_>>>0){at=aZ;ay=a_}else{break}}at=aU-a_|0;c[aD>>2]=at;an=ay-a_|0;c[aC>>2]=an;L3254:do{if(an>>>0<8388609){aH=b+20|0;aA=b+40|0;ar=b+24|0;aq=b|0;ae=c[b+4>>2]|0;ap=c[aH>>2]|0;aG=an;ax=c[aA>>2]|0;av=c[ar>>2]|0;az=at;while(1){au=ap+8|0;c[aH>>2]=au;aE=aG<<8;c[aC>>2]=aE;if(av>>>0<ae>>>0){U=av+1|0;c[ar>>2]=U;a$=d[(c[aq>>2]|0)+av|0]|0;a0=U}else{a$=0;a0=av}c[aA>>2]=a$;U=((a$|ax<<8)>>>1&255|az<<8&2147483392)^255;c[aD>>2]=U;if(aE>>>0<8388609){ap=au;aG=aE;ax=a$;av=a0;az=U}else{break L3254}}}}while(0);c[aw>>2]=aZ;a1=aP-aZ|0;a2=aF;a3=aB;a4=as;break}else{aO=0;G=2205}}while(0);do{if((G|0)==2205){aV=aO;aW=0;aX=a+32|0;aY=a+36|0;G=2215;break}}while(0);if((G|0)==2215){c[aX>>2]=0;a1=0;a2=aV;a3=aW;a4=aY}c[a4>>2]=a1;a1=a+40|0;a4=a+44|0;if((a3|0)>0){aY=d[a3+5243564|0]|0;aW=b+28|0;aV=c[aW>>2]|0;aX=b+32|0;aO=c[aX>>2]|0;aZ=aV>>>8;aP=-1;a0=aV;while(1){a5=aP+1|0;a6=X(d[5244040+(a5+aY|0)|0]|0,aZ);if(aO>>>0<a6>>>0){aP=a5;a0=a6}else{break}}aP=aO-a6|0;c[aX>>2]=aP;aO=a0-a6|0;c[aW>>2]=aO;L3273:do{if(aO>>>0<8388609){a6=b+20|0;a0=b+40|0;aZ=b+24|0;aY=b|0;aV=c[b+4>>2]|0;a$=c[a6>>2]|0;a_=aO;aU=c[a0>>2]|0;aT=c[aZ>>2]|0;aI=aP;while(1){aS=a$+8|0;c[a6>>2]=aS;aR=a_<<8;c[aW>>2]=aR;if(aT>>>0<aV>>>0){aQ=aT+1|0;c[aZ>>2]=aQ;a7=d[(c[aY>>2]|0)+aT|0]|0;a8=aQ}else{a7=0;a8=aT}c[a0>>2]=a7;aQ=((a7|aU<<8)>>>1&255|aI<<8&2147483392)^255;c[aX>>2]=aQ;if(aR>>>0<8388609){a$=aS;a_=aR;aU=a7;aT=a8;aI=aQ}else{break L3273}}}}while(0);c[a1>>2]=a5;a9=a3-a5|0}else{c[a1>>2]=0;a9=0}c[a4>>2]=a9;do{if((a2|0)>0){a9=d[a2+5243564|0]|0;a4=b+28|0;a1=c[a4>>2]|0;a5=b+32|0;a3=c[a5>>2]|0;a8=a1>>>8;a7=-1;aX=a1;while(1){ba=a7+1|0;bb=X(d[5243888+(ba+a9|0)|0]|0,a8);if(a3>>>0<bb>>>0){a7=ba;aX=bb}else{break}}a7=a3-bb|0;c[a5>>2]=a7;a8=aX-bb|0;c[a4>>2]=a8;L3288:do{if(a8>>>0<8388609){a9=b+20|0;a1=b+40|0;aW=b+24|0;aP=b|0;aO=c[b+4>>2]|0;aI=c[a9>>2]|0;aT=a8;aU=c[a1>>2]|0;a_=c[aW>>2]|0;a$=a7;while(1){a0=aI+8|0;c[a9>>2]=a0;aY=aT<<8;c[a4>>2]=aY;if(a_>>>0<aO>>>0){aZ=a_+1|0;c[aW>>2]=aZ;bc=d[(c[aP>>2]|0)+a_|0]|0;bd=aZ}else{bc=0;bd=a_}c[a1>>2]=bc;aZ=((bc|aU<<8)>>>1&255|a$<<8&2147483392)^255;c[a5>>2]=aZ;if(aY>>>0<8388609){aI=a0;aT=aY;aU=bc;a_=bd;a$=aZ}else{be=aY;bf=aZ;break L3288}}}else{be=a8;bf=a7}}while(0);a7=a2-ba|0;a8=a+48|0;aX=a+52|0;if((ba|0)<=0){bg=a7;bh=a8;bi=aX;G=2244;break}a3=d[ba+5243564|0]|0;a$=be>>>8;a_=-1;aU=be;while(1){bj=a_+1|0;bk=X(d[5244040+(bj+a3|0)|0]|0,a$);if(bf>>>0<bk>>>0){a_=bj;aU=bk}else{break}}a_=bf-bk|0;c[a5>>2]=a_;a$=aU-bk|0;c[a4>>2]=a$;L3300:do{if(a$>>>0<8388609){a3=b+20|0;aT=b+40|0;aI=b+24|0;a1=b|0;aP=c[b+4>>2]|0;aW=c[a3>>2]|0;aO=a$;a9=c[aT>>2]|0;aZ=c[aI>>2]|0;aY=a_;while(1){a0=aW+8|0;c[a3>>2]=a0;aV=aO<<8;c[a4>>2]=aV;if(aZ>>>0<aP>>>0){a6=aZ+1|0;c[aI>>2]=a6;bl=d[(c[a1>>2]|0)+aZ|0]|0;bm=a6}else{bl=0;bm=aZ}c[aT>>2]=bl;a6=((bl|a9<<8)>>>1&255|aY<<8&2147483392)^255;c[a5>>2]=a6;if(aV>>>0<8388609){aW=a0;aO=aV;a9=bl;aZ=bm;aY=a6}else{break L3300}}}}while(0);c[a8>>2]=bj;bn=ba-bj|0;bo=a7;bp=aX;break}else{bg=0;bh=a+48|0;bi=a+52|0;G=2244;break}}while(0);if((G|0)==2244){c[bh>>2]=0;bn=0;bo=bg;bp=bi}c[bp>>2]=bn;bn=a+56|0;bp=a+60|0;if((bo|0)<=0){c[bn>>2]=0;bq=0;c[bp>>2]=bq;return}a=d[bo+5243564|0]|0;bi=b+28|0;bg=c[bi>>2]|0;bh=b+32|0;G=c[bh>>2]|0;bj=bg>>>8;ba=-1;bm=bg;while(1){br=ba+1|0;bs=X(d[5244040+(br+a|0)|0]|0,bj);if(G>>>0<bs>>>0){ba=br;bm=bs}else{break}}ba=G-bs|0;c[bh>>2]=ba;G=bm-bs|0;c[bi>>2]=G;L3318:do{if(G>>>0<8388609){bs=b+20|0;bm=b+40|0;bj=b+24|0;a=b|0;bg=c[b+4>>2]|0;bl=c[bs>>2]|0;bk=G;bf=c[bm>>2]|0;be=c[bj>>2]|0;a2=ba;while(1){bd=bl+8|0;c[bs>>2]=bd;bc=bk<<8;c[bi>>2]=bc;if(be>>>0<bg>>>0){bb=be+1|0;c[bj>>2]=bb;bt=d[(c[a>>2]|0)+be|0]|0;bu=bb}else{bt=0;bu=be}c[bm>>2]=bt;bb=((bt|bf<<8)>>>1&255|a2<<8&2147483392)^255;c[bh>>2]=bb;if(bc>>>0<8388609){bl=bd;bk=bc;bf=bt;be=bu;a2=bb}else{break L3318}}}}while(0);c[bn>>2]=br;bq=bo-br|0;c[bp>>2]=bq;return}function bE(a,d,f,g,h,i){a=a|0;d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;j=a+4|0;k=d;r=e[j>>1]|e[j+2>>1]<<16;b[k>>1]=r&65535;b[k+2>>1]=r>>16;k=a+8|0;l=f;r=e[k>>1]|e[k+2>>1]<<16;b[l>>1]=r&65535;b[l+2>>1]=r>>16;l=d+(i<<1)|0;r=e[l>>1]|e[l+2>>1]<<16;b[j>>1]=r&65535;b[j+2>>1]=r>>16;j=f+(i<<1)|0;r=e[j>>1]|e[j+2>>1]<<16;b[k>>1]=r&65535;b[k+2>>1]=r>>16;k=a|0;j=b[k>>1]<<16>>16;l=a+2|0;a=b[l>>1]<<16>>16;m=h<<3;n=(65536/(m|0)&-1)<<16>>16;o=(X((c[g>>2]|0)-j<<16>>16,n)>>15)+1>>1;p=g+4|0;q=(X((c[p>>2]|0)-a<<16>>16,n)>>15)+1>>1;L1:do{if((m|0)>0){n=h<<3;s=0;t=j;u=a;while(1){v=t+o|0;w=u+q|0;x=s+1|0;y=b[d+(x<<1)>>1]<<16>>16;z=((b[d+(s+2<<1)>>1]<<16>>16)+(b[d+(s<<1)>>1]<<16>>16)|0)+(y<<1)|0;A=f+(x<<1)|0;B=b[A>>1]<<16>>16<<8;C=v<<16>>16;D=X(z>>7,C);E=X(z<<9&65024,C)>>16;C=w<<16>>16;z=X(y>>5,C);F=((((z+B|0)+D|0)+(X(y<<11&63488,C)>>16)|0)+E>>7)+1>>1;if((F|0)>32767){G=32767}else{G=(F|0)<-32768?-32768:F&65535}b[A>>1]=G;if((x|0)==(n|0)){break L1}else{s=x;t=v;u=w}}}}while(0);L9:do{if((m|0)<(i|0)){G=c[g>>2]<<16>>16;q=c[p>>2]<<16>>16;o=m;while(1){a=o+1|0;j=b[d+(a<<1)>>1]<<16>>16;h=((b[d+(o+2<<1)>>1]<<16>>16)+(b[d+(o<<1)>>1]<<16>>16)|0)+(j<<1)|0;u=f+(a<<1)|0;t=b[u>>1]<<16>>16<<8;s=X(h>>7,G);n=X(h<<9&65024,G)>>16;h=X(j>>5,q);w=((((h+t|0)+s|0)+(X(j<<11&63488,q)>>16)|0)+n>>7)+1>>1;if((w|0)>32767){H=32767}else{H=(w|0)<-32768?-32768:w&65535}b[u>>1]=H;if((a|0)==(i|0)){break L9}else{o=a}}}}while(0);b[k>>1]=c[g>>2]&65535;b[l>>1]=c[p>>2]&65535;if((i|0)>0){I=0}else{return}while(1){p=I+1|0;l=d+(p<<1)|0;g=b[l>>1]<<16>>16;k=f+(p<<1)|0;H=b[k>>1]<<16>>16;m=H+g|0;o=g-H|0;if((m|0)>32767){J=32767}else{J=(m|0)<-32768?-32768:m&65535}b[l>>1]=J;if((o|0)>32767){K=32767}else{K=(o|0)<-32768?-32768:o&65535}b[k>>1]=K;if((p|0)==(i|0)){break}else{I=p}}return}function bF(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((f|0)>=(e|0)){g=a;h=f<<1;b_(g|0,0,h|0);return}i=d+2|0;j=d+4|0;k=d+6|0;l=d+8|0;m=d+10|0;n=(f|0)>6;o=f;while(1){p=o-1|0;q=X(b[d>>1]<<16>>16,b[c+(p<<1)>>1]<<16>>16);r=X(b[i>>1]<<16>>16,b[c+(o-2<<1)>>1]<<16>>16)+q|0;q=r+X(b[j>>1]<<16>>16,b[c+(o-3<<1)>>1]<<16>>16)|0;r=q+X(b[k>>1]<<16>>16,b[c+(o-4<<1)>>1]<<16>>16)|0;q=r+X(b[l>>1]<<16>>16,b[c+(o-5<<1)>>1]<<16>>16)|0;r=q+X(b[m>>1]<<16>>16,b[c+(o-6<<1)>>1]<<16>>16)|0;L34:do{if(n){q=r;s=6;while(1){t=X(b[d+(s<<1)>>1]<<16>>16,b[c+(p-s<<1)>>1]<<16>>16)+q|0;u=t+X(b[d+((s|1)<<1)>>1]<<16>>16,b[c+(p+(s^-1)<<1)>>1]<<16>>16)|0;t=s+2|0;if((t|0)<(f|0)){q=u;s=t}else{v=u;break L34}}}else{v=r}}while(0);r=((b[c+(o<<1)>>1]<<16>>16<<12)-v>>11)+1>>1;if((r|0)>32767){w=32767}else{w=(r|0)<-32768?-32768:r&65535}b[a+(o<<1)>>1]=w;r=o+1|0;if((r|0)==(e|0)){break}else{o=r}}g=a;h=f<<1;b_(g|0,0,h|0);return}function bG(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;e=i;i=i+128|0;f=e|0;g=d&1;do{if((d|0)>0){h=0;j=0;while(1){l=b[a+(h<<1)>>1]<<16>>16;m=l+j|0;c[f+(g<<6)+(h<<2)>>2]=l<<12;l=h+1|0;if((l|0)==(d|0)){break}else{h=l;j=m}}if((m|0)>4095){n=0}else{break}i=e;return n|0}}while(0);m=d-1|0;L49:do{if((m|0)>0){d=0;a=1073741824;j=g;h=m;while(1){l=c[f+(j<<6)+(h<<2)>>2]|0;if((l+16773022|0)>>>0>33546044){n=0;break}o=-(l<<7)|0;l=o;p=(o|0)<0?-1:0;af(l|0,p|0,l|0,p|0),c[k>>2]|0;o=1073741824-(c[k+4>>2]|0)|0;q=(o|0)>0?o:-o|0;if((q|0)==0){r=32;s=0;t=30}else{u=am(q|0,1)|0;q=32-u|0;r=u;s=q;t=q+30|0}q=o<<r-1;u=q>>16;v=536870911/(u|0)&-1;w=v<<16;x=w>>16;y=X(u,x);u=(536870912-y|0)-(X(q&65535,x)>>16)<<3;q=X(u>>16,x);y=X(u&65528,x)>>16;x=((X(u,(v>>15)+1>>1)+w|0)+q|0)+y|0;y=(62-r|0)-t|0;if((y|0)<1){q=-y|0;w=-2147483648>>q;v=2147483647>>>(q>>>0);do{if((w|0)>(v|0)){if((x|0)>(w|0)){A=w;break}A=(x|0)<(v|0)?v:x}else{if((x|0)>(v|0)){A=v;break}A=(x|0)<(w|0)?w:x}}while(0);B=A<<q}else{B=(y|0)<32?x>>y:0}af(o|0,((o|0)<0?-1:0)|0,a|0,d|0),c[k>>2]|0;w=c[k+4>>2]|0;v=h&1;u=h-1|0;C=(s|0)==1;D=B;E=(B|0)<0?-1:0;F=s-1|0;G=0;while(1){H=c[f+(j<<6)+(G<<2)>>2]|0;I=c[f+(j<<6)+(u-G<<2)>>2]|0;J=(af(I|0,((I|0)<0?-1:0)|0,l|0,p|0),c[k>>2]|0);I=c[k+4>>2]|0;K=b2(J>>>30|I<<2,I>>>30|0<<2,1,0);I=z;J=H-(K>>>1|I<<31)|0;I=(af(J|0,((J|0)<0?-1:0)|0,D|0,E|0),c[k>>2]|0);J=c[k+4>>2]|0;if(C){K=b2(I>>>1|J<<31,J>>>1|0<<31,I&1,J&0);L=K}else{K=b5(I|0,J|0,F|0);J=z;I=b2(K,J,1,0);J=z;L=I>>>1|J<<31}c[f+(v<<6)+(G<<2)>>2]=L;J=G+1|0;if((J|0)==(h|0)){break}else{G=J}}G=w<<2|0>>>30;F=G;C=(G|0)<0?-1:0;if((u|0)>0){d=C;a=F;j=v;h=u}else{M=C;N=F;O=v;break L49}}i=e;return n|0}else{M=0;N=1073741824;O=g}}while(0);g=c[f+(O<<6)>>2]|0;if((g+16773022|0)>>>0>33546044){n=0;i=e;return n|0}O=-(g<<7)|0;g=O;f=(O|0)<0?-1:0;af(g|0,f|0,g|0,f|0),c[k>>2]|0;f=1073741824-(c[k+4>>2]|0)|0;af(f|0,((f|0)<0?-1:0)|0,N|0,M|0),c[k>>2]|0;M=c[k+4>>2]|0;n=M<<2|0>>>30;i=e;return n|0}
function bH(a,c,d){a=a|0;c=c|0;d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=d-1|0;g=(f|0)<1;h=c+(d<<1)|0;i=1;while(1){j=b[a>>1]|0;k=b[c>>1]|0;l=(j<<16>>16)-(k<<16>>16)|0;L82:do{if(g){m=0;n=l}else{o=0;p=1;q=l;r=j;while(1){s=b[a+(p<<1)>>1]|0;t=((s<<16>>16)-(r<<16>>16)|0)-(b[c+(p<<1)>>1]<<16>>16)|0;u=(t|0)<(q|0);v=u?p:o;w=u?t:q;t=p+1|0;if((t|0)==(d|0)){m=v;n=w;break L82}else{o=v;p=t;q=w;r=s}}}}while(0);x=a+(f<<1)|0;j=b[h>>1]|0;l=(32768-(b[x>>1]<<16>>16)|0)-(j<<16>>16)|0;r=(l|0)<(n|0);q=r?d:m;if(((r?l:n)|0)>-1){y=92;break}do{if((q|0)==0){b[a>>1]=k}else{if((q|0)==(d|0)){b[x>>1]=-32768-j&65535;break}L93:do{if((q|0)>0){l=1;r=0;p=k;while(1){o=(p<<16>>16)+r|0;if((l|0)==(q|0)){z=o;break L93}s=b[c+(l<<1)>>1]|0;l=l+1|0;r=o;p=s}}else{z=0}}while(0);p=c+(q<<1)|0;r=b[p>>1]<<16>>16;l=r>>1;s=l+z|0;L98:do{if((q|0)<(d|0)){o=d;w=32768;t=j;while(1){v=w-(t<<16>>16)|0;u=o-1|0;if((u|0)<=(q|0)){A=v;break L98}o=u;w=v;t=b[c+(u<<1)>>1]|0}}else{A=32768}}while(0);t=A-l|0;w=a+(q-1<<1)|0;o=a+(q<<1)|0;u=(b[o>>1]<<16>>16)+(b[w>>1]<<16>>16)|0;v=(u>>1)+(u&1)|0;do{if((s|0)>(t|0)){if((v|0)>(s|0)){B=s;break}B=(v|0)<(t|0)?t:v}else{if((v|0)>(t|0)){B=t;break}B=(v|0)<(s|0)?s:v}}while(0);v=B-(r>>>1)|0;b[w>>1]=v&65535;b[o>>1]=v+(e[p>>1]|0)&65535}}while(0);if((i|0)>=20){break}i=i+1|0}if((y|0)==92){return}if((i|0)!=20){return}i=(d|0)>1;L117:do{if(i){y=1;while(1){B=b[a+(y<<1)>>1]|0;A=y;while(1){z=A-1|0;n=b[a+(z<<1)>>1]|0;if(B<<16>>16>=n<<16>>16){C=A;break}b[a+(A<<1)>>1]=n;if((z|0)>0){A=z}else{C=z;break}}b[a+(C<<1)>>1]=B;A=y+1|0;if((A|0)==(d|0)){break}else{y=A}}y=b[a>>1]|0;A=b[c>>1]|0;p=y<<16>>16>A<<16>>16?y:A;b[a>>1]=p;if(i){D=1;E=p}else{break}while(1){p=a+(D<<1)|0;A=b[p>>1]<<16>>16;y=(b[c+(D<<1)>>1]<<16>>16)+(E<<16>>16)|0;o=((A|0)>(y|0)?A:y)&65535;b[p>>1]=o;p=D+1|0;if((p|0)==(d|0)){break L117}else{D=p;E=o}}}else{o=b[a>>1]|0;p=b[c>>1]|0;b[a>>1]=o<<16>>16>p<<16>>16?o:p}}while(0);E=b[x>>1]<<16>>16;D=32768-(b[h>>1]<<16>>16)|0;h=(E|0)<(D|0)?E:D;b[x>>1]=h&65535;x=d-2|0;if((x|0)>-1){F=x;G=h}else{return}while(1){h=a+(F<<1)|0;x=b[h>>1]<<16>>16;d=(G<<16>>16)-(b[c+(F+1<<1)>>1]<<16>>16)|0;D=(x|0)<(d|0)?x:d;b[h>>1]=D&65535;if((F|0)>0){F=F-1|0;G=D}else{break}}return}function bI(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b[c>>1]<<16>>16;f=(b[c+2>>1]<<16>>16)-e|0;g=131072/(((f|0)>1?f:1)|0)&-1;f=g+(131072/(((e|0)>1?e:1)|0)&-1)|0;b[a>>1]=(f|0)<32767?f&65535:32767;f=d-1|0;L135:do{if((f|0)>1){d=1;e=g;while(1){h=d+1|0;i=c+(h<<1)|0;j=(b[i>>1]<<16>>16)-(b[c+(d<<1)>>1]<<16>>16)|0;k=131072/(((j|0)>1?j:1)|0)&-1;j=k+e|0;b[a+(d<<1)>>1]=(j|0)<32767?j&65535:32767;j=d+2|0;l=(b[c+(j<<1)>>1]<<16>>16)-(b[i>>1]<<16>>16)|0;i=131072/(((l|0)>1?l:1)|0)&-1;l=i+k|0;b[a+(h<<1)>>1]=(l|0)<32767?l&65535:32767;if((j|0)<(f|0)){d=j;e=i}else{m=i;break L135}}}else{m=g}}while(0);g=32768-(b[c+(f<<1)>>1]<<16>>16)|0;c=(131072/(((g|0)>1?g:1)|0)&-1)+m|0;b[a+(f<<1)>>1]=(c|0)<32767?c&65535:32767;return}function bJ(a,e,f){a=a|0;e=e|0;f=f|0;var g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;g=i;i=i+200|0;h=g|0;j=g+64|0;l=g+100|0;m=g+136|0;n=(f|0)==16?5246800:5246816;o=(f|0)>0;if(o){p=0;while(1){q=b[e+(p<<1)>>1]<<16>>16;r=q>>8;s=b[5247204+(r<<1)>>1]<<16>>16;t=(X((b[5247204+(r+1<<1)>>1]<<16>>16)-s|0,q-(r<<8)|0)+(s<<8)>>3)+1>>1;c[h+((d[n+p|0]|0)<<2)>>2]=t;t=p+1|0;if((t|0)==(f|0)){break}else{p=t}}u=c[h>>2]|0}else{u=0}p=f>>1;n=j|0;c[n>>2]=65536;e=-u|0;u=j+4|0;c[u>>2]=e;t=(p|0)>1;L145:do{if(t){s=1;r=65536;q=e;while(1){v=c[h+(s<<1<<2)>>2]|0;w=v;x=(v|0)<0?-1:0;y=j+(s<<2)|0;A=(af(w|0,x|0,q|0,((q|0)<0?-1:0)|0),c[k>>2]|0);B=c[k+4>>2]|0;C=b2(A>>>15|B<<17,B>>>15|0<<17,1,0);B=z;A=s+1|0;D=j+(A<<2)|0;c[D>>2]=(r<<1)-(C>>>1|B<<31)|0;L148:do{if((s|0)>1){B=s;C=r;E=q;while(1){F=c[j+(B-2<<2)>>2]|0;G=B-1|0;H=(af(C|0,((C|0)<0?-1:0)|0,w|0,x|0),c[k>>2]|0);I=c[k+4>>2]|0;J=b2(H>>>15|I<<17,I>>>15|0<<17,1,0);I=z;c[j+(B<<2)>>2]=(F+E|0)-(J>>>1|I<<31)|0;if((G|0)<=1){break L148}B=G;C=F;E=c[j+(G<<2)>>2]|0}}}while(0);c[u>>2]=(c[u>>2]|0)-v|0;if((A|0)==(p|0)){break L145}s=A;r=c[y>>2]|0;q=c[D>>2]|0}}}while(0);u=l|0;c[u>>2]=65536;e=-(c[h+4>>2]|0)|0;q=l+4|0;c[q>>2]=e;L155:do{if(t){r=1;s=65536;x=e;while(1){w=c[h+((r<<1|1)<<2)>>2]|0;E=w;C=(w|0)<0?-1:0;B=l+(r<<2)|0;G=(af(E|0,C|0,x|0,((x|0)<0?-1:0)|0),c[k>>2]|0);F=c[k+4>>2]|0;I=b2(G>>>15|F<<17,F>>>15|0<<17,1,0);F=z;G=r+1|0;J=l+(G<<2)|0;c[J>>2]=(s<<1)-(I>>>1|F<<31)|0;L158:do{if((r|0)>1){F=r;I=s;H=x;while(1){K=c[l+(F-2<<2)>>2]|0;L=F-1|0;M=(af(I|0,((I|0)<0?-1:0)|0,E|0,C|0),c[k>>2]|0);N=c[k+4>>2]|0;O=b2(M>>>15|N<<17,N>>>15|0<<17,1,0);N=z;c[l+(F<<2)>>2]=(K+H|0)-(O>>>1|N<<31)|0;if((L|0)<=1){break L158}F=L;I=K;H=c[l+(L<<2)>>2]|0}}}while(0);c[q>>2]=(c[q>>2]|0)-w|0;if((G|0)==(p|0)){break L155}r=G;s=c[B>>2]|0;x=c[J>>2]|0}}}while(0);q=f-1|0;L165:do{if((p|0)>0){h=0;e=c[n>>2]|0;t=c[u>>2]|0;while(1){x=h+1|0;s=c[j+(x<<2)>>2]|0;r=e+s|0;C=c[l+(x<<2)>>2]|0;E=C-t|0;c[m+(h<<2)>>2]=-(E+r|0)|0;c[m+(q-h<<2)>>2]=E-r|0;if((x|0)==(p|0)){break L165}else{h=x;e=s;t=C}}}}while(0);p=(q|0)>0;l=m+(q<<2)|0;j=0;u=0;while(1){if(o){P=0;Q=u;R=0}else{S=j;break}while(1){n=c[m+(R<<2)>>2]|0;t=(n|0)>0?n:-n|0;n=(t|0)>(P|0);T=n?t:P;U=n?R:Q;n=R+1|0;if((n|0)==(f|0)){break}else{P=T;Q=U;R=n}}n=(T>>4)+1>>1;if((n|0)<=32767){S=j;break}t=(n|0)<163838?n:163838;n=65470-(((t<<14)-536854528|0)/(X(t,U+1|0)>>2|0)&-1)|0;t=n-65536|0;e=n>>16;L176:do{if(p){h=0;C=n;s=e;while(1){x=m+(h<<2)|0;r=c[x>>2]|0;E=r<<16>>16;D=X(E,s);y=(X(E,C&65535)>>16)+D|0;c[x>>2]=y+X((r>>15)+1>>1,C)|0;r=((X(C,t)>>15)+1>>1)+C|0;y=h+1|0;x=r>>16;if((y|0)==(q|0)){V=r;W=x;break L176}else{h=y;C=r;s=x}}}else{V=n;W=e}}while(0);e=c[l>>2]|0;n=e<<16>>16;t=X(n,W);s=(X(n,V&65535)>>16)+t|0;c[l>>2]=s+X((e>>15)+1>>1,V)|0;e=j+1|0;if((e|0)<10){j=e;u=U}else{S=e;break}}L181:do{if((S|0)==10){if(o){Y=0}else{Z=0;break}while(1){U=m+(Y<<2)|0;u=(c[U>>2]>>4)+1>>1;if((u|0)>32767){_=32767}else{_=(u|0)<-32768?-32768:u&65535}b[a+(Y<<1)>>1]=_;c[U>>2]=_<<16>>16<<5;U=Y+1|0;if((U|0)==(f|0)){Z=0;break L181}else{Y=U}}}else{if(o){$=0}else{Z=0;break}while(1){b[a+($<<1)>>1]=(((c[m+($<<2)>>2]|0)>>>4)+1|0)>>>1&65535;U=$+1|0;if((U|0)==(f|0)){Z=0;break L181}else{$=U}}}}while(0);while(1){if((bG(a,f)|0)>=107374){aa=138;break}$=65536-(2<<Z)|0;Y=$-65536|0;_=$>>16;L194:do{if(p){S=0;U=$;u=_;while(1){j=m+(S<<2)|0;V=c[j>>2]|0;W=V<<16>>16;T=X(W,u);R=(X(W,U&65535)>>16)+T|0;c[j>>2]=R+X((V>>15)+1>>1,U)|0;V=((X(U,Y)>>15)+1>>1)+U|0;R=S+1|0;j=V>>16;if((R|0)==(q|0)){ab=V;ac=j;break L194}else{S=R;U=V;u=j}}}else{ab=$;ac=_}}while(0);_=c[l>>2]|0;$=_<<16>>16;Y=X($,ac);u=(X($,ab&65535)>>16)+Y|0;c[l>>2]=u+X((_>>15)+1>>1,ab)|0;L198:do{if(o){_=0;while(1){b[a+(_<<1)>>1]=(((c[m+(_<<2)>>2]|0)>>>4)+1|0)>>>1&65535;u=_+1|0;if((u|0)==(f|0)){break L198}else{_=u}}}}while(0);_=Z+1|0;if((_|0)<16){Z=_}else{aa=139;break}}if((aa|0)==138){i=g;return}else if((aa|0)==139){i=g;return}}function bK(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;b_(b|0,0,300);do{if((f|0)==0){if(!((d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;return g|0}if((e|0)==48e3|(e|0)==24e3|(e|0)==16e3|(e|0)==12e3|(e|0)==8e3){c[b+292>>2]=a[(((e>>12)-((e|0)>16e3&1)>>((e|0)>24e3&1))-1|0)+(5256332+((((d>>12)-((d|0)>16e3&1)>>((d|0)>24e3&1))-1|0)*5&-1))|0]<<24>>24;break}else{g=-1;return g|0}}else{if(!((d|0)==48e3|(d|0)==24e3|(d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;return g|0}if((e|0)==16e3|(e|0)==12e3|(e|0)==8e3){c[b+292>>2]=a[((e>>12)-1|0)+(5256316+((((d>>12)-((d|0)>16e3&1)>>((d|0)>24e3&1))-1|0)*3&-1))|0]<<24>>24;break}else{g=-1;return g|0}}}while(0);f=(d|0)/1e3&-1;c[b+284>>2]=f;c[b+288>>2]=(e|0)/1e3&-1;c[b+268>>2]=f*10&-1;do{if((e|0)>(d|0)){f=b+264|0;if((d<<1|0)==(e|0)){c[f>>2]=1;h=0;break}else{c[f>>2]=2;h=1;break}}else{f=b+264|0;if((e|0)>=(d|0)){c[f>>2]=0;h=0;break}c[f>>2]=3;f=e<<2;if((f|0)==(d*3&-1|0)){c[b+280>>2]=3;c[b+276>>2]=18;c[b+296>>2]=5244680;h=0;break}i=e*3&-1;if((i|0)==(d<<1|0)){c[b+280>>2]=2;c[b+276>>2]=18;c[b+296>>2]=5244740;h=0;break}if((e<<1|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=24;c[b+296>>2]=5244900;h=0;break}if((i|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=5244860;h=0;break}if((f|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=5244820;h=0;break}if((e*6&-1|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=5244780;h=0;break}else{g=-1;return g|0}}}while(0);f=e<<16>>16;i=(e>>15)+1>>1;j=d<<h;k=((d<<(h|14)|0)/(e|0)&-1)<<2;while(1){e=X(k>>16,f);h=X(k&65535,f)>>16;if(((e+X(k,i)|0)+h|0)<(j|0)){k=k+1|0}else{break}}c[b+272>>2]=k;g=0;return g|0}function bL(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a+284|0;g=a+292|0;h=c[g>>2]|0;i=(c[f>>2]|0)-h|0;j=a+168|0;b$(a+168+(h<<1)|0,d,i<<1);h=c[a+264>>2]|0;if((h|0)==1){k=a|0;bN(k,b,j|0,c[f>>2]|0);bN(k,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else if((h|0)==2){k=a;bQ(k,b,j|0,c[f>>2]|0);bQ(k,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else if((h|0)==3){h=a;bM(h,b,j|0,c[f>>2]|0);bM(h,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else{b$(b,j,c[f>>2]<<1);b$(b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)<<1)}f=c[g>>2]|0;b$(j,d+(e-f<<1)|0,f<<1);return 0}function bM(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0;g=i;h=a+268|0;j=c[h>>2]|0;k=a+276|0;l=c[k>>2]|0;m=i;i=i+((l+j|0)*4&-1)|0;i=i+3>>2<<2;n=m;o=a+24|0;b$(n,o,l<<2);p=a+296|0;q=c[p>>2]|0;r=q+4|0;s=c[a+272>>2]|0;t=a;u=a+4|0;v=a+280|0;a=q+6|0;w=q+8|0;x=q+10|0;y=q+12|0;z=q+14|0;A=q+16|0;B=q+18|0;C=q+20|0;D=q+22|0;E=q+24|0;F=q+26|0;G=q+28|0;H=q+30|0;I=q+32|0;J=q+34|0;K=q+36|0;L=q+38|0;M=d;d=e;e=f;f=j;j=l;l=q;while(1){N=(e|0)<(f|0)?e:f;L264:do{if((N|0)>0){O=l+2|0;P=0;Q=c[t>>2]|0;R=c[u>>2]|0;while(1){S=(b[d+(P<<1)>>1]<<16>>16<<8)+Q|0;c[m+(P+j<<2)>>2]=S;T=S<<2;S=T>>16;U=b[l>>1]<<16>>16;V=X(S,U);W=T&65532;T=(V+R|0)+(X(W,U)>>16)|0;c[t>>2]=T;U=b[O>>1]<<16>>16;V=X(S,U);S=(X(W,U)>>16)+V|0;c[u>>2]=S;V=P+1|0;if((V|0)==(N|0)){break L264}else{P=V;Q=T;R=S}}}}while(0);R=N<<16;Q=c[v>>2]|0;L269:do{if((j|0)==36){if((R|0)>0){Y=0;Z=M}else{_=M;break}while(1){P=Y>>16;O=(c[m+(P+35<<2)>>2]|0)+(c[m+(P<<2)>>2]|0)|0;S=b[r>>1]<<16>>16;T=X(O>>16,S);V=X(O&65535,S)>>16;S=(c[m+(P+34<<2)>>2]|0)+(c[m+(P+1<<2)>>2]|0)|0;O=b[a>>1]<<16>>16;U=X(S>>16,O);W=X(S&65535,O)>>16;O=(c[m+(P+33<<2)>>2]|0)+(c[m+(P+2<<2)>>2]|0)|0;S=b[w>>1]<<16>>16;$=X(O>>16,S);aa=X(O&65535,S)>>16;S=(c[m+(P+32<<2)>>2]|0)+(c[m+(P+3<<2)>>2]|0)|0;O=b[x>>1]<<16>>16;ab=X(S>>16,O);ac=X(S&65535,O)>>16;O=(c[m+(P+31<<2)>>2]|0)+(c[m+(P+4<<2)>>2]|0)|0;S=b[y>>1]<<16>>16;ad=X(O>>16,S);ae=X(O&65535,S)>>16;S=(c[m+(P+30<<2)>>2]|0)+(c[m+(P+5<<2)>>2]|0)|0;O=b[z>>1]<<16>>16;af=X(S>>16,O);ag=X(S&65535,O)>>16;O=(c[m+(P+29<<2)>>2]|0)+(c[m+(P+6<<2)>>2]|0)|0;S=b[A>>1]<<16>>16;ah=X(O>>16,S);ai=X(O&65535,S)>>16;S=(c[m+(P+28<<2)>>2]|0)+(c[m+(P+7<<2)>>2]|0)|0;O=b[B>>1]<<16>>16;aj=X(S>>16,O);ak=X(S&65535,O)>>16;O=(c[m+(P+27<<2)>>2]|0)+(c[m+(P+8<<2)>>2]|0)|0;S=b[C>>1]<<16>>16;al=X(O>>16,S);am=X(O&65535,S)>>16;S=(c[m+(P+26<<2)>>2]|0)+(c[m+(P+9<<2)>>2]|0)|0;O=b[D>>1]<<16>>16;an=X(S>>16,O);ao=X(S&65535,O)>>16;O=(c[m+(P+25<<2)>>2]|0)+(c[m+(P+10<<2)>>2]|0)|0;S=b[E>>1]<<16>>16;ap=X(O>>16,S);aq=X(O&65535,S)>>16;S=(c[m+(P+24<<2)>>2]|0)+(c[m+(P+11<<2)>>2]|0)|0;O=b[F>>1]<<16>>16;ar=X(S>>16,O);as=X(S&65535,O)>>16;O=(c[m+(P+23<<2)>>2]|0)+(c[m+(P+12<<2)>>2]|0)|0;S=b[G>>1]<<16>>16;at=X(O>>16,S);au=X(O&65535,S)>>16;S=(c[m+(P+22<<2)>>2]|0)+(c[m+(P+13<<2)>>2]|0)|0;O=b[H>>1]<<16>>16;av=X(S>>16,O);aw=X(S&65535,O)>>16;O=(c[m+(P+21<<2)>>2]|0)+(c[m+(P+14<<2)>>2]|0)|0;S=b[I>>1]<<16>>16;ax=X(O>>16,S);ay=X(O&65535,S)>>16;S=(c[m+(P+20<<2)>>2]|0)+(c[m+(P+15<<2)>>2]|0)|0;O=b[J>>1]<<16>>16;az=X(S>>16,O);aA=X(S&65535,O)>>16;O=(c[m+(P+19<<2)>>2]|0)+(c[m+(P+16<<2)>>2]|0)|0;S=b[K>>1]<<16>>16;aB=X(O>>16,S);aC=X(O&65535,S)>>16;S=(c[m+(P+18<<2)>>2]|0)+(c[m+(P+17<<2)>>2]|0)|0;P=b[L>>1]<<16>>16;O=X(S>>16,P);aD=(((((((((((((((((((((((((((((((((((V+T|0)+U|0)+W|0)+$|0)+aa|0)+ab|0)+ac|0)+ad|0)+ae|0)+af|0)+ag|0)+ah|0)+ai|0)+aj|0)+ak|0)+al|0)+am|0)+an|0)+ao|0)+ap|0)+aq|0)+ar|0)+as|0)+at|0)+au|0)+av|0)+aw|0)+ax|0)+ay|0)+az|0)+aA|0)+aB|0)+aC|0)+O|0)+(X(S&65535,P)>>16)>>5)+1>>1;if((aD|0)>32767){aE=32767}else{aE=(aD|0)<-32768?-32768:aD&65535}aD=Z+2|0;b[Z>>1]=aE;P=Y+s|0;if((P|0)<(R|0)){Y=P;Z=aD}else{_=aD;break L269}}}else if((j|0)==24){if((R|0)>0){aF=0;aG=M}else{_=M;break}while(1){aD=aF>>16;P=(c[m+(aD+23<<2)>>2]|0)+(c[m+(aD<<2)>>2]|0)|0;S=b[r>>1]<<16>>16;O=X(P>>16,S);aC=X(P&65535,S)>>16;S=(c[m+(aD+22<<2)>>2]|0)+(c[m+(aD+1<<2)>>2]|0)|0;P=b[a>>1]<<16>>16;aB=X(S>>16,P);aA=X(S&65535,P)>>16;P=(c[m+(aD+21<<2)>>2]|0)+(c[m+(aD+2<<2)>>2]|0)|0;S=b[w>>1]<<16>>16;az=X(P>>16,S);ay=X(P&65535,S)>>16;S=(c[m+(aD+20<<2)>>2]|0)+(c[m+(aD+3<<2)>>2]|0)|0;P=b[x>>1]<<16>>16;ax=X(S>>16,P);aw=X(S&65535,P)>>16;P=(c[m+(aD+19<<2)>>2]|0)+(c[m+(aD+4<<2)>>2]|0)|0;S=b[y>>1]<<16>>16;av=X(P>>16,S);au=X(P&65535,S)>>16;S=(c[m+(aD+18<<2)>>2]|0)+(c[m+(aD+5<<2)>>2]|0)|0;P=b[z>>1]<<16>>16;at=X(S>>16,P);as=X(S&65535,P)>>16;P=(c[m+(aD+17<<2)>>2]|0)+(c[m+(aD+6<<2)>>2]|0)|0;S=b[A>>1]<<16>>16;ar=X(P>>16,S);aq=X(P&65535,S)>>16;S=(c[m+(aD+16<<2)>>2]|0)+(c[m+(aD+7<<2)>>2]|0)|0;P=b[B>>1]<<16>>16;ap=X(S>>16,P);ao=X(S&65535,P)>>16;P=(c[m+(aD+15<<2)>>2]|0)+(c[m+(aD+8<<2)>>2]|0)|0;S=b[C>>1]<<16>>16;an=X(P>>16,S);am=X(P&65535,S)>>16;S=(c[m+(aD+14<<2)>>2]|0)+(c[m+(aD+9<<2)>>2]|0)|0;P=b[D>>1]<<16>>16;al=X(S>>16,P);ak=X(S&65535,P)>>16;P=(c[m+(aD+13<<2)>>2]|0)+(c[m+(aD+10<<2)>>2]|0)|0;S=b[E>>1]<<16>>16;aj=X(P>>16,S);ai=X(P&65535,S)>>16;S=(c[m+(aD+12<<2)>>2]|0)+(c[m+(aD+11<<2)>>2]|0)|0;aD=b[F>>1]<<16>>16;P=X(S>>16,aD);ah=(((((((((((((((((((((((aC+O|0)+aB|0)+aA|0)+az|0)+ay|0)+ax|0)+aw|0)+av|0)+au|0)+at|0)+as|0)+ar|0)+aq|0)+ap|0)+ao|0)+an|0)+am|0)+al|0)+ak|0)+aj|0)+ai|0)+P|0)+(X(S&65535,aD)>>16)>>5)+1>>1;if((ah|0)>32767){aH=32767}else{aH=(ah|0)<-32768?-32768:ah&65535}ah=aG+2|0;b[aG>>1]=aH;aD=aF+s|0;if((aD|0)<(R|0)){aF=aD;aG=ah}else{_=ah;break L269}}}else if((j|0)==18){if((R|0)<=0){_=M;break}ah=Q<<16>>16;aD=Q-1|0;S=0;P=M;while(1){ai=S>>16;aj=X(S&65535,ah)>>16;ak=aj*9&-1;al=c[m+(ai<<2)>>2]|0;am=b[q+(ak+2<<1)>>1]<<16>>16;an=X(am,al>>16);ao=X(am,al&65535)>>16;al=c[m+(ai+1<<2)>>2]|0;am=b[q+(ak+3<<1)>>1]<<16>>16;ap=X(am,al>>16);aq=X(am,al&65535)>>16;al=c[m+(ai+2<<2)>>2]|0;am=b[q+(ak+4<<1)>>1]<<16>>16;ar=X(am,al>>16);as=X(am,al&65535)>>16;al=c[m+(ai+3<<2)>>2]|0;am=b[q+(ak+5<<1)>>1]<<16>>16;at=X(am,al>>16);au=X(am,al&65535)>>16;al=c[m+(ai+4<<2)>>2]|0;am=b[q+(ak+6<<1)>>1]<<16>>16;av=X(am,al>>16);aw=X(am,al&65535)>>16;al=c[m+(ai+5<<2)>>2]|0;am=b[q+(ak+7<<1)>>1]<<16>>16;ax=X(am,al>>16);ay=X(am,al&65535)>>16;al=c[m+(ai+6<<2)>>2]|0;am=b[q+(ak+8<<1)>>1]<<16>>16;az=X(am,al>>16);aA=X(am,al&65535)>>16;al=c[m+(ai+7<<2)>>2]|0;am=b[q+(ak+9<<1)>>1]<<16>>16;aB=X(am,al>>16);O=X(am,al&65535)>>16;al=c[m+(ai+8<<2)>>2]|0;am=b[q+(ak+10<<1)>>1]<<16>>16;ak=X(am,al>>16);aC=X(am,al&65535)>>16;al=(aD-aj|0)*9&-1;aj=c[m+(ai+17<<2)>>2]|0;am=b[q+(al+2<<1)>>1]<<16>>16;ag=X(am,aj>>16);af=X(am,aj&65535)>>16;aj=c[m+(ai+16<<2)>>2]|0;am=b[q+(al+3<<1)>>1]<<16>>16;ae=X(am,aj>>16);ad=X(am,aj&65535)>>16;aj=c[m+(ai+15<<2)>>2]|0;am=b[q+(al+4<<1)>>1]<<16>>16;ac=X(am,aj>>16);ab=X(am,aj&65535)>>16;aj=c[m+(ai+14<<2)>>2]|0;am=b[q+(al+5<<1)>>1]<<16>>16;aa=X(am,aj>>16);$=X(am,aj&65535)>>16;aj=c[m+(ai+13<<2)>>2]|0;am=b[q+(al+6<<1)>>1]<<16>>16;W=X(am,aj>>16);U=X(am,aj&65535)>>16;aj=c[m+(ai+12<<2)>>2]|0;am=b[q+(al+7<<1)>>1]<<16>>16;T=X(am,aj>>16);V=X(am,aj&65535)>>16;aj=c[m+(ai+11<<2)>>2]|0;am=b[q+(al+8<<1)>>1]<<16>>16;aI=X(am,aj>>16);aJ=X(am,aj&65535)>>16;aj=c[m+(ai+10<<2)>>2]|0;am=b[q+(al+9<<1)>>1]<<16>>16;aK=X(am,aj>>16);aL=X(am,aj&65535)>>16;aj=c[m+(ai+9<<2)>>2]|0;ai=b[q+(al+10<<1)>>1]<<16>>16;al=X(ai,aj>>16);am=(((((((((((((((((((((((((((((((((((ao+an|0)+ap|0)+aq|0)+ar|0)+as|0)+at|0)+au|0)+av|0)+aw|0)+ax|0)+ay|0)+az|0)+aA|0)+aB|0)+O|0)+ak|0)+aC|0)+ag|0)+af|0)+ae|0)+ad|0)+ac|0)+ab|0)+aa|0)+$|0)+W|0)+U|0)+T|0)+V|0)+aI|0)+aJ|0)+aK|0)+aL|0)+al|0)+(X(ai,aj&65535)>>16)>>5)+1>>1;if((am|0)>32767){aM=32767}else{aM=(am|0)<-32768?-32768:am&65535}am=P+2|0;b[P>>1]=aM;aj=S+s|0;if((aj|0)<(R|0)){S=aj;P=am}else{_=am;break L269}}}else{_=M}}while(0);R=e-N|0;if((R|0)<=1){break}Q=c[k>>2]|0;b$(n,m+(N<<2)|0,Q<<2);M=_;d=d+(N<<1)|0;e=R;f=c[h>>2]|0;j=Q;l=c[p>>2]|0}b$(o,m+(N<<2)|0,c[k>>2]<<2);i=g;return}function bN(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if((f|0)<=0){return}g=a+4|0;h=a+8|0;i=a+12|0;j=a+16|0;k=a+20|0;l=0;while(1){m=b[e+(l<<1)>>1]<<16>>16<<10;n=c[a>>2]|0;o=m-n|0;p=(((o&65535)*1746&-1)>>>16)+((o>>16)*1746&-1)|0;o=p+n|0;c[a>>2]=p+m|0;p=c[g>>2]|0;n=o-p|0;q=(((n&65535)*14986&-1)>>>16)+((n>>16)*14986&-1)|0;n=q+p|0;c[g>>2]=q+o|0;o=n-(c[h>>2]|0)|0;q=(((o&65535)*-26453&-1)>>16)+((o>>16)*-26453&-1)|0;c[h>>2]=(o+n|0)+q|0;o=(q+n>>9)+1>>1;if((o|0)>32767){r=32767}else{r=(o|0)<-32768?-32768:o&65535}o=l<<1;b[d+(o<<1)>>1]=r;n=c[i>>2]|0;q=m-n|0;p=(((q&65535)*6854&-1)>>>16)+((q>>16)*6854&-1)|0;q=p+n|0;c[i>>2]=p+m|0;m=c[j>>2]|0;p=q-m|0;n=(((p&65535)*25769&-1)>>>16)+((p>>16)*25769&-1)|0;p=n+m|0;c[j>>2]=n+q|0;q=p-(c[k>>2]|0)|0;n=(((q&65535)*-9994&-1)>>16)+((q>>16)*-9994&-1)|0;c[k>>2]=(q+p|0)+n|0;q=(n+p>>9)+1>>1;if((q|0)>32767){s=32767}else{s=(q|0)<-32768?-32768:q&65535}b[d+((o|1)<<1)>>1]=s;o=l+1|0;if((o|0)==(f|0)){break}else{l=o}}return}function bO(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;f=i;i=i+24|0;g=f|0;h=a+28|0;j=c[h>>2]|0;k=a+32|0;l=c[k>>2]|0;m=j>>>8;n=-1;o=j;while(1){p=n+1|0;q=X(d[p+5243488|0]|0,m);if(l>>>0<q>>>0){n=p;o=q}else{break}}n=l-q|0;c[k>>2]=n;l=o-q|0;c[h>>2]=l;q=a+20|0;o=a+40|0;m=a+24|0;j=a+4|0;r=a|0;L309:do{if(l>>>0<8388609){a=c[j>>2]|0;s=c[q>>2]|0;t=l;u=c[o>>2]|0;v=c[m>>2]|0;w=n;while(1){x=s+8|0;c[q>>2]=x;y=t<<8;c[h>>2]=y;if(v>>>0<a>>>0){z=v+1|0;c[m>>2]=z;A=d[(c[r>>2]|0)+v|0]|0;B=z}else{A=0;B=v}c[o>>2]=A;z=((A|u<<8)>>>1&255|w<<8&2147483392)^255;c[k>>2]=z;if(y>>>0<8388609){s=x;t=y;u=A;v=B;w=z}else{C=y;D=z;break L309}}}else{C=l;D=n}}while(0);n=(p|0)/5&-1;l=g+8|0;c[l>>2]=n;B=g+20|0;c[B>>2]=(n*-5&-1)+p|0;p=0;n=C;C=D;while(1){D=n>>>8;A=-1;w=n;while(1){E=A+1|0;F=X(d[E+5243444|0]|0,D);if(C>>>0<F>>>0){A=E;w=F}else{break}}A=C-F|0;c[k>>2]=A;D=w-F|0;c[h>>2]=D;L322:do{if(D>>>0<8388609){v=c[j>>2]|0;u=c[q>>2]|0;t=D;s=c[o>>2]|0;a=c[m>>2]|0;z=A;while(1){y=u+8|0;c[q>>2]=y;x=t<<8;c[h>>2]=x;if(a>>>0<v>>>0){G=a+1|0;c[m>>2]=G;H=d[(c[r>>2]|0)+a|0]|0;I=G}else{H=0;I=a}c[o>>2]=H;G=((H|s<<8)>>>1&255|z<<8&2147483392)^255;c[k>>2]=G;if(x>>>0<8388609){u=y;t=x;s=H;a=I;z=G}else{J=x;K=G;break L322}}}else{J=D;K=A}}while(0);c[g+(p*12&-1)>>2]=E;A=J>>>8;D=-1;w=J;while(1){L=D+1|0;M=X(d[L+5243432|0]|0,A);if(K>>>0<M>>>0){D=L;w=M}else{break}}D=K-M|0;c[k>>2]=D;A=w-M|0;c[h>>2]=A;L333:do{if(A>>>0<8388609){z=c[j>>2]|0;a=c[q>>2]|0;s=A;t=c[o>>2]|0;u=c[m>>2]|0;v=D;while(1){G=a+8|0;c[q>>2]=G;x=s<<8;c[h>>2]=x;if(u>>>0<z>>>0){y=u+1|0;c[m>>2]=y;N=d[(c[r>>2]|0)+u|0]|0;O=y}else{N=0;O=u}c[o>>2]=N;y=((N|t<<8)>>>1&255|v<<8&2147483392)^255;c[k>>2]=y;if(x>>>0<8388609){a=G;s=x;t=N;u=O;v=y}else{P=x;Q=y;break L333}}}else{P=A;Q=D}}while(0);c[g+(p*12&-1)+4>>2]=L;D=p+1|0;if((D|0)==2){break}else{p=D;n=P;C=Q}}Q=g|0;C=(c[Q>>2]|0)+((c[l>>2]|0)*3&-1)|0;c[Q>>2]=C;Q=b[5243456+(C<<1)>>1]<<16>>16;l=(b[5243456+(C+1<<1)>>1]<<16>>16)-Q|0;C=X(l>>16,429522944)+((l&65535)*6554&-1)>>16;l=X(C,c[g+4>>2]<<17>>16|1)+Q|0;Q=g+12|0;C=(c[Q>>2]|0)+((c[B>>2]|0)*3&-1)|0;c[Q>>2]=C;Q=b[5243456+(C<<1)>>1]<<16>>16;B=(b[5243456+(C+1<<1)>>1]<<16>>16)-Q|0;C=X(B>>16,429522944)+((B&65535)*6554&-1)>>16;B=X(C,c[g+16>>2]<<17>>16|1)+Q|0;c[e+4>>2]=B;c[e>>2]=l-B|0;i=f;return}function bP(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,h=0,i=0.0,j=0.0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0.0,r=0.0,s=0,t=0,u=0.0,v=0,w=0.0,x=0,y=0,z=0.0,A=0,B=0,C=0.0,D=0,E=0.0,F=0,G=0.0,H=0.0;e=X(c,b);L343:do{if((e|0)>0){f=0;while(1){h=a+(f<<2)|0;i=+g[h>>2];do{if(i<=2.0&i<-2.0){j=-2.0}else{if(i>2.0){j=2.0;break}j=i}}while(0);g[h>>2]=j;k=f+1|0;if((k|0)==(e|0)){break L343}else{f=k}}}}while(0);if((c|0)<=0){return}e=(b|0)>0;f=0;while(1){k=a+(f<<2)|0;l=d+(f<<2)|0;j=+g[l>>2];L356:do{if(e){m=0;while(1){n=a+(X(m,c)+f<<2)|0;i=+g[n>>2];o=j*i;if(o>=0.0){break L356}g[n>>2]=i+i*o;n=m+1|0;if((n|0)<(b|0)){m=n}else{break L356}}}}while(0);j=+g[k>>2];m=0;while(1){h=m;while(1){p=(h|0)<(b|0);if(!p){break}o=+g[a+(X(h,c)+f<<2)>>2];if(o>1.0|o<-1.0){break}else{h=h+1|0}}if((h|0)==(b|0)){q=0.0;break}o=+g[a+(X(h,c)+f<<2)>>2];if(o<0.0){r=-0.0-o}else{r=o}n=h;while(1){if((n|0)<=0){break}s=n-1|0;if(o*+g[a+(X(s,c)+f<<2)>>2]<0.0){break}else{n=s}}L375:do{if(p){s=h;i=r;t=h;while(1){u=+g[a+(X(s,c)+f<<2)>>2];if(o*u<0.0){v=s;w=i;x=t;break L375}y=u<0.0;if(y){z=-0.0-u}else{z=u}A=z<=i;if(A|y^1){B=A?t:s;C=A?i:u}else{B=s;C=-0.0-u}A=s+1|0;if((A|0)<(b|0)){s=A;i=C;t=B}else{v=A;w=C;x=B;break L375}}}else{v=h;w=r;x=h}}while(0);if((n|0)==0){D=o*+g[k>>2]>=0.0}else{D=0}i=(w+-1.0)/(w*w);if(o>0.0){E=-0.0-i}else{E=i}L392:do{if((n|0)<(v|0)){h=n;while(1){t=a+(X(h,c)+f<<2)|0;i=+g[t>>2];g[t>>2]=i+i*E*i;t=h+1|0;if((t|0)==(v|0)){break L392}else{h=t}}}}while(0);L396:do{if(D&(x|0)>1){o=j- +g[k>>2];i=o/+(x|0);if((m|0)<(x|0)){F=m;G=o}else{break}while(1){o=G-i;n=a+(X(F,c)+f<<2)|0;u=o+ +g[n>>2];g[n>>2]=u;do{if(u<=1.0&u<-1.0){H=-1.0}else{if(u>1.0){H=1.0;break}H=u}}while(0);g[n>>2]=H;h=F+1|0;if((h|0)==(x|0)){break L396}else{F=h;G=o}}}}while(0);if((v|0)==(b|0)){q=E;break}else{m=v}}g[l>>2]=q;m=f+1|0;if((m|0)==(c|0)){break}else{f=m}}return}function bQ(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=a+268|0;j=c[h>>2]|0;k=i;i=i+(((j<<1)+8|0)*2&-1)|0;i=i+3>>2<<2;l=k;m=a+24|0;b$(l,m,16);n=c[a+272>>2]|0;o=a;a=k+16|0;p=d;d=e;e=f;f=j;while(1){q=(e|0)<(f|0)?e:f;bN(o,a,d,q);j=q<<17;L410:do{if((j|0)>0){r=0;s=p;while(1){t=((r&65535)*12&-1)>>>16;u=r>>16;v=X(b[5244192+(t<<3)>>1]<<16>>16,b[k+(u<<1)>>1]<<16>>16);w=X(b[5244194+(t<<3)>>1]<<16>>16,b[k+(u+1<<1)>>1]<<16>>16)+v|0;v=w+X(b[5244196+(t<<3)>>1]<<16>>16,b[k+(u+2<<1)>>1]<<16>>16)|0;w=v+X(b[5244198+(t<<3)>>1]<<16>>16,b[k+(u+3<<1)>>1]<<16>>16)|0;v=11-t|0;t=w+X(b[5244198+(v<<3)>>1]<<16>>16,b[k+(u+4<<1)>>1]<<16>>16)|0;w=t+X(b[5244196+(v<<3)>>1]<<16>>16,b[k+(u+5<<1)>>1]<<16>>16)|0;t=w+X(b[5244194+(v<<3)>>1]<<16>>16,b[k+(u+6<<1)>>1]<<16>>16)|0;w=(t+X(b[5244192+(v<<3)>>1]<<16>>16,b[k+(u+7<<1)>>1]<<16>>16)>>14)+1>>1;if((w|0)>32767){x=32767}else{x=(w|0)<-32768?-32768:w&65535}w=s+2|0;b[s>>1]=x;u=r+n|0;if((u|0)<(j|0)){r=u;s=w}else{y=w;break L410}}}else{y=p}}while(0);j=e-q|0;if((j|0)<=0){break}b$(l,k+(q<<1<<1)|0,16);p=y;d=d+(q<<1)|0;e=j;f=c[h>>2]|0}b$(m,k+(q<<1<<1)|0,16);i=g;return}function bR(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;if(!((d|0)==48e3|(d|0)==24e3|(d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;i=f;return g|0}if((e-1|0)>>>0>1){g=-1;i=f;return g|0}h=e*8768&-1;b_(a|0,0,h+9380|0);c[a+4>>2]=84;c[a>>2]=8628;j=a+84|0;k=a+8628|0;l=k;c[a+8>>2]=e;c[a+44>>2]=e;c[a+12>>2]=d;c[a+24>>2]=d;c[a+16>>2]=e;b_(j|0,0,4252);c[a+2460>>2]=1;c[j>>2]=65536;c[a+4232>>2]=0;c[a+4236>>2]=3176576;c[a+4252>>2]=0;c[a+4324>>2]=65536;c[a+4328>>2]=65536;c[a+4340>>2]=20;c[a+4336>>2]=2;j=a+4344|0;b_(j|0,0,4252);c[a+6720>>2]=1;c[j>>2]=65536;c[a+8492>>2]=0;c[a+8496>>2]=3176576;c[a+8512>>2]=0;c[a+8584>>2]=65536;c[a+8588>>2]=65536;c[a+8600>>2]=20;c[a+8596>>2]=2;j=a+8604|0;b[j>>1]=0;b[j+2>>1]=0;b[j+4>>1]=0;b[j+6>>1]=0;b[j+8>>1]=0;b[j+10>>1]=0;c[a+8624>>2]=0;if(e>>>0>2|(k|0)==0){g=-3;i=f;return g|0}b_(k|0,0,h+752|0);c[k>>2]=5247900;c[k+4>>2]=120;c[k+8>>2]=e;c[k+12>>2]=e;e=k+16|0;c[e>>2]=1;c[k+20>>2]=0;c[k+24>>2]=21;c[k+28>>2]=1;c[k+44>>2]=0;a3(l,4028,(q=i,i=i+1|0,i=i+3>>2<<2,c[q>>2]=0,q)|0);if((d|0)==16e3){m=3}else if((d|0)==24e3){m=2}else if((d|0)==8e3){m=6}else if((d|0)==48e3){m=1}else if((d|0)==12e3){m=4}else{c[e>>2]=0;g=-3;i=f;return g|0}c[e>>2]=m;a3(l,10016,(q=i,i=i+4|0,c[q>>2]=0,q)|0);c[a+56>>2]=0;c[a+60>>2]=(d|0)/400&-1;g=0;i=f;return g|0}function bS(e,f,g,h,i,j,k){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;if((j|0)==0){l=-1;return l|0}m=a[e]|0;n=m&255;do{if((n&128|0)==0){if((n&96|0)==96){o=(n&8|0)==0?480:960;break}p=n>>>3&3;if((p|0)==3){o=2880;break}o=(48e3<<p|0)/100&-1}else{o=(48e3<<(n>>>3&3)|0)/400&-1}}while(0);p=e+1|0;q=f-1|0;r=n&3;L450:do{if((r|0)==1){if((g|0)!=0){s=2;t=1;u=q;v=q;w=p;x=349;break}if((q&1|0)==0){n=(q|0)/2&-1;b[j>>1]=n&65535;y=p;z=n;A=q;B=1;C=2;x=348;break}else{l=-4;return l|0}}else if((r|0)==2){if((q|0)<1){b[j>>1]=-1;l=-4;return l|0}n=a[p]|0;D=n&255;do{if((n&255)<252){E=1;F=D;G=D}else{if((q|0)>=2){H=((d[e+2|0]|0)<<2)+D&65535;E=2;F=H;G=H;break}b[j>>1]=-1;l=-4;return l|0}}while(0);b[j>>1]=G;D=q-E|0;n=F<<16>>16;if(F<<16>>16<0|(n|0)>(D|0)){l=-4;return l|0}else{y=e+(E+1|0)|0;z=D-n|0;A=D;B=0;C=2;x=348;break}}else if((r|0)==0){y=p;z=q;A=q;B=0;C=1;x=348}else{if((q|0)<1){l=-4;return l|0}D=e+2|0;n=a[p]|0;H=n&255;I=H&63;if((I|0)==0){l=-4;return l|0}if((X(I,o)|0)>5760){l=-4;return l|0}J=f-2|0;L482:do{if((H&64|0)==0){K=D;L=J}else{M=D;N=J;while(1){if((N|0)<1){l=-4;break}O=M+1|0;P=a[M]|0;Q=P<<24>>24==-1;R=(N-1|0)+(Q?-254:-(P&255)|0)|0;if(Q){M=O;N=R}else{K=O;L=R;break L482}}return l|0}}while(0);if((L|0)<0){l=-4;return l|0}J=H>>>7^1;if((H&128|0)==0){if((g|0)!=0){s=I;t=J;u=L;v=q;w=K;x=349;break}D=(L|0)/(I|0)&-1;if((X(D,I)|0)!=(L|0)){l=-4;return l|0}if((I-1|0)<=0){y=K;z=D;A=L;B=J;C=I;x=348;break}N=D&65535;M=(n&63)-1|0;R=0;while(1){b[j+(R<<1)>>1]=N;O=R+1|0;if((O|0)==(M|0)){y=K;z=D;A=L;B=J;C=I;x=348;break L450}else{R=O}}}R=I-1|0;L501:do{if((R|0)>0){D=0;M=L;N=L;n=K;while(1){S=j+(D<<1)|0;if((M|0)<1){x=334;break}H=a[n]|0;O=H&255;if((H&255)<252){T=1;U=O;V=O}else{if((M|0)<2){x=338;break}H=((d[n+1|0]|0)<<2)+O&65535;T=2;U=H;V=H}b[S>>1]=V;H=M-T|0;O=U<<16>>16;if(U<<16>>16<0|(O|0)>(H|0)){l=-4;x=385;break}Q=n+T|0;P=(N-T|0)-O|0;O=D+1|0;if((O|0)<(R|0)){D=O;M=H;N=P;n=Q}else{W=H;Y=P;Z=Q;break L501}}if((x|0)==334){b[S>>1]=-1;l=-4;return l|0}else if((x|0)==338){b[S>>1]=-1;l=-4;return l|0}else if((x|0)==385){return l|0}}else{W=L;Y=L;Z=K}}while(0);if((Y|0)<0){l=-4}else{y=Z;z=Y;A=W;B=J;C=I;x=348;break}return l|0}}while(0);do{if((x|0)==348){if((g|0)!=0){s=C;t=B;u=A;v=z;w=y;x=349;break}if((z|0)>1275){l=-4;return l|0}else{b[j+(C-1<<1)>>1]=z&65535;_=y;$=C;break}}}while(0);L525:do{if((x|0)==349){C=s-1|0;y=j+(C<<1)|0;if((u|0)<1){b[y>>1]=-1;l=-4;return l|0}z=a[w]|0;A=z&255;do{if((z&255)<252){aa=1;ab=A;ac=A}else{if((u|0)>=2){B=((d[w+1|0]|0)<<2)+A&65535;aa=2;ab=B;ac=B;break}b[y>>1]=-1;l=-4;return l|0}}while(0);b[y>>1]=ac;A=u-aa|0;z=ab<<16>>16;if(ab<<16>>16<0|(z|0)>(A|0)){l=-4;return l|0}I=w+aa|0;if((t|0)==0){if((z|0)>(v|0)){l=-4}else{_=I;$=s;break}return l|0}if((X(z,s)|0)>(A|0)){l=-4;return l|0}if((C|0)>0){ad=0;ae=ab}else{_=I;$=s;break}while(1){b[j+(ad<<1)>>1]=ae;A=ad+1|0;if((A|0)==(C|0)){_=I;$=s;break L525}ad=A;ae=b[y>>1]|0}}}while(0);L553:do{if((i|0)!=0&($|0)>0){ae=0;ad=_;while(1){c[i+(ae<<2)>>2]=ad;s=ad+(b[j+(ae<<1)>>1]<<16>>16)|0;ab=ae+1|0;if((ab|0)==($|0)){af=s;break L553}else{ae=ab;ad=s}}}else{af=_}}while(0);if((h|0)!=0){a[h]=m}if((k|0)==0){l=$;return l|0}c[k>>2]=af-e|0;l=$;return l|0}function bT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;do{if((a|0)==48e3|(a|0)==24e3|(a|0)==16e3|(a|0)==12e3|(a|0)==8e3){if((b-1|0)>>>0>1){e=397;break}f=bX((b*8768&-1)+9380|0)|0;g=f;if((f|0)==0){if((d|0)==0){h=0;break}c[d>>2]=-7;h=0;break}i=bR(g,a,b)|0;if((d|0)!=0){c[d>>2]=i}if((i|0)==0){h=g;break}bY(f);h=0;break}else{e=397}}while(0);do{if((e|0)==397){if((d|0)==0){h=0;break}c[d>>2]=-1;h=0}}while(0);return h|0}function bU(d,e,f,h,j,k,l,m,n){d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;o=i;i=i+104|0;p=o|0;q=o+4|0;r=o+8|0;if(k>>>0>1){s=-1;i=o;return s|0}t=(k|0)!=0;k=(f|0)==0;u=(e|0)==0;do{if(t|k|u){if(((j|0)%((c[d+12>>2]|0)/400&-1|0)|0)==0){break}else{s=-1}i=o;return s|0}}while(0);if(k|u){u=d+8|0;k=0;while(1){v=bV(d,0,0,h+(X(c[u>>2]|0,k)<<2)|0,j-k|0,0)|0;if((v|0)<0){s=v;w=467;break}x=v+k|0;if((x|0)<(j|0)){k=x}else{break}}if((w|0)==467){i=o;return s|0}c[d+68>>2]=x;s=x;i=o;return s|0}if((f|0)<0){s=-1;i=o;return s|0}x=a[e]|0;k=x&255;do{if((k&128|0)==0){u=(k&96|0)==96?1001:1e3;if((k&96|0)==96){v=d+12|0;y=k>>>4&1|1104;z=v;A=v}else{v=d+12|0;y=(k>>>5&3)+1101|0;z=v;A=v}v=c[A>>2]|0;if((k&96|0)==96){if((k&8|0)==0){B=(v|0)/100&-1;C=u;D=y;E=z;break}else{B=(v|0)/50&-1;C=u;D=y;E=z;break}}else{F=k>>>3&3;if((F|0)==3){B=(v*60&-1|0)/1e3&-1;C=u;D=y;E=z;break}else{B=(v<<F|0)/100&-1;C=u;D=y;E=z;break}}}else{u=k>>>5&3;F=d+12|0;B=(c[F>>2]<<(k>>>3&3)|0)/400&-1;C=1002;D=(u|0)==0?1101:u+1102|0;E=F}}while(0);k=(x&4)<<24>>24!=0?2:1;x=r|0;z=bS(e,f,l,q,0,x,p)|0;q=c[p>>2]|0;p=e+q|0;if(!t){if((z|0)<0){s=z;i=o;return s|0}if((X(z,B)|0)>(j|0)){s=-2;i=o;return s|0}c[d+52>>2]=C;c[d+48>>2]=D;c[d+60>>2]=B;c[d+44>>2]=k;L626:do{if((z|0)>0){t=d+8|0;e=q;l=0;f=0;y=p;while(1){A=r+(f<<1)|0;F=b[A>>1]<<16>>16;u=bV(d,y,F,h+(X(c[t>>2]|0,l)<<2)|0,j-l|0,0)|0;if((u|0)<0){s=u;break}F=b[A>>1]<<16>>16;A=F+e|0;v=u+l|0;u=f+1|0;if((u|0)<(z|0)){e=A;l=v;f=u;y=y+F|0}else{G=A;H=v;break L626}}i=o;return s|0}else{G=q;H=0}}while(0);if((m|0)!=0){c[m>>2]=G}c[d+68>>2]=H;if((n|0)==0){g[d+76>>2]=0.0;g[d+72>>2]=0.0;s=H;i=o;return s|0}else{bP(h,H,c[d+8>>2]|0,d+72|0);s=H;i=o;return s|0}}do{if(!((B|0)>(j|0)|(C|0)==1002)){H=d+52|0;if((c[H>>2]|0)==1002){break}n=d+68|0;G=c[n>>2]|0;m=j-B|0;L645:do{if((B|0)==(j|0)){I=d+8|0}else{L648:do{if(((m|0)%((c[E>>2]|0)/400&-1|0)|0)==0){q=d+8|0;z=0;while(1){r=bV(d,0,0,h+(X(c[q>>2]|0,z)<<2)|0,m-z|0,0)|0;if((r|0)<0){J=r;break L648}K=r+z|0;if((K|0)<(m|0)){z=K}else{break}}c[n>>2]=K;if((K|0)<0){J=K}else{I=q;break L645}}else{J=-1}}while(0);c[n>>2]=G;s=J;i=o;return s|0}}while(0);c[H>>2]=C;c[d+48>>2]=D;c[d+60>>2]=B;c[d+44>>2]=k;G=b[x>>1]<<16>>16;z=bV(d,p,G,h+(X(c[I>>2]|0,m)<<2)|0,B,1)|0;if((z|0)<0){s=z;i=o;return s|0}c[n>>2]=j;s=j;i=o;return s|0}}while(0);if(((j|0)%((c[E>>2]|0)/400&-1|0)|0)!=0){s=-1;i=o;return s|0}E=d+8|0;B=0;while(1){I=bV(d,0,0,h+(X(c[E>>2]|0,B)<<2)|0,j-B|0,0)|0;if((I|0)<0){s=I;w=462;break}L=I+B|0;if((L|0)<(j|0)){B=L}else{break}}if((w|0)==462){i=o;return s|0}c[d+68>>2]=L;s=L;i=o;return s|0}function bV(a,e,f,h,j,k){a=a|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,al=0,an=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0.0,aY=0.0,aZ=0,a_=0,a0=0,a1=0;l=i;i=i+72|0;m=l|0;n=l+8|0;o=l+56|0;p=l+60|0;r=l+64|0;s=l+68|0;c[p>>2]=0;t=a;u=c[a+4>>2]|0;v=t+u|0;w=t+(c[a>>2]|0)|0;x=a+12|0;y=c[x>>2]|0;z=(y|0)/50&-1;A=z>>1;B=z>>2;C=z>>3;if((C|0)>(j|0)){D=-2;i=l;return D|0}E=((y|0)/25&-1)*3&-1;y=(E|0)>(j|0)?j:E;do{if((f|0)<2){E=c[a+60>>2]|0;F=(y|0)<(E|0)?y:E;G=483;break}else{if((e|0)==0){F=y;G=483;break}E=c[a+60>>2]|0;j=c[a+52>>2]|0;c[n>>2]=e;c[n+4>>2]=f;c[n+8>>2]=0;c[n+12>>2]=0;c[n+16>>2]=0;H=n+20|0;c[H>>2]=9;I=n+24|0;c[I>>2]=0;J=n+28|0;c[J>>2]=128;if((f|0)==0){K=0;L=0}else{c[I>>2]=1;K=d[e]|0;L=1}M=n+40|0;c[M>>2]=K;N=K>>>1^127;O=n+32|0;c[O>>2]=N;c[n+44>>2]=0;if(L>>>0<f>>>0){P=L+1|0;c[I>>2]=P;Q=d[e+L|0]|0;R=P}else{Q=0;R=L}if(R>>>0<f>>>0){P=R+1|0;c[I>>2]=P;S=d[e+R|0]|0;T=P}else{S=0;T=R}if(T>>>0<f>>>0){c[I>>2]=T+1|0;V=d[e+T|0]|0}else{V=0}c[H>>2]=33;c[J>>2]=-2147483648;c[M>>2]=V;c[O>>2]=((((Q|K<<8)>>>1&255|N<<8)<<8|(S|Q<<8)>>>1&255)<<8&2147483392|(V|S<<8)>>>1&255)^16777215;W=E;Y=j;Z=y;_=e;$=1;break}}while(0);do{if((G|0)==483){e=c[a+56>>2]|0;if((e|0)!=0){W=F;Y=e;Z=F;_=0;$=0;break}e=a+8|0;if((X(c[e>>2]|0,F)|0)>0){aa=0}else{D=F;i=l;return D|0}while(1){g[h+(aa<<2)>>2]=0.0;y=aa+1|0;if((y|0)<(X(c[e>>2]|0,F)|0)){aa=y}else{D=F;break}}i=l;return D|0}}while(0);F=(_|0)==0;aa=(Y|0)==1e3;if(aa|F^1){ab=Z}else{ab=(Z|0)<(z|0)?Z:z}do{if($){Z=c[a+56>>2]|0;if((Z|0)<=0){G=493;break}e=(Y|0)==1002;y=(Z|0)==1002;do{if(y|e^1){G=492}else{if((c[a+64>>2]|0)==0){break}else{G=492;break}}}while(0);if((G|0)==492){if(e|y^1){G=493;break}}Z=X(c[a+8>>2]|0,B);S=e?0:Z;V=ao()|0;Q=i;i=i+((e?Z:0)*4&-1)|0;i=i+3>>2<<2;if(!e){ac=1;ad=S;ae=V;af=Q;break}bV(a,0,0,Q,(B|0)<(W|0)?B:W,0);ac=1;ad=S;ae=V;af=Q;break}else{G=493}}while(0);if((G|0)==493){ac=0;ad=0;ae=ao()|0;af=m|0}L716:do{if((W|0)>(ab|0)){ag=-1}else{G=(Y|0)!=1002;L718:do{if(G){Q=a+8|0;V=X(c[Q>>2]|0,(A|0)>(W|0)?A:W);S=i;i=i+(V*2&-1)|0;i=i+3>>2<<2;if((c[a+56>>2]|0)==1002){b_(v|0,0,4252);c[t+(u+2376|0)>>2]=1;c[v>>2]=65536;c[t+(u+4148|0)>>2]=0;c[t+(u+4152|0)>>2]=3176576;c[t+(u+4168|0)>>2]=0;c[t+(u+4240|0)>>2]=65536;c[t+(u+4244|0)>>2]=65536;c[t+(u+4256|0)>>2]=20;c[t+(u+4252|0)>>2]=2;V=t+(u+4260|0)|0;b_(V|0,0,4252);c[t+(u+6636|0)>>2]=1;c[V>>2]=65536;c[t+(u+8408|0)>>2]=0;c[t+(u+8412|0)>>2]=3176576;c[t+(u+8428|0)>>2]=0;c[t+(u+8500|0)>>2]=65536;c[t+(u+8504|0)>>2]=65536;c[t+(u+8516|0)>>2]=20;c[t+(u+8512|0)>>2]=2;V=t+(u+8520|0)|0;b[V>>1]=0;b[V+2>>1]=0;b[V+4>>1]=0;b[V+6>>1]=0;b[V+8>>1]=0;b[V+10>>1]=0;c[t+(u+8540|0)>>2]=0}V=(W*1e3&-1|0)/(c[x>>2]|0)&-1;Z=a+16|0;c[a+32>>2]=(V|0)<10?10:V;do{if($){c[a+20>>2]=c[a+44>>2]|0;if(!aa){c[a+28>>2]=16e3;break}V=c[a+48>>2]|0;if((V|0)==1101){c[a+28>>2]=8e3;break}else if((V|0)==1102){c[a+28>>2]=12e3;break}else{c[a+28>>2]=16e3;break}}}while(0);V=F?1:k<<1;K=(V|0)==0;T=S;R=0;while(1){L736:do{if((bx(v,Z,V,(R|0)==0&1,n,T,o)|0)==0){ah=c[Q>>2]|0}else{if(K){ag=-4;break L716}c[o>>2]=W;L=c[Q>>2]|0;if((X(L,W)|0)>0){ai=0}else{ah=L;break}while(1){b[T+(ai<<1)>>1]=0;L=ai+1|0;j=c[Q>>2]|0;if((L|0)<(X(j,W)|0)){ai=L}else{ah=j;break L736}}}}while(0);j=c[o>>2]|0;L=T+(X(ah,j)<<1)|0;E=j+R|0;if((E|0)<(W|0)){T=L;R=E}else{aj=S;break L718}}}else{aj=m}}while(0);e=(k|0)!=0;do{if(e){al=f;an=0;ap=0;aq=0}else{if(!G){al=f;an=0;ap=0;aq=0;break}if(!$){al=f;an=0;ap=0;aq=0;break}y=n+20|0;S=c[y>>2]|0;R=n+28|0;T=c[R>>2]|0;Q=am(T|0,1)|-32;if((((S+17|0)+Q|0)+(-((c[a+52>>2]|0)==1001&1)&20)|0)>(f<<3|0)){al=f;an=0;ap=0;aq=0;break}Q=(Y|0)==1001;K=n+32|0;V=c[K>>2]|0;if(Q){Z=T>>>12;E=V>>>0<Z>>>0;L=E&1;if(E){c[R>>2]=Z;ar=V;as=Z}else{j=V-Z|0;c[K>>2]=j;N=T-Z|0;c[R>>2]=N;if(N>>>0<8388609){ar=j;as=N}else{al=f;an=0;ap=0;aq=0;break}}N=n+40|0;j=n+24|0;Z=n|0;O=c[n+4>>2]|0;M=S;J=as;H=c[N>>2]|0;I=c[j>>2]|0;P=ar;while(1){at=M+8|0;c[y>>2]=at;au=J<<8;c[R>>2]=au;if(I>>>0<O>>>0){av=I+1|0;c[j>>2]=av;aw=d[(c[Z>>2]|0)+I|0]|0;ax=av}else{aw=0;ax=I}c[N>>2]=aw;ay=((aw|H<<8)>>>1&255|P<<8&2147483392)^255;c[K>>2]=ay;if(au>>>0<8388609){M=at;J=au;H=aw;I=ax;P=ay}else{break}}if(E){az=L;aA=au;aB=at;aC=ay}else{al=f;an=0;ap=0;aq=0;break}}else{az=1;aA=T;aB=S;aC=V}P=n+32|0;I=aA>>>1;H=aC>>>0<I>>>0;J=H&1;if(H){aD=I;aE=aC}else{H=aC-I|0;c[P>>2]=H;aD=aA-I|0;aE=H}c[R>>2]=aD;L765:do{if(aD>>>0<8388609){H=n+40|0;I=n+24|0;M=n|0;K=c[n+4>>2]|0;N=aB;Z=aD;j=c[H>>2]|0;O=c[I>>2]|0;av=aE;while(1){aF=N+8|0;c[y>>2]=aF;aG=Z<<8;c[R>>2]=aG;if(O>>>0<K>>>0){aH=O+1|0;c[I>>2]=aH;aI=d[(c[M>>2]|0)+O|0]|0;aJ=aH}else{aI=0;aJ=O}c[H>>2]=aI;aH=((aI|j<<8)>>>1&255|av<<8&2147483392)^255;c[P>>2]=aH;if(aG>>>0<8388609){N=aF;Z=aG;j=aI;O=aJ;av=aH}else{aK=aF;aL=aG;break L765}}}else{aK=aB;aL=aD}}while(0);if(Q){P=(a6(n,256)|0)+2|0;aM=P;aN=c[y>>2]|0;aO=c[R>>2]|0}else{aM=f-((aK+7|0)+(am(aL|0,1)|-32)>>3)|0;aN=aK;aO=aL}P=f-aM|0;V=(P<<3|0)<((am(aO|0,1)|-32)+aN|0);S=V?0:aM;T=n+4|0;c[T>>2]=(c[T>>2]|0)-S|0;al=V?0:P;an=J;ap=S;aq=V?0:az}}while(0);V=G?17:0;S=c[a+48>>2]|0;if((S|0)==1101){aP=13}else if((S|0)==1102|(S|0)==1103){aP=17}else if((S|0)==1104){aP=19}else{aP=21}a3(w,10012,(q=i,i=i+4|0,c[q>>2]=aP,q)|0);a3(w,10008,(q=i,i=i+4|0,c[q>>2]=c[a+44>>2]|0,q)|0);S=(aq|0)!=0;P=i;i=i+((S?0:ad)*4&-1)|0;i=i+3>>2<<2;T=(ac|0)!=0;L=T&(S^1);if(S|T^1|G^1){aQ=af}else{T=(B|0)<(W|0)?B:W;bV(a,0,0,P,T,0);aQ=P}do{if(S){P=X(c[a+8>>2]|0,B);T=i;i=i+(P*4&-1)|0;i=i+3>>2<<2;if((an|0)==0){aR=T;aS=1;aT=1;break}a3(w,10010,(q=i,i=i+4|0,c[q>>2]=0,q)|0);a$(w,_+al|0,ap,T,B,0);a3(w,4031,(q=i,i=i+4|0,c[q>>2]=p,q)|0);aR=T;aS=0;aT=0}else{aR=m|0;aS=(an|0)==0;aT=1}}while(0);a3(w,10010,(q=i,i=i+4|0,c[q>>2]=V,q)|0);do{if(aa){b[r>>1]=-1;T=a+8|0;L793:do{if((X(c[T>>2]|0,W)|0)>0){P=0;while(1){g[h+(P<<2)>>2]=0.0;E=P+1|0;if((E|0)<(X(c[T>>2]|0,W)|0)){P=E}else{break L793}}}}while(0);if((c[a+56>>2]|0)!=1001){aU=0;aV=aT;break}if(!aT){if((c[a+64>>2]|0)!=0){aU=0;aV=0;break}}a3(w,10010,(q=i,i=i+4|0,c[q>>2]=0,q)|0);a$(w,r,2,h,C,0);aU=0;aV=aT}else{T=(z|0)<(W|0)?z:W;J=c[a+56>>2]|0;do{if((Y|0)!=(J|0)&(J|0)>0){if((c[a+64>>2]|0)!=0){break}a3(w,4028,(q=i,i=i+1|0,i=i+3>>2<<2,c[q>>2]=0,q)|0)}}while(0);aU=a$(w,e?0:_,al,h,T,n)|0;aV=aT}}while(0);L807:do{if(G){e=a+8|0;if((X(c[e>>2]|0,W)|0)>0){aW=0}else{break}while(1){V=h+(aW<<2)|0;g[V>>2]=+g[V>>2]+ +(b[aj+(aW<<1)>>1]<<16>>16|0)*30517578125.0e-15;V=aW+1|0;if((V|0)<(X(c[e>>2]|0,W)|0)){aW=V}else{break L807}}}}while(0);a3(w,10015,(q=i,i=i+4|0,c[q>>2]=s,q)|0);G=c[(c[s>>2]|0)+60>>2]|0;e=S&aS;L812:do{if(e){a3(w,4028,(q=i,i=i+1|0,i=i+3>>2<<2,c[q>>2]=0,q)|0);a3(w,10010,(q=i,i=i+4|0,c[q>>2]=0,q)|0);T=_+al|0;a$(w,T,ap,aR,B,0);a3(w,4031,(q=i,i=i+4|0,c[q>>2]=p,q)|0);T=c[a+8>>2]|0;V=X(T,W-C|0);J=X(T,C);R=48e3/(c[x>>2]|0)&-1;if((T|0)<=0){break}y=(C|0)>0;Q=0;while(1){L817:do{if(y){P=0;while(1){aX=+g[G+(X(P,R)<<2)>>2];aY=aX*aX;E=X(P,T)+Q|0;av=h+(E+V<<2)|0;g[av>>2]=aY*+g[aR+(E+J<<2)>>2]+(1.0-aY)*+g[av>>2];av=P+1|0;if((av|0)==(C|0)){break L817}else{P=av}}}}while(0);P=Q+1|0;if((P|0)==(T|0)){break L812}else{Q=P}}}}while(0);L822:do{if(!aV){S=a+8|0;Q=c[S>>2]|0;if((Q|0)<=0){break}T=(C|0)>0;J=0;V=Q;while(1){L827:do{if(T){Q=0;R=V;while(1){y=X(R,Q)+J|0;g[h+(y<<2)>>2]=+g[aR+(y<<2)>>2];y=Q+1|0;P=c[S>>2]|0;if((y|0)==(C|0)){aZ=P;break L827}else{Q=y;R=P}}}else{aZ=V}}while(0);R=J+1|0;if((R|0)<(aZ|0)){J=R;V=aZ}else{break}}V=X(aZ,C);J=48e3/(c[x>>2]|0)&-1;if((aZ|0)<=0){break}S=(C|0)>0;T=0;while(1){L835:do{if(S){R=0;while(1){aY=+g[G+(X(R,J)<<2)>>2];aX=aY*aY;Q=(X(R,aZ)+T|0)+V|0;P=h+(Q<<2)|0;g[P>>2]=aX*+g[P>>2]+(1.0-aX)*+g[aR+(Q<<2)>>2];Q=R+1|0;if((Q|0)==(C|0)){break L835}else{R=Q}}}}while(0);R=T+1|0;if((R|0)==(aZ|0)){break L822}else{T=R}}}}while(0);L840:do{if(L){T=a+8|0;V=c[T>>2]|0;if((W|0)<(B|0)){J=48e3/(c[x>>2]|0)&-1;if((V|0)<=0){break}S=(C|0)>0;R=0;while(1){L847:do{if(S){Q=0;while(1){aX=+g[G+(X(Q,J)<<2)>>2];aY=aX*aX;P=X(Q,V)+R|0;y=h+(P<<2)|0;g[y>>2]=aY*+g[y>>2]+(1.0-aY)*+g[aQ+(P<<2)>>2];P=Q+1|0;if((P|0)==(C|0)){break L847}else{Q=P}}}}while(0);Q=R+1|0;if((Q|0)==(V|0)){break L840}else{R=Q}}}R=X(V,C);L852:do{if((R|0)>0){J=0;while(1){g[h+(J<<2)>>2]=+g[aQ+(J<<2)>>2];S=J+1|0;Q=c[T>>2]|0;P=X(Q,C);if((S|0)<(P|0)){J=S}else{a_=Q;a0=P;break L852}}}else{a_=V;a0=R}}while(0);R=48e3/(c[x>>2]|0)&-1;if((a_|0)<=0){break}V=(C|0)>0;T=0;while(1){L859:do{if(V){J=0;while(1){aY=+g[G+(X(J,R)<<2)>>2];aX=aY*aY;P=(X(J,a_)+T|0)+a0|0;Q=h+(P<<2)|0;g[Q>>2]=aX*+g[Q>>2]+(1.0-aX)*+g[aQ+(P<<2)>>2];P=J+1|0;if((P|0)==(C|0)){break L859}else{J=P}}}}while(0);J=T+1|0;if((J|0)==(a_|0)){break L840}else{T=J}}}}while(0);G=c[a+40>>2]|0;L864:do{if((G|0)!=0){aX=+U(+(G|0)*.0006488140788860619*.6931471805599453);L=a+8|0;if((X(c[L>>2]|0,W)|0)>0){a1=0}else{break}while(1){T=h+(a1<<2)|0;g[T>>2]=aX*+g[T>>2];T=a1+1|0;if((T|0)<(X(c[L>>2]|0,W)|0)){a1=T}else{break L864}}}}while(0);if((al|0)<2){c[a+80>>2]=0}else{c[a+80>>2]=c[p>>2]^c[n+28>>2]}c[a+56>>2]=Y;c[a+64>>2]=e&1;ag=(aU|0)<0?aU:W}}while(0);ak(ae|0);D=ag;i=l;return D|0}function bW(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return bU(a,b,c,d,e,f,0,0,0)|0}function bX(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,am=0,an=0,ao=0,aq=0,as=0,at=0,av=0,aw=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1314355]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5257460+(h<<2)|0;j=5257460+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1314355]=e&(1<<g^-1)}else{if(l>>>0<(c[1314359]|0)>>>0){au();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{au();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1314357]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5257460+(p<<2)|0;m=5257460+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1314355]=e&(1<<r^-1)}else{if(l>>>0<(c[1314359]|0)>>>0){au();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{au();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1314357]|0;if((l|0)!=0){q=c[1314360]|0;d=l>>>3;l=d<<1;f=5257460+(l<<2)|0;k=c[1314355]|0;h=1<<d;do{if((k&h|0)==0){c[1314355]=k|h;s=f;t=5257460+(l+2<<2)|0}else{d=5257460+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1314359]|0)>>>0){s=g;t=d;break}au();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1314357]=m;c[1314360]=e;n=i;return n|0}l=c[1314356]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5257724+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1314359]|0;if(r>>>0<i>>>0){au();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){au();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L1055:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L1055}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){au();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){au();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){au();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{au();return 0}}}while(0);L1077:do{if((e|0)!=0){f=d+28|0;i=5257724+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1314356]=c[1314356]&(1<<c[f>>2]^-1);break L1077}else{if(e>>>0<(c[1314359]|0)>>>0){au();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L1077}}}while(0);if(v>>>0<(c[1314359]|0)>>>0){au();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1314357]|0;if((f|0)!=0){e=c[1314360]|0;i=f>>>3;f=i<<1;q=5257460+(f<<2)|0;k=c[1314355]|0;g=1<<i;do{if((k&g|0)==0){c[1314355]=k|g;y=q;z=5257460+(f+2<<2)|0}else{i=5257460+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1314359]|0)>>>0){y=l;z=i;break}au();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1314357]=p;c[1314360]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1314356]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5257724+(A<<2)>>2]|0;L885:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L885}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L885}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5257724+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L900:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L900}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1314357]|0)-g|0)>>>0){o=g;break}k=K;q=c[1314359]|0;if(k>>>0<q>>>0){au();return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){au();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L913:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L913}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){au();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){au();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){au();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{au();return 0}}}while(0);L935:do{if((e|0)!=0){i=K+28|0;q=5257724+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1314356]=c[1314356]&(1<<c[i>>2]^-1);break L935}else{if(e>>>0<(c[1314359]|0)>>>0){au();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L935}}}while(0);if(L>>>0<(c[1314359]|0)>>>0){au();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5257460+(e<<2)|0;r=c[1314355]|0;j=1<<i;do{if((r&j|0)==0){c[1314355]=r|j;O=q;P=5257460+(e+2<<2)|0}else{i=5257460+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1314359]|0)>>>0){O=d;P=i;break}au();return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5257724+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1314356]|0;l=1<<Q;if((q&l|0)==0){c[1314356]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=762;break}else{l=l<<1;q=j}}if((T|0)==762){if(S>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1314359]|0;if(q>>>0<i>>>0){au();return 0}if(j>>>0<i>>>0){au();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1314357]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1314360]|0;if(S>>>0>15){R=J;c[1314360]=R+o|0;c[1314357]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1314357]=0;c[1314360]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1314358]|0;if(o>>>0<J>>>0){S=J-o|0;c[1314358]=S;J=c[1314361]|0;K=J;c[1314361]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1311969]|0)==0){J=al(8)|0;if((J-1&J|0)==0){c[1311971]=J;c[1311970]=J;c[1311972]=-1;c[1311973]=2097152;c[1311974]=0;c[1314466]=0;c[1311969]=ax(0)&-16^1431655768;break}else{au();return 0}}}while(0);J=o+48|0;S=c[1311971]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1314465]|0;do{if((O|0)!=0){P=c[1314463]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1144:do{if((c[1314466]&4|0)==0){O=c[1314361]|0;L1146:do{if((O|0)==0){T=792}else{L=O;P=5257868;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=792;break L1146}else{P=M}}if((P|0)==0){T=792;break}L=R-(c[1314358]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=ar(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=801;break}}while(0);do{if((T|0)==792){O=ar(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1311970]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1314463]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1314465]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=ar($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=801;break}}while(0);L1166:do{if((T|0)==801){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=812;break L1144}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1311971]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((ar(O|0)|0)==-1){ar(q|0);W=Y;break L1166}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=812;break L1144}}}while(0);c[1314466]=c[1314466]|4;ad=W;T=809;break}else{ad=0;T=809}}while(0);do{if((T|0)==809){if(S>>>0>=2147483647){break}W=ar(S|0)|0;Z=ar(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=812;break}}}while(0);do{if((T|0)==812){ad=(c[1314463]|0)+aa|0;c[1314463]=ad;if(ad>>>0>(c[1314464]|0)>>>0){c[1314464]=ad}ad=c[1314361]|0;L1186:do{if((ad|0)==0){S=c[1314359]|0;if((S|0)==0|ab>>>0<S>>>0){c[1314359]=ab}c[1314467]=ab;c[1314468]=aa;c[1314470]=0;c[1314364]=c[1311969]|0;c[1314363]=-1;S=0;while(1){Y=S<<1;ac=5257460+(Y<<2)|0;c[5257460+(Y+3<<2)>>2]=ac;c[5257460+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1314361]=ab+ae|0;c[1314358]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1314362]=c[1311973]|0}else{S=5257868;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=824;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==824){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1314361]|0;Y=(c[1314358]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1314361]=Z+ai|0;c[1314358]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1314362]=c[1311973]|0;break L1186}}while(0);if(ab>>>0<(c[1314359]|0)>>>0){c[1314359]=ab}S=ab+aa|0;Y=5257868;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=834;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==834){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){am=0}else{am=-S&7}S=ab+(am+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[1314361]|0)){J=(c[1314358]|0)+K|0;c[1314358]=J;c[1314361]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1314360]|0)){J=(c[1314357]|0)+K|0;c[1314357]=J;c[1314360]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+am|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1231:do{if(X>>>0<256){U=c[ab+((am|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+am|0)>>2]|0;R=5257460+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1314359]|0)>>>0){au();return 0}if((c[U+12>>2]|0)==(Z|0)){break}au();return 0}}while(0);if((Q|0)==(U|0)){c[1314355]=c[1314355]&(1<<V^-1);break}do{if((Q|0)==(R|0)){an=Q+8|0}else{if(Q>>>0<(c[1314359]|0)>>>0){au();return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){an=q;break}au();return 0}}while(0);c[U+12>>2]=Q;c[an>>2]=U}else{R=S;q=c[ab+((am|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+am|0)>>2]|0;L1252:do{if((P|0)==(R|0)){O=am|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){ao=0;break L1252}else{aq=M;as=e;break}}else{aq=L;as=g}}while(0);while(1){g=aq+20|0;L=c[g>>2]|0;if((L|0)!=0){aq=L;as=g;continue}g=aq+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{aq=L;as=g}}if(as>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[as>>2]=0;ao=aq;break}}else{g=c[ab+((am|8)+aa|0)>>2]|0;if(g>>>0<(c[1314359]|0)>>>0){au();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){au();return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;ao=P;break}else{au();return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+am|0)|0;U=5257724+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=ao;if((ao|0)!=0){break}c[1314356]=c[1314356]&(1<<c[P>>2]^-1);break L1231}else{if(q>>>0<(c[1314359]|0)>>>0){au();return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=ao}else{c[q+20>>2]=ao}if((ao|0)==0){break L1231}}}while(0);if(ao>>>0<(c[1314359]|0)>>>0){au();return 0}c[ao+24>>2]=q;R=am|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[ao+16>>2]=P;c[P+24>>2]=ao;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[ao+20>>2]=P;c[P+24>>2]=ao;break}}}while(0);at=ab+(($|am)+aa|0)|0;av=$+K|0}else{at=Z;av=K}J=at+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=av|1;c[ab+(av+W|0)>>2]=av;J=av>>>3;if(av>>>0<256){V=J<<1;X=5257460+(V<<2)|0;P=c[1314355]|0;q=1<<J;do{if((P&q|0)==0){c[1314355]=P|q;aw=X;ay=5257460+(V+2<<2)|0}else{J=5257460+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1314359]|0)>>>0){aw=U;ay=J;break}au();return 0}}while(0);c[ay>>2]=_;c[aw+12>>2]=_;c[ab+(W+8|0)>>2]=aw;c[ab+(W+12|0)>>2]=X;break}V=ac;q=av>>>8;do{if((q|0)==0){az=0}else{if(av>>>0>16777215){az=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;az=av>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5257724+(az<<2)|0;c[ab+(W+28|0)>>2]=az;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1314356]|0;Q=1<<az;if((X&Q|0)==0){c[1314356]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((az|0)==31){aA=0}else{aA=25-(az>>>1)|0}Q=av<<aA;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(av|0)){break}aB=X+16+(Q>>>31<<2)|0;q=c[aB>>2]|0;if((q|0)==0){T=907;break}else{Q=Q<<1;X=q}}if((T|0)==907){if(aB>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[aB>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1314359]|0;if(X>>>0<$>>>0){au();return 0}if(q>>>0<$>>>0){au();return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=5257868;while(1){aC=c[W>>2]|0;if(aC>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aC+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aC+(aD-39|0)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aC+((aD-47|0)+aF|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=(aa-40|0)-aG|0;c[1314361]=ab+aG|0;c[1314358]=_;c[ab+(aG+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1314362]=c[1311973]|0;c[ac+4>>2]=27;c[W>>2]=c[1314467]|0;c[W+4>>2]=c[5257872>>2]|0;c[W+8>>2]=c[5257876>>2]|0;c[W+12>>2]=c[5257880>>2]|0;c[1314467]=ab;c[1314468]=aa;c[1314470]=0;c[1314469]=W;W=ac+28|0;c[W>>2]=7;L1350:do{if((ac+32|0)>>>0<aE>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aE>>>0){_=K}else{break L1350}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5257460+(K<<2)|0;S=c[1314355]|0;q=1<<_;do{if((S&q|0)==0){c[1314355]=S|q;aH=Z;aI=5257460+(K+2<<2)|0}else{_=5257460+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1314359]|0)>>>0){aH=Q;aI=_;break}au();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aJ=0}else{if(W>>>0>16777215){aJ=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aJ=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5257724+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1314356]|0;Q=1<<aJ;if((Z&Q|0)==0){c[1314356]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=W<<aK;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aL=Z+16+(Q>>>31<<2)|0;q=c[aL>>2]|0;if((q|0)==0){T=942;break}else{Q=Q<<1;Z=q}}if((T|0)==942){if(aL>>>0<(c[1314359]|0)>>>0){au();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1314359]|0;if(Z>>>0<q>>>0){au();return 0}if(W>>>0<q>>>0){au();return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1314358]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1314358]=W;ad=c[1314361]|0;Q=ad;c[1314361]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[ap()>>2]=12;n=0;return n|0}function bY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1314359]|0;if(b>>>0<e>>>0){au()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){au()}h=f&-8;i=a+(h-8|0)|0;j=i;L1403:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){au()}if((n|0)==(c[1314360]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1314357]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=5257460+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){au()}if((c[k+12>>2]|0)==(n|0)){break}au()}}while(0);if((s|0)==(k|0)){c[1314355]=c[1314355]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){au()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}au()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L1437:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L1437}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){au()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){au()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){au()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{au()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=5257724+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1314356]=c[1314356]&(1<<c[v>>2]^-1);q=n;r=o;break L1403}else{if(p>>>0<(c[1314359]|0)>>>0){au()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1403}}}while(0);if(A>>>0<(c[1314359]|0)>>>0){au()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1314359]|0)>>>0){au()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1314359]|0)>>>0){au()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){au()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){au()}do{if((e&2|0)==0){if((j|0)==(c[1314361]|0)){B=(c[1314358]|0)+r|0;c[1314358]=B;c[1314361]=q;c[q+4>>2]=B|1;if((q|0)==(c[1314360]|0)){c[1314360]=0;c[1314357]=0}if(B>>>0<=(c[1314362]|0)>>>0){return}bZ(0);return}if((j|0)==(c[1314360]|0)){B=(c[1314357]|0)+r|0;c[1314357]=B;c[1314360]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1508:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=5257460+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[1314359]|0)>>>0){au()}if((c[u+12>>2]|0)==(j|0)){break}au()}}while(0);if((g|0)==(u|0)){c[1314355]=c[1314355]&(1<<C^-1);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[1314359]|0)>>>0){au()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}au()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16|0)>>2]|0;t=c[a+(h|4)>>2]|0;L1510:do{if((t|0)==(b|0)){p=a+(h+12|0)|0;v=c[p>>2]|0;do{if((v|0)==0){m=a+(h+8|0)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break L1510}else{F=k;G=m;break}}else{F=v;G=p}}while(0);while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[1314359]|0)>>>0){au()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[1314359]|0)>>>0){au()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){au()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{au()}}}while(0);if((f|0)==0){break}t=a+(h+20|0)|0;u=5257724+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1314356]=c[1314356]&(1<<c[t>>2]^-1);break L1508}else{if(f>>>0<(c[1314359]|0)>>>0){au()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1508}}}while(0);if(E>>>0<(c[1314359]|0)>>>0){au()}c[E+24>>2]=f;b=c[a+(h+8|0)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[1314359]|0)>>>0){au()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12|0)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[1314359]|0)>>>0){au()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[1314360]|0)){H=B;break}c[1314357]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=5257460+(d<<2)|0;A=c[1314355]|0;E=1<<r;do{if((A&E|0)==0){c[1314355]=A|E;I=e;J=5257460+(d+2<<2)|0}else{r=5257460+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1314359]|0)>>>0){I=h;J=r;break}au()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=(14-(E|J|d)|0)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=5257724+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1314356]|0;d=1<<K;do{if((r&d|0)==0){c[1314356]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1121;break}else{A=A<<1;J=E}}if((N|0)==1121){if(M>>>0<(c[1314359]|0)>>>0){au()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[1314359]|0;if(J>>>0<E>>>0){au()}if(B>>>0<E>>>0){au()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[1314363]|0)-1|0;c[1314363]=q;if((q|0)==0){O=5257876}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[1314363]=-1;return}function bZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((c[1311969]|0)==0){b=al(8)|0;if((b-1&b|0)==0){c[1311971]=b;c[1311970]=b;c[1311972]=-1;c[1311973]=2097152;c[1311974]=0;c[1314466]=0;c[1311969]=ax(0)&-16^1431655768;break}else{au();return 0}}}while(0);if(a>>>0>=4294967232){d=0;e=d&1;return e|0}b=c[1314361]|0;if((b|0)==0){d=0;e=d&1;return e|0}f=c[1314358]|0;do{if(f>>>0>(a+40|0)>>>0){g=c[1311971]|0;h=X(((((((-40-a|0)-1|0)+f|0)+g|0)>>>0)/(g>>>0)>>>0)-1|0,g);i=b;j=5257868;while(1){k=c[j>>2]|0;if(k>>>0<=i>>>0){if((k+(c[j+4>>2]|0)|0)>>>0>i>>>0){l=j;break}}k=c[j+8>>2]|0;if((k|0)==0){l=0;break}else{j=k}}if((c[l+12>>2]&8|0)!=0){break}j=ar(0)|0;i=l+4|0;if((j|0)!=((c[l>>2]|0)+(c[i>>2]|0)|0)){break}k=ar(-(h>>>0>2147483646?-2147483648-g|0:h)|0)|0;m=ar(0)|0;if(!((k|0)!=-1&m>>>0<j>>>0)){break}k=j-m|0;if((j|0)==(m|0)){break}c[i>>2]=(c[i>>2]|0)-k|0;c[1314463]=(c[1314463]|0)-k|0;i=c[1314361]|0;n=(c[1314358]|0)-k|0;k=i;o=i+8|0;if((o&7|0)==0){p=0}else{p=-o&7}o=n-p|0;c[1314361]=k+p|0;c[1314358]=o;c[k+(p+4|0)>>2]=o|1;c[k+(n+4|0)>>2]=40;c[1314362]=c[1311973]|0;d=(j|0)!=(m|0);e=d&1;return e|0}}while(0);if((c[1314358]|0)>>>0<=(c[1314362]|0)>>>0){d=0;e=d&1;return e|0}c[1314362]=-1;d=0;e=d&1;return e|0}function b_(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function b$(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function b0(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{b$(b,c,d)}}function b1(b){b=b|0;var c=0;c=b;while(a[c]|0!=0){c=c+1|0}return c-b|0}function b2(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;c=b+d>>>0;if(e>>>0<a>>>0){c=c+1>>>0}return(z=c,e|0)|0}function b3(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){z=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}z=a<<c-32;return 0}function b4(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){z=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}z=0;return b>>>c-32|0}function b5(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){z=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}z=(b|0)<0?-1:0;return b>>c-32|0}function b6(a,b){a=a|0;b=b|0;aA[a&1](b|0)}function b7(a,b){a=a|0;b=b|0;return aB[a&1](b|0)|0}function b8(a,b,c){a=a|0;b=b|0;c=c|0;return aC[a&1](b|0,c|0)|0}function b9(a){a=a|0;aD[a&1]()}function ca(a){a=a|0;Y(0)}function cb(a){a=a|0;Y(1);return 0}function cc(a,b){a=a|0;b=b|0;Y(2);return 0}function cd(){Y(3)}
// EMSCRIPTEN_END_FUNCS
var aA=[ca,ca];var aB=[cb,cb];var aC=[cc,cc];var aD=[cd,cd];return{_strlen:b1,_free:bY,_opus_decoder_create:bT,_memmove:b0,_opus_decode_float:bW,_memset:b_,_malloc:bX,_memcpy:b$,stackAlloc:aE,stackSave:aF,stackRestore:aG,setThrew:aH,setTempRet0:aI,setTempRet1:aJ,setTempRet2:aK,setTempRet3:aL,setTempRet4:aM,setTempRet5:aN,setTempRet6:aO,setTempRet7:aP,setTempRet8:aQ,setTempRet9:aR,dynCall_vi:b6,dynCall_ii:b7,dynCall_iii:b8,dynCall_v:b9}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, i64Math_add: i64Math_add, i64Math_subtract: i64Math_subtract, i64Math_multiply: i64Math_multiply, i64Math_divide: i64Math_divide, i64Math_modulo: i64Math_modulo, _llvm_va_end: _llvm_va_end, _cos: _cos, _llvm_stackrestore: _llvm_stackrestore, _sysconf: _sysconf, _llvm_ctlz_i32: _llvm_ctlz_i32, ___setErrNo: ___setErrNo, _llvm_stacksave: _llvm_stacksave, ___errno_location: ___errno_location, _sqrt: _sqrt, _sbrk: _sbrk, _atan2: _atan2, _floorf: _floorf, _abort: _abort, _floor: _floor, _exp: _exp, _time: _time, _sqrtf: _sqrtf, _llvm_lifetime_start: _llvm_lifetime_start, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity }, buffer);
var _strlen = Module["_strlen"] = asm._strlen;
var _free = Module["_free"] = asm._free;
var _opus_decoder_create = Module["_opus_decoder_create"] = asm._opus_decoder_create;
var _memmove = Module["_memmove"] = asm._memmove;
var _opus_decode_float = Module["_opus_decode_float"] = asm._opus_decode_float;
var _memset = Module["_memset"] = asm._memset;
var _malloc = Module["_malloc"] = asm._malloc;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    subtract: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.subtract(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    multiply: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.multiply(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    divide: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.div(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, z, null);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    modulo: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.modulo(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, null, z);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
initRuntime();
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
if (shouldRunNow) {
  run();
}
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
    
    this.prototype.init = function() {
        this.buflen = 4096;
        this.buf = _malloc(this.buflen);
        
        this.outlen = 4096;
        this.outbuf = _malloc(this.outlen * this.format.channelsPerFrame * 4);
        this.f32 = this.outbuf >> 2;
        
        this.opus = _opus_decoder_create(this.format.sampleRate, this.format.channelsPerFrame, this.buf);
    }
    
    this.prototype.readChunk = function() {
        if (!this.stream.available(1))
            throw new AV.UnderflowError();
        
        var list = this.stream.list;
        var packet = list.first;
        list.advance();
        
        if (this.buflen < packet.length) {
            this.buf = _realloc(this.buf, packet.length);
            this.buflen = packet.length;
        }
        
        Module.HEAPU8.set(packet.data, this.buf);
        
        var len = _opus_decode_float(this.opus, this.buf, packet.length, this.outbuf, this.outlen, 0);
        if (len < 0)
            throw new Error("Opus decoding error: " + len);
            
        var samples = Module.HEAPF32.subarray(this.f32, this.f32 + len * this.format.channelsPerFrame);
        return new Float32Array(samples);
    }
    
    AV.OggDemuxer.plugins.push({
        magic: "OpusHead",
        
        readHeaders: function(packet) {
            if (packet[8] !== 1)
                throw new Error("Unknown opus version");
            
            this.emit('format', {
                formatID: 'opus',
                sampleRate: 48000,
                channelsPerFrame: packet[9],
                floatingPoint: true
            });
            
            return true;
        },
        
        readPacket: function(packet) {
            var tag = packet.subarray(0, 8);
            if (String.fromCharCode.apply(String, tag) === "OpusTags")
                console.log('tag!');
            else
                this.emit('data', new AV.Buffer(packet));
        }
    });
});