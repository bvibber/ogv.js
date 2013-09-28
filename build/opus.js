var OpusDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('opus', this);
    
    var Module = {};
    // Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
  Module.test;
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
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
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
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
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
  if (isArrayType(type)) return true;
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
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
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
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
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
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
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
        return Runtime.dynCall(sig, func, arguments);
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
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
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
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
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
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
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
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
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
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
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
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
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
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
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
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
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
if (!Math['imul']) Math['imul'] = function(a, b) {
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
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
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
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 17136;
/* memory initializer */ allocate([2,0,20,0,55,0,108,0,178,0,10,1,116,1,238,1,123,2,24,3,198,3,133,4,85,5,54,6,39,7,41,8,58,9,91,10,140,11,204,12,27,14,121,15,229,16,95,18,230,19,123,21,28,23,202,24,132,26,73,28,25,30,243,31,215,33,196,35,185,37,183,39,188,41,199,43,216,45,239,47,10,50,41,52,75,54,111,56,149,58,187,60,226,62,8,65,45,67,80,69,111,71,139,73,163,75,181,77,194,79,200,81,199,83,190,85,173,87,147,89,111,91,66,93,10,95,198,96,120,98,29,100,183,101,67,103,195,104,54,106,156,107,245,108,64,110,125,111,173,112,207,113,227,114,234,115,228,116,208,117,176,118,130,119,72,120,1,121,175,121,81,122,231,122,114,123,243,123,105,124,214,124,57,125,148,125,229,125,47,126,114,126,173,126,225,126,16,127,56,127,92,127,122,127,149,127,171,127,189,127,205,127,217,127,228,127,236,127,242,127,246,127,250,127,252,127,254,127,255,127,255,127,255,127,255,127,255,127,255,127,126,124,119,109,87,41,19,9,4,2,0,0,0,0,0,0,0,255,0,255,0,255,0,255,0,255,0,254,1,0,1,255,0,254,0,253,2,0,1,255,0,254,0,253,3,0,1,255,2,1,0,0,0,0,0,0,25,23,2,0,0,0,0,0,2,1,0,0,0,0,0,0,224,192,160,128,96,64,32,0,213,171,128,85,43,0,0,0,205,154,102,51,0,0,0,0,192,128,64,0,0,0,0,0,171,85,0,0,0,0,0,0,230,0,0,0,0,0,0,0,232,158,10,0,0,0,0,0,92,202,190,216,182,223,154,226,156,230,120,236,122,244,204,252,52,3,134,11,136,19,100,25,102,29,74,32,66,39,164,53,249,247,246,245,244,234,210,202,201,200,197,174,82,59,56,55,54,46,22,12,11,10,9,7,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,254,49,67,77,82,93,99,198,11,18,24,31,36,45,255,46,66,78,87,94,104,208,14,21,32,42,51,66,255,94,104,109,112,115,118,248,53,69,80,88,95,102,0,0,0,0,0,0,0,0,2,5,9,14,20,27,35,44,54,65,77,90,104,119,135,0,0,0,0,0,0,0,130,0,200,58,0,231,130,26,0,244,184,76,12,0,249,214,130,43,6,0,252,232,173,87,24,3,0,253,241,203,131,56,14,2,0,254,246,221,167,94,35,8,1,0,254,249,232,193,130,65,23,5,1,0,255,251,239,211,162,99,45,15,4,1,0,255,251,243,223,186,131,74,33,11,3,1,0,255,252,245,230,202,158,105,57,24,8,2,1,0,255,253,247,235,214,179,132,84,44,19,7,2,1,0,255,254,250,240,223,196,159,112,69,36,15,6,2,1,0,255,254,253,245,231,209,176,136,93,55,27,11,3,2,1,0,255,254,253,252,239,221,194,158,117,76,42,18,4,3,2,1,0,129,0,203,54,0,234,129,23,0,245,184,73,10,0,250,215,129,41,5,0,252,232,173,86,24,3,0,253,240,200,129,56,15,2,0,253,244,217,164,94,38,10,1,0,253,245,226,189,132,71,27,7,1,0,253,246,231,203,159,105,56,23,6,1,0,255,248,235,213,179,133,85,47,19,5,1,0,255,254,243,221,194,159,117,70,37,12,2,1,0,255,254,248,234,208,171,128,85,48,22,8,2,1,0,255,254,250,240,220,189,149,107,67,36,16,6,2,1,0,255,254,251,243,227,201,166,128,90,55,29,13,5,2,1,0,255,254,252,246,234,213,183,147,109,73,43,22,10,4,2,1,0,129,0,207,50,0,236,129,20,0,245,185,72,10,0,249,213,129,42,6,0,250,226,169,87,27,4,0,251,233,194,130,62,20,4,0,250,236,207,160,99,47,17,3,0,255,240,217,182,131,81,41,11,1,0,255,254,233,201,159,107,61,20,2,1,0,255,249,233,206,170,128,86,50,23,7,1,0,255,250,238,217,186,148,108,70,39,18,6,1,0,255,252,243,226,200,166,128,90,56,30,13,4,1,0,255,252,245,231,209,180,146,110,76,47,25,11,4,1,0,255,253,248,237,219,194,163,128,93,62,37,19,8,3,1,0,255,254,250,241,226,205,177,145,111,79,51,30,15,6,2,1,0,128,0,214,42,0,235,128,21,0,244,184,72,11,0,248,214,128,42,7,0,248,225,170,80,25,5,0,251,236,198,126,54,18,3,0,250,238,211,159,82,35,15,5,0,250,231,203,168,128,88,53,25,6,0,252,238,216,185,148,108,71,40,18,4,0,253,243,225,199,166,128,90,57,31,13,3,0,254,246,233,212,183,147,109,73,44,23,10,2,0,255,250,240,223,198,166,128,90,58,33,16,6,1,0,255,251,244,231,210,181,146,110,75,46,25,12,5,1,0,255,253,248,238,221,196,164,128,92,60,35,18,8,3,1,0,255,253,249,242,229,208,180,146,110,76,48,27,14,7,3,1,0,189,0,168,253,105,2,103,119,117,0,97,255,210,251,8,116,52,0,221,0,168,246,116,110,252,255,17,2,234,242,229,102,208,255,246,2,140,240,165,93,176,255,137,3,117,239,6,83,157,255,204,3,130,239,102,71,149,255,199,3,139,240,39,59,153,255,128,3,97,242,174,46,165,255,5,3,207,244,94,34,185,255,99,2,161,247,152,22,210,255,169,1,161,250,180,11,241,190,178,132,87,74,41,14,0,223,193,157,140,106,57,39,18,0,0,0,0,0,0,0,125,51,26,18,15,12,11,10,9,8,7,6,5,4,3,2,1,0,198,105,45,22,15,12,11,10,9,8,7,6,5,4,3,2,1,0,213,162,116,83,59,43,32,24,18,15,12,9,7,6,5,3,2,0,239,187,116,59,28,16,11,10,9,8,7,6,5,4,3,2,1,0,250,229,188,135,86,51,30,19,13,10,8,6,5,4,3,2,1,0,249,235,213,185,156,128,103,83,66,53,42,33,26,21,17,13,10,0,254,249,235,206,164,118,77,46,27,16,10,7,5,4,3,2,1,0,255,253,249,239,220,191,156,119,85,57,37,23,15,10,6,4,2,0,255,253,251,246,237,223,203,179,152,124,98,75,55,40,29,21,15,0,255,254,253,247,220,162,106,67,42,28,18,12,9,6,4,3,2,0,0,0,0,0,253,250,244,233,212,182,150,131,120,110,98,85,72,60,49,40,32,25,19,15,13,11,9,8,7,6,5,4,3,2,1,0,210,208,206,203,199,193,183,168,142,104,74,52,37,27,20,14,10,6,4,2,0,0,0,0,223,201,183,167,152,138,124,111,98,88,79,70,62,56,50,44,39,35,31,27,24,21,18,16,14,12,10,8,6,4,3,2,1,0,0,0,0,0,0,0,188,176,155,138,119,97,67,43,26,10,0,0,0,0,0,0,165,119,80,61,47,35,27,20,14,9,4,0,0,0,0,0,113,63,0,0,0,0,0,0,120,0,0,0,0,0,0,0,224,112,44,15,3,2,1,0,254,237,192,132,70,23,4,0,255,252,226,155,61,11,2,0,250,245,234,203,71,50,42,38,35,33,31,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,0,0,0,0,0,0,0,42,175,213,201,207,255,64,0,17,0,99,255,97,1,16,254,163,0,39,43,189,86,217,255,6,0,91,0,86,255,186,0,23,0,128,252,192,24,216,77,237,255,220,255,102,0,167,255,232,255,72,1,73,252,8,10,37,62,0,0,0,0,0,0,135,199,61,201,64,0,128,0,134,255,36,0,54,1,0,253,72,2,51,36,69,69,12,0,128,0,18,0,114,255,32,1,139,255,159,252,27,16,123,56,148,107,103,196,17,0,12,0,8,0,1,0,246,255,234,255,226,255,224,255,234,255,3,0,44,0,100,0,168,0,243,0,61,1,125,1,173,1,199,1,228,87,5,197,3,0,242,255,236,255,241,255,2,0,25,0,37,0,25,0,240,255,185,255,149,255,177,255,50,0,36,1,111,2,214,3,8,5,184,5,230,62,198,196,243,255,0,0,20,0,26,0,5,0,225,255,213,255,252,255,65,0,90,0,7,0,99,255,8,255,212,255,81,2,47,6,52,10,199,12,104,2,13,200,246,255,39,0,58,0,210,255,172,255,120,0,184,0,197,254,227,253,4,5,4,21,64,35,0,0,0,0,100,0,240,0,32,0,100,0,243,221,192,181,0,0,0,0,175,148,160,176,178,173,174,164,177,174,196,182,198,192,182,68,62,66,60,72,117,85,90,118,136,151,142,160,142,155,0,0,179,138,140,148,151,149,153,151,163,116,67,82,59,92,72,100,89,92,0,0,0,0,0,0,100,40,16,7,3,1,0,0,100,0,3,0,40,0,3,0,3,0,3,0,5,0,14,0,14,0,10,0,11,0,3,0,8,0,9,0,7,0,3,0,91,1,0,0,0,0,0,0,250,0,3,0,6,0,3,0,3,0,3,0,4,0,3,0,3,0,3,0,205,1,0,0,32,0,16,0,102,38,171,1,144,11,0,0,16,11,0,0,128,7,0,0,224,8,0,0,80,8,0,0,128,10,0,0,192,7,0,0,0,0,0,0,32,0,10,0,20,46,100,1,144,13,0,0,80,11,0,0,160,7,0,0,224,9,0,0,152,8,0,0,200,10,0,0,232,7,0,0,0,0,0,0,255,254,253,244,12,3,2,1,0,255,254,252,224,38,3,2,1,0,255,254,251,209,57,4,2,1,0,255,254,244,195,69,4,2,1,0,255,251,232,184,84,7,2,1,0,255,254,240,186,86,14,2,1,0,255,254,239,178,91,30,5,1,0,255,248,227,177,100,19,2,1,0,255,254,253,238,14,3,2,1,0,255,254,252,218,35,3,2,1,0,255,254,250,208,59,4,2,1,0,255,254,246,194,71,10,2,1,0,255,252,236,183,82,8,2,1,0,255,252,235,180,90,17,2,1,0,255,248,224,171,97,30,4,1,0,255,254,236,173,95,37,7,1,0,0,0,0,0,0,0,0,1,100,102,102,68,68,36,34,96,164,107,158,185,180,185,139,102,64,66,36,34,34,0,1,32,208,139,141,191,152,185,155,104,96,171,104,166,102,102,102,132,1,0,0,0,0,16,16,0,80,109,78,107,185,139,103,101,208,212,141,139,173,153,123,103,36,0,0,0,0,0,0,1,48,0,0,0,0,0,0,32,68,135,123,119,119,103,69,98,68,103,120,118,118,102,71,98,134,136,157,184,182,153,139,134,208,168,248,75,189,143,121,107,32,49,34,34,34,0,17,2,210,235,139,123,185,137,105,134,98,135,104,182,100,183,171,134,100,70,68,70,66,66,34,131,64,166,102,68,36,2,1,0,134,166,102,68,34,34,66,132,212,246,158,139,107,107,87,102,100,219,125,122,137,118,103,132,114,135,137,105,171,106,50,34,164,214,141,143,185,151,121,103,192,34,0,0,0,0,0,1,208,109,74,187,134,249,159,137,102,110,154,118,87,101,119,101,0,2,0,36,36,66,68,35,96,164,102,100,36,0,2,33,167,138,174,102,100,84,2,2,100,107,120,119,36,197,24,0,16,0,0,0,0,99,66,36,36,34,36,34,34,34,34,83,69,36,52,34,116,102,70,68,68,176,102,68,68,34,65,85,68,84,36,116,141,152,139,170,132,187,184,216,137,132,249,168,185,139,104,102,100,68,68,178,218,185,185,170,244,216,187,187,170,244,187,187,219,138,103,155,184,185,137,116,183,155,152,136,132,217,184,184,170,164,217,171,155,139,244,169,184,185,170,164,216,223,218,138,214,143,188,218,168,244,141,136,155,170,168,138,220,219,139,164,219,202,216,137,168,186,246,185,139,116,185,219,185,138,100,100,134,100,102,34,68,68,100,68,168,203,221,218,168,167,154,136,104,70,164,246,171,137,139,137,155,218,219,139,255,255,255,156,4,154,255,255,255,255,255,227,102,15,92,255,255,255,255,255,213,83,24,72,236,255,255,255,255,150,76,33,63,214,255,255,255,190,121,77,43,55,185,255,255,255,245,137,71,43,59,139,255,255,255,255,131,66,50,66,107,194,255,255,166,116,76,55,53,125,255,255,255,255,255,131,6,145,255,255,255,255,255,236,93,15,96,255,255,255,255,255,194,83,25,71,221,255,255,255,255,162,73,34,66,162,255,255,255,210,126,73,43,57,173,255,255,255,201,125,71,48,58,130,255,255,255,166,110,73,57,62,104,210,255,255,251,123,65,55,68,100,171,255,225,204,201,184,183,175,158,154,153,135,119,115,113,110,109,99,98,95,79,68,52,50,48,45,43,32,31,27,18,10,3,0,255,251,235,230,212,201,196,182,167,166,163,151,138,124,110,104,90,78,76,70,69,57,45,34,24,21,11,6,5,4,3,0,212,178,148,129,108,96,85,82,79,77,61,59,57,56,51,49,48,45,42,41,40,38,36,34,31,30,21,12,10,3,1,0,255,245,244,236,233,225,217,203,190,176,175,161,149,136,125,114,102,91,81,71,60,52,43,35,28,20,19,18,12,11,5,0,7,23,38,54,69,85,100,116,131,147,162,178,193,208,223,239,13,25,41,55,69,83,98,112,127,142,157,171,187,203,220,236,15,21,34,51,61,78,92,106,126,136,152,167,185,205,225,240,10,21,36,50,63,79,95,110,126,141,157,173,189,205,221,237,17,20,37,51,59,78,89,107,123,134,150,164,184,205,224,240,10,15,32,51,67,81,96,112,129,142,158,173,189,204,220,236,8,21,37,51,65,79,98,113,126,138,155,168,179,192,209,218,12,15,34,55,63,78,87,108,118,131,148,167,185,203,219,236,16,19,32,36,56,79,91,108,118,136,154,171,186,204,220,237,11,28,43,58,74,89,105,120,135,150,165,180,196,211,226,241,6,16,33,46,60,75,92,107,123,137,156,169,185,199,214,225,11,19,30,44,57,74,89,105,121,135,152,169,186,202,218,234,12,19,29,46,57,71,88,100,120,132,148,165,182,199,216,233,17,23,35,46,56,77,92,106,123,134,152,167,185,204,222,237,14,17,45,53,63,75,89,107,115,132,151,171,188,206,221,240,9,16,29,40,56,71,88,103,119,137,154,171,189,205,222,237,16,19,36,48,57,76,87,105,118,132,150,167,185,202,218,236,12,17,29,54,71,81,94,104,126,136,149,164,182,201,221,237,15,28,47,62,79,97,115,129,142,155,168,180,194,208,223,238,8,14,30,45,62,78,94,111,127,143,159,175,192,207,223,239,17,30,49,62,79,92,107,119,132,145,160,174,190,204,220,235,14,19,36,45,61,76,91,108,121,138,154,172,189,205,222,238,12,18,31,45,60,76,91,107,123,138,154,171,187,204,221,236,13,17,31,43,53,70,83,103,114,131,149,167,185,203,220,237,17,22,35,42,58,78,93,110,125,139,155,170,188,206,224,240,8,15,34,50,67,83,99,115,131,146,162,178,193,209,224,239,13,16,41,66,73,86,95,111,128,137,150,163,183,206,225,241,17,25,37,52,63,75,92,102,119,132,144,160,175,191,212,231,19,31,49,65,83,100,117,133,147,161,174,187,200,213,227,242,18,31,52,68,88,103,117,126,138,149,163,177,192,207,223,239,16,29,47,61,76,90,106,119,133,147,161,176,193,209,224,240,15,21,35,50,61,73,86,97,110,119,129,141,175,198,218,237,12,35,60,83,108,132,157,180,206,228,15,32,55,77,101,125,151,175,201,225,19,42,66,89,114,137,162,184,209,230,12,25,50,72,97,120,147,172,200,223,26,44,69,90,114,135,159,180,205,225,13,22,53,80,106,130,156,180,205,228,15,25,44,64,90,115,142,168,196,222,19,24,62,82,100,120,145,168,190,214,22,31,50,79,103,120,151,170,203,227,21,29,45,65,106,124,150,171,196,224,30,49,75,97,121,142,165,186,209,229,19,25,52,70,93,116,143,166,192,219,26,34,62,75,97,118,145,167,194,217,25,33,56,70,91,113,143,165,196,223,21,34,51,72,97,117,145,171,196,222,20,29,50,67,90,117,144,168,197,221,22,31,48,66,95,117,146,168,196,222,24,33,51,77,116,134,158,180,200,224,21,28,70,87,106,124,149,170,194,217,26,33,53,64,83,117,152,173,204,225,27,34,65,95,108,129,155,174,210,225,20,26,72,99,113,131,154,176,200,219,34,43,61,78,93,114,155,177,205,229,23,29,54,97,124,138,163,179,209,229,30,38,56,89,118,129,158,178,200,231,21,29,49,63,85,111,142,163,193,222,27,48,77,103,133,158,179,196,215,232,29,47,74,99,124,151,176,198,220,237,33,42,61,76,93,121,155,174,207,225,29,53,87,112,136,154,170,188,208,227,24,30,52,84,131,150,166,186,203,229,37,48,64,84,104,118,156,177,201,230,0,15,8,7,4,11,12,3,2,13,10,5,6,9,14,1,0,9,6,3,4,5,8,1,2,7,0,0,0,0,0,0,128,64,0,0,0,0,0,0,0,16,0,0,176,15,0,0,16,15,0,0,0,0,0,0,179,99,0,0,0,0,0,0,250,27,61,39,5,245,42,88,4,1,254,60,65,6,252,255,251,73,56,1,247,19,94,29,247,0,12,99,6,4,8,237,102,46,243,3,2,13,3,2,9,235,84,72,238,245,46,104,234,8,18,38,48,23,0,240,70,83,235,11,5,245,117,22,248,250,23,117,244,3,3,248,95,28,4,246,15,77,60,241,255,4,124,2,252,3,38,84,24,231,2,13,42,13,31,21,252,56,46,255,255,35,79,243,19,249,65,88,247,242,20,4,81,49,227,20,0,75,3,239,5,247,44,92,248,1,253,22,69,31,250,95,41,244,5,39,67,16,252,1,0,250,120,55,220,243,44,122,4,232,81,5,11,3,7,2,0,9,10,88,13,22,39,23,12,255,36,64,27,250,249,10,55,43,17,1,1,8,1,1,6,245,74,53,247,244,55,76,244,8,253,3,93,27,252,26,39,59,3,248,2,0,77,11,9,248,22,44,250,7,40,9,26,3,9,249,20,101,249,4,3,248,42,26,0,241,33,68,2,23,254,55,46,254,15,3,255,21,16,41,4,6,24,7,5,0,0,2,0,0,12,28,41,13,252,247,15,42,25,14,1,254,62,41,247,246,37,65,252,3,250,4,66,7,248,16,14,38,253,33,104,16,0,0,88,16,0,0,56,16,0,0,0,0,0,0,241,225,211,199,187,175,164,153,142,132,123,114,105,96,88,80,72,64,57,50,44,38,33,29,24,20,16,12,9,5,2,0,199,165,144,124,109,96,84,71,61,51,42,32,23,15,8,0,71,56,43,30,21,12,6,0,205,60,0,48,0,32,0,0,0,32,254,31,246,31,234,31,216,31,194,31,168,31,136,31,98,31,58,31,10,31,216,30,160,30,98,30,34,30,220,29,144,29,66,29,238,28,150,28,58,28,216,27,114,27,10,27,156,26,42,26,180,25,58,25,188,24,60,24,182,23,46,23,160,22,16,22,126,21,232,20,78,20,176,19,16,19,110,18,200,17,30,17,116,16,198,15,22,15,100,14,174,13,248,12,64,12,132,11,200,10,10,10,74,9,138,8,198,7,2,7,62,6,120,5,178,4,234,3,34,3,90,2,146,1,202,0,0,0,54,255,110,254,166,253,222,252,22,252,78,251,136,250,194,249,254,248,58,248,118,247,182,246,246,245,56,245,124,244,192,243,8,243,82,242,156,241,234,240,58,240,140,239,226,238,56,238,146,237,240,236,80,236,178,235,24,235,130,234,240,233,96,233,210,232,74,232,196,231,68,231,198,230,76,230,214,229,100,229,246,228,142,228,40,228,198,227,106,227,18,227,190,226,112,226,36,226,222,225,158,225,96,225,40,225,246,224,198,224,158,224,120,224,88,224,62,224,40,224,22,224,10,224,2,224,0,224,0,0,0,0,0,0,144,17,0,0,136,17,0,0,215,195,166,125,110,82,0,0,203,150,0,0,0,0,0,0,6,0,0,0,4,0,0,0,3,0,0,0,0,0,0,0,0,0,1,255,1,255,2,254,2,254,3,253,0,1,0,1,255,2,255,2,254,3,254,3,0,0,1,255,0,1,255,0,255,1,254,2,254,254,2,253,2,3,253,252,3,252,4,4,251,5,250,251,6,249,6,5,8,247,0,0,1,0,0,0,0,0,0,0,255,1,0,0,1,255,0,1,255,255,1,255,2,1,255,2,254,254,2,254,2,2,3,253,0,1,0,0,0,0,0,0,1,0,1,0,0,1,255,1,0,0,2,1,255,2,255,255,2,255,2,2,255,3,254,254,254,3,0,1,0,0,1,0,1,255,2,255,2,255,2,3,254,3,254,254,4,4,253,5,253,252,6,252,6,5,251,8,250,251,249,9,0,1,0,0,0,1,0,0,0,2,255,255,255,0,0,1,1,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,255,2,1,0,1,1,0,0,255,255,0,0,0,0,0,1,1,1,2,3,3,3,2,3,3,3,2,3,3,3,0,3,12,15,48,51,60,63,192,195,204,207,240,243,252,255,0,115,0,102,0,83,0,64,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,7,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,6,0,0,0,1,0,0,0,5,0,0,0,2,0,0,0,15,0,0,0,0,0,0,0,8,0,0,0,7,0,0,0,12,0,0,0,3,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,1,0,0,0,9,0,0,0,6,0,0,0,13,0,0,0,2,0,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,187,0,0,120,0,0,0,21,0,0,0,21,0,0,0,205,108,0,0,0,16,0,32,240,38,0,0,3,0,0,0,8,0,0,0,120,0,0,0,11,0,0,0,232,43,0,0,104,23,0,0,8,0,0,0,128,7,0,0,3,0,0,0,168,31,0,0,120,31,0,0,72,31,0,0,24,31,0,0,160,19,0,0,136,1,0,0,216,40,0,0,88,42,0,0,176,41,0,0,0,0,0,0,255,127,255,127,255,127,255,127,254,127,251,127,250,127,247,127,245,127,241,127,239,127,235,127,231,127,226,127,221,127,217,127,212,127,205,127,199,127,193,127,186,127,178,127,171,127,164,127,155,127,146,127,138,127,128,127,119,127,108,127,98,127,87,127,76,127,65,127,54,127,42,127,29,127,16,127,3,127,246,126,231,126,218,126,203,126,188,126,173,126,157,126,141,126,125,126,108,126,92,126,75,126,57,126,38,126,21,126,1,126,239,125,219,125,200,125,180,125,159,125,138,125,118,125,96,125,74,125,51,125,29,125,6,125,240,124,216,124,192,124,168,124,144,124,119,124,93,124,68,124,42,124,16,124,246,123,219,123,191,123,164,123,136,123,108,123,79,123,51,123,20,123,247,122,218,122,187,122,156,122,125,122,94,122,62,122,30,122,254,121,222,121,188,121,155,121,121,121,87,121,54,121,18,121,239,120,204,120,169,120,133,120,96,120,59,120,23,120,241,119,204,119,165,119,128,119,89,119,51,119,11,119,227,118,188,118,148,118,107,118,66,118,25,118,239,117,197,117,155,117,113,117,70,117,27,117,240,116,195,116,151,116,107,116,62,116,17,116,228,115,182,115,137,115,89,115,43,115,252,114,206,114,157,114,109,114,62,114,13,114,220,113,170,113,122,113,72,113,21,113,227,112,176,112,125,112,74,112,22,112,226,111,174,111,121,111,69,111,16,111,218,110,164,110,111,110,57,110,2,110,202,109,147,109,91,109,36,109,236,108,179,108,122,108,65,108,9,108,206,107,148,107,89,107,31,107,229,106,169,106,110,106,51,106,246,105,186,105,126,105,65,105,3,105,198,104,136,104,74,104,12,104,206,103,142,103,80,103,15,103,208,102,145,102,79,102,15,102,206,101,141,101,75,101,10,101,200,100,134,100,67,100,1,100,189,99,122,99,54,99,242,98,174,98,106,98,37,98,224,97,155,97,85,97,16,97,202,96,131,96,60,96,246,95,175,95,104,95,32,95,216,94,144,94,71,94,255,93,182,93,109,93,34,93,217,92,143,92,70,92,250,91,176,91,102,91,26,91,206,90,131,90,55,90,234,89,158,89,82,89,4,89,183,88,106,88,29,88,206,87,128,87,50,87,228,86,149,86,69,86,246,85,167,85,86,85,6,85,183,84,102,84,20,84,195,83,115,83,34,83,207,82,126,82,43,82,218,81,134,81,52,81,225,80,141,80,58,80,231,79,147,79,62,79,234,78,150,78,66,78,235,77,151,77,65,77,236,76,150,76,64,76,234,75,147,75,60,75,230,74,144,74,55,74,223,73,137,73,49,73,216,72,128,72,40,72,208,71,118,71,29,71,196,70,105,70,16,70,182,69,93,69,2,69,168,68,77,68,243,67,151,67,60,67,226,66,134,66,41,66,206,65,115,65,22,65,185,64,93,64,1,64,163,63,70,63,233,62,140,62,45,62,208,61,114,61,20,61,181,60,87,60,248,59,153,59,58,59,219,58,125,58,27,58,189,57,93,57,253,56,157,56,60,56,220,55,124,55,27,55,186,54,90,54,247,53,150,53,53,53,212,52,113,52,16,52,174,51,77,51,233,50,135,50,36,50,194,49,94,49,252,48,153,48,53,48,209,47,110,47,12,47,167,46,67,46,224,45,123,45,22,45,178,44,78,44,233,43,131,43,31,43,187,42,84,42,240,41,139,41,38,41,191,40,90,40,244,39,143,39,40,39,193,38,92,38,246,37,142,37,40,37,194,36,90,36,244,35,141,35,38,35,191,34,87,34,241,33,137,33,33,33,185,32,82,32,235,31,131,31,26,31,178,30,73,30,226,29,121,29,17,29,168,28,63,28,217,27,111,27,5,27,157,26,53,26,204,25,98,25,249,24,144,24,38,24,189,23,85,23,235,22,128,22,24,22,173,21,69,21,219,20,112,20,7,20,158,19,50,19,201,18,95,18,244,17,138,17,32,17,182,16,75,16,225,15,118,15,12,15,161,14,56,14,204,13,98,13,246,12,140,12,34,12,182,11,75,11,226,10,119,10,10,10,161,9,54,9,203,8,95,8,245,7,137,7,31,7,179,6,73,6,221,5,113,5,7,5,156,4,49,4,196,3,90,3,239,2,132,2,23,2,173,1,66,1,214,0,107,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,8,0,8,0,8,0,16,0,16,0,16,0,21,0,21,0,24,0,29,0,34,0,36,0,0,0,0,0,0,0,255,127,0,0,254,127,83,254,245,127,166,252,231,127,249,250,212,127,77,249,186,127,161,247,155,127,246,245,119,127,74,244,76,127,159,242,29,127,245,240,232,126,75,239,173,126,163,237,108,126,251,235,39,126,84,234,219,125,173,232,138,125,7,231,51,125,99,229,216,124,193,227,119,124,30,226,16,124,125,224,164,123,223,222,51,123,65,221,187,122,166,219,62,122,12,218,189,121,114,216,54,121,220,214,169,120,71,213,23,120,180,211,128,119,35,210,228,118,147,208,66,118,4,207,155,117,121,205,240,116,240,203,62,116,106,202,137,115,229,200,206,114,99,199,13,114,229,197,72,113,103,196,125,112,237,194,174,111,118,193,219,110,0,192,2,110,143,190,36,109,33,189,66,108,180,187,90,107,75,186,110,106,227,184,126,105,128,183,136,104,33,182,142,103,196,180,145,102,106,179,141,101,21,178,134,100,194,176,122,99,115,175,106,98,40,174,86,97,223,172,61,96,155,171,33,95,90,170,255,93,30,169,218,92,229,167,177,91,175,166,131,90,125,165,82,89,80,164,29,88,39,163,228,86,1,162,167,85,224,160,102,84,196,159,34,83,171,158,218,81,150,157,142,80,135,156,64,79,123,155,237,77,115,154,151,76,113,153,61,75,115,152,226,73,120,151,129,72,132,150,29,71,146,149,182,69,167,148,77,68,191,147,226,66,220,146,115,65,254,145,1,64,38,145,140,62,82,144,20,61,131,143,154,59,185,142,30,58,243,141,158,56,51,141,28,55,120,140,152,53,195,139,17,52,18,139,137,50,101,138,252,48,190,137,110,47,29,137,224,45,128,136,78,44,233,135,187,42,87,135,38,41,202,134,143,39,68,134,246,37,194,133,91,36,70,133,191,34,207,132,34,33,92,132,131,31,241,131,226,29,138,131,65,28,40,131,159,26,205,130,249,24,118,130,85,23,37,130,173,21,218,129,7,20,148,129,95,18,83,129,182,16,25,129,12,15,227,128,98,13,180,128,183,11,138,128,12,10,101,128,96,8,70,128,180,6,44,128,7,5,26,128,92,3,11,128,174,1,2,128,0,0,1,128,83,254,2,128,166,252,11,128,249,250,25,128,77,249,44,128,161,247,70,128,246,245,101,128,74,244,137,128,159,242,180,128,245,240,227,128,75,239,24,129,163,237,83,129,251,235,148,129,84,234,217,129,173,232,37,130,7,231,118,130,99,229,205,130,193,227,40,131,30,226,137,131,125,224,240,131,223,222,92,132,65,221,205,132,166,219,69,133,12,218,194,133,114,216,67,134,220,214,202,134,71,213,87,135,180,211,233,135,35,210,128,136,147,208,28,137,4,207,190,137,121,205,101,138,240,203,16,139,106,202,194,139,229,200,119,140,99,199,50,141,229,197,243,141,103,196,184,142,237,194,131,143,118,193,82,144,0,192,37,145,143,190,254,145,33,189,220,146,180,187,190,147,75,186,166,148,227,184,146,149,128,183,130,150,33,182,120,151,196,180,114,152,106,179,111,153,21,178,115,154,194,176,122,155,115,175,134,156,40,174,150,157,223,172,170,158,155,171,195,159,90,170,223,160,30,169,1,162,229,167,38,163,175,166,79,164,125,165,125,165,80,164,174,166,39,163,227,167,1,162,28,169,224,160,89,170,196,159,154,171,171,158,222,172,150,157,38,174,135,156,114,175,123,155,192,176,115,154,19,178,113,153,105,179,115,152,195,180,120,151,30,182,132,150,127,183,146,149,227,184,167,148,74,186,191,147,179,187,220,146,30,189,254,145,141,190,38,145,255,191,82,144,116,193,131,143,236,194,185,142,102,196,243,141,226,197,51,141,98,199,120,140,228,200,195,139,104,202,18,139,239,203,101,138,119,205,190,137,4,207,29,137,146,208,128,136,32,210,233,135,178,211,87,135,69,213,202,134,218,214,68,134,113,216,194,133,10,218,70,133,165,219,207,132,65,221,92,132,222,222,241,131,125,224,138,131,30,226,40,131,191,227,205,130,97,229,118,130,7,231,37,130,171,232,218,129,83,234,148,129,249,235,83,129,161,237,25,129,74,239,227,128,244,240,180,128,158,242,138,128,73,244,101,128,244,245,70,128,160,247,44,128,76,249,26,128,249,250,11,128,164,252,2,128,82,254,1,128,0,0,2,128,173,1,11,128,90,3,25,128,7,5,44,128,179,6,70,128,95,8,101,128,10,10,137,128,182,11,180,128,97,13,227,128,11,15,24,129,181,16,83,129,93,18,148,129,5,20,217,129,172,21,37,130,83,23,118,130,249,24,205,130,157,26,40,131,63,28,137,131,226,29,240,131,131,31,92,132,33,33,205,132,191,34,69,133,90,36,194,133,244,37,67,134,142,39,202,134,36,41,87,135,185,42,233,135,76,44,128,136,221,45,28,137,109,47,190,137,252,48,101,138,135,50,16,139,16,52,194,139,150,53,119,140,27,55,50,141,157,56,243,141,27,58,184,142,153,59,131,143,19,61,82,144,138,62,37,145,0,64,254,145,113,65,220,146,223,66,190,147,76,68,166,148,181,69,146,149,29,71,130,150,128,72,120,151,223,73,114,152,60,75,111,153,150,76,115,154,235,77,122,155,62,79,134,156,141,80,150,157,216,81,170,158,33,83,195,159,101,84,223,160,166,85,1,162,226,86,38,163,27,88,79,164,81,89,125,165,131,90,174,166,176,91,227,167,217,92,28,169,255,93,89,170,32,95,154,171,60,96,222,172,85,97,38,174,106,98,114,175,121,99,192,176,133,100,19,178,141,101,105,179,143,102,195,180,141,103,30,182,136,104,127,183,124,105,227,184,110,106,74,186,89,107,179,187,65,108,30,189,36,109,141,190,2,110,255,191,218,110,116,193,174,111,236,194,125,112,102,196,71,113,226,197,13,114,98,199,205,114,228,200,136,115,104,202,61,116,239,203,238,116,119,205,155,117,4,207,66,118,146,208,227,118,32,210,128,119,178,211,23,120,69,213,169,120,218,214,54,121,113,216,188,121,10,218,62,122,165,219,186,122,65,221,49,123,222,222,164,123,125,224,15,124,30,226,118,124,191,227,216,124,97,229,51,125,7,231,138,125,171,232,219,125,83,234,38,126,249,235,108,126,161,237,173,126,74,239,231,126,244,240,29,127,158,242,76,127,73,244,118,127,244,245,155,127,160,247,186,127,76,249,212,127,249,250,230,127,164,252,245,127,82,254,254,127,0,0,255,127,173,1,254,127,90,3,245,127,7,5,231,127,179,6,212,127,95,8,186,127,10,10,155,127,182,11,119,127,97,13,76,127,11,15,29,127,181,16,232,126,93,18,173,126,5,20,108,126,172,21,39,126,83,23,219,125,249,24,138,125,157,26,51,125,63,28,216,124,226,29,119,124,131,31,16,124,33,33,164,123,191,34,51,123,90,36,187,122,244,37,62,122,142,39,189,121,36,41,54,121,185,42,169,120,76,44,23,120,221,45,128,119,109,47,228,118,252,48,66,118,135,50,155,117,16,52,240,116,150,53,62,116,27,55,137,115,157,56,206,114,27,58,13,114,153,59,72,113,19,61,125,112,138,62,174,111,0,64,219,110,113,65,2,110,223,66,36,109,76,68,66,108,181,69,90,107,29,71,110,106,128,72,126,105,223,73,136,104,60,75,142,103,150,76,145,102,235,77,141,101,62,79,134,100,141,80,122,99,216,81,106,98,33,83,86,97,101,84,61,96,166,85,33,95,226,86,255,93,27,88,218,92,81,89,177,91,131,90,131,90,176,91,82,89,217,92,29,88,255,93,228,86,32,95,167,85,60,96,102,84,85,97,34,83,106,98,218,81,121,99,142,80,133,100,64,79,141,101,237,77,143,102,151,76,141,103,61,75,136,104,226,73,124,105,129,72,110,106,29,71,89,107,182,69,65,108,77,68,36,109,226,66,2,110,115,65,218,110,1,64,174,111,140,62,125,112,20,61,71,113,154,59,13,114,30,58,205,114,158,56,136,115,28,55,61,116,152,53,238,116,17,52,155,117,137,50,66,118,252,48,227,118,110,47,128,119,224,45,23,120,78,44,169,120,187,42,54,121,38,41,188,121,143,39,62,122,246,37,186,122,91,36,49,123,191,34,164,123,34,33,15,124,131,31,118,124,226,29,216,124,65,28,51,125,159,26,138,125,249,24,219,125,85,23,38,126,173,21,108,126,7,20,173,126,95,18,231,126,182,16,29,127,12,15,76,127,98,13,118,127,183,11,155,127,12,10,186,127,96,8,212,127,180,6,230,127,7,5,245,127,92,3,254,127,174,1,60,0,0,0,3,0,0,0,4,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,31,0,0,152,23,0,0,120,0,0,0,2,0,0,0,4,0,30,0,2,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,37,0,0,152,23,0,0,240,0,0,0,1,0,0,0,4,0,60,0,4,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,36,0,0,152,23,0,0,224,1,0,0,255,255,255,255,4,0,120,0,4,0,30,0,2,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,80,32,0,0,152,23,0,0,0,0,15,0,30,0,45,0,5,0,20,0,35,0,50,0,10,0,25,0,40,0,55,0,1,0,16,0,31,0,46,0,6,0,21,0,36,0,51,0,11,0,26,0,41,0,56,0,2,0,17,0,32,0,47,0,7,0,22,0,37,0,52,0,12,0,27,0,42,0,57,0,3,0,18,0,33,0,48,0,8,0,23,0,38,0,53,0,13,0,28,0,43,0,58,0,4,0,19,0,34,0,49,0,9,0,24,0,39,0,54,0,14,0,29,0,44,0,59,0,0,0,120,0,240,0,104,1,30,0,150,0,14,1,134,1,60,0,180,0,44,1,164,1,90,0,210,0,74,1,194,1,15,0,135,0,255,0,119,1,45,0,165,0,29,1,149,1,75,0,195,0,59,1,179,1,105,0,225,0,89,1,209,1,5,0,125,0,245,0,109,1,35,0,155,0,19,1,139,1,65,0,185,0,49,1,169,1,95,0,215,0,79,1,199,1,20,0,140,0,4,1,124,1,50,0,170,0,34,1,154,1,80,0,200,0,64,1,184,1,110,0,230,0,94,1,214,1,10,0,130,0,250,0,114,1,40,0,160,0,24,1,144,1,70,0,190,0,54,1,174,1,100,0,220,0,84,1,204,1,25,0,145,0,9,1,129,1,55,0,175,0,39,1,159,1,85,0,205,0,69,1,189,1,115,0,235,0,99,1,219,1,1,0,121,0,241,0,105,1,31,0,151,0,15,1,135,1,61,0,181,0,45,1,165,1,91,0,211,0,75,1,195,1,16,0,136,0,0,1,120,1,46,0,166,0,30,1,150,1,76,0,196,0,60,1,180,1,106,0,226,0,90,1,210,1,6,0,126,0,246,0,110,1,36,0,156,0,20,1,140,1,66,0,186,0,50,1,170,1,96,0,216,0,80,1,200,1,21,0,141,0,5,1,125,1,51,0,171,0,35,1,155,1,81,0,201,0,65,1,185,1,111,0,231,0,95,1,215,1,11,0,131,0,251,0,115,1,41,0,161,0,25,1,145,1,71,0,191,0,55,1,175,1,101,0,221,0,85,1,205,1,26,0,146,0,10,1,130,1,56,0,176,0,40,1,160,1,86,0,206,0,70,1,190,1,116,0,236,0,100,1,220,1,2,0,122,0,242,0,106,1,32,0,152,0,16,1,136,1,62,0,182,0,46,1,166,1,92,0,212,0,76,1,196,1,17,0,137,0,1,1,121,1,47,0,167,0,31,1,151,1,77,0,197,0,61,1,181,1,107,0,227,0,91,1,211,1,7,0,127,0,247,0,111,1,37,0,157,0,21,1,141,1,67,0,187,0,51,1,171,1,97,0,217,0,81,1,201,1,22,0,142,0,6,1,126,1,52,0,172,0,36,1,156,1,82,0,202,0,66,1,186,1,112,0,232,0,96,1,216,1,12,0,132,0,252,0,116,1,42,0,162,0,26,1,146,1,72,0,192,0,56,1,176,1,102,0,222,0,86,1,206,1,27,0,147,0,11,1,131,1,57,0,177,0,41,1,161,1,87,0,207,0,71,1,191,1,117,0,237,0,101,1,221,1,3,0,123,0,243,0,107,1,33,0,153,0,17,1,137,1,63,0,183,0,47,1,167,1,93,0,213,0,77,1,197,1,18,0,138,0,2,1,122,1,48,0,168,0,32,1,152,1,78,0,198,0,62,1,182,1,108,0,228,0,92,1,212,1,8,0,128,0,248,0,112,1,38,0,158,0,22,1,142,1,68,0,188,0,52,1,172,1,98,0,218,0,82,1,202,1,23,0,143,0,7,1,127,1,53,0,173,0,37,1,157,1,83,0,203,0,67,1,187,1,113,0,233,0,97,1,217,1,13,0,133,0,253,0,117,1,43,0,163,0,27,1,147,1,73,0,193,0,57,1,177,1,103,0,223,0,87,1,207,1,28,0,148,0,12,1,132,1,58,0,178,0,42,1,162,1,88,0,208,0,72,1,192,1,118,0,238,0,102,1,222,1,4,0,124,0,244,0,108,1,34,0,154,0,18,1,138,1,64,0,184,0,48,1,168,1,94,0,214,0,78,1,198,1,19,0,139,0,3,1,123,1,49,0,169,0,33,1,153,1,79,0,199,0,63,1,183,1,109,0,229,0,93,1,213,1,9,0,129,0,249,0,113,1,39,0,159,0,23,1,143,1,69,0,189,0,53,1,173,1,99,0,219,0,83,1,203,1,24,0,144,0,8,1,128,1,54,0,174,0,38,1,158,1,84,0,204,0,68,1,188,1,114,0,234,0,98,1,218,1,14,0,134,0,254,0,118,1,44,0,164,0,28,1,148,1,74,0,194,0,58,1,178,1,104,0,224,0,88,1,208,1,29,0,149,0,13,1,133,1,59,0,179,0,43,1,163,1,89,0,209,0,73,1,193,1,119,0,239,0,103,1,223,1,0,0,60,0,120,0,180,0,15,0,75,0,135,0,195,0,30,0,90,0,150,0,210,0,45,0,105,0,165,0,225,0,5,0,65,0,125,0,185,0,20,0,80,0,140,0,200,0,35,0,95,0,155,0,215,0,50,0,110,0,170,0,230,0,10,0,70,0,130,0,190,0,25,0,85,0,145,0,205,0,40,0,100,0,160,0,220,0,55,0,115,0,175,0,235,0,1,0,61,0,121,0,181,0,16,0,76,0,136,0,196,0,31,0,91,0,151,0,211,0,46,0,106,0,166,0,226,0,6,0,66,0,126,0,186,0,21,0,81,0,141,0,201,0,36,0,96,0,156,0,216,0,51,0,111,0,171,0,231,0,11,0,71,0,131,0,191,0,26,0,86,0,146,0,206,0,41,0,101,0,161,0,221,0,56,0,116,0,176,0,236,0,2,0,62,0,122,0,182,0,17,0,77,0,137,0,197,0,32,0,92,0,152,0,212,0,47,0,107,0,167,0,227,0,7,0,67,0,127,0,187,0,22,0,82,0,142,0,202,0,37,0,97,0,157,0,217,0,52,0,112,0,172,0,232,0,12,0,72,0,132,0,192,0,27,0,87,0,147,0,207,0,42,0,102,0,162,0,222,0,57,0,117,0,177,0,237,0,3,0,63,0,123,0,183,0,18,0,78,0,138,0,198,0,33,0,93,0,153,0,213,0,48,0,108,0,168,0,228,0,8,0,68,0,128,0,188,0,23,0,83,0,143,0,203,0,38,0,98,0,158,0,218,0,53,0,113,0,173,0,233,0,13,0,73,0,133,0,193,0,28,0,88,0,148,0,208,0,43,0,103,0,163,0,223,0,58,0,118,0,178,0,238,0,4,0,64,0,124,0,184,0,19,0,79,0,139,0,199,0,34,0,94,0,154,0,214,0,49,0,109,0,169,0,229,0,9,0,69,0,129,0,189,0,24,0,84,0,144,0,204,0,39,0,99,0,159,0,219,0,54,0,114,0,174,0,234,0,14,0,74,0,134,0,194,0,29,0,89,0,149,0,209,0,44,0,104,0,164,0,224,0,59,0,119,0,179,0,239,0,0,0,30,0,60,0,90,0,15,0,45,0,75,0,105,0,5,0,35,0,65,0,95,0,20,0,50,0,80,0,110,0,10,0,40,0,70,0,100,0,25,0,55,0,85,0,115,0,1,0,31,0,61,0,91,0,16,0,46,0,76,0,106,0,6,0,36,0,66,0,96,0,21,0,51,0,81,0,111,0,11,0,41,0,71,0,101,0,26,0,56,0,86,0,116,0,2,0,32,0,62,0,92,0,17,0,47,0,77,0,107,0,7,0,37,0,67,0,97,0,22,0,52,0,82,0,112,0,12,0,42,0,72,0,102,0,27,0,57,0,87,0,117,0,3,0,33,0,63,0,93,0,18,0,48,0,78,0,108,0,8,0,38,0,68,0,98,0,23,0,53,0,83,0,113,0,13,0,43,0,73,0,103,0,28,0,58,0,88,0,118,0,4,0,34,0,64,0,94,0,19,0,49,0,79,0,109,0,9,0,39,0,69,0,99,0,24,0,54,0,84,0,114,0,14,0,44,0,74,0,104,0,29,0,59,0,89,0,119,0,15,0,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,1,0,2,0,3,0,4,0,5,0,6,0,7,0,8,0,10,0,12,0,14,0,16,0,20,0,24,0,28,0,34,0,40,0,48,0,60,0,78,0,100,0,0,0,0,0,72,127,65,129,66,128,65,128,64,128,62,128,64,128,64,128,92,78,92,79,92,78,90,79,116,41,115,40,114,40,132,26,132,26,145,17,161,12,176,10,177,11,24,179,48,138,54,135,54,132,53,134,56,133,55,132,55,132,61,114,70,96,74,88,75,88,87,74,89,66,91,67,100,59,108,50,120,40,122,37,97,43,78,50,83,78,84,81,88,75,86,74,87,71,90,73,93,74,93,74,109,40,114,36,117,34,117,34,143,17,145,18,146,19,162,12,165,10,178,7,189,6,190,8,177,9,23,178,54,115,63,102,66,98,69,99,74,89,71,91,73,91,78,89,86,80,92,66,93,64,102,59,103,60,104,60,117,52,123,44,138,35,133,31,97,38,77,45,61,90,93,60,105,42,107,41,110,45,116,38,113,38,112,38,124,26,132,27,136,19,140,20,155,14,159,16,158,18,170,13,177,10,187,8,192,6,175,9,159,10,21,178,59,110,71,86,75,85,84,83,91,66,88,73,87,72,92,75,98,72,105,58].concat([107,54,115,52,114,55,112,56,129,51,132,40,150,33,140,29,98,35,77,42,42,121,96,66,108,43,111,40,117,44,123,32,120,36,119,33,127,33,134,34,139,21,147,23,152,20,158,25,154,26,166,21,173,16,184,13,184,10,150,13,139,15,22,178,63,114,74,82,84,83,92,82,103,62,96,72,96,67,101,73,107,72,113,55,118,52,125,52,118,52,117,55,135,49,137,39,157,32,145,29,97,33,77,40,103,100,92,85,81,77,72,70,78,75,73,71,78,74,69,72,70,74,76,71,60,60,60,60,60,0,0,0,0,0,0,0,6,0,3,0,7,3,0,1,10,0,2,6,18,10,12,0,4,0,2,0,0,0,9,4,7,4,0,3,12,7,7,0,0,64,202,69,27,76,255,82,130,90,179,98,162,107,96,117,64,39,200,27,152,16,96,59,80,34,0,0,96,102,208,12,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,41,0,41,0,41,0,82,0,82,0,123,0,164,0,200,0,222,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,0,41,0,41,0,41,0,123,0,123,0,123,0,164,0,164,0,240,0,10,1,27,1,39,1,41,0,41,0,41,0,41,0,41,0,41,0,41,0,41,0,123,0,123,0,123,0,123,0,240,0,240,0,240,0,10,1,10,1,49,1,62,1,72,1,80,1,123,0,123,0,123,0,123,0,123,0,123,0,123,0,123,0,240,0,240,0,240,0,240,0,49,1,49,1,49,1,62,1,62,1,87,1,95,1,102,1,108,1,240,0,240,0,240,0,240,0,240,0,240,0,240,0,240,0,49,1,49,1,49,1,49,1,87,1,87,1,87,1,95,1,95,1,114,1,120,1,126,1,131,1,0,0,0,0,0,0,224,224,224,224,224,224,224,224,160,160,160,160,185,185,185,178,178,168,134,61,37,224,224,224,224,224,224,224,224,240,240,240,240,207,207,207,198,198,183,144,66,40,160,160,160,160,160,160,160,160,185,185,185,185,193,193,193,183,183,172,138,64,38,240,240,240,240,240,240,240,240,207,207,207,207,204,204,204,193,193,180,143,66,40,185,185,185,185,185,185,185,185,193,193,193,193,193,193,193,183,183,172,138,65,39,207,207,207,207,207,207,207,207,204,204,204,204,201,201,201,188,188,176,141,66,40,193,193,193,193,193,193,193,193,193,193,193,193,194,194,194,184,184,173,139,65,39,204,204,204,204,204,204,204,204,201,201,201,201,198,198,198,187,187,175,140,66,40,40,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,40,15,23,28,31,34,36,38,39,41,42,43,44,45,46,47,47,49,50,51,52,53,54,55,55,57,58,59,60,61,62,63,63,65,66,67,68,69,70,71,71,40,20,33,41,48,53,57,61,64,66,69,71,73,75,76,78,80,82,85,87,89,91,92,94,96,98,101,103,105,107,108,110,112,114,117,119,121,123,124,126,128,40,23,39,51,60,67,73,79,83,87,91,94,97,100,102,105,107,111,115,118,121,124,126,129,131,135,139,142,145,148,150,153,155,159,163,166,169,172,174,177,179,35,28,49,65,78,89,99,107,114,120,126,132,136,141,145,149,153,159,165,171,176,180,185,189,192,199,205,211,216,220,225,229,232,239,245,251,21,33,58,79,97,112,125,137,148,157,166,174,182,189,195,201,207,217,227,235,243,251,17,35,63,86,106,123,139,152,165,177,187,197,206,214,222,230,237,250,25,31,55,75,91,105,117,128,138,146,154,161,168,174,180,185,190,200,208,215,222,229,235,240,245,255,16,36,65,89,110,128,144,159,173,185,196,207,217,226,234,242,250,11,41,74,103,128,151,172,191,209,225,241,255,9,43,79,110,138,163,186,207,227,246,12,39,71,99,123,144,164,182,198,214,228,241,253,9,44,81,113,142,168,192,214,235,255,7,49,90,127,160,191,220,247,6,51,95,134,170,203,234,7,47,87,123,155,184,212,237,6,52,97,137,174,208,240,5,57,106,151,192,231,5,59,111,158,202,243,5,55,103,147,187,224,5,60,113,161,206,248,4,65,122,175,224,4,67,127,182,234,195,117,10,87,92,47,154,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,80,75,69,63,56,49,40,34,29,20,18,10,0,0,0,0,0,0,0,0,110,100,90,84,78,71,65,58,51,45,39,32,26,20,12,0,0,0,0,0,0,118,110,103,93,86,80,75,70,65,59,53,47,40,31,23,15,4,0,0,0,0,126,119,112,104,95,89,83,78,72,66,60,54,47,39,32,25,17,12,1,0,0,134,127,120,114,103,97,91,85,78,72,66,60,54,47,41,35,29,23,16,10,1,144,137,130,124,113,107,101,95,88,82,76,70,64,57,51,45,39,33,26,15,1,152,145,138,132,123,117,111,105,98,92,86,80,74,67,61,55,49,43,36,20,1,162,155,148,142,133,127,121,115,108,102,96,90,84,77,71,65,59,53,46,30,1,172,165,158,152,143,137,131,125,118,112,106,100,94,87,81,75,69,63,56,45,20,200,200,200,200,200,200,200,200,198,193,188,183,178,173,168,163,158,153,148,129,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,154,121,102,102,0,0,0,0,184,126,51,115,0,0,0,0,0,8,13,16,19,21,23,24,26,27,28,29,30,31,32,32,33,34,34,35,36,36,37,37,184,126,154,121,0,0,0,0,24,47,0,0,216,49,0,0,148,52,0,0,76,55,0,0,0,58,0,0,176,60,0,0,92,63,0,0,196,64,0,0,128,65,0,0,244,65,0,0,64,66,0,0,120,66,0,0,152,66,0,0,176,66,0,0,188,66,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,3,0,0,0,5,0,0,0,7,0,0,0,9,0,0,0,11,0,0,0,13,0,0,0,15,0,0,0,17,0,0,0,19,0,0,0,21,0,0,0,23,0,0,0,25,0,0,0,27,0,0,0,29,0,0,0,31,0,0,0,33,0,0,0,35,0,0,0,37,0,0,0,39,0,0,0,41,0,0,0,43,0,0,0,45,0,0,0,47,0,0,0,49,0,0,0,51,0,0,0,53,0,0,0,55,0,0,0,57,0,0,0,59,0,0,0,61,0,0,0,63,0,0,0,65,0,0,0,67,0,0,0,69,0,0,0,71,0,0,0,73,0,0,0,75,0,0,0,77,0,0,0,79,0,0,0,81,0,0,0,83,0,0,0,85,0,0,0,87,0,0,0,89,0,0,0,91,0,0,0,93,0,0,0,95,0,0,0,97,0,0,0,99,0,0,0,101,0,0,0,103,0,0,0,105,0,0,0,107,0,0,0,109,0,0,0,111,0,0,0,113,0,0,0,115,0,0,0,117,0,0,0,119,0,0,0,121,0,0,0,123,0,0,0,125,0,0,0,127,0,0,0,129,0,0,0,131,0,0,0,133,0,0,0,135,0,0,0,137,0,0,0,139,0,0,0,141,0,0,0,143,0,0,0,145,0,0,0,147,0,0,0,149,0,0,0,151,0,0,0,153,0,0,0,155,0,0,0,157,0,0,0,159,0,0,0,161,0,0,0,163,0,0,0,165,0,0,0,167,0,0,0,169,0,0,0,171,0,0,0,173,0,0,0,175,0,0,0,177,0,0,0,179,0,0,0,181,0,0,0,183,0,0,0,185,0,0,0,187,0,0,0,189,0,0,0,191,0,0,0,193,0,0,0,195,0,0,0,197,0,0,0,199,0,0,0,201,0,0,0,203,0,0,0,205,0,0,0,207,0,0,0,209,0,0,0,211,0,0,0,213,0,0,0,215,0,0,0,217,0,0,0,219,0,0,0,221,0,0,0,223,0,0,0,225,0,0,0,227,0,0,0,229,0,0,0,231,0,0,0,233,0,0,0,235,0,0,0,237,0,0,0,239,0,0,0,241,0,0,0,243,0,0,0,245,0,0,0,247,0,0,0,249,0,0,0,251,0,0,0,253,0,0,0,255,0,0,0,1,1,0,0,3,1,0,0,5,1,0,0,7,1,0,0,9,1,0,0,11,1,0,0,13,1,0,0,15,1,0,0,17,1,0,0,19,1,0,0,21,1,0,0,23,1,0,0,25,1,0,0,27,1,0,0,29,1,0,0,31,1,0,0,33,1,0,0,35,1,0,0,37,1,0,0,39,1,0,0,41,1,0,0,43,1,0,0,45,1,0,0,47,1,0,0,49,1,0,0,51,1,0,0,53,1,0,0,55,1,0,0,57,1,0,0,59,1,0,0,61,1,0,0,63,1,0,0,65,1,0,0,67,1,0,0,69,1,0,0,71,1,0,0,73,1,0,0,75,1,0,0,77,1,0,0,79,1,0,0,81,1,0,0,83,1,0,0,85,1,0,0,87,1,0,0,89,1,0,0,91,1,0,0,93,1,0,0,95,1,0,0,13,0,0,0,25,0,0,0,41,0,0,0,61,0,0,0,85,0,0,0,113,0,0,0,145,0,0,0,181,0,0,0,221,0,0,0,9,1,0,0,57,1,0,0,109,1,0,0,165,1,0,0,225,1,0,0,33,2,0,0,101,2,0,0,173,2,0,0,249,2,0,0,73,3,0,0,157,3,0,0,245,3,0,0,81,4,0,0,177,4,0,0,21,5,0,0,125,5,0,0,233,5,0,0,89,6,0,0,205,6,0,0,69,7,0,0,193,7,0,0,65,8,0,0,197,8,0,0,77,9,0,0,217,9,0,0,105,10,0,0,253,10,0,0,149,11,0,0,49,12,0,0,209,12,0,0,117,13,0,0,29,14,0,0,201,14,0,0,121,15,0,0,45,16,0,0,229,16,0,0,161,17,0,0,97,18,0,0,37,19,0,0,237,19,0,0,185,20,0,0,137,21,0,0,93,22,0,0,53,23,0,0,17,24,0,0,241,24,0,0,213,25,0,0,189,26,0,0,169,27,0,0,153,28,0,0,141,29,0,0,133,30,0,0,129,31,0,0,129,32,0,0,133,33,0,0,141,34,0,0,153,35,0,0,169,36,0,0,189,37,0,0,213,38,0,0,241,39,0,0,17,41,0,0,53,42,0,0,93,43,0,0,137,44,0,0,185,45,0,0,237,46,0,0,37,48,0,0,97,49,0,0,161,50,0,0,229,51,0,0,45,53,0,0,121,54,0,0,201,55,0,0,29,57,0,0,117,58,0,0,209,59,0,0,49,61,0,0,149,62,0,0,253,63,0,0,105,65,0,0,217,66,0,0,77,68,0,0,197,69,0,0,65,71,0,0,193,72,0,0,69,74,0,0,205,75,0,0,89,77,0,0,233,78,0,0,125,80,0,0,21,82,0,0,177,83,0,0,81,85,0,0,245,86,0,0,157,88,0,0,73,90,0,0,249,91,0,0,173,93,0,0,101,95,0,0,33,97,0,0,225,98,0,0,165,100,0,0,109,102,0,0,57,104,0,0,9,106,0,0,221,107,0,0,181,109,0,0,145,111,0,0,113,113,0,0,85,115,0,0,61,117,0,0,41,119,0,0,25,121,0,0,13,123,0,0,5,125,0,0,1,127,0,0,1,129,0,0,5,131,0,0,13,133,0,0,25,135,0,0,41,137,0,0,61,139,0,0,85,141,0,0,113,143,0,0,145,145,0,0,181,147,0,0,221,149,0,0,9,152,0,0,57,154,0,0,109,156,0,0,165,158,0,0,225,160,0,0,33,163,0,0,101,165,0,0,173,167,0,0,249,169,0,0,73,172,0,0,157,174,0,0,245,176,0,0,81,179,0,0,177,181,0,0,21,184,0,0,125,186,0,0,233,188,0,0,89,191,0,0,205,193,0,0,69,196,0,0,193,198,0,0,65,201,0,0,197,203,0,0,77,206,0,0,217,208,0,0,105,211,0,0,253,213,0,0,149,216,0,0,49,219,0,0,209,221,0,0,117,224,0,0,29,227,0,0,201,229,0,0,121,232,0,0,45,235,0,0,229,237,0,0,161,240,0,0,63,0,0,0,129,0,0,0,231,0,0,0,121,1,0,0,63,2,0,0,65,3,0,0,135,4,0,0,25,6,0,0,255,7,0,0,65,10,0,0,231,12,0,0,249,15,0,0,127,19,0,0,129,23,0,0,7,28,0,0,25,33,0,0,191,38,0,0,1,45,0,0,231,51,0,0,121,59,0,0,191,67,0,0,193,76,0,0,135,86,0,0,25,97,0,0,127,108,0,0,193,120,0,0,231,133,0,0,249,147,0,0,255,162,0,0,1,179,0,0,7,196,0,0,25,214,0,0,63,233,0,0,129,253,0,0,231,18,1,0,121,41,1,0,63,65,1,0,65,90,1,0,135,116,1,0,25,144,1,0,255,172,1,0,65,203,1,0,231,234,1,0,249,11,2,0,127,46,2,0,129,82,2,0,7,120,2,0,25,159,2,0,191,199,2,0,1,242,2,0,231,29,3,0,121,75,3,0,191,122,3,0,193,171,3,0,135,222,3,0,25,19,4,0,127,73,4,0,193,129,4,0,231,187,4,0,249,247,4,0,255,53,5,0,1,118,5,0,7,184,5,0,25,252,5,0,63,66,6,0,129,138,6,0,231,212,6,0,121,33,7,0,63,112,7,0,65,193,7,0,135,20,8,0,25,106,8,0,255,193,8,0,65,28,9,0,231,120,9,0,249,215,9,0,127,57,10,0,129,157,10,0,7,4,11,0,25,109,11,0,191,216,11,0,1,71,12,0,231,183,12,0,121,43,13,0,191,161,13,0,193,26,14,0,135,150,14,0,25,21,15,0,127,150,15,0,193,26,16,0,231,161,16,0,249,43,17,0,255,184,17,0,1,73,18,0,7,220,18,0,25,114,19,0,63,11,20,0,129,167,20,0,231,70,21,0,121,233,21,0,63,143,22,0,65,56,23,0,135,228,23,0,25,148,24,0,255,70,25,0,65,253,25,0,231,182,26,0,249,115,27,0,127,52,28,0,129,248,28,0,7,192,29,0,25,139,30,0,191,89,31,0,1,44,32,0,231,1,33,0,121,219,33,0,191,184,34,0,193,153,35,0,135,126,36,0,25,103,37,0,127,83,38,0,193,67,39,0,231,55,40,0,249,47,41,0,255,43,42,0,1,44,43,0,7,48,44,0,25,56,45,0,63,68,46,0,129,84,47,0,231,104,48,0,121,129,49,0,63,158,50,0,65,191,51,0,135,228,52,0,25,14,54,0,255,59,55,0,65,110,56,0,231,164,57,0,249,223,58,0,127,31,60,0,129,99,61,0,7,172,62,0,25,249,63,0,191,74,65,0,1,161,66,0,231,251,67,0,121,91,69,0,191,191,70,0,193,40,72,0,135,150,73,0,25,9,75,0,127,128,76,0,193,252,77,0,231,125,79,0,249,3,81,0,255,142,82,0,1,31,84,0,7,180,85,0,25,78,87,0,63,237,88,0,129,145,90,0,231,58,92,0,121,233,93,0,63,157,95,0,65,86,97,0,135,20,99,0,25,216,100,0,255,160,102,0,65,111,104,0,231,66,106,0,249,27,108,0,127,250,109,0,65,1,0,0,169,2,0,0,9,5,0,0,193,8,0,0,65,14,0,0,9,22,0,0,169,32,0,0,193,46,0,0,1,65,0,0,41,88,0,0,9,117,0,0,129,152,0,0,129,195,0,0,9,247,0,0,41,52,1,0,1,124,1,0,193,207,1,0,169,48,2,0,9,160,2,0,65,31,3,0,193,175,3,0,9,83,4,0,169,10,5,0,65,216,5,0,129,189,6,0,41,188,7,0,9,214,8,0,1,13,10,0,1,99,11,0,9,218,12,0,41,116,14,0,129,51,16,0,65,26,18,0,169,42,20,0,9,103,22,0,193,209,24,0,65,109,27,0,9,60,30,0,169,64,33,0,193,125,36,0,1,246,39,0,41,172,43,0,9,163,47,0,129,221,51,0,129,94,56,0,9,41,61,0,41,64,66,0,1,167,71,0,193,96,77,0,169,112,83,0,9,218,89,0,65,160,96,0,193,198,103,0,9,81,111,0,169,66,119,0,65,159,127,0,129,106,136,0,41,168,145,0,9,92,155,0,1,138,165,0,1,54,176,0,9,100,187,0,41,24,199,0,129,86,211,0,65,35,224,0,169,130,237,0,9,121,251,0,193,10,10,1,65,60,25,1,9,18,41,1,169,144,57,1,193,188,74,1,1,155,92,1,41,48,111,1,9,129,130,1,129,146,150,1,129,105,171,1,9,11,193,1,41,124,215,1,1,194,238,1,193,225,6,2,169,224,31,2,9,196,57,2,65,145,84,2,193,77,112,2,9,255,140,2,169,170,170,2,65,86,201,2,129,7,233,2,41,196,9,3,9,146,43,3,1,119,78,3,1,121,114,3,9,158,151,3,41,236,189,3,129,105,229,3,65,28,14,4,169,10,56,4,9,59,99,4,193,179,143,4,65,123,189,4,9,152,236,4,169,16,29,5,193,235,78,5,1,48,130,5,41,228,182,5,9,15,237,5,129,183,36,6,129,228,93,6,9,157,152,6,41,232,212,6,1,205,18,7,193,82,82,7,169,128,147,7,9,94,214,7,65,242,26,8,193,68,97,8,9,93,169,8,169,66,243,8,65,253,62,9,129,148,140,9,41,16,220,9,9,120,45,10,1,212,128,10,1,44,214,10,9,136,45,11,41,240,134,11,129,108,226,11,65,5,64,12,169,194,159,12,9,173,1,13,193,204,101,13,65,42,204,13,9,206,52,14,169,192,159,14,193,10,13,15,1,181,124,15,41,200,238,15,9,77,99,16,129,76,218,16,129,207,83,17,9,223,207,17,41,132,78,18,1,200,207,18,193,179,83,19,169,80,218,19,9,168,99,20,65,195,239,20,193,171,126,21,9,107,16,22,169,10,165,22,65,148,60,23,129,17,215,23,41,140,116,24,9,14,21,25,1,161,184,25,1,79,95,26,9,34,9,27,41,36,182,27,129,95,102,28,65,222,25,29,169,170,208,29,9,207,138,30,193,85,72,31,65,73,9,32,9,180,205,32,169,160,149,33,193,25,97,34,1,42,48,35,41,220,2,36,9,59,217,36,129,81,179,37,147,6,0,0,69,14,0,0,15,28,0,0,17,51,0,0,91,87,0,0,13,142,0,0,119,221,0,0,57,77,1,0,99,230,1,0,149,179,2,0,31,193,3,0,33,29,5,0,171,215,6,0,221,2,9,0,7,179,11,0,201,254,14,0,51,255,18,0,229,207,23,0,47,143,29,0,49,94,36,0,251,96,44,0,173,190,53,0,151,161,64,0,89,55,77,0,3,177,91,0,53,67,108,0,63,38,127,0,65,150,148,0,75,211,172,0,125,33,200,0,39,201,230,0,233,22,9,1,211,91,47,1,133,237,89,1,79,38,137,1,81,101,189,1,155,14,247,1,77,139,54,2,183,73,124,2,121,189,200,2,163,95,28,3,213,174,119,3,95,47,219,3,97,107,71,4,235,242,188,4,29,92,60,5,71,67,198,5,9,75,91,6,115,28,252,6,37,103,169,7,111,225,99,8,113,72,44,9,59,96,3,10,237,243,233,10,215,213,224,11,153,223,232,12,67,242,2,14,117,246,47,15,127,220,112,16,129,156,198,17,139,54,50,19,189,178,180,20,103,33,79,22,41,155,2,24,19,65,208,25,197,60,185,27,143,192,190,29,145,7,226,31,219,85,36,34,141,248,134,36,247,69,11,39,185,157,178,41,227,104,126,44,21,26,112,47,159,45,137,50,161,41,203,53,43,158,55,57,93,37,208,60,135,99,150,64,73,7,140,68,179,201,178,72,101,110,12,77,175,195,154,81,177,162,95,86,123,239,92,91,45,153,148,96,23,154,8,102,217,247,186,107,131,195,173,113,181,25,227,119,191,34,93,126,29,35,0,0,113,77,0,0,145,156,0,0,253,38,1,0,101,12,2,0,233,119,3,0,153,162,5,0,53,214,8,0,45,112,13,0,225,228,19,0,33,195,28,0,237,183,40,0,117,146,56,0,89,72,77,0,41,250,103,0,37,248,137,0,61,199,180,0,81,38,234,0,177,19,44,1,221,210,124,1,133,242,222,1,201,82,85,2,185,43,227,2,21,20,140,3,77,8,84,4,193,113,63,5,65,46,83,6,205,151,148,7,149,140,9,9,57,119,184,10,73,87,168,12,5,202,224,14,93,19,106,17,49,39,77,20,209,178,147,23,189,38,72,27,165,192,117,31,169,149,40,36,217,156,109,41,245,185,82,47,109,200,230,53,161,166,57,61,97,65,92,69,173,159,96,78,181,238,89,88,25,142,92,99,105,28,126,111,229,131,213,124,255,189,0,0,1,168,1,0,143,107,3,0,241,158,6,0,63,35,12,0,193,61,21,0,143,182,35,0,241,252,57,0,255,81,91,0,1,250,139,0,15,117,209,0,113,191,50,1,63,154,184,1,193,220,109,2,15,207,95,3,113,142,158,4,255,123,61,6,1,182,83,8,143,156,252,10,241,97,88,14,63,167,140,18,193,37,197,23,143,101,52,30,241,129,20,38,255,251,167,47,1,156,58,59,15,98,34,73,113,134,192,89,63,138,130,109,193,88,227,132,1,14,4,0,145,33,9,0,17,44,19,0,65,238,37,0,65,79,71,0,145,67,128,0,17,247,221,0,1,70,115,1,1,146,90,2,17,1,184,3,145,53,188,5,65,143,167,8,65,6,206,12,17,178,155,18,145,15,154,26,1,26,118,37,1,76,7,52,145,158,87,71,17,157,172,96,65,166,145,129,35,81,22,0,197,158,50,0,23,185,107,0,153,246,216,0,107,137,160,1,13,196,254,2,31,1,80,5,33,217,29,9,51,108,48,15,213,162,164,24,167,103,8,39,41,253,125,60,123,181,231,91,29,119,29,137,175,160,45,201,173,142,123,0,137,230,25,1,57,150,94,2,61,22,216,4,181,99,119,9,225,40,198,17,33,3,52,32,117,72,130,56,125,87,87,96,191,91,175,2,129,216,39,6,247,132,94,13,233,254,173,27,127,139,235,54,129,183,229,104,23,3,156,193,193,12,255,14,57,106,133,34,25,238,145,75,129,120,43,158,51,225,9,84])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
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
  var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC); 
  Module["_llvm_ctlz_i32"] = _llvm_ctlz_i32;
  Module["_memcpy"] = _memcpy; 
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _llvm_va_start=undefined;
  var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _llvm_va_end() {}
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOPNOTSUPP:45,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};function _sysconf(name) {
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
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
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
          }[name.substr(name.lastIndexOf('.')+1)];
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
            Browser.safeSetTimeout(function() {
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
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
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
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
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
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
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
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        setInterval(function() {
          if (!ABORT) func();
        }, timeout);
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
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x = event.pageX - (window.scrollX + rect.left);
          var y = event.pageY - (window.scrollY + rect.top);
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
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
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.copyTempDouble;var af=env.copyTempFloat;var ag=env.min;var ah=env.invoke_ii;var ai=env.invoke_v;var aj=env.invoke_iii;var ak=env.invoke_vi;var al=env._llvm_va_end;var am=env._llvm_lifetime_end;var an=env._llvm_stackrestore;var ao=env._sysconf;var ap=env.___setErrNo;var aq=env.___errno_location;var ar=env._llvm_lifetime_start;var as=env._abort;var at=env._sbrk;var au=env._time;var av=env._llvm_stacksave;
// EMSCRIPTEN_START_FUNCS
function aA(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function aB(){return i|0}function aC(a){a=a|0;i=a}function aD(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function aE(a){a=a|0;D=a}function aF(a){a=a|0;E=a}function aG(a){a=a|0;F=a}function aH(a){a=a|0;G=a}function aI(a){a=a|0;H=a}function aJ(a){a=a|0;I=a}function aK(a){a=a|0;J=a}function aL(a){a=a|0;K=a}function aM(a){a=a|0;L=a}function aN(a){a=a|0;M=a}function aO(a,d,e,f,g,h,i,j){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;k=c[a+24>>2]|0;l=c[a+36>>2]|0;m=$(l,j);n=k+(g<<1)|0;o=(g|0)<(h|0);p=k+(h<<1)|0;q=a+8|0;a=j<<2;r=0;while(1){s=$(r,m);t=e+(s<<2)|0;u=b[n>>1]|0;v=$(u<<16>>16,j);w=d+(v+s<<1)|0;L3:do{if((v|0)>0){s=t;x=0;while(1){y=s+4|0;c[s>>2]=0;z=x+1|0;A=b[n>>1]|0;if((z|0)<($(A<<16>>16,j)|0)){s=y;x=z}else{B=y;C=A;break L3}}}else{B=t;C=u}}while(0);L7:do{if(o){u=B;t=w;v=g;x=C;while(1){s=c[f+($(c[q>>2]|0,r)+v<<2)>>2]|0;A=$(x<<16>>16,j);y=v+1|0;z=k+(y<<1)|0;D=$(b[z>>1]|0,j);E=s>>17<<1;F=s>>>1&65535;s=A+1|0;G=((D|0)>(s|0)?D:s)-A|0;s=t+(G<<1)|0;H=A;A=t;I=u;while(1){J=b[A>>1]|0;K=$(E,J);c[I>>2]=($(J,F)>>15)+K<<2;K=H+1|0;if((K|0)<(D|0)){H=K;A=A+2|0;I=I+4|0}else{break}}I=u+(G<<2)|0;if((y|0)>=(h|0)){L=I;break L7}u=I;t=s;v=y;x=b[z>>1]|0}}else{L=B}}while(0);w=b[p>>1]|0;if(($(w,j)|0)<(m|0)){b1(L|0,0,$(a,l-w|0)|0)}w=r+1|0;if((w|0)<(i|0)){r=w}else{break}}return}function aP(e,f,g,h,i,j,k,l,m,n,o,p,q){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0;if((k|0)>=(l|0)){return}r=e+24|0;s=e+8|0;e=(i|0)==1;t=(h|0)==3;u=1<<h;v=(u|0)>0;w=k;k=q;while(1){q=w+1|0;x=c[r>>2]|0;y=(b[x+(q<<1)>>1]|0)-(b[x+(w<<1)>>1]|0)|0;x=y<<h;z=-((((c[p+(w<<2)>>2]|0)+1|0)/(x|0)&-1)<<7)|0;A=z<<16>>26;do{if((A|0)>14){B=2130706432}else{if((A|0)<-15){B=0;break}C=z-(A<<10)<<20>>16;D=-2-A|0;E=($(($(((C*10204&-1)>>>15<<16)+971177984>>16,C)>>>15<<16)+1494482944>>16,C)>>>15<<16)+1073676288>>16;if((D|0)>0){B=E>>D;break}else{B=E<<-D;break}}}while(0);A=B>>1;z=(A|0)>32767?32767:A;A=(z>>16<<15|z>>>1&32767)&65535;z=65567-(b2(x|0)|0)<<16>>17;D=(x<<(7-z<<1)<<16^-2147483648)>>16;E=($(((D*6713&-1)>>>15<<16)-884080640>>16,D)>>>15<<16)+1543831552>>16;C=$(E,E)>>>15<<16>>16;F=(($(C,D)>>>15)+C<<17^-2147483648)>>16;C=($($(((F*12288&-1)>>>15<<16)-1073741824>>16,F)>>>15<<16>>16,E)>>>15)+E<<16>>16;E=$(w,i);F=(y|0)>0;D=k;G=0;while(1){H=c[s>>2]|0;I=$(H,G)+w|0;J=b[n+(I<<1)>>1]|0;K=b[o+(I<<1)>>1]|0;if(e){L=H+w|0;H=b[n+(L<<1)>>1]|0;M=b[o+(L<<1)>>1]|0;N=K<<16>>16>M<<16>>16?K:M;O=J<<16>>16>H<<16>>16?J:H}else{N=K;O=J}J=(b[m+(I<<1)>>1]|0)-((O<<16>>16<N<<16>>16?O:N)<<16>>16)|0;I=(J|0)<0?0:J;if((I|0)<16384){J=-I|0;I=J<<16>>26;do{if((I|0)>14){P=2130706432}else{if((I|0)<-15){P=0;break}K=J-(I<<10)<<20>>16;H=-2-I|0;M=($(($(((K*10204&-1)>>>15<<16)+971177984>>16,K)>>>15<<16)+1494482944>>16,K)>>>15<<16)+1073676288>>16;if((H|0)>0){P=M>>H;break}else{P=M<<-H;break}}}while(0);I=P>>1;Q=(I|0)>16383?32766:I<<1&65535}else{Q=0}if(t){R=Q<<16>>16>23169?32765:((Q<<16>>16)*23170&-1)>>>14&65535}else{R=Q}I=$(G,j);J=((b[(c[r>>2]|0)+(w<<1)>>1]|0)<<h)+I|0;I=f+(J<<1)|0;do{if(v){H=g+(G+E|0)|0;M=$((A<<16>>16<R<<16>>16?A:R)<<16>>16>>>1<<16>>16,C)>>15>>z<<16>>16;K=-M|0;L52:do{if(F){L=0;S=0;T=D;while(1){L58:do{if(((d[H]|0)&1<<L|0)==0){U=L+J|0;V=0;W=T;while(1){X=$(W,1664525)+1013904223|0;b[f+(U+(V<<h)<<1)>>1]=((X&32768|0)!=0?M:K)&65535;Y=V+1|0;if((Y|0)<(y|0)){V=Y;W=X}else{Z=X;_=1;break L58}}}else{Z=T;_=S}}while(0);W=L+1|0;if((W|0)<(u|0)){L=W;S=_;T=Z}else{aa=_;ab=Z;break L52}}}else{T=a[H]|0;S=0;L=0;while(1){W=(T&255&1<<S|0)==0?1:L;V=S+1|0;if((V|0)<(u|0)){S=V;L=W}else{aa=W;ab=D;break L52}}}}while(0);if((aa|0)==0){ac=ab;break}br(I,x,32767);ac=ab}else{ac=D}}while(0);I=G+1|0;if((I|0)<(i|0)){D=ac;G=I}else{break}}if((q|0)<(l|0)){w=q;k=ac}else{break}}return}function aQ(f,g,h,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;u=u|0;v=v|0;w=w|0;x=x|0;y=y|0;z=z|0;var A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0;A=i;i=i+80|0;B=A|0;C=A+8|0;D=A+16|0;E=A+40|0;F=c[g+24>>2]|0;G=(l|0)!=0;H=G?2:1;I=(f|0)==0;J=(p|0)!=0?1<<x:1;p=F+(h<<1)|0;K=(b[p>>1]|0)<<x;L=(b[F+((c[g+8>>2]|0)-1<<1)>>1]|0)<<x;M=L-K|0;N=$(M,H);O=i;i=i+(N*2&-1)|0;i=i+7>>3<<3;c[E+32>>2]=n;n=E+24|0;c[n>>2]=w;N=E|0;c[N>>2]=f;c[E+12>>2]=s;c[E+4>>2]=g;f=c[z>>2]|0;P=E+36|0;c[P>>2]=f;c[E+16>>2]=q;if((h|0)>=(j|0)){Q=f;c[z>>2]=Q;i=A;return}f=E+8|0;R=j-1|0;S=w+20|0;T=w+28|0;w=E+28|0;U=y-1|0;V=E+20|0;W=g+12|0;g=(1<<J)-1|0;X=I^1;Y=M-K|0;Z=D|0;_=D+4|0;aa=D+8|0;ab=D+16|0;ac=D+20|0;ad=D+12|0;ae=H-1|0;af=(q|0)!=3|(J|0)>1;q=1;ag=0;ah=k+(L<<1)|0;L=h;ai=v;v=r;while(1){c[f>>2]=L;r=(L|0)==(R|0);aj=F+(L<<1)|0;ak=(b[aj>>1]|0)<<x;al=k+(ak<<1)|0;if(G){am=l+(ak<<1)|0}else{am=0}an=L+1|0;ao=((b[F+(an<<1)>>1]|0)<<x)-ak|0;ak=c[S>>2]|0;ap=c[T>>2]|0;aq=32-(b2(ap|0)|0)|0;ar=ap>>>((aq-16|0)>>>0);ap=$(ar,ar);ar=ap>>>31;as=ap>>>15>>>(ar>>>0);ap=$(as,as);as=ap>>>31;at=ap>>>15>>>(as>>>0);ap=(ak<<3)-($(at,at)>>>31|(as|(ar|aq<<1)<<1)<<1)|0;aq=ai-((L|0)==(h|0)?0:ap)|0;ar=u-ap|0;as=ar-1|0;c[w>>2]=as;do{if((L|0)>(U|0)){au=0}else{at=y-L|0;ak=(c[o+(L<<2)>>2]|0)+((aq|0)/(((at|0)>3?3:at)|0)&-1)|0;at=(ar|0)<(ak|0)?ar:ak;if((at|0)<0){au=0;break}au=(at|0)>16383?16383:at}}while(0);do{if(I){if((((b[aj>>1]|0)<<x)-ao|0)<((b[p>>1]|0)<<x|0)){av=ag;break}av=(q|0)!=0|(ag|0)==0?L:ag}else{av=ag}}while(0);ar=c[t+(L<<2)>>2]|0;c[V>>2]=ar;if((L|0)<(c[W>>2]|0)){aw=am;ax=al;ay=ah}else{aw=G?O:am;ax=O;ay=0}at=r?0:ay;L88:do{if((av|0)==0){az=g;aA=g;aB=-1}else{if(!(af|(ar|0)<0)){az=g;aA=g;aB=-1;break}ak=(((b[F+(av<<1)>>1]|0)<<x)-K|0)-ao|0;aC=(ak|0)<0?0:ak;ak=aC+K|0;aD=av;while(1){aE=aD-1|0;if(((b[F+(aE<<1)>>1]|0)<<x|0)>(ak|0)){aD=aE}else{break}}aD=ak+ao|0;aF=av-1|0;while(1){aG=aF+1|0;if(((b[F+(aG<<1)>>1]|0)<<x|0)<(aD|0)){aF=aG}else{aH=aE;aI=0;aJ=0;break}}while(1){aF=$(aH,H);aD=d[m+aF|0]|0|aJ;ak=d[m+(ae+aF|0)|0]|0|aI;aF=aH+1|0;if((aF|0)<(aG|0)){aH=aF;aI=ak;aJ=aD}else{az=ak;aA=aD;aB=aC;break L88}}}}while(0);ar=(L|0)!=(s|0)|(v|0)==0;al=ar?v:0;L99:do{if(ar|X){if((al|0)==0){aK=79;break}aC=(au|0)/2&-1;aD=(aB|0)!=-1;if(aD){aL=O+(aB<<1)|0}else{aL=0}if(r){aM=0}else{aM=O+(((b[aj>>1]|0)<<x)-K<<1)|0}ak=aR(E,ax,ao,aC,J,aL,x,aM,32767,at,aA)|0;if(aD){aN=O+(aB+M<<1)|0}else{aN=0}if(r){aO=0}else{aO=O+(Y+((b[aj>>1]|0)<<x)<<1)|0}aP=aR(E,aw,ao,aC,J,aN,x,aO,32767,at,az)&255;aQ=ak&255;aT=al;break}else{if((((b[aj>>1]|0)<<x)-K|0)>0){aU=0}else{aK=79;break}while(1){ak=O+(aU<<1)|0;b[ak>>1]=((b[O+(aU+M<<1)>>1]|0)+(b[ak>>1]|0)|0)>>>1&65535;ak=aU+1|0;if((ak|0)<(((b[aj>>1]|0)<<x)-K|0)){aU=ak}else{aK=79;break L99}}}}while(0);L117:do{if((aK|0)==79){aK=0;al=(aB|0)==-1;if((aw|0)==0){if(al){aV=0}else{aV=O+(aB<<1)|0}if(r){aW=0}else{aW=O+(((b[aj>>1]|0)<<x)-K<<1)|0}ar=aR(E,ax,ao,au,J,aV,x,aW,32767,at,az|aA)&255;aP=ar;aQ=ar;aT=0;break}if(al){aX=0}else{aX=O+(aB<<1)|0}if(r){aY=0}else{aY=O+(((b[aj>>1]|0)<<x)-K<<1)|0}al=az|aA;c[B>>2]=au;c[C>>2]=al;ar=(c[N>>2]|0)!=0;ak=c[n>>2]|0;if((ao|0)==1){aC=ak+12|0;aD=ak+16|0;aF=ak+24|0;aZ=ak+8|0;a_=ak+4|0;a$=ak|0;a0=ak+44|0;a1=ak+20|0;a2=1;a3=ax;a4=as;while(1){if((a4|0)>7){if(ar){a5=(e[a3>>1]|0)>>>15&65535;a6=c[aC>>2]|0;a7=c[aD>>2]|0;if((a7+1|0)>>>0>32){a8=7-a7|0;a9=(a8|0)>-8?a8:-8;a8=a7;ba=a6;while(1){bb=c[aZ>>2]|0;bc=c[a_>>2]|0;if((bb+(c[aF>>2]|0)|0)>>>0<bc>>>0){bd=bb+1|0;c[aZ>>2]=bd;a[(c[a$>>2]|0)+(bc-bd|0)|0]=ba&255;be=0}else{be=-1}c[a0>>2]=c[a0>>2]|be;bf=ba>>>8;bd=a8-8|0;if((bd|0)>7){a8=bd;ba=bf}else{break}}bg=(a7-8|0)-(a9+a7&-8)|0;bh=bf}else{bg=a7;bh=a6}bi=a5;bj=bg+1|0;bk=a5<<bg|bh}else{ba=c[aC>>2]|0;a8=c[aD>>2]|0;if((a8|0)==0){bd=c[aZ>>2]|0;bc=c[a_>>2]|0;if(bd>>>0<bc>>>0){bb=bd+1|0;c[aZ>>2]=bb;bl=d[(c[a$>>2]|0)+(bc-bb|0)|0]|0;bm=bb}else{bl=0;bm=bd}if(bm>>>0<bc>>>0){bd=bm+1|0;c[aZ>>2]=bd;bn=(d[(c[a$>>2]|0)+(bc-bd|0)|0]|0)<<8;bo=bd}else{bn=0;bo=bm}if(bo>>>0<bc>>>0){bd=bo+1|0;c[aZ>>2]=bd;bp=(d[(c[a$>>2]|0)+(bc-bd|0)|0]|0)<<16;bq=bd}else{bp=0;bq=bo}if(bq>>>0<bc>>>0){bd=bq+1|0;c[aZ>>2]=bd;br=(d[(c[a$>>2]|0)+(bc-bd|0)|0]|0)<<24}else{br=0}bs=bl|ba|bn|bp|br;bt=32}else{bs=ba;bt=a8}bi=bs&1;bj=bt-1|0;bk=bs>>>1}c[aC>>2]=bk;c[aD>>2]=bj;c[a1>>2]=(c[a1>>2]|0)+1|0;c[w>>2]=(c[w>>2]|0)-8|0;bu=bi}else{bu=0}if(!ar){b[a3>>1]=(bu|0)!=0?-16384:16384}if((a2|0)>=2){break}a2=a2+1|0;a3=aw;a4=c[w>>2]|0}if((aY|0)==0){aP=1;aQ=1;aT=0;break}b[aY>>1]=(b[ax>>1]|0)>>>4&65535;aP=1;aQ=1;aT=0;break}aS(E,D,ax,aw,ao,B,J,J,x,1,C);a4=c[Z>>2]|0;a3=c[ab>>2]|0;a2=c[ac>>2]|0;a1=c[_>>2]&65535;aD=c[aa>>2]&65535;aC=(ao|0)==2;a$=c[B>>2]|0;if(aC){if((a3|0)==16384|(a3|0)==0){bv=0}else{bv=8}aZ=a$-bv|0;a_=(a3|0)>8192;c[w>>2]=(c[w>>2]|0)-(bv+a2|0)|0;a0=a_?aw:ax;aF=a_?ax:aw;do{if((bv|0)==0){bw=0}else{if(ar){a_=$(b[aF+2>>1]|0,b[a0>>1]|0);a8=(a_-$(b[aF>>1]|0,b[a0+2>>1]|0)|0)>>>31;a_=ak+12|0;ba=c[a_>>2]|0;bd=ak+16|0;bc=c[bd>>2]|0;if((bc+1|0)>>>0>32){bb=ak+24|0;bx=ak+8|0;by=ak+4|0;bz=ak|0;bA=ak+44|0;bB=7-bc|0;bC=(bB|0)>-8?bB:-8;bB=bc;bD=ba;while(1){bE=c[bx>>2]|0;bF=c[by>>2]|0;if((bE+(c[bb>>2]|0)|0)>>>0<bF>>>0){bG=bE+1|0;c[bx>>2]=bG;a[(c[bz>>2]|0)+(bF-bG|0)|0]=bD&255;bH=0}else{bH=-1}c[bA>>2]=c[bA>>2]|bH;bI=bD>>>8;bG=bB-8|0;if((bG|0)>7){bB=bG;bD=bI}else{break}}bJ=(bc-8|0)-(bC+bc&-8)|0;bK=bI}else{bJ=bc;bK=ba}c[a_>>2]=a8<<bJ|bK;c[bd>>2]=bJ+1|0;bD=ak+20|0;c[bD>>2]=(c[bD>>2]|0)+1|0;bw=a8;break}bD=ak+12|0;bB=c[bD>>2]|0;bA=ak+16|0;bz=c[bA>>2]|0;if((bz|0)==0){bx=ak+8|0;bb=ak|0;by=c[bx>>2]|0;a5=c[ak+4>>2]|0;if(by>>>0<a5>>>0){a6=by+1|0;c[bx>>2]=a6;bL=d[(c[bb>>2]|0)+(a5-a6|0)|0]|0;bM=a6}else{bL=0;bM=by}if(bM>>>0<a5>>>0){by=bM+1|0;c[bx>>2]=by;bN=(d[(c[bb>>2]|0)+(a5-by|0)|0]|0)<<8;bO=by}else{bN=0;bO=bM}if(bO>>>0<a5>>>0){by=bO+1|0;c[bx>>2]=by;bP=(d[(c[bb>>2]|0)+(a5-by|0)|0]|0)<<16;bQ=by}else{bP=0;bQ=bO}if(bQ>>>0<a5>>>0){by=bQ+1|0;c[bx>>2]=by;bR=(d[(c[bb>>2]|0)+(a5-by|0)|0]|0)<<24}else{bR=0}bS=bL|bB|bN|bP|bR;bT=32}else{bS=bB;bT=bz}c[bD>>2]=bS>>>1;c[bA>>2]=bT-1|0;bA=ak+20|0;c[bA>>2]=(c[bA>>2]|0)+1|0;bw=bS&1}}while(0);ak=1-(bw<<1)|0;bA=aR(E,a0,2,aZ,J,aX,x,aY,32767,at,al)|0;b[aF>>1]=$(b[a0+2>>1]|0,-ak|0)&65535;b[aF+2>>1]=$(b[a0>>1]|0,ak)&65535;ak=bA&255;if(ar){aP=ak;aQ=ak;aT=0;break}bA=a1<<16>>16;b[ax>>1]=$(b[ax>>1]|0,bA)>>>15&65535;bD=ax+2|0;b[bD>>1]=$(b[bD>>1]|0,bA)>>>15&65535;bA=aD<<16>>16;bz=$(b[aw>>1]|0,bA)>>>15&65535;b[aw>>1]=bz;bB=aw+2|0;b[bB>>1]=$(b[bB>>1]|0,bA)>>>15&65535;bA=b[ax>>1]|0;b[ax>>1]=bA-bz&65535;b[aw>>1]=(b[aw>>1]|0)+bA&65535;bA=b[bD>>1]|0;b[bD>>1]=bA-(b[bB>>1]|0)&65535;b[bB>>1]=(b[bB>>1]|0)+bA&65535;bU=ak}else{ak=(a$-(c[ad>>2]|0)|0)/2&-1;bA=(a$|0)<(ak|0)?a$:ak;ak=(bA|0)<0?0:bA;bA=a$-ak|0;bB=(c[w>>2]|0)-a2|0;c[w>>2]=bB;bD=c[C>>2]|0;if((ak|0)<(bA|0)){bz=aR(E,aw,ao,bA,J,0,x,0,aD,0,bD>>J)|0;by=((c[w>>2]|0)-bB|0)+bA|0;if((by|0)<25|(a3|0)==16384){bV=ak}else{bV=(ak-24|0)+by|0}bW=(aR(E,ax,ao,bV,J,aX,x,aY,32767,at,bD)|bz)&255}else{bz=aR(E,ax,ao,ak,J,aX,x,aY,32767,at,bD)|0;by=((c[w>>2]|0)-bB|0)+ak|0;if((by|0)<25|(a3|0)==0){bX=bA}else{bX=(bA-24|0)+by|0}bW=(aR(E,aw,ao,bX,J,0,x,0,aD,0,bD>>J)|bz)&255}if(ar){aP=bW;aQ=bW;aT=0;break}else{bU=bW}}L224:do{if(!aC){bz=(ao|0)>0;L226:do{if(bz){bD=0;by=0;bA=0;while(1){ak=b[aw+(bA<<1)>>1]|0;bB=$(ak,b[ax+(bA<<1)>>1]|0)+by|0;a5=$(ak,ak)+bD|0;ak=bA+1|0;if((ak|0)<(ao|0)){bD=a5;by=bB;bA=ak}else{bY=a5;bZ=bB;break L226}}}else{bY=0;bZ=0}}while(0);a8=a1<<16>>16;bd=$(a8<<1,bZ>>16);a_=($(bZ&65535,a8)>>15)+bd|0;bd=a8>>>1<<16>>16;ba=bY+$(bd,bd)|0;bd=a_<<1;a_=ba-bd|0;bc=bd+ba|0;if((bc|0)<161061|(a_|0)<161061){if(bz){b_=0}else{aP=bU;aQ=bU;aT=0;break L117}while(1){b[aw+(b_<<1)>>1]=b[ax+(b_<<1)>>1]|0;ba=b_+1|0;if((ba|0)<(ao|0)){b_=ba}else{break L224}}}ba=65567-(b2(a_|0)|0)<<16>>17;bd=65567-(b2(bc|0)|0)<<16>>17;bC=ba<<1;bA=bC-14|0;if((bA|0)>0){b$=a_>>bA}else{b$=a_<<14-bC}bC=(b$<<16^-2147483648)>>16;bA=($(((bC*6713&-1)>>>15<<16)-884080640>>16,bC)>>>15<<16)+1543831552>>16;by=$(bA,bA)>>>15<<16>>16;bD=(($(by,bC)>>>15)+by<<17^-2147483648)>>16;by=($($(((bD*12288&-1)>>>15<<16)-1073741824>>16,bD)>>>15<<16>>16,bA)>>>15)+bA|0;bA=bd<<1;bD=bA-14|0;if((bD|0)>0){b0=bc>>bD}else{b0=bc<<14-bA}bA=(b0<<16^-2147483648)>>16;bD=($(((bA*6713&-1)>>>15<<16)-884080640>>16,bA)>>>15<<16)+1543831552>>16;bC=$(bD,bD)>>>15<<16>>16;bB=(($(bC,bA)>>>15)+bC<<17^-2147483648)>>16;if(!bz){aP=bU;aQ=bU;aT=0;break L117}bC=by<<16>>16;by=(ba|0)<7?8:ba+1|0;ba=1<<by>>1;bA=($($(((bB*12288&-1)>>>15<<16)-1073741824>>16,bB)>>>15<<16>>16,bD)>>>15)+bD<<16>>16;bD=(bd|0)<7?8:bd+1|0;bd=1<<bD>>1;bB=0;while(1){a5=ax+(bB<<1)|0;ak=$(b[a5>>1]|0,a8)>>>15;bb=aw+(bB<<1)|0;bx=ak<<16>>16;ak=b[bb>>1]|0;b[a5>>1]=$(bx-ak<<16>>16,bC)+ba>>by&65535;b[bb>>1]=$(bx+ak<<16>>16,bA)+bd>>bD&65535;ak=bB+1|0;if((ak|0)<(ao|0)){bB=ak}else{break L224}}}}while(0);if((a4|0)!=0&(ao|0)>0){b1=0}else{aP=bU;aQ=bU;aT=0;break}while(1){a1=aw+(b1<<1)|0;b[a1>>1]=-(b[a1>>1]|0)&65535;a1=b1+1|0;if((a1|0)<(ao|0)){b1=a1}else{aP=bU;aQ=bU;aT=0;break L117}}}}while(0);as=$(L,H);a[m+as|0]=aQ;a[m+(ae+as|0)|0]=aP;as=(aq+ap|0)+(c[o+(L<<2)>>2]|0)|0;if((an|0)<(j|0)){q=(au|0)>(ao<<3|0)&1;ag=av;ah=at;L=an;ai=as;v=aT}else{break}}Q=c[P>>2]|0;c[z>>2]=Q;i=A;return}function aR(f,g,h,i,j,k,l,m,n,o,p){f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0;q=(c[f>>2]|0)!=0;r=c[f+20>>2]|0;s=(j|0)==1&1;t=(h|0)/(j|0)&-1;if((h|0)==1){u=c[f+24>>2]|0;v=f+28|0;w=u+12|0;x=u+16|0;y=u+24|0;z=u+8|0;A=u+4|0;B=u|0;C=u+44|0;D=u+20|0;if((c[v>>2]|0)>7){if(q){u=(e[g>>1]|0)>>>15&65535;E=c[w>>2]|0;F=c[x>>2]|0;if((F+1|0)>>>0>32){G=7-F|0;H=((G|0)>-8?G:-8)+F|0;G=F;I=E;while(1){J=c[z>>2]|0;K=c[A>>2]|0;if((J+(c[y>>2]|0)|0)>>>0<K>>>0){L=J+1|0;c[z>>2]=L;a[(c[B>>2]|0)+(K-L|0)|0]=I&255;M=0}else{M=-1}c[C>>2]=c[C>>2]|M;N=I>>>8;L=G-8|0;if((L|0)>7){G=L;I=N}else{break}}O=(F-8|0)-(H&-8)|0;P=N}else{O=F;P=E}Q=u;R=O+1|0;S=u<<O|P}else{P=c[w>>2]|0;O=c[x>>2]|0;if((O|0)==0){u=c[z>>2]|0;E=c[A>>2]|0;if(u>>>0<E>>>0){A=u+1|0;c[z>>2]=A;T=d[(c[B>>2]|0)+(E-A|0)|0]|0;U=A}else{T=0;U=u}if(U>>>0<E>>>0){u=U+1|0;c[z>>2]=u;V=(d[(c[B>>2]|0)+(E-u|0)|0]|0)<<8;W=u}else{V=0;W=U}if(W>>>0<E>>>0){U=W+1|0;c[z>>2]=U;X=(d[(c[B>>2]|0)+(E-U|0)|0]|0)<<16;Y=U}else{X=0;Y=W}if(Y>>>0<E>>>0){W=Y+1|0;c[z>>2]=W;Z=(d[(c[B>>2]|0)+(E-W|0)|0]|0)<<24}else{Z=0}_=Z|(X|(V|(T|P)));aa=32}else{_=P;aa=O}Q=_&1;R=aa-1|0;S=_>>>1}c[w>>2]=S;c[x>>2]=R;c[D>>2]=(c[D>>2]|0)+1|0;c[v>>2]=(c[v>>2]|0)-8|0;ab=Q}else{ab=0}if(!q){b[g>>1]=(ab|0)!=0?-16384:16384}if((m|0)==0){ac=1;return ac|0}b[m>>1]=(b[g>>1]|0)>>>4&65535;ac=1;return ac|0}ab=(r|0)>0;Q=ab?r:0;L294:do{if((o|0)==0|(k|0)==0){ad=k}else{if((Q|0)==0){if(!((t&1|0)==0&(r|0)<0|(j|0)>1)){ad=k;break}}if((h|0)>0){ae=0}else{ad=o;break}while(1){b[o+(ae<<1)>>1]=b[k+(ae<<1)>>1]|0;v=ae+1|0;if((v|0)<(h|0)){ae=v}else{ad=o;break L294}}}}while(0);L302:do{if(ab){o=(ad|0)==0;ae=p;k=0;while(1){L306:do{if(q){v=1<<k;D=h>>k>>1;if((v|0)<=0){break}R=v<<1;if((D|0)>0){af=0}else{break}while(1){x=0;while(1){S=g+($(R,x)+af<<1)|0;w=g+(((x<<1|1)<<k)+af<<1)|0;_=((b[S>>1]|0)*23170&-1)>>>15<<16>>16;aa=((b[w>>1]|0)*23170&-1)>>>15<<16>>16;b[S>>1]=aa+_&65535;b[w>>1]=_-aa&65535;aa=x+1|0;if((aa|0)<(D|0)){x=aa}else{break}}x=af+1|0;if((x|0)<(v|0)){af=x}else{break L306}}}}while(0);L315:do{if(!o){v=1<<k;D=h>>k>>1;if((v|0)<=0){break}R=v<<1;if((D|0)>0){ag=0}else{break}while(1){x=0;while(1){aa=ad+($(R,x)+ag<<1)|0;_=ad+(((x<<1|1)<<k)+ag<<1)|0;w=((b[aa>>1]|0)*23170&-1)>>>15<<16>>16;S=((b[_>>1]|0)*23170&-1)>>>15<<16>>16;b[aa>>1]=S+w&65535;b[_>>1]=w-S&65535;S=x+1|0;if((S|0)<(D|0)){x=S}else{break}}x=ag+1|0;if((x|0)<(v|0)){ag=x}else{break L315}}}}while(0);v=(d[4736+(ae>>4)|0]|0)<<2|(d[4736+(ae&15)|0]|0);D=k+1|0;if((D|0)<(Q|0)){ae=v;k=D}else{ah=v;break L302}}}else{ah=p}}while(0);p=j>>Q;j=t<<Q;L325:do{if((j&1|0)==0&(r|0)<0){t=(ad|0)!=0;ag=j;af=0;k=ah;ae=p;o=r;while(1){L329:do{if(q){v=ag>>1;if((ae|0)<=0){break}D=ae<<1;if((v|0)>0){ai=0}else{break}while(1){R=0;while(1){x=g+($(D,R)+ai<<1)|0;S=((b[x>>1]|0)*23170&-1)>>>15;w=g+($(R<<1|1,ae)+ai<<1)|0;_=S<<16>>16;S=((b[w>>1]|0)*23170&-1)>>>15<<16>>16;b[x>>1]=S+_&65535;b[w>>1]=_-S&65535;S=R+1|0;if((S|0)<(v|0)){R=S}else{break}}R=ai+1|0;if((R|0)<(ae|0)){ai=R}else{break L329}}}}while(0);v=ag>>1;L338:do{if(t&(ae|0)>0){D=ae<<1;if((v|0)>0){aj=0}else{break}while(1){R=0;while(1){S=ad+($(D,R)+aj<<1)|0;_=((b[S>>1]|0)*23170&-1)>>>15;w=ad+($(R<<1|1,ae)+aj<<1)|0;x=_<<16>>16;_=((b[w>>1]|0)*23170&-1)>>>15<<16>>16;b[S>>1]=_+x&65535;b[w>>1]=x-_&65535;_=R+1|0;if((_|0)<(v|0)){R=_}else{break}}R=aj+1|0;if((R|0)<(ae|0)){aj=R}else{break L338}}}}while(0);D=k<<ae|k;R=ae<<1;_=af+1|0;x=o+1|0;if((v&1|0)==0&(x|0)<0){ag=v;af=_;k=D;ae=R;o=x}else{ak=v;al=_;am=D;an=R;break L325}}}else{ak=j;al=0;am=ah;an=p}}while(0);p=(an|0)>1;do{if(p){if(q){aU(g,ak>>Q,an<<Q,s)}if((ad|0)==0){break}aU(ad,ak>>Q,an<<Q,s)}}while(0);ah=aV(f,g,h,i,an,ad,l,n,am)|0;if(q){ac=ah;return ac|0}if(p){aW(g,ak>>Q,an<<Q,s)}L360:do{if((al|0)>0){s=ak;p=ah;q=0;am=an;while(1){n=am>>1;l=s<<1;ad=p>>>(n>>>0)|p;i=l>>1;L363:do{if((n|0)>0){f=n<<1;if((l|0)>0){ao=0}else{break}while(1){j=0;while(1){aj=g+($(f,j)+ao<<1)|0;ai=((b[aj>>1]|0)*23170&-1)>>>15;r=g+($(j<<1|1,n)+ao<<1)|0;o=ai<<16>>16;ai=((b[r>>1]|0)*23170&-1)>>>15<<16>>16;b[aj>>1]=ai+o&65535;b[r>>1]=o-ai&65535;ai=j+1|0;if((ai|0)<(i|0)){j=ai}else{break}}j=ao+1|0;if((j|0)<(n|0)){ao=j}else{break L363}}}}while(0);i=q+1|0;if((i|0)<(al|0)){s=l;p=ad;q=i;am=n}else{ap=ad;aq=n;break L360}}}else{ap=ah;aq=an}}while(0);L372:do{if(ab){an=ap;ah=0;while(1){al=d[an+4752|0]|0;ao=1<<ah;ak=h>>ah>>1;L375:do{if((ao|0)>0){am=ao<<1;if((ak|0)>0){ar=0}else{break}while(1){q=0;while(1){p=g+($(am,q)+ar<<1)|0;s=g+(((q<<1|1)<<ah)+ar<<1)|0;i=((b[p>>1]|0)*23170&-1)>>>15<<16>>16;v=((b[s>>1]|0)*23170&-1)>>>15<<16>>16;b[p>>1]=v+i&65535;b[s>>1]=i-v&65535;v=q+1|0;if((v|0)<(ak|0)){q=v}else{break}}q=ar+1|0;if((q|0)<(ao|0)){ar=q}else{break L375}}}}while(0);ao=ah+1|0;if((ao|0)<(Q|0)){an=al;ah=ao}else{as=al;break L372}}}else{as=ap}}while(0);ap=aq<<Q;L384:do{if((m|0)!=0){Q=h<<22;do{if((Q|0)==0){at=0}else{if((Q|0)>1073741823){at=32767;break}aq=65567-(b2(Q|0)|0)<<16>>17;ar=aq<<1;ab=ar-14|0;if((ab|0)>0){au=Q>>ab}else{au=Q<<14-ar}ar=(au<<16^-2147483648)>>16;ab=($(($(($(((ar*-664&-1)>>>15<<16)+111345664>>16,ar)>>>15<<16)-197328896>>16,ar)>>>15<<16)+757661696>>16,ar)>>>15<<16)+1518796800>>16;ar=14-aq|0;if((ar|0)>0){at=ab>>ar;break}else{at=ab<<-ar;break}}}while(0);if((h|0)<=0){break}Q=at<<16>>16;ar=0;while(1){b[m+(ar<<1)>>1]=$(b[g+(ar<<1)>>1]|0,Q)>>>15&65535;ab=ar+1|0;if((ab|0)<(h|0)){ar=ab}else{break L384}}}}while(0);ac=as&(1<<ap)-1;return ac|0}function aS(a,e,f,g,h,i,j,k,l,m,n){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0;o=c[a>>2]|0;p=c[a+4>>2]|0;q=c[a+8>>2]|0;r=c[a+12>>2]|0;s=c[a+24>>2]|0;t=c[a+32>>2]|0;u=(b[(c[p+48>>2]|0)+(q<<1)>>1]|0)+(l<<3)|0;l=(m|0)!=0;if(l){v=(h|0)==2?16:4}else{v=4}w=c[i>>2]|0;x=(l&(h|0)==2?-2:-1)+(h<<1)|0;y=(w-u|0)-32|0;z=($((u>>1)-v|0,x)+w|0)/(x|0)&-1;x=(y|0)<(z|0)?y:z;z=(x|0)>64?64:x;if((z|0)<4){A=1}else{A=((b[10416+((z&7)<<1)>>1]|0)>>14-(z>>3))+1&-2}z=l^1;x=(q|0)<(r|0)|z?A:1;A=(o|0)!=0;if(A){B=bs(f,g,m,h)|0}else{B=0}m=s+20|0;o=c[m>>2]|0;r=s+28|0;y=c[r>>2]|0;v=32-(b2(y|0)|0)|0;u=y>>>((v-16|0)>>>0);C=$(u,u);u=C>>>31;D=C>>>15>>>(u>>>0);C=$(D,D);D=C>>>31;E=C>>>15>>>(D>>>0);C=$(E,E)>>>31|(D|(u|v<<1)<<1)<<1;v=o<<3;L412:do{if((x|0)==1){if(!l){F=B;G=0;break}if(A){u=(B|0)>8192;D=u&1;L509:do{if(u&(h|0)>0){E=0;while(1){H=g+(E<<1)|0;b[H>>1]=-(b[H>>1]|0)&65535;H=E+1|0;if((H|0)<(h|0)){E=H}else{break L509}}}}while(0);aT(c[p+8>>2]|0,f,g,t,q,h);I=D;J=c[i>>2]|0}else{I=0;J=w}if((J|0)<=16){F=0;G=0;break}if((c[a+28>>2]|0)<=16){F=0;G=0;break}u=c[r>>2]|0;E=s+32|0;if(A){H=u>>>2;K=u-H|0;L=(I|0)!=0;if(L){c[E>>2]=(c[E>>2]|0)+K|0}M=L?H:K;c[r>>2]=M;if(M>>>0>=8388609){F=0;G=I;break}M=c[E>>2]|0;while(1){a4(s,M>>>23);K=c[E>>2]<<8&2147483392;c[E>>2]=K;H=c[r>>2]<<8;c[r>>2]=H;c[m>>2]=(c[m>>2]|0)+8|0;if(H>>>0<8388609){M=K}else{F=0;G=I;break L412}}}M=c[E>>2]|0;D=u>>>2;K=M>>>0<D>>>0;H=K&1;if(K){N=D;O=M}else{K=M-D|0;c[E>>2]=K;N=u-D|0;O=K}c[r>>2]=N;if(N>>>0>=8388609){F=0;G=H;break}K=s+40|0;D=s+24|0;M=s|0;L=c[s+4>>2]|0;P=c[m>>2]|0;Q=N;R=c[K>>2]|0;S=c[D>>2]|0;T=O;while(1){U=P+8|0;c[m>>2]=U;V=Q<<8;c[r>>2]=V;if(S>>>0<L>>>0){W=S+1|0;c[D>>2]=W;X=d[(c[M>>2]|0)+S|0]|0;Y=W}else{X=0;Y=S}c[K>>2]=X;W=((X|R<<8)>>>1&255|T<<8&2147483392)^255;c[E>>2]=W;if(V>>>0<8388609){P=U;Q=V;R=X;S=Y;T=W}else{F=0;G=H;break L412}}}else{if(A){Z=$(B,x)+8192>>14}else{Z=B}L417:do{if(l&(h|0)>2){H=(x|0)/2&-1;T=H+1|0;S=T*3&-1;R=S+H|0;if(A){if((Z|0)>(H|0)){_=(Z-H|0)+S|0;aa=((Z-1|0)-H|0)+S|0}else{Q=Z*3&-1;_=Q+3|0;aa=Q}Q=(y>>>0)/(R>>>0)>>>0;if((aa|0)==0){ab=y-$(Q,R-_|0)|0}else{P=y-$(Q,R-aa|0)|0;E=s+32|0;c[E>>2]=P+(c[E>>2]|0)|0;ab=$(Q,_-aa|0)}c[r>>2]=ab;if(ab>>>0>=8388609){ac=Z;break}Q=s+32|0;E=c[Q>>2]|0;while(1){a4(s,E>>>23);P=c[Q>>2]<<8&2147483392;c[Q>>2]=P;K=c[r>>2]<<8;c[r>>2]=K;c[m>>2]=(c[m>>2]|0)+8|0;if(K>>>0<8388609){E=P}else{ac=Z;break L417}}}E=(y>>>0)/(R>>>0)>>>0;c[s+36>>2]=E;Q=s+32|0;P=c[Q>>2]|0;K=(P>>>0)/(E>>>0)>>>0;M=K+1|0;D=(R+(K^-1)|0)-(R-M&-(M>>>0>R>>>0&1))|0;if((D|0)<(S|0)){ad=(D|0)/3&-1}else{ad=(T-S|0)+D|0}if((ad|0)>(H|0)){ae=(S-H|0)+ad|0;af=(S+(H^-1)|0)+ad|0}else{D=ad*3&-1;ae=D+3|0;af=D}D=$(E,R-ae|0);M=P-D|0;c[Q>>2]=M;if((af|0)==0){ag=y-D|0}else{ag=$(E,ae-af|0)}c[r>>2]=ag;if(ag>>>0>=8388609){ac=ad;break}E=s+40|0;D=s+24|0;P=s|0;K=c[s+4>>2]|0;L=o;u=ag;W=c[E>>2]|0;V=c[D>>2]|0;U=M;while(1){M=L+8|0;c[m>>2]=M;ah=u<<8;c[r>>2]=ah;if(V>>>0<K>>>0){ai=V+1|0;c[D>>2]=ai;aj=d[(c[P>>2]|0)+V|0]|0;ak=ai}else{aj=0;ak=V}c[E>>2]=aj;ai=((aj|W<<8)>>>1&255|U<<8&2147483392)^255;c[Q>>2]=ai;if(ah>>>0<8388609){L=M;u=ah;W=aj;V=ak;U=ai}else{ac=ad;break L417}}}else{if((k|0)>1|l){U=x+1|0;if(A){a3(s,Z,U);ac=Z;break}else{F=(a2(s,U)<<14|0)/(x|0)&-1;G=0;break L412}}U=x>>1;V=U+1|0;W=$(V,V);if(A){if((Z|0)>(U|0)){u=(x+1|0)-Z|0;al=W-($(u,(x+2|0)-Z|0)>>1)|0;am=u}else{u=Z+1|0;al=$(u,Z)>>1;am=u}u=(y>>>0)/(W>>>0)>>>0;if((al|0)==0){an=y-$(u,W-am|0)|0}else{L=y-$(u,W-al|0)|0;Q=s+32|0;c[Q>>2]=L+(c[Q>>2]|0)|0;an=$(u,am)}c[r>>2]=an;if(an>>>0>=8388609){ac=Z;break}u=s+32|0;Q=c[u>>2]|0;while(1){a4(s,Q>>>23);L=c[u>>2]<<8&2147483392;c[u>>2]=L;E=c[r>>2]<<8;c[r>>2]=E;c[m>>2]=(c[m>>2]|0)+8|0;if(E>>>0<8388609){Q=L}else{ac=Z;break L417}}}Q=(y>>>0)/(W>>>0)>>>0;c[s+36>>2]=Q;u=s+32|0;L=c[u>>2]|0;E=(L>>>0)/(Q>>>0)>>>0;P=E+1|0;D=(W+(E^-1)|0)-(W-P&-(P>>>0>W>>>0&1))|0;if((D|0)<($(V,U)>>1|0)){P=D<<3|1;E=(b2(P|0)|0)>>>1^15;K=P;P=E;R=0;H=1<<E;while(1){E=(R<<1)+H<<P;if(E>>>0>K>>>0){ao=K;ap=R}else{ao=K-E|0;ap=R+H|0}if((P|0)>0){K=ao;P=P-1|0;R=ap;H=H>>>1}else{break}}H=(ap-1|0)>>>1;R=H+1|0;aq=$(R,H)>>>1;ar=H;as=R}else{R=x+1|0;H=(W-D<<3)-7|0;P=(b2(H|0)|0)>>>1^15;K=H;H=P;U=0;V=1<<P;while(1){P=(U<<1)+V<<H;if(P>>>0>K>>>0){at=K;au=U}else{at=K-P|0;au=U+V|0}if((H|0)>0){K=at;H=H-1|0;U=au;V=V>>>1}else{break}}V=((R<<1)-au|0)>>>1;U=R-V|0;aq=W-($(U,(x+2|0)-V|0)>>1)|0;ar=V;as=U}U=$(Q,(W-as|0)-aq|0);V=L-U|0;c[u>>2]=V;if((aq|0)==0){av=y-U|0}else{av=$(Q,as)}c[r>>2]=av;if(av>>>0>=8388609){ac=ar;break}U=s+40|0;H=s+24|0;K=s|0;D=c[s+4>>2]|0;P=o;E=av;S=c[U>>2]|0;T=c[H>>2]|0;ai=V;while(1){V=P+8|0;c[m>>2]=V;ah=E<<8;c[r>>2]=ah;if(T>>>0<D>>>0){M=T+1|0;c[H>>2]=M;aw=d[(c[K>>2]|0)+T|0]|0;ax=M}else{aw=0;ax=T}c[U>>2]=aw;M=((aw|S<<8)>>>1&255|ai<<8&2147483392)^255;c[u>>2]=M;if(ah>>>0<8388609){P=V;E=ah;S=aw;T=ax;ai=M}else{ac=ar;break L417}}}}while(0);ai=(ac<<14|0)/(x|0)&-1;if(A^1|z){F=ai;G=0;break}if((ai|0)==0){aT(c[p+8>>2]|0,f,g,t,q,h);F=0;G=0;break}if((h|0)>0){ay=0}else{F=ai;G=0;break}while(1){T=f+(ay<<1)|0;S=g+(ay<<1)|0;E=((b[T>>1]|0)*23170&-1)>>>15<<16>>16;P=((b[S>>1]|0)*23170&-1)>>>15<<16>>16;b[T>>1]=P+E&65535;b[S>>1]=P-E&65535;E=ay+1|0;if((E|0)<(h|0)){ay=E}else{F=ai;G=0;break L412}}}}while(0);ay=c[m>>2]|0;m=c[r>>2]|0;r=32-(b2(m|0)|0)|0;g=m>>>((r-16|0)>>>0);m=$(g,g);g=m>>>31;f=m>>>15>>>(g>>>0);m=$(f,f);f=m>>>31;q=m>>>15>>>(f>>>0);m=((ay<<3)-($(q,q)>>>31|(f|(g|r<<1)<<1)<<1)|0)+(C-v|0)|0;c[i>>2]=(c[i>>2]|0)-m|0;if((F|0)==0){c[n>>2]=c[n>>2]&(1<<j)-1;az=-16384;aA=32767;aB=0;aC=e|0;c[aC>>2]=G;aD=e+4|0;c[aD>>2]=aA;aE=e+8|0;c[aE>>2]=aB;aF=e+12|0;c[aF>>2]=az;aG=e+16|0;c[aG>>2]=F;aH=e+20|0;c[aH>>2]=m;return}else if((F|0)==16384){c[n>>2]=c[n>>2]&(1<<j)-1<<j;az=16384;aA=0;aB=32767;aC=e|0;c[aC>>2]=G;aD=e+4|0;c[aD>>2]=aA;aE=e+8|0;c[aE>>2]=aB;aF=e+12|0;c[aF>>2]=az;aG=e+16|0;c[aG>>2]=F;aH=e+20|0;c[aH>>2]=m;return}else{j=F<<16>>16;n=($(j,j)+4096|0)>>>13<<16>>16;j=(32768-n|0)+(($((($((((n*-626&-1)+16384|0)>>>15<<16)+542441472>>16,n)+16384|0)>>>15<<16)-501415936>>16,n)+16384|0)>>>15)<<16>>16;n=16384-F<<16>>16;i=($(n,n)+4096|0)>>>13<<16>>16;n=(32768-i|0)+(($((($((((i*-626&-1)+16384|0)>>>15<<16)+542441472>>16,i)+16384|0)>>>15<<16)-501415936>>16,i)+16384|0)>>>15)<<16>>16;i=32-(b2(j|0)|0)|0;v=32-(b2(n|0)|0)|0;C=n<<15-v<<16>>16;r=($((((C*-2597&-1)+16384|0)>>>15<<16)+519831552>>16,C)+16384|0)>>>15;C=j<<15-i<<16>>16;az=$(((v-i<<11)-(($((((C*-2597&-1)+16384|0)>>>15<<16)+519831552>>16,C)+16384|0)>>>15)|0)+r<<16>>16,(h<<23)-8388608>>16)+16384>>15;aA=j;aB=n;aC=e|0;c[aC>>2]=G;aD=e+4|0;c[aD>>2]=aA;aE=e+8|0;c[aE>>2]=aB;aF=e+12|0;c[aF>>2]=az;aG=e+16|0;c[aG>>2]=F;aH=e+20|0;c[aH>>2]=m;return}}function aT(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;i=c[f+(g<<2)>>2]|0;j=c[f+(g+a<<2)>>2]|0;a=(i|0)>(j|0)?i:j;do{if((a|0)<1){k=0;l=376}else{g=65567-(b2(a|0)|0)<<16>>16;f=g-13|0;if((f|0)<=0){k=g;l=376;break}m=i>>f&65535;n=j>>f&65535;break}}while(0);if((l|0)==376){l=13-k|0;m=i<<l&65535;n=j<<l&65535}l=m<<16>>16;m=$(l,l)+1|0;j=n<<16>>16;n=m+$(j,j)|0;do{if((n|0)>1073741823){o=32767}else{m=65567-(b2(n|0)|0)<<16>>17;i=m<<1;k=i-14|0;if((k|0)>0){p=n>>>(k>>>0)}else{p=n<<14-i}i=(p<<16^-2147483648)>>16;k=($(($(($(((i*-664&-1)>>>15<<16)+111345664>>16,i)>>>15<<16)-197328896>>16,i)>>>15<<16)+757661696>>16,i)>>>15<<16)+1518796800>>16;i=14-m|0;if((i|0)>0){o=k>>i;break}else{o=k<<-i;break}}}while(0);p=(o<<16)+65536>>16;if((h|0)<=0){return}o=((l<<14|0)/(p|0)&-1)<<16>>16;l=((j<<14|0)/(p|0)&-1)<<16>>16;p=0;while(1){j=d+(p<<1)|0;n=b[e+(p<<1)>>1]|0;i=$(b[j>>1]|0,o)>>>14;b[j>>1]=($(n<<16>>16,l)>>>14)+i&65535;i=p+1|0;if((i|0)<(h|0)){p=i}else{break}}return}function aU(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;h=a;j=$(e,d);k=i;i=i+(j*2&-1)|0;i=i+7>>3<<3;l=k;L566:do{if((f|0)==0){if((e|0)<=0){break}m=(d|0)>0;n=0;while(1){L571:do{if(m){o=$(n,d);p=0;while(1){b[k+(p+o<<1)>>1]=b[a+($(p,e)+n<<1)>>1]|0;q=p+1|0;if((q|0)<(d|0)){p=q}else{break L571}}}}while(0);p=n+1|0;if((p|0)<(e|0)){n=p}else{break L566}}}else{n=e-2|0;if((e|0)<=0){break}m=(d|0)>0;p=0;while(1){L580:do{if(m){o=$(c[4776+(n+p<<2)>>2]|0,d);q=0;while(1){b[k+(o+q<<1)>>1]=b[a+($(q,e)+p<<1)>>1]|0;r=q+1|0;if((r|0)<(d|0)){q=r}else{break L580}}}}while(0);q=p+1|0;if((q|0)<(e|0)){p=q}else{break L566}}}}while(0);if((j|0)<=0){i=g;return}b3(h|0,l|0,j<<1);i=g;return}function aV(f,g,h,j,k,l,m,n,o){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;p=i;q=g;r=i;i=i+4|0;i=i+7>>3<<3;s=i;i=i+4|0;i=i+7>>3<<3;t=i;i=i+24|0;c[r>>2]=j;c[s>>2]=o;u=(c[f>>2]|0)!=0;v=c[f+4>>2]|0;w=c[f+8>>2]|0;x=c[f+16>>2]|0;y=c[f+24>>2]|0;z=v+92|0;A=c[z>>2]|0;B=m+1|0;C=v+8|0;D=$(c[C>>2]|0,B)+w|0;E=v+88|0;v=b[(c[E>>2]|0)+(D<<1)>>1]|0;D=a[A+v|0]|0;do{if((m|0)!=-1){if(!(((d[A+((D&255)+v|0)|0]|0)+12|0)<(j|0)&(h|0)>2)){break}F=h>>1;G=g+(F<<1)|0;H=m-1|0;if((k|0)==1){c[s>>2]=o&1|o<<1}I=k+1>>1;aS(f,t,g,G,F,r,I,k,H,0,s);J=c[t+12>>2]|0;K=c[t+16>>2]|0;L=c[t+20>>2]|0;M=c[t+4>>2]&65535;N=c[t+8>>2]&65535;do{if((k|0)>1){if((K&16383|0)==0){O=J;break}if((K|0)>8192){O=J-(J>>5-m)|0;break}else{P=J+(F<<3>>6-m)|0;O=(P|0)>0?0:P;break}}else{O=J}}while(0);J=c[r>>2]|0;P=(J-O|0)/2&-1;Q=(J|0)<(P|0)?J:P;P=(Q|0)<0?0:Q;Q=J-P|0;J=f+28|0;R=(c[J>>2]|0)-L|0;c[J>>2]=R;if((l|0)==0){S=0}else{S=l+(F<<1)|0}T=n<<16>>16;if((P|0)<(Q|0)){U=($(N<<16>>16,T)+16384|0)>>>15&65535;V=c[s>>2]|0;W=aV(f,G,F,Q,I,S,H,U,V>>I)<<(k>>1);U=((c[J>>2]|0)-R|0)+Q|0;if((U|0)<25|(K|0)==16384){X=P}else{X=(P-24|0)+U|0}Y=aV(f,g,F,X,I,l,H,($(M<<16>>16,T)+16384|0)>>>15&65535,V)|W;i=p;return Y|0}else{W=($(M<<16>>16,T)+16384|0)>>>15&65535;V=c[s>>2]|0;U=aV(f,g,F,P,I,l,H,W,V)|0;W=((c[J>>2]|0)-R|0)+P|0;if((W|0)<25|(K|0)==0){Z=Q}else{Z=(Q-24|0)+W|0}Y=aV(f,G,F,Z,I,S,H,($(N<<16>>16,T)+16384|0)>>>15&65535,V>>I)<<(k>>1)|U;i=p;return Y|0}}}while(0);S=D&255;D=j-1|0;j=(S+1|0)>>>1;Z=(d[A+(j+v|0)|0]|0|0)<(D|0);X=Z?j:0;O=Z?S:j;j=(X+1|0)+O>>1;S=(d[A+(j+v|0)|0]|0|0)<(D|0);Z=S?j:X;X=S?O:j;j=(Z+1|0)+X>>1;O=(d[A+(j+v|0)|0]|0|0)<(D|0);S=O?j:Z;Z=O?X:j;j=(S+1|0)+Z>>1;X=(d[A+(j+v|0)|0]|0|0)<(D|0);O=X?j:S;S=X?Z:j;j=(O+1|0)+S>>1;Z=(d[A+(j+v|0)|0]|0|0)<(D|0);X=Z?j:O;O=Z?S:j;j=(X+1|0)+O>>1;S=(d[A+(j+v|0)|0]|0|0)<(D|0);Z=S?j:X;X=S?O:j;if((Z|0)==0){_=-1}else{_=d[A+(Z+v|0)|0]|0}j=(D-_|0)>((d[A+(X+v|0)|0]|0)-D|0)?X:Z;if((j|0)==0){aa=0}else{aa=(d[A+(v+j|0)|0]|0)+1|0}v=f+28|0;A=(c[v>>2]|0)-aa|0;c[v>>2]=A;L625:do{if((A|0)<0&(j|0)>0){Z=A;X=aa;D=j;while(1){ab=X+Z|0;c[v>>2]=ab;_=D-1|0;if((_|0)==0){break}O=$(c[C>>2]|0,B);S=(d[(c[z>>2]|0)+((b[(c[E>>2]|0)+(O+w<<1)>>1]|0)+_|0)|0]|0)+1|0;O=ab-S|0;c[v>>2]=O;if((O|0)<0&(_|0)>0){Z=O;X=S;D=_}else{ac=_;ad=435;break L625}}c[v>>2]=ab;break}else{if((j|0)==0){break}else{ac=j;ad=435;break}}}while(0);if((ad|0)==435){if((ac|0)<8){ae=ac}else{ae=(ac&7|8)<<(ac>>3)-1}if(u){Y=bo(g,h,ae,x,k,y)|0;i=p;return Y|0}else{Y=bq(g,h,ae,x,k,y,n)|0;i=p;return Y|0}}if(u){Y=0;i=p;return Y|0}u=(1<<k)-1|0;k=u&o;c[s>>2]=k;if((k|0)==0){if((h|0)<=0){Y=0;i=p;return Y|0}b1(q|0,0,h<<1|0);Y=0;i=p;return Y|0}q=(h|0)>0;L652:do{if((l|0)==0){if(!q){af=u;break}s=f+36|0;o=0;while(1){y=$(c[s>>2]|0,1664525)+1013904223|0;c[s>>2]=y;b[g+(o<<1)>>1]=y>>20&65535;y=o+1|0;if((y|0)<(h|0)){o=y}else{af=u;break L652}}}else{if(!q){af=k;break}o=f+36|0;s=0;while(1){y=$(c[o>>2]|0,1664525)+1013904223|0;c[o>>2]=y;b[g+(s<<1)>>1]=(((y>>>12<<16&524288)-262144|0)>>>16)+(e[l+(s<<1)>>1]|0)&65535;y=s+1|0;if((y|0)<(h|0)){s=y}else{af=k;break L652}}}}while(0);br(g,h,n);Y=af;i=p;return Y|0}function aW(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;h=a;j=$(e,d);k=i;i=i+(j*2&-1)|0;i=i+7>>3<<3;l=k;L664:do{if((f|0)==0){if((e|0)<=0){break}m=(d|0)>0;n=0;while(1){L669:do{if(m){o=$(n,d);p=0;while(1){q=b[a+(p+o<<1)>>1]|0;b[k+($(p,e)+n<<1)>>1]=q;q=p+1|0;if((q|0)<(d|0)){p=q}else{break L669}}}}while(0);p=n+1|0;if((p|0)<(e|0)){n=p}else{break L664}}}else{n=e-2|0;if((e|0)<=0){break}m=(d|0)>0;p=0;while(1){L678:do{if(m){o=$(c[4776+(n+p<<2)>>2]|0,d);q=0;while(1){r=b[a+(o+q<<1)>>1]|0;b[k+($(q,e)+p<<1)>>1]=r;r=q+1|0;if((r|0)<(d|0)){q=r}else{break L678}}}}while(0);q=p+1|0;if((q|0)<(e|0)){p=q}else{break L664}}}}while(0);if((j|0)<=0){i=g;return}b3(h|0,l|0,j<<1);i=g;return}function aX(a,d,e,f,g,h,i,j,k,l,m){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;n=h<<16>>16;o=i<<16>>16==0;if((i|h)<<16>>16==0){if((d|0)==(a|0)){return}b4(a|0,d|0,g<<2|0);return}h=i<<16>>16;i=$(b[10432+(k*6&-1)>>1]|0,h)>>>15&65535;p=$(b[10434+(k*6&-1)>>1]|0,h)>>>15&65535;q=$(b[10436+(k*6&-1)>>1]|0,h)>>>15&65535;h=c[d+(1-f<<2)>>2]|0;k=c[d+(-f<<2)>>2]|0;r=c[d+((f^-1)<<2)>>2]|0;s=c[d+(-2-f<<2)>>2]|0;L696:do{if((m|0)>0){t=b[10434+(j*6&-1)>>1]|0;u=b[10432+(j*6&-1)>>1]|0;v=$(b[10436+(j*6&-1)>>1]|0,n);w=$(t,n);t=2-f|0;x=$(u,n)>>>15<<16>>16;u=w>>>15<<16>>16;w=v>>>15<<16>>16;v=i<<16>>16;y=p<<16>>16;z=q<<16>>16;A=h;B=k;C=r;D=s;E=0;while(1){F=c[d+(t+E<<2)>>2]|0;G=b[l+(E<<1)>>1]|0;H=$(G,G)>>>15;G=c[d+(E<<2)>>2]|0;I=H<<16>>16;H=32767-I<<16>>16;J=$(H,x)>>>15<<16>>16;K=E-e|0;L=c[d+(K<<2)>>2]|0;M=$(J,L>>16);N=$(J,L&65535)>>15;L=$(H,u)>>>15<<16>>16;J=(c[d+(K-1<<2)>>2]|0)+(c[d+(K+1<<2)>>2]|0)|0;O=$(L,J>>16);P=$(L,J&65535)>>15;J=$(H,w)>>>15<<16>>16;H=(c[d+(K-2<<2)>>2]|0)+(c[d+(K+2<<2)>>2]|0)|0;K=$(J,H>>16);L=$(J,H&65535)>>15;H=$(I,v)>>>15<<16>>16;J=$(H,B>>16);Q=$(H,B&65535)>>15;H=$(I,y)>>>15<<16>>16;R=C+A|0;S=$(H,R>>16);T=$(H,R&65535)>>15;R=$(I,z)>>>15<<16>>16;I=F+D|0;H=$(R,I>>16);c[a+(E<<2)>>2]=((((((Q+G|0)+T|0)+($(R,I&65535)>>15)|0)+N|0)+P|0)+L|0)+(((((S+H|0)+J|0)+O|0)+K|0)+M<<1)|0;M=E+1|0;if((M|0)<(m|0)){D=C;C=B;B=A;A=F;E=M}else{U=F;V=A;W=B;X=C;Y=m;break L696}}}else{U=h;V=k;W=r;X=s;Y=0}}while(0);if(o){if((d|0)==(a|0)){return}b4(a+(m<<2)|0,d+(m<<2)|0,g-m<<2|0);return}if((Y|0)>=(g|0)){return}m=2-f|0;f=i<<16>>16;i=p<<16>>16;p=q<<16>>16;q=U;U=V;V=W;W=X;X=Y;while(1){Y=c[d+(m+X<<2)>>2]|0;o=c[d+(X<<2)>>2]|0;s=$(U>>16,f);r=$(U&65535,f)>>15;k=V+q|0;h=$(k>>16,i);e=$(k&65535,i)>>15;k=Y+W|0;l=$(k>>16,p);c[a+(X<<2)>>2]=(((e+r|0)+o|0)+($(k&65535,p)>>15)|0)+((h+s|0)+l<<1)|0;l=X+1|0;if((l|0)<(g|0)){W=V;V=U;U=q;q=Y;X=l}else{break}}return}function aY(e,f,g,h,j,k){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aY=0,a$=0,a0=0,a1=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b3=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0;l=i;i=i+96|0;m=l|0;n=l+48|0;o=l+56|0;p=l+64|0;q=l+72|0;r=l+80|0;s=l+88|0;t=c[e+8>>2]|0;c[q>>2]=0;c[r>>2]=0;u=c[e+12>>2]|0;v=c[e>>2]|0;w=v+8|0;x=c[w>>2]|0;y=v+4|0;z=c[y>>2]|0;A=v+24|0;B=c[A>>2]|0;C=e+16|0;D=c[C>>2]|0;E=z+2048|0;F=0;while(1){G=$(F,E);c[o+(F<<2)>>2]=e+76+(G<<2)|0;c[n+(F<<2)>>2]=e+76+(G+1024<<2)|0;G=F+1|0;if((G|0)<(t|0)){F=G}else{break}}F=$(D,j);j=$(z+2060|0,t);D=e+76+(j<<2)|0;E=x<<1;G=j+x|0;j=e+76+(G<<2)|0;H=G+x|0;G=e+76+(H<<2)|0;I=e+76+(H+x<<2)|0;H=v+36|0;J=v+28|0;K=c[J>>2]|0;L=0;while(1){if((L|0)>(K|0)){M=-1;N=721;break}if((c[H>>2]<<L|0)==(F|0)){break}else{L=L+1|0}}if((N|0)==721){i=l;return M|0}K=1<<L;if(g>>>0>1275|(h|0)==0){M=-1;i=l;return M|0}O=c[H>>2]<<L;P=e+24|0;Q=c[P>>2]|0;R=c[v+12>>2]|0;S=(Q|0)>(R|0)?R:Q;if((f|0)==0|(g|0)<2){aZ(e,h,O,L);M=(F|0)/(c[C>>2]|0)&-1;i=l;return M|0}if((k|0)==0){c[m>>2]=f;c[m+4>>2]=g;c[m+8>>2]=0;c[m+12>>2]=0;c[m+16>>2]=0;Q=m+20|0;c[Q>>2]=9;R=m+24|0;c[R>>2]=0;T=m+28|0;c[T>>2]=128;if((g|0)==0){U=0;V=0}else{c[R>>2]=1;U=d[f]|0;V=1}W=m+40|0;c[W>>2]=U;X=U>>>1^127;Y=m+32|0;c[Y>>2]=X;c[m+44>>2]=0;if(V>>>0<g>>>0){Z=V+1|0;c[R>>2]=Z;_=d[f+V|0]|0;aa=Z}else{_=0;aa=V}if(aa>>>0<g>>>0){V=aa+1|0;c[R>>2]=V;ab=d[f+aa|0]|0;ac=V}else{ab=0;ac=aa}if(ac>>>0<g>>>0){c[R>>2]=ac+1|0;ad=d[f+ac|0]|0}else{ad=0}c[Q>>2]=33;c[T>>2]=-2147483648;c[W>>2]=ad;c[Y>>2]=((((_|U<<8)>>>1&255|X<<8)<<8|(ab|_<<8)>>>1&255)<<8&2147483392|(ad|ab<<8)>>>1&255)^16777215;ae=m}else{ae=k}k=(u|0)==1;L746:do{if(k&(x|0)>0){m=0;while(1){ab=D+(m<<1)|0;ad=b[ab>>1]|0;_=b[D+(m+x<<1)>>1]|0;b[ab>>1]=ad<<16>>16>_<<16>>16?ad:_;_=m+1|0;if((_|0)<(x|0)){m=_}else{break L746}}}}while(0);m=g<<3;_=ae+20|0;ad=c[_>>2]|0;ab=ae+28|0;X=c[ab>>2]|0;U=(b2(X|0)|-32)+ad|0;do{if((U|0)<(m|0)){if((U|0)!=1){af=U;ag=0;ah=X;ai=ad;break}Y=ae+32|0;W=c[Y>>2]|0;T=X>>>15;Q=W>>>0<T>>>0;if(Q){c[ab>>2]=T;aj=W;ak=T}else{ac=W-T|0;c[Y>>2]=ac;W=X-T|0;c[ab>>2]=W;if(W>>>0<8388609){aj=ac;ak=W}else{af=1;ag=0;ah=W;ai=ad;break}}W=ae+40|0;ac=ae+24|0;T=ae|0;f=c[ae+4>>2]|0;R=ad;aa=ak;V=c[W>>2]|0;Z=c[ac>>2]|0;al=aj;while(1){am=R+8|0;c[_>>2]=am;ao=aa<<8;c[ab>>2]=ao;if(Z>>>0<f>>>0){ap=Z+1|0;c[ac>>2]=ap;aq=d[(c[T>>2]|0)+Z|0]|0;ar=ap}else{aq=0;ar=Z}c[W>>2]=aq;ap=((aq|V<<8)>>>1&255|al<<8&2147483392)^255;c[Y>>2]=ap;if(ao>>>0<8388609){R=am;aa=ao;V=aq;Z=ar;al=ap}else{break}}if(Q){as=am;at=ao;N=524;break}else{af=1;ag=0;ah=ao;ai=am;break}}else{as=ad;at=X;N=524}}while(0);if((N|0)==524){N=((m-as|0)-(b2(at|0)|-32)|0)+as|0;c[_>>2]=N;af=m;ag=1;ah=at;ai=N}N=e+20|0;do{if((c[N>>2]|0)==0){if((af+16|0)>(m|0)){au=0;aw=0;ax=af;ay=0;az=ah;aA=ai;break}at=ae+32|0;as=c[at>>2]|0;X=ah>>>1;ad=as>>>0<X>>>0;if(ad){aB=X;aC=as}else{am=as-X|0;c[at>>2]=am;aB=ah-X|0;aC=am}c[ab>>2]=aB;L772:do{if(aB>>>0<8388609){am=ae+40|0;X=ae+24|0;as=ae|0;ao=c[ae+4>>2]|0;ar=ai;aq=aB;aj=c[am>>2]|0;ak=c[X>>2]|0;U=aC;while(1){al=ar+8|0;c[_>>2]=al;Z=aq<<8;c[ab>>2]=Z;if(ak>>>0<ao>>>0){V=ak+1|0;c[X>>2]=V;aD=d[(c[as>>2]|0)+ak|0]|0;aE=V}else{aD=0;aE=ak}c[am>>2]=aD;V=((aD|aj<<8)>>>1&255|U<<8&2147483392)^255;c[at>>2]=V;if(Z>>>0<8388609){ar=al;aq=Z;aj=aD;ak=aE;U=V}else{aF=al;aG=Z;break L772}}}else{aF=ai;aG=aB}}while(0);if(ad){Q=a2(ae,6)|0;U=16<<Q;ak=Q+4|0;Q=ae+12|0;aj=c[Q>>2]|0;aq=ae+16|0;ar=c[aq>>2]|0;if(ar>>>0<ak>>>0){am=ae+8|0;as=ae|0;X=ar+8|0;ao=((X|0)>25?ar+7|0:24)-ar|0;Z=c[ae+4>>2]|0;al=aj;V=ar;aa=c[am>>2]|0;while(1){if(aa>>>0<Z>>>0){R=aa+1|0;c[am>>2]=R;aH=d[(c[as>>2]|0)+(Z-R|0)|0]|0;aI=R}else{aH=0;aI=aa}aJ=aH<<V|al;R=V+8|0;if((R|0)<25){al=aJ;V=R;aa=aI}else{break}}aK=aJ;aL=X+(ao&-8)|0}else{aK=aj;aL=ar}aa=aK>>>(ak>>>0);V=aL-ak|0;c[Q>>2]=aa;c[aq>>2]=V;al=(c[_>>2]|0)+ak|0;c[_>>2]=al;Z=(U-1|0)+(aK&(1<<ak)-1)|0;if(V>>>0<3){as=ae+8|0;am=ae|0;ad=V+8|0;R=((ad|0)>25?V+7|0:24)-V|0;Y=c[ae+4>>2]|0;W=aa;T=V;ac=c[as>>2]|0;while(1){if(ac>>>0<Y>>>0){f=ac+1|0;c[as>>2]=f;aM=d[(c[am>>2]|0)+(Y-f|0)|0]|0;aN=f}else{aM=0;aN=ac}aR=aM<<T|W;f=T+8|0;if((f|0)<25){W=aR;T=f;ac=aN}else{break}}aS=aR;aT=ad+(R&-8)|0}else{aS=aa;aT=V}ac=aS&7;c[Q>>2]=aS>>>3;c[aq>>2]=aT-3|0;T=al+3|0;c[_>>2]=T;W=c[ab>>2]|0;L800:do{if(((al+5|0)+(b2(W|0)|-32)|0)>(m|0)){aU=0;aV=T;aW=W}else{Y=c[at>>2]|0;am=W>>>2;as=-1;ak=W;while(1){aY=as+1|0;a$=$(d[aY+296|0]|0,am);if(Y>>>0<a$>>>0){as=aY;ak=a$}else{break}}as=Y-a$|0;c[at>>2]=as;am=ak-a$|0;c[ab>>2]=am;if(am>>>0>=8388609){aU=aY;aV=T;aW=am;break}U=ae+40|0;ar=ae+24|0;aj=ae|0;ao=c[ae+4>>2]|0;X=T;f=am;am=c[U>>2]|0;ap=c[ar>>2]|0;a0=as;while(1){as=X+8|0;c[_>>2]=as;a1=f<<8;c[ab>>2]=a1;if(ap>>>0<ao>>>0){a3=ap+1|0;c[ar>>2]=a3;a4=d[(c[aj>>2]|0)+ap|0]|0;a5=a3}else{a4=0;a5=ap}c[U>>2]=a4;a3=((a4|am<<8)>>>1&255|a0<<8&2147483392)^255;c[at>>2]=a3;if(a1>>>0<8388609){X=as;f=a1;am=a4;ap=a5;a0=a3}else{aU=aY;aV=as;aW=a1;break L800}}}}while(0);a6=Z;a7=aU;a8=(ac*3072&-1)+3072&65535;ba=aV;bb=aW}else{a6=0;a7=0;a8=0;ba=aF;bb=aG}au=a6;aw=a7;ax=(b2(bb|0)|-32)+ba|0;ay=a8;az=bb;aA=ba}else{au=0;aw=0;ax=af;ay=0;az=ah;aA=ai}}while(0);ai=(L|0)>0;do{if(ai){if((ax+3|0)>(m|0)){bc=0;bd=ax;be=az;bf=aA;break}ah=ae+32|0;af=c[ah>>2]|0;ba=az>>>3;bb=af>>>0<ba>>>0;a8=bb&1;if(bb){bg=ba;bh=af}else{bb=af-ba|0;c[ah>>2]=bb;bg=az-ba|0;bh=bb}c[ab>>2]=bg;L820:do{if(bg>>>0<8388609){bb=ae+40|0;ba=ae+24|0;af=ae|0;a7=c[ae+4>>2]|0;a6=aA;aG=bg;aF=c[bb>>2]|0;aW=c[ba>>2]|0;aV=bh;while(1){aU=a6+8|0;c[_>>2]=aU;aY=aG<<8;c[ab>>2]=aY;if(aW>>>0<a7>>>0){a5=aW+1|0;c[ba>>2]=a5;bi=d[(c[af>>2]|0)+aW|0]|0;bo=a5}else{bi=0;bo=aW}c[bb>>2]=bi;a5=((bi|aF<<8)>>>1&255|aV<<8&2147483392)^255;c[ah>>2]=a5;if(aY>>>0<8388609){a6=aU;aG=aY;aF=bi;aW=bo;aV=a5}else{bp=aU;bq=aY;break L820}}}else{bp=aA;bq=bg}}while(0);bc=a8;bd=(b2(bq|0)|-32)+bp|0;be=bq;bf=bp}else{bc=0;bd=ax;be=az;bf=aA}}while(0);aA=(bc|0)!=0;az=aA?K:0;L829:do{if((bd+3|0)>(m|0)){br=0}else{ax=ae+32|0;bp=c[ax>>2]|0;bq=be>>>3;bg=bp>>>0<bq>>>0;bo=bg&1;if(bg){bs=bq;bt=bp}else{bg=bp-bq|0;c[ax>>2]=bg;bs=be-bq|0;bt=bg}c[ab>>2]=bs;if(bs>>>0>=8388609){br=bo;break}bg=ae+40|0;bq=ae+24|0;bp=ae|0;bi=c[ae+4>>2]|0;bh=bf;ah=bs;ac=c[bg>>2]|0;Z=c[bq>>2]|0;aV=bt;while(1){aW=bh+8|0;c[_>>2]=aW;aF=ah<<8;c[ab>>2]=aF;if(Z>>>0<bi>>>0){aG=Z+1|0;c[bq>>2]=aG;bu=d[(c[bp>>2]|0)+Z|0]|0;bv=aG}else{bu=0;bv=Z}c[bg>>2]=bu;aG=((bu|ac<<8)>>>1&255|aV<<8&2147483392)^255;c[ax>>2]=aG;if(aF>>>0<8388609){bh=aW;ah=aF;ac=bu;Z=bv;aV=aG}else{br=bo;break L829}}}}while(0);bm(v,c[N>>2]|0,c[P>>2]|0,D,br,ae,u,L);br=av()|0;bv=i;i=i+(x*4&-1)|0;i=i+7>>3<<3;bu=c[N>>2]|0;bt=c[P>>2]|0;bs=ae+4|0;bf=c[bs>>2]|0;be=bf<<3;bd=c[_>>2]|0;bo=c[ab>>2]|0;aV=(b2(bo|0)|-32)+bd|0;Z=aA?2:4;if(ai){bw=(aV+(Z|1)|0)>>>0<=be>>>0}else{bw=0}ai=be-(bw&1)|0;be=(bu|0)<(bt|0);L844:do{if(be){ac=aA?4:5;ah=ae+32|0;bh=ae+40|0;ax=ae+24|0;bg=ae|0;bp=0;bq=bu;bi=0;a8=Z;aG=aV;aF=bo;aW=bd;while(1){if((a8+aG|0)>>>0>ai>>>0){bx=aG;by=bi;bz=bp;bA=aF;bB=aW}else{a6=c[ah>>2]|0;bb=aF>>>(a8>>>0);af=a6>>>0<bb>>>0;ba=af&1;if(af){bC=bb;bD=a6}else{af=a6-bb|0;c[ah>>2]=af;bC=aF-bb|0;bD=af}c[ab>>2]=bC;L853:do{if(bC>>>0<8388609){af=aW;bb=bC;a6=c[bh>>2]|0;a7=c[ax>>2]|0;aY=bD;while(1){aU=af+8|0;c[_>>2]=aU;a5=bb<<8;c[ab>>2]=a5;if(a7>>>0<bf>>>0){a4=a7+1|0;c[ax>>2]=a4;bE=d[(c[bg>>2]|0)+a7|0]|0;bF=a4}else{bE=0;bF=a7}c[bh>>2]=bE;a4=((bE|a6<<8)>>>1&255|aY<<8&2147483392)^255;c[ah>>2]=a4;if(a5>>>0<8388609){af=aU;bb=a5;a6=bE;a7=bF;aY=a4}else{bG=a5;bH=aU;break L853}}}else{bG=bC;bH=aW}}while(0);aY=ba^bp;bx=(b2(bG|0)|-32)+bH|0;by=aY|bi;bz=aY;bA=bG;bB=bH}c[bv+(bq<<2)>>2]=bz;aY=bq+1|0;if((aY|0)<(bt|0)){bp=bz;bq=aY;bi=by;a8=ac;aG=bx;aF=bA;aW=bB}else{bI=by;bJ=bA;bK=bB;break L844}}}else{bI=0;bJ=bo;bK=bd}}while(0);do{if(bw){bd=bc<<2;if((a[(bI+bd|0)+(264+(L<<3))|0]|0)==(a[(bI+(bd|2)|0)+(264+(L<<3))|0]|0)){bL=0;bM=bK;bN=bJ;break}bd=ae+32|0;bo=c[bd>>2]|0;bB=bJ>>>1;bA=bo>>>0<bB>>>0;by=bA&1;if(bA){bO=bB;bP=bo}else{bA=bo-bB|0;c[bd>>2]=bA;bO=bJ-bB|0;bP=bA}c[ab>>2]=bO;L869:do{if(bO>>>0<8388609){bA=ae+40|0;bB=ae+24|0;bo=ae|0;bx=bK;bz=bO;bH=c[bA>>2]|0;bG=c[bB>>2]|0;bC=bP;while(1){bF=bx+8|0;c[_>>2]=bF;bE=bz<<8;c[ab>>2]=bE;if(bG>>>0<bf>>>0){bD=bG+1|0;c[bB>>2]=bD;bQ=d[(c[bo>>2]|0)+bG|0]|0;bR=bD}else{bQ=0;bR=bG}c[bA>>2]=bQ;bD=((bQ|bH<<8)>>>1&255|bC<<8&2147483392)^255;c[bd>>2]=bD;if(bE>>>0<8388609){bx=bF;bz=bE;bH=bQ;bG=bR;bC=bD}else{bS=bF;bT=bE;break L869}}}else{bS=bK;bT=bO}}while(0);bL=by<<1;bM=bS;bN=bT}else{bL=0;bM=bK;bN=bJ}}while(0);L878:do{if(be){bJ=bL+(bc<<2)|0;bK=bu;while(1){bT=bv+(bK<<2)|0;c[bT>>2]=a[(bJ+(c[bT>>2]|0)|0)+(264+(L<<3))|0]|0;bT=bK+1|0;if((bT|0)<(bt|0)){bK=bT}else{break L878}}}}while(0);L883:do{if(((bM+4|0)+(b2(bN|0)|-32)|0)>(m|0)){bU=2;bV=bM;bW=bN}else{bt=ae+32|0;bu=c[bt>>2]|0;bc=bN>>>5;bL=-1;be=bN;while(1){bX=bL+1|0;bY=$(d[bX+304|0]|0,bc);if(bu>>>0<bY>>>0){bL=bX;be=bY}else{break}}bL=bu-bY|0;c[bt>>2]=bL;bc=be-bY|0;c[ab>>2]=bc;if(bc>>>0>=8388609){bU=bX;bV=bM;bW=bc;break}bK=ae+40|0;bJ=ae+24|0;by=ae|0;bT=bM;bS=bc;bc=c[bK>>2]|0;bO=c[bJ>>2]|0;bR=bL;while(1){bL=bT+8|0;c[_>>2]=bL;bQ=bS<<8;c[ab>>2]=bQ;if(bO>>>0<bf>>>0){bP=bO+1|0;c[bJ>>2]=bP;bZ=d[(c[by>>2]|0)+bO|0]|0;b_=bP}else{bZ=0;b_=bO}c[bK>>2]=bZ;bP=((bZ|bc<<8)>>>1&255|bR<<8&2147483392)^255;c[bt>>2]=bP;if(bQ>>>0<8388609){bT=bL;bS=bQ;bc=bZ;bO=b_;bR=bP}else{bU=bX;bV=bL;bW=bQ;break L883}}}}while(0);bX=i;i=i+(x*4&-1)|0;i=i+7>>3<<3;b_=c[w>>2]|0;L895:do{if((b_|0)>0){w=(u-1|0)+(L<<1)|0;bZ=c[A>>2]|0;bM=c[v+96>>2]|0;bY=0;bN=b[bZ>>1]|0;while(1){bR=bY+1|0;bO=b[bZ+(bR<<1)>>1]|0;bc=(d[bM+($(b_,w)+bY|0)|0]|0)+64|0;c[bX+(bY<<2)>>2]=$($((bO<<16>>16)-(bN<<16>>16)<<L,u),bc)>>2;if((bR|0)<(b_|0)){bY=bR;bN=bO}else{break L895}}}}while(0);b_=i;i=i+(x*4&-1)|0;i=i+7>>3<<3;A=g<<6;g=32-(b2(bW|0)|0)|0;bN=bW>>>((g-16|0)>>>0);bY=$(bN,bN);bN=bY>>>31;w=bY>>>15>>>(bN>>>0);bY=$(w,w);w=bY>>>31;bM=bY>>>15>>>(w>>>0);bY=(bV<<3)-($(bM,bM)>>>31|(w|(bN|g<<1)<<1)<<1)|0;g=ae+32|0;bN=ae+40|0;w=ae+24|0;bM=ae|0;bZ=c[N>>2]|0;bO=6;bR=bY;bY=A;bc=bW;bW=bV;L900:while(1){bV=bO<<3;bS=bZ;b$=bR;b0=bY;b3=bc;b5=bW;while(1){if((bS|0)>=(c[P>>2]|0)){break L900}b6=bS+1|0;bT=$((b[B+(b6<<1)>>1]|0)-(b[B+(bS<<1)>>1]|0)|0,u)<<L;bt=bT<<3;bK=(bT|0)<48?48:bT;bT=(bt|0)<(bK|0)?bt:bK;if((bV+b$|0)>=(b0|0)){c[b_+(bS<<2)>>2]=0;bS=b6;b$=b$;b0=b0;b3=b3;b5=b5;continue}bK=c[bX+(bS<<2)>>2]|0;bt=b0;by=b$;bJ=bO;be=0;bu=b3;bQ=b5;while(1){if((be|0)>=(bK|0)){b7=by;b8=bt;b9=be;ca=bu;cb=bQ;break}bL=c[g>>2]|0;bP=bu>>>(bJ>>>0);bI=bL>>>0<bP>>>0;if(bI){cc=bP;cd=bL}else{bw=bL-bP|0;c[g>>2]=bw;cc=bu-bP|0;cd=bw}c[ab>>2]=cc;L914:do{if(cc>>>0<8388609){bw=bQ;bP=cc;bL=c[bN>>2]|0;bd=c[w>>2]|0;bC=cd;while(1){bG=bw+8|0;c[_>>2]=bG;bH=bP<<8;c[ab>>2]=bH;if(bd>>>0<bf>>>0){bz=bd+1|0;c[w>>2]=bz;ce=d[(c[bM>>2]|0)+bd|0]|0;cf=bz}else{ce=0;cf=bd}c[bN>>2]=ce;bz=((ce|bL<<8)>>>1&255|bC<<8&2147483392)^255;c[g>>2]=bz;if(bH>>>0<8388609){bw=bG;bP=bH;bL=ce;bd=cf;bC=bz}else{cg=bG;ch=bH;break L914}}}else{cg=bQ;ch=cc}}while(0);bC=32-(b2(ch|0)|0)|0;bd=ch>>>((bC-16|0)>>>0);bL=$(bd,bd);bd=bL>>>31;bP=bL>>>15>>>(bd>>>0);bL=$(bP,bP);bP=bL>>>31;bw=bL>>>15>>>(bP>>>0);bL=(cg<<3)-($(bw,bw)>>>31|(bP|(bd|bC<<1)<<1)<<1)|0;if(!bI){b7=bL;b8=bt;b9=be;ca=ch;cb=cg;break}bC=be+bT|0;bd=bt-bT|0;if((bL+8|0)<(bd|0)){bt=bd;by=bL;bJ=1;be=bC;bu=ch;bQ=cg}else{b7=bL;b8=bd;b9=bC;ca=ch;cb=cg;break}}c[b_+(bS<<2)>>2]=b9;if((b9|0)>0){break}else{bS=b6;b$=b7;b0=b8;b3=ca;b5=cb}}bS=bO-1|0;bZ=b6;bO=(bS|0)<2?2:bS;bR=b7;bY=b8;bc=ca;bW=cb}cb=i;i=i+(x*4&-1)|0;i=i+7>>3<<3;L926:do{if((b$+48|0)>(b0|0)){ci=5;cj=b5;ck=b3}else{bW=c[g>>2]|0;ca=b3>>>7;bc=-1;b8=b3;while(1){cl=bc+1|0;cm=$(d[cl+248|0]|0,ca);if(bW>>>0<cm>>>0){bc=cl;b8=cm}else{break}}bc=bW-cm|0;c[g>>2]=bc;ca=b8-cm|0;c[ab>>2]=ca;if(ca>>>0>=8388609){ci=cl;cj=b5;ck=ca;break}bY=b5;b7=ca;ca=c[bN>>2]|0;bR=c[w>>2]|0;bO=bc;while(1){bc=bY+8|0;c[_>>2]=bc;b6=b7<<8;c[ab>>2]=b6;if(bR>>>0<bf>>>0){bZ=bR+1|0;c[w>>2]=bZ;cn=d[(c[bM>>2]|0)+bR|0]|0;co=bZ}else{cn=0;co=bR}c[bN>>2]=cn;bZ=((cn|ca<<8)>>>1&255|bO<<8&2147483392)^255;c[g>>2]=bZ;if(b6>>>0<8388609){bY=bc;b7=b6;ca=cn;bR=co;bO=bZ}else{ci=cl;cj=bc;ck=b6;break L926}}}}while(0);cl=32-(b2(ck|0)|0)|0;co=ck>>>((cl-16|0)>>>0);ck=$(co,co);co=ck>>>31;cn=ck>>>15>>>(co>>>0);ck=$(cn,cn);cn=ck>>>31;g=ck>>>15>>>(cn>>>0);ck=((A-1|0)-(cj<<3)|0)+($(g,g)>>>31|(cn|(co|cl<<1)<<1)<<1)|0;if(aA&(L|0)>1){cp=(ck|0)>=((L<<3)+16|0)}else{cp=0}cl=cp?8:0;co=i;i=i+(x*4&-1)|0;i=i+7>>3<<3;cn=i;i=i+(x*4&-1)|0;i=i+7>>3<<3;g=bn(v,c[N>>2]|0,c[P>>2]|0,b_,bX,ci,q,r,ck-cl|0,s,co,cb,cn,u,L,ae,0,0,0)|0;bj(v,c[N>>2]|0,c[P>>2]|0,D,cb,ae,u);ck=$(x,u);ci=i;i=i+ck|0;i=i+7>>3<<3;bX=$(O,u);b_=i;i=i+(bX*2&-1)|0;i=i+7>>3<<3;bX=(u|0)==2;if(bX){cq=b_+(O<<1)|0}else{cq=0}cj=e+32|0;aQ(0,v,c[N>>2]|0,c[P>>2]|0,b_,cq,ci,0,co,az,bU,c[r>>2]|0,c[q>>2]|0,bv,A-cl|0,c[s>>2]|0,ae,L,g,cj);do{if(cp){g=ae+12|0;s=c[g>>2]|0;cl=ae+16|0;A=c[cl>>2]|0;if((A|0)==0){bv=ae+8|0;q=c[bv>>2]|0;r=c[bs>>2]|0;if(q>>>0<r>>>0){bU=q+1|0;c[bv>>2]=bU;cr=d[(c[bM>>2]|0)+(r-bU|0)|0]|0;cs=bU}else{cr=0;cs=q}if(cs>>>0<r>>>0){q=cs+1|0;c[bv>>2]=q;ct=(d[(c[bM>>2]|0)+(r-q|0)|0]|0)<<8;cu=q}else{ct=0;cu=cs}if(cu>>>0<r>>>0){q=cu+1|0;c[bv>>2]=q;cv=(d[(c[bM>>2]|0)+(r-q|0)|0]|0)<<16;cw=q}else{cv=0;cw=cu}if(cw>>>0<r>>>0){q=cw+1|0;c[bv>>2]=q;cx=(d[(c[bM>>2]|0)+(r-q|0)|0]|0)<<24}else{cx=0}cy=cx|(cv|(ct|(cr|s)));cz=32}else{cy=s;cz=A}c[g>>2]=cy>>>1;c[cl>>2]=cz-1|0;cl=c[_>>2]|0;c[_>>2]=cl+1|0;g=c[N>>2]|0;A=c[P>>2]|0;bk(v,g,A,D,cb,cn,(m+(cl^-1)|0)-(b2(c[ab>>2]|0)|-32)|0,ae,u);if((cy&1|0)==0){break}aP(v,b_,ci,L,u,O,c[N>>2]|0,c[P>>2]|0,D,j,G,co,c[cj>>2]|0)}else{cl=c[N>>2]|0;A=c[P>>2]|0;g=c[_>>2]|0;bk(v,cl,A,D,cb,cn,(m-g|0)-(b2(c[ab>>2]|0)|-32)|0,ae,u)}}while(0);cn=i;i=i+(ck*4&-1)|0;i=i+7>>3<<3;bl(v,c[N>>2]|0,c[P>>2]|0,cn,D,u);L964:do{if(ag&(ck|0)>0){b1(cn|0,0,ck<<2|0);cb=0;while(1){b[D+(cb<<1)>>1]=-28672;co=cb+1|0;if((co|0)<(ck|0)){cb=co}else{break L964}}}}while(0);ck=$(O,(t|0)>(u|0)?t:u);ag=i;i=i+(ck*4&-1)|0;i=i+7>>3<<3;aO(v,b_,ag,cn,c[N>>2]|0,S,u,K);cn=(2048-O|0)+((z|0)/2&-1)<<2;b_=0;while(1){ck=c[o+(b_<<2)>>2]|0;b4(ck|0,ck+(O<<2)|0,cn|0);ck=b_+1|0;if((ck|0)<(t|0)){b_=ck}else{break}}b_=(b[B+(S<<1)>>1]|0)<<L;S=c[C>>2]|0;B=(S|0)==1;cn=0;while(1){o=$(O,cn);if(B){cA=b_}else{ck=(O|0)/(S|0)&-1;cA=(b_|0)<(ck|0)?b_:ck}if((cA|0)<(O|0)){b1(ag+(cA+o<<2)|0,0,O-cA<<2|0)}o=cn+1|0;if((o|0)<(u|0)){cn=o}else{break}}cn=1024-O|0;u=0;while(1){c[p+(u<<2)>>2]=(c[n+(u<<2)>>2]|0)+(cn<<2)|0;cA=u+1|0;if((cA|0)<(t|0)){u=cA}else{break}}L984:do{if(k&(t|0)==2&(O|0)>0){u=0;while(1){c[ag+(u+O<<2)>>2]=c[ag+(u<<2)>>2]|0;cn=u+1|0;if((cn|0)<(O|0)){u=cn}else{break L984}}}}while(0);L988:do{if(bX&(t|0)==1&(O|0)>0){u=0;while(1){cn=ag+(u<<2)|0;c[cn>>2]=(c[ag+(u+O<<2)>>2]|0)+(c[cn>>2]|0)>>1;cn=u+1|0;if((cn|0)<(O|0)){u=cn}else{break L988}}}}while(0);bX=p|0;u=c[y>>2]|0;y=c[H>>2]|0;if((az|0)==0){cB=(c[J>>2]|0)-L|0;cC=y<<L;cD=1}else{cB=c[J>>2]|0;cC=y;cD=az}az=(cD|0)>0;y=v+56|0;J=$(cC,cD);cn=v+52|0;n=0;while(1){L998:do{if(az){cA=$(J,n);b_=c[p+(n<<2)>>2]|0;S=0;while(1){B=b_+($(S,cC)<<2)|0;a9(y,ag+(S+cA<<2)|0,B,c[cn>>2]|0,u,cB,cD);B=S+1|0;if((B|0)<(cD|0)){S=B}else{break L998}}}}while(0);S=n+1|0;if((S|0)<(t|0)){n=S}else{break}}n=e+48|0;cD=e+52|0;cB=e+58|0;u=e+56|0;y=e+64|0;cC=e+60|0;J=(L|0)!=0;L=0;while(1){az=c[n>>2]|0;S=(az|0)>15?az:15;c[n>>2]=S;az=c[cD>>2]|0;cA=(az|0)>15?az:15;c[cD>>2]=cA;az=c[p+(L<<2)>>2]|0;aX(az,az,cA,S,c[H>>2]|0,b[cB>>1]|0,b[u>>1]|0,c[y>>2]|0,c[cC>>2]|0,c[cn>>2]|0,z);if(J){S=c[H>>2]|0;cA=az+(S<<2)|0;aX(cA,cA,c[n>>2]|0,au,O-S|0,b[u>>1]|0,ay,c[cC>>2]|0,aw,c[cn>>2]|0,z)}S=L+1|0;if((S|0)<(t|0)){L=S}else{break}}c[cD>>2]=c[n>>2]|0;b[cB>>1]=b[u>>1]|0;c[y>>2]=c[cC>>2]|0;c[n>>2]=au;b[u>>1]=ay;c[cC>>2]=aw;if(J){c[cD>>2]=au;b[cB>>1]=ay;c[y>>2]=aw}L1013:do{if(k&(x|0)>0){aw=0;while(1){b[D+(aw+x<<1)>>1]=b[D+(aw<<1)>>1]|0;y=aw+1|0;if((y|0)<(x|0)){aw=y}else{break L1013}}}}while(0);k=(E|0)>0;L1017:do{if(aA){if(k){cE=0}else{break}while(1){aw=j+(cE<<1)|0;y=b[aw>>1]|0;ay=b[D+(cE<<1)>>1]|0;b[aw>>1]=y<<16>>16<ay<<16>>16?y:ay;ay=cE+1|0;if((ay|0)<(E|0)){cE=ay}else{break L1017}}}else{if(k){cF=0}else{break}while(1){b[G+(cF<<1)>>1]=b[j+(cF<<1)>>1]|0;ay=cF+1|0;if((ay|0)<(E|0)){cF=ay}else{break}}if(k){cG=0}else{break}while(1){b[j+(cG<<1)>>1]=b[D+(cG<<1)>>1]|0;ay=cG+1|0;if((ay|0)<(E|0)){cG=ay}else{break}}if(k){cH=0}else{break}while(1){ay=I+(cH<<1)|0;y=(b[ay>>1]|0)+K|0;aw=b[D+(cH<<1)>>1]|0;b[ay>>1]=(y|0)<(aw<<16>>16|0)?y&65535:aw;aw=cH+1|0;if((aw|0)<(E|0)){cH=aw}else{break L1017}}}}while(0);cH=c[N>>2]|0;L1031:do{if((cH|0)>0){E=0;while(1){b[D+(E<<1)>>1]=0;b[G+(E<<1)>>1]=-28672;b[j+(E<<1)>>1]=-28672;K=E+1|0;I=c[N>>2]|0;if((K|0)<(I|0)){E=K}else{cI=I;break L1031}}}else{cI=cH}}while(0);cH=c[P>>2]|0;if((cH|0)<(x|0)){E=cH;while(1){b[D+(E<<1)>>1]=0;b[G+(E<<1)>>1]=-28672;b[j+(E<<1)>>1]=-28672;cH=E+1|0;if((cH|0)<(x|0)){E=cH}else{break}}cJ=c[N>>2]|0}else{cJ=cI}L1040:do{if((cJ|0)>0){cI=0;while(1){E=cI+x|0;b[D+(E<<1)>>1]=0;b[G+(E<<1)>>1]=-28672;b[j+(E<<1)>>1]=-28672;E=cI+1|0;if((E|0)<(c[N>>2]|0)){cI=E}else{break L1040}}}}while(0);N=c[P>>2]|0;L1044:do{if((N|0)<(x|0)){P=N;while(1){cJ=P+x|0;b[D+(cJ<<1)>>1]=0;b[G+(cJ<<1)>>1]=-28672;b[j+(cJ<<1)>>1]=-28672;cJ=P+1|0;if((cJ|0)<(x|0)){P=cJ}else{break L1044}}}}while(0);c[cj>>2]=c[ab>>2]|0;a_(bX,h,O,t,c[C>>2]|0,b[v+16>>1]|0,e+68|0,ag);c[e+44>>2]=0;ag=c[_>>2]|0;if(((b2(c[ab>>2]|0)|-32)+ag|0)>(m|0)){cK=-3}else{if((c[ae+44>>2]|0)!=0){c[e+36>>2]=1}cK=(F|0)/(c[C>>2]|0)&-1}an(br|0);M=cK;i=l;return M|0}function aZ(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aP=0,aQ=0;g=i;i=i+4320|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+2072|0;n=g+4120|0;o=g+4224|0;p=g+4272|0;q=c[a+8>>2]|0;r=c[a>>2]|0;s=c[r+8>>2]|0;t=r+4|0;u=c[t>>2]|0;v=c[r+24>>2]|0;w=u+2048|0;x=2048-e|0;y=0;while(1){z=$(y,w);c[h+(y<<2)>>2]=a+76+(z<<2)|0;c[j+(y<<2)>>2]=a+76+(x+z<<2)|0;z=y+1|0;if((z|0)<(q|0)){y=z}else{break}}y=$(w,q);w=$(u+2060|0,q);z=a+76+(w<<2)|0;A=a+76+((s*3&-1)+w<<2)|0;w=a+44|0;B=c[w>>2]|0;C=c[a+20>>2]|0;D=c[a+16>>2]|0;E=(B|0)>4;if(E|(C|0)!=0){F=$(q,e);G=i;i=i+(F*4&-1)|0;i=i+7>>3<<3;H=c[a+24>>2]|0;I=c[r+12>>2]|0;J=(H|0)<(I|0)?H:I;I=(C|0)>(J|0)?C:J;J=av()|0;K=i;i=i+(F*2&-1)|0;i=i+7>>3<<3;F=$(s,q);L=i;i=i+(F*4&-1)|0;i=i+7>>3<<3;if(E){bl(r,C,H,L,A,q)}else{A=(C|0)<(H|0);E=(B|0)==0?1536:512;F=0;while(1){L1065:do{if(A){M=$(F,s);N=C;while(1){O=z+(N+M<<1)|0;b[O>>1]=(b[O>>1]|0)-E&65535;O=N+1|0;if((O|0)<(H|0)){N=O}else{break L1065}}}}while(0);N=F+1|0;if((N|0)<(q|0)){F=N}else{break}}bl(r,C,H,L,z,q)}z=a+32|0;H=c[z>>2]|0;L1073:do{if((q|0)>0){F=(C|0)<(I|0);E=H;s=0;while(1){L1077:do{if(F){A=$(s,e);N=E;M=C;while(1){O=b[v+(M<<1)>>1]|0;P=(O<<f)+A|0;Q=M+1|0;R=(b[v+(Q<<1)>>1]|0)-O<<f;L1081:do{if((R|0)>0){O=0;S=N;while(1){T=$(S,1664525)+1013904223|0;b[K+(O+P<<1)>>1]=T>>20&65535;U=O+1|0;if((U|0)<(R|0)){O=U;S=T}else{V=T;break L1081}}}else{V=N}}while(0);br(K+(P<<1)|0,R,32767);if((Q|0)<(I|0)){N=V;M=Q}else{W=V;break L1077}}}else{W=E}}while(0);M=s+1|0;if((M|0)<(q|0)){E=W;s=M}else{X=W;break L1073}}}else{X=H}}while(0);c[z>>2]=X;aO(r,K,G,L,C,I,q,1<<f);C=(b[v+(I<<1)>>1]|0)<<f;I=(D|0)==1;v=0;while(1){L=$(v,e);if(I){Y=C}else{K=(e|0)/(D|0)&-1;Y=(C|0)<(K|0)?C:K}if((Y|0)<(e|0)){b1(G+(Y+L<<2)|0,0,e-Y<<2|0)}L=v+1|0;if((L|0)<(q|0)){v=L}else{break}}v=x+(u>>>1)<<2;Y=0;while(1){C=c[h+(Y<<2)>>2]|0;b4(C|0,C+(e<<2)|0,v|0);C=Y+1|0;if((C|0)<(q|0)){Y=C}else{break}}Y=c[t>>2]|0;t=c[r+36>>2]<<f;v=(c[r+28>>2]|0)-f|0;f=r+56|0;C=r+52|0;I=0;while(1){L=$(I,t);a9(f,G+(L<<2)|0,c[j+(I<<2)>>2]|0,c[C>>2]|0,Y,v,1);L=I+1|0;if((L|0)<(q|0)){I=L}else{break}}an(J|0);Z=G;_=j|0;aa=r+16|0;ab=a+68|0;ac=b[aa>>1]|0;a_(_,d,e,q,D,ac,ab,Z);ad=B+1|0;c[w>>2]=ad;i=g;return}G=i;i=i+(e*4&-1)|0;i=i+7>>3<<3;J=(B|0)==0;if(J){I=l|0;ba(h|0,I,2048,q);bc(l+720|0,I,1328,620,k);I=720-(c[k>>2]|0)|0;c[k>>2]=I;c[a+40>>2]=I;ae=32767;af=I}else{I=c[a+40>>2]|0;c[k>>2]=I;ae=26214;af=I}I=av()|0;k=i;i=i+(u*4&-1)|0;i=i+7>>3<<3;l=c[r+52>>2]|0;v=m|0;Y=n|0;C=af<<1;f=(C|0)<1024?C:1024;C=2047-f|0;t=1024-f|0;L=m+(t<<1)|0;K=o|0;X=(f|0)>0;z=f>>1;H=x<<2;W=1024-af|0;V=u+e|0;s=(V|0)>0;E=x-1|0;F=p|0;M=(u|0)>0;N=(e|0)>0;A=a+48|0;S=a+56|0;O=a+60|0;T=(u|0)/2&-1;U=(u|0)>1;ag=u-1|0;ah=(1024-e|0)+W|0;ai=1024-z|0;aj=V<<2;ak=0;while(1){al=c[h+(ak<<2)>>2]|0;am=0;while(1){b[m+(am<<1)>>1]=((c[al+(am+1024<<2)>>2]|0)+2048|0)>>>12&65535;ao=am+1|0;if((ao|0)<1024){am=ao}else{break}}do{if(J){bi(v,Y,l,u,24,1024);am=c[Y>>2]|0;c[Y>>2]=(am>>13)+am|0;am=1;while(1){ao=$(am<<17,am);ap=n+(am<<2)|0;aq=c[ap>>2]|0;ar=$(ao>>15,aq>>16);c[ap>>2]=(aq-ar|0)-($(aq&65535,ao>>16)>>15)|0;ao=am+1|0;if((ao|0)<25){am=ao}else{break}}be(a+76+((ak*12&-1)+y<<2)|0,Y,24);as=0;break}else{as=0}}while(0);while(1){b[o+(as<<1)>>1]=((c[al+(C-as<<2)>>2]|0)+2048|0)>>>12&65535;am=as+1|0;if((am|0)<24){as=am}else{break}}am=a+76+((ak*12&-1)+y<<2)|0;bg(L,am,L,f,24,K);if(X){ao=0;aq=0;ar=0;while(1){ap=b[m+(ao+t<<1)>>1]|0;at=aq<<16>>16>ap<<16>>16?aq:ap;au=ar<<16>>16<ap<<16>>16?ar:ap;ap=ao+1|0;if((ap|0)<(f|0)){ao=ap;aq=at;ar=au}else{break}}aw=au<<16>>16;ax=at<<16>>16}else{aw=0;ax=0}ar=-aw|0;aq=(ax|0)>(ar|0)?ax:ar;do{if((aq|0)<1){ay=0}else{if(((65567-(b2(aq|0)|0)<<16>>15)-20|0)<0){ay=0;break}if(X){ar=0;ao=0;ap=0;while(1){az=b[m+(ar+t<<1)>>1]|0;aA=ao<<16>>16>az<<16>>16?ao:az;aB=ap<<16>>16<az<<16>>16?ap:az;az=ar+1|0;if((az|0)<(f|0)){ar=az;ao=aA;ap=aB}else{break}}aC=aB<<16>>16;aD=aA<<16>>16}else{aC=0;aD=0}ap=-aC|0;ao=(aD|0)>(ap|0)?aD:ap;if((ao|0)<1){ay=-20;break}ay=(65567-(b2(ao|0)|0)<<16>>15)-20|0}}while(0);L1136:do{if(X){aq=1;ao=1;ap=0;while(1){ar=b[m+(ai+ap<<1)>>1]|0;az=($(ar,ar)>>>(ay>>>0))+aq|0;ar=b[m+(ap+t<<1)>>1]|0;aE=($(ar,ar)>>>(ay>>>0))+ao|0;ar=ap+1|0;if((ar|0)<(z|0)){aq=az;ao=aE;ap=ar}else{aF=az;aG=aE;break L1136}}}else{aF=1;aG=1}}while(0);ap=a8(((aF|0)<(aG|0)?aF:aG)>>1,aG)|0;do{if((ap|0)==0){aH=0}else{if((ap|0)>1073741823){aH=32767;break}ao=65567-(b2(ap|0)|0)<<16>>17;aq=ao<<1;aE=aq-14|0;if((aE|0)>0){aI=ap>>aE}else{aI=ap<<14-aq}aq=(aI<<16^-2147483648)>>16;aE=($(($(($(((aq*-664&-1)>>>15<<16)+111345664>>16,aq)>>>15<<16)-197328896>>16,aq)>>>15<<16)+757661696>>16,aq)>>>15<<16)+1518796800>>16;aq=14-ao|0;if((aq|0)>0){aH=aE>>aq;break}else{aH=aE<<-aq;break}}}while(0);b4(al|0,al+(e<<2)|0,H|0);ap=aH<<16>>16;L1151:do{if(s){aq=0;aE=0;ao=$(ap,ae)>>>15&65535;az=0;while(1){if((aE|0)<(af|0)){aJ=ao;aK=aE}else{aJ=$(ao<<16>>16,ap)>>>15&65535;aK=aE-af|0}c[al+(az+x<<2)>>2]=$(b[m+(aK+W<<1)>>1]|0,aJ<<16>>16)>>15<<12;ar=((c[al+(ah+aK<<2)>>2]|0)+2048|0)>>>12<<16>>16;aL=($(ar,ar)>>>8)+aq|0;ar=az+1|0;if((ar|0)<(V|0)){aq=aL;aE=aK+1|0;ao=aJ;az=ar}else{aM=aL;break L1151}}}else{aM=0}}while(0);ap=0;while(1){b[p+(ap<<1)>>1]=((c[al+(E-ap<<2)>>2]|0)+2048|0)>>>12&65535;az=ap+1|0;if((az|0)<24){ap=az}else{break}}ap=al+8192|0;az=al+(x<<2)|0;bh(az,am,az,V,24,F);L1162:do{if(s){ao=0;aE=0;while(1){aq=((c[al+(aE+x<<2)>>2]|0)+2048|0)>>>12<<16>>16;aL=($(aq,aq)>>>8)+ao|0;aq=aE+1|0;if((aq|0)<(V|0)){ao=aL;aE=aq}else{aN=aL;break L1162}}}else{aN=0}}while(0);L1166:do{if((aM|0)>(aN>>2|0)){if((aM|0)>=(aN|0)){break}am=a8((aM>>1)+1|0,aN+1|0)|0;do{if((am|0)==0){aP=0}else{if((am|0)>1073741823){aP=32767;break}aE=65567-(b2(am|0)|0)<<16>>17;ao=aE<<1;aL=ao-14|0;if((aL|0)>0){aQ=am>>aL}else{aQ=am<<14-ao}ao=(aQ<<16^-2147483648)>>16;aL=($(($(($(((ao*-664&-1)>>>15<<16)+111345664>>16,ao)>>>15<<16)-197328896>>16,ao)>>>15<<16)+757661696>>16,ao)>>>15<<16)+1518796800>>16;ao=14-aE|0;if((ao|0)>0){aP=aL>>ao&65535;break}else{aP=aL<<-ao&65535;break}}}while(0);L1182:do{if(M){am=(32767-aP&65535)<<16>>16;ao=0;while(1){aL=32767-($(b[l+(ao<<1)>>1]|0,am)>>>15)<<16>>16;aE=al+(ao+x<<2)|0;aq=c[aE>>2]|0;ar=$(aq>>16<<1,aL);c[aE>>2]=($(aL,aq&65535)>>15)+ar|0;ar=ao+1|0;if((ar|0)<(u|0)){ao=ar}else{break L1182}}}}while(0);if(!N){break}ao=aP<<16>>16;am=ao<<1;ar=u;while(1){aq=al+(ar+x<<2)|0;aL=c[aq>>2]|0;aE=$(am,aL>>16);c[aq>>2]=($(aL&65535,ao)>>15)+aE|0;aE=ar+1|0;if((aE|0)<(V|0)){ar=aE}else{break L1166}}}else{if(!s){break}b1(az|0,0,aj|0)}}while(0);az=c[A>>2]|0;ar=-(b[S>>1]|0)&65535;ao=c[O>>2]|0;aX(k,ap,az,az,u,ar,ar,ao,ao,0,0);L1191:do{if(U){ao=0;ar=0;while(1){az=b[l+(ao<<1)>>1]|0;am=ag+ar|0;aE=c[k+(am<<2)>>2]|0;aL=$(aE>>16,az);aq=$(aE&65535,az)>>15;az=b[l+(am<<1)>>1]|0;am=c[k+(ao<<2)>>2]|0;aE=$(am>>16,az);c[al+(ao+2048<<2)>>2]=(($(am&65535,az)>>15)+aq|0)+(aE+aL<<1)|0;aL=ao+1|0;aE=ao^-1;if((aL|0)<(T|0)){ao=aL;ar=aE}else{break L1191}}}}while(0);al=ak+1|0;if((al|0)<(q|0)){ak=al}else{break}}an(I|0);Z=G;_=j|0;aa=r+16|0;ab=a+68|0;ac=b[aa>>1]|0;a_(_,d,e,q,D,ac,ab,Z);ad=B+1|0;c[w>>2]=ad;i=g;return}function a_(a,d,e,f,g,h,i,j){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;k=(e|0)/(g|0)&-1;l=(g|0)>1;m=(e|0)>0;n=h<<16>>16;h=n<<1;o=(k|0)>0;p=0;q=0;while(1){r=i+(p<<2)|0;s=c[r>>2]|0;t=c[a+(p<<2)>>2]|0;do{if(l){L1202:do{if(m){u=0;v=s;while(1){w=(c[t+(u<<2)>>2]|0)+v|0;x=$(h,w>>16);y=($(w&65535,n)>>15)+x|0;c[j+(u<<2)>>2]=w;w=u+1|0;if((w|0)<(e|0)){u=w;v=y}else{z=y;break L1202}}}else{z=s}}while(0);c[r>>2]=z;A=1;B=825;break}else{L1207:do{if(m){v=0;u=s;while(1){y=(c[t+(v<<2)>>2]|0)+u|0;w=$(h,y>>16);x=($(y&65535,n)>>15)+w|0;w=y+2048>>12;y=(w|0)>-32768?w:-32768;b[d+($(v,f)+p<<1)>>1]=(y|0)<32767?y&65535:32767;y=v+1|0;if((y|0)<(e|0)){v=y;u=x}else{C=x;break L1207}}}else{C=s}}while(0);c[r>>2]=C;if((q|0)==0){D=0;break}else{A=q;B=825;break}}}while(0);L1211:do{if((B|0)==825){B=0;if(o){E=0}else{D=A;break}while(1){r=(c[j+($(E,g)<<2)>>2]|0)+2048>>12;s=(r|0)>-32768?r:-32768;b[d+($(E,f)+p<<1)>>1]=(s|0)<32767?s&65535:32767;s=E+1|0;if((s|0)<(k|0)){E=s}else{D=A;break L1211}}}}while(0);s=p+1|0;if((s|0)<(f|0)){p=s;q=D}else{break}}return}function a$(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+16|0;g=f|0;h=g|0;j=g;c[j>>2]=e;c[j+4>>2]=0;L1218:do{if((d|0)==10010){j=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((j|0)<0){k=852;break}if((j|0)>=(c[(c[a>>2]|0)+8>>2]|0)){k=852;break}c[a+20>>2]=j;k=851;break}else if((d|0)==10012){j=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((j|0)<1){k=852;break}if((j|0)>(c[(c[a>>2]|0)+8>>2]|0)){k=852;break}c[a+24>>2]=j;k=851;break}else if((d|0)==10008){j=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((j-1|0)>>>0>1){k=852;break}c[a+12>>2]=j;k=851;break}else if((d|0)==10007){j=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((j|0)==0){k=852;break}e=a+36|0;c[j>>2]=c[e>>2]|0;c[e>>2]=0;k=851;break}else if((d|0)==4027){e=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((e|0)==0){k=852;break}c[e>>2]=(c[a+4>>2]|0)/(c[a+16>>2]|0)&-1;k=851;break}else if((d|0)==4028){e=c[a+8>>2]|0;j=$((c[a+4>>2]|0)+2060|0,e);g=a|0;l=c[g>>2]|0;m=c[l+8>>2]|0;n=m+j|0;j=a+76+(n<<2)|0;o=a+76+(n+m<<2)|0;b1(a+32|0,0,((m<<4)+44|0)+$((c[l+4>>2]<<2)+8240|0,e)|0);if((m<<1|0)>0){p=0}else{k=851;break}while(1){b[o+(p<<1)>>1]=-28672;b[j+(p<<1)>>1]=-28672;m=p+1|0;if((m|0)<(c[(c[g>>2]|0)+8>>2]<<1|0)){p=m}else{k=851;break L1218}}}else if((d|0)==4033){g=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((g|0)==0){k=852;break}c[g>>2]=c[a+48>>2]|0;k=851;break}else if((d|0)==10015){g=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((g|0)==0){k=852;break}c[g>>2]=c[a>>2]|0;k=851;break}else if((d|0)==10016){c[a+28>>2]=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);k=851;break}else if((d|0)==4031){g=(u=c[h+4>>2]|0,c[h+4>>2]=u+8,c[(c[h>>2]|0)+u>>2]|0);if((g|0)==0){k=852;break}c[g>>2]=c[a+32>>2]|0;k=851;break}else{q=-5;i=f;return q|0}}while(0);if((k|0)==851){q=0;i=f;return q|0}else if((k|0)==852){q=-1;i=f;return q|0}return 0}function a0(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b-1|0;g=c[a+(f<<2)>>2]|0;h=(g|0)>-1?g:-g|0;i=f;f=g>>>31;while(1){g=i-1|0;j=b-g|0;k=(c[(c[11992+(((j|0)<(h|0)?j:h)<<2)>>2]|0)+(((j|0)>(h|0)?j:h)<<2)>>2]|0)+f|0;l=c[a+(g<<2)>>2]|0;m=((l|0)>-1?l:-l|0)+h|0;if((l|0)<0){l=m+1|0;n=(c[(c[11992+(((j|0)<(l|0)?j:l)<<2)>>2]|0)+(((j|0)>(l|0)?j:l)<<2)>>2]|0)+k|0}else{n=k}if((g|0)>0){h=m;i=g;f=n}else{break}}f=d+1|0;a3(e,n,(c[(c[11992+(((f|0)>(b|0)?b:f)<<2)>>2]|0)+(((f|0)<(b|0)?b:f)<<2)>>2]|0)+(c[(c[11992+(((b|0)<(d|0)?b:d)<<2)>>2]|0)+(((b|0)>(d|0)?b:d)<<2)>>2]|0)|0);return}function a1(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=d+1|0;g=b;h=d;i=a;a=a2(e,(c[(c[11992+(((f|0)>(b|0)?b:f)<<2)>>2]|0)+(((f|0)<(b|0)?b:f)<<2)>>2]|0)+(c[(c[11992+(((b|0)<(d|0)?b:d)<<2)>>2]|0)+(((b|0)>(d|0)?b:d)<<2)>>2]|0)|0)|0;while(1){d=h+1|0;b=c[(c[11992+(((g|0)<(d|0)?g:d)<<2)>>2]|0)+(((g|0)>(d|0)?g:d)<<2)>>2]|0;d=a>>>0>=b>>>0&1;f=-d|0;e=a-(b&f)|0;b=c[(c[11992+(((g|0)<(h|0)?g:h)<<2)>>2]|0)+(((g|0)>(h|0)?g:h)<<2)>>2]|0;L1258:do{if(b>>>0>e>>>0){j=h;while(1){k=j-1|0;l=c[(c[11992+(((g|0)<(k|0)?g:k)<<2)>>2]|0)+(((g|0)>(k|0)?g:k)<<2)>>2]|0;if(l>>>0>e>>>0){j=k}else{m=k;n=l;break L1258}}}else{m=h;n=b}}while(0);c[i>>2]=(h-d|0)-m^f;b=g-1|0;if((b|0)>0){g=b;h=m;i=i+4|0;a=e-n|0}else{break}}return}function a2(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=b-1|0;f=32-(b2(e|0)|0)|0;if(f>>>0<=8){g=a+28|0;h=c[g>>2]|0;i=(h>>>0)/(b>>>0)>>>0;c[a+36>>2]=i;j=a+32|0;k=c[j>>2]|0;l=(k>>>0)/(i>>>0)>>>0;m=l+1|0;n=b-m&-(m>>>0>b>>>0&1);m=(l^-1)+b|0;b=m-n|0;l=$(e-b|0,i);o=k-l|0;c[j>>2]=o;k=(m|0)==(n|0)?h-l|0:i;c[g>>2]=k;if(k>>>0>=8388609){p=b;return p|0}i=a+20|0;l=a+40|0;h=a+24|0;n=a|0;m=c[a+4>>2]|0;q=c[i>>2]|0;r=k;k=c[l>>2]|0;s=c[h>>2]|0;t=o;while(1){o=q+8|0;c[i>>2]=o;u=r<<8;c[g>>2]=u;if(s>>>0<m>>>0){v=s+1|0;c[h>>2]=v;w=d[(c[n>>2]|0)+s|0]|0;x=v}else{w=0;x=s}c[l>>2]=w;v=((w|k<<8)>>>1&255|t<<8&2147483392)^255;c[j>>2]=v;if(u>>>0<8388609){q=o;r=u;k=w;s=x;t=v}else{p=b;break}}return p|0}b=f-8|0;f=e>>>(b>>>0);t=f+1|0;x=a+28|0;s=c[x>>2]|0;w=(s>>>0)/(t>>>0)>>>0;c[a+36>>2]=w;k=a+32|0;r=c[k>>2]|0;q=(r>>>0)/(w>>>0)>>>0;j=q+1|0;l=t-j&-(j>>>0>t>>>0&1);j=t+(q^-1)|0;q=j-l|0;t=$(f-q|0,w);f=r-t|0;c[k>>2]=f;r=(j|0)==(l|0)?s-t|0:w;c[x>>2]=r;L1276:do{if(r>>>0<8388609){w=a+20|0;t=a+40|0;s=a+24|0;l=a|0;j=c[a+4>>2]|0;n=c[w>>2]|0;h=r;m=c[t>>2]|0;g=c[s>>2]|0;i=f;while(1){v=n+8|0;c[w>>2]=v;u=h<<8;c[x>>2]=u;if(g>>>0<j>>>0){o=g+1|0;c[s>>2]=o;y=d[(c[l>>2]|0)+g|0]|0;z=o}else{y=0;z=g}c[t>>2]=y;o=((y|m<<8)>>>1&255|i<<8&2147483392)^255;c[k>>2]=o;if(u>>>0<8388609){n=v;h=u;m=y;g=z;i=o}else{break L1276}}}}while(0);z=q<<b;q=a+12|0;y=c[q>>2]|0;k=a+16|0;x=c[k>>2]|0;if(x>>>0<b>>>0){f=a+8|0;r=a|0;i=x+8|0;g=((i|0)>25?x+7|0:24)-x|0;m=c[a+4>>2]|0;h=y;n=x;t=c[f>>2]|0;while(1){if(t>>>0<m>>>0){l=t+1|0;c[f>>2]=l;A=d[(c[r>>2]|0)+(m-l|0)|0]|0;B=l}else{A=0;B=t}C=A<<n|h;l=n+8|0;if((l|0)<25){h=C;n=l;t=B}else{break}}D=C;E=i+(g&-8)|0}else{D=y;E=x}c[q>>2]=D>>>(b>>>0);c[k>>2]=E-b|0;E=a+20|0;c[E>>2]=(c[E>>2]|0)+b|0;E=D&(1<<b)-1|z;if(E>>>0<=e>>>0){p=E;return p|0}c[a+44>>2]=1;p=e;return p|0}function a3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=e-1|0;g=32-(b2(f|0)|0)|0;if(g>>>0<=8){h=b+28|0;i=c[h>>2]|0;j=(i>>>0)/(e>>>0)>>>0;if((d|0)==0){k=i-$(j,f)|0}else{l=i-$(j,e-d|0)|0;e=b+32|0;c[e>>2]=l+(c[e>>2]|0)|0;k=j}c[h>>2]=k;if(k>>>0>=8388609){return}k=b+32|0;j=b+20|0;e=c[k>>2]|0;while(1){a4(b,e>>>23);l=c[k>>2]<<8&2147483392;c[k>>2]=l;i=c[h>>2]<<8;c[h>>2]=i;c[j>>2]=(c[j>>2]|0)+8|0;if(i>>>0<8388609){e=l}else{break}}return}e=g-8|0;g=f>>>(e>>>0);f=g+1|0;j=d>>>(e>>>0);h=b+28|0;k=c[h>>2]|0;l=(k>>>0)/(f>>>0)>>>0;if((j|0)==0){m=k-$(l,g)|0}else{g=k-$(l,f-j|0)|0;j=b+32|0;c[j>>2]=g+(c[j>>2]|0)|0;m=l}c[h>>2]=m;L1315:do{if(m>>>0<8388609){l=b+32|0;j=b+20|0;g=c[l>>2]|0;while(1){a4(b,g>>>23);f=c[l>>2]<<8&2147483392;c[l>>2]=f;k=c[h>>2]<<8;c[h>>2]=k;c[j>>2]=(c[j>>2]|0)+8|0;if(k>>>0<8388609){g=f}else{break L1315}}}}while(0);h=(1<<e)-1&d;d=b+12|0;m=c[d>>2]|0;g=b+16|0;j=c[g>>2]|0;if((j+e|0)>>>0>32){l=b+24|0;f=b+8|0;k=b+4|0;i=b|0;n=b+44|0;o=7-j|0;p=((o|0)>-8?o:-8)+j|0;o=j;q=m;while(1){r=c[f>>2]|0;s=c[k>>2]|0;if((r+(c[l>>2]|0)|0)>>>0<s>>>0){t=r+1|0;c[f>>2]=t;a[(c[i>>2]|0)+(s-t|0)|0]=q&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u;v=q>>>8;t=o-8|0;if((t|0)>7){o=t;q=v}else{break}}w=(j-8|0)-(p&-8)|0;x=v}else{w=j;x=m}c[d>>2]=h<<w|x;c[g>>2]=w+e|0;w=b+20|0;c[w>>2]=(c[w>>2]|0)+e|0;return}function a4(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((d|0)==255){e=b+36|0;c[e>>2]=(c[e>>2]|0)+1|0;return}e=d>>8;f=b+40|0;g=c[f>>2]|0;if((g|0)>-1){h=b+24|0;i=c[h>>2]|0;if(((c[b+8>>2]|0)+i|0)>>>0<(c[b+4>>2]|0)>>>0){c[h>>2]=i+1|0;a[(c[b>>2]|0)+i|0]=g+e&255;j=0}else{j=-1}g=b+44|0;c[g>>2]=c[g>>2]|j}j=b+36|0;g=c[j>>2]|0;L1341:do{if((g|0)!=0){i=b+24|0;h=b+8|0;k=b+4|0;l=e+255&255;m=b|0;n=b+44|0;o=g;while(1){p=c[i>>2]|0;if(((c[h>>2]|0)+p|0)>>>0<(c[k>>2]|0)>>>0){c[i>>2]=p+1|0;a[(c[m>>2]|0)+p|0]=l;q=0;r=c[j>>2]|0}else{q=-1;r=o}c[n>>2]=c[n>>2]|q;p=r-1|0;c[j>>2]=p;if((p|0)==0){break L1341}else{o=p}}}}while(0);c[f>>2]=d&255;return}function a5(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;f=i;i=i+32|0;g=f|0;h=c[a+4>>2]|0;j=(h|0)>0?h:0;h=a|0;L1351:do{if((c[h>>2]|0)>0){k=a+40|0;l=0;while(1){m=d+(l<<3)|0;n=e+((b[(c[k>>2]|0)+(l<<1)>>1]|0)<<3)|0;o=c[m+4>>2]|0;c[n>>2]=c[m>>2]|0;c[n+4>>2]=o;o=l+1|0;if((o|0)<(c[h>>2]|0)){l=o}else{break L1351}}}}while(0);c[g>>2]=1;h=0;d=1;while(1){l=h<<1;k=b[a+8+((l|1)<<1)>>1]|0;o=$(d,b[a+8+(l<<1)>>1]|0);p=h+1|0;c[g+(p<<2)>>2]=o;if(k<<16>>16==1){break}else{h=p;d=o}}if((h|0)<=-1){i=f;return}d=a+44|0;o=b[a+8+((p<<1)-1<<1)>>1]|0;p=h;while(1){if((p|0)==0){q=1;r=0}else{h=p<<1;q=b[a+8+(h-1<<1)>>1]|0;r=h}h=b[a+8+(r<<1)>>1]|0;L1367:do{if((h|0)==4){k=c[g+(p<<2)>>2]|0;l=k<<j;n=o<<1;m=o*3&-1;if((k|0)<=0){break}s=(o|0)>0;t=l<<1;u=l*3&-1;v=0;while(1){w=c[d>>2]|0;L1372:do{if(s){x=w;y=w;z=w;A=0;B=e+($(v,q)<<3)|0;while(1){C=b[z>>1]|0;D=B+(o<<3)|0;E=c[D>>2]|0;F=E>>16;G=$(F,C);H=E&65535;E=$(H,C)>>15;I=b[z+2>>1]|0;J=B+(o<<3)+4|0;K=c[J>>2]|0;L=K>>16;M=$(L,I);N=K&65535;K=(($(N,I)>>15)+E|0)+(M+G<<1)|0;G=$(C<<1,L);L=$(N,C)>>15;C=$(F<<1,I);F=((G-C|0)-($(I,H)>>15)|0)+L|0;L=b[y>>1]|0;H=B+(n<<3)|0;I=c[H>>2]|0;C=I>>16;G=$(C,L);N=I&65535;I=$(N,L)>>15;M=b[y+2>>1]|0;E=B+(n<<3)+4|0;O=c[E>>2]|0;P=O>>16;Q=$(P,M);R=O&65535;O=(($(R,M)>>15)+I|0)+(Q+G<<1)|0;G=$(L<<1,P);P=$(R,L)>>15;L=$(C<<1,M);C=((G-L|0)-($(M,N)>>15)|0)+P|0;P=b[x>>1]|0;N=B+(m<<3)|0;M=c[N>>2]|0;L=M>>16;G=$(L,P);R=M&65535;M=$(R,P)>>15;Q=b[x+2>>1]|0;I=B+(m<<3)+4|0;S=c[I>>2]|0;T=S>>16;U=$(T,Q);V=S&65535;S=(($(V,Q)>>15)+M|0)+(U+G<<1)|0;G=$(P<<1,T);T=$(V,P)>>15;P=$(L<<1,Q);L=((G-P|0)-($(Q,R)>>15)|0)+T|0;T=B|0;R=c[T>>2]|0;Q=R-O|0;P=B+4|0;G=c[P>>2]|0;V=G-C|0;U=R+O|0;c[T>>2]=U;O=G+C|0;c[P>>2]=O;C=S+K|0;G=L+F|0;R=K-S|0;S=F-L|0;c[H>>2]=U-C|0;c[E>>2]=O-G|0;c[T>>2]=C+(c[T>>2]|0)|0;c[P>>2]=G+(c[P>>2]|0)|0;c[D>>2]=Q-S|0;c[J>>2]=R+V|0;c[N>>2]=S+Q|0;c[I>>2]=V-R|0;R=A+1|0;if((R|0)<(o|0)){x=x+(u<<2)|0;y=y+(t<<2)|0;z=z+(l<<2)|0;A=R;B=B+8|0}else{break L1372}}}}while(0);w=v+1|0;if((w|0)<(k|0)){v=w}else{break L1367}}}else if((h|0)==5){v=c[g+(p<<2)>>2]|0;k=v<<j;l=c[d>>2]|0;t=$(k,o);u=$(k<<1,o);if((v|0)<=0){break}m=o<<1;n=o*3&-1;s=o<<2;w=(o|0)>0;B=k*3&-1;A=b[l+(t<<2)>>1]|0;z=b[l+(u<<2)>>1]|0;y=b[l+(t<<2)+2>>1]|0;t=y<<1;x=b[l+(u<<2)+2>>1]|0;u=x<<1;R=0;while(1){V=$(R,q);L1381:do{if(w){I=0;Q=e+(V+s<<3)|0;S=e+(V+n<<3)|0;N=e+(V+m<<3)|0;J=e+(V+o<<3)|0;D=e+(V<<3)|0;while(1){P=D|0;G=c[P>>2]|0;T=D+4|0;C=c[T>>2]|0;O=$(I,k);E=b[l+(O<<2)>>1]|0;U=J|0;H=c[U>>2]|0;L=H>>16;F=$(L,E);K=H&65535;H=$(K,E)>>15;M=b[l+(O<<2)+2>>1]|0;O=J+4|0;W=c[O>>2]|0;X=W>>16;Y=$(X,M);Z=W&65535;W=(($(Z,M)>>15)+H|0)+(Y+F<<1)|0;F=$(E<<1,X);X=$(Z,E)>>15;E=$(L<<1,M);L=((F-E|0)-($(M,K)>>15)|0)+X|0;X=$(I<<1,k);K=b[l+(X<<2)>>1]|0;M=N|0;E=c[M>>2]|0;F=E>>16;Z=$(F,K);Y=E&65535;E=$(Y,K)>>15;H=b[l+(X<<2)+2>>1]|0;X=N+4|0;_=c[X>>2]|0;aa=_>>16;ab=$(aa,H);ac=_&65535;_=(($(ac,H)>>15)+E|0)+(ab+Z<<1)|0;Z=$(K<<1,aa);aa=$(ac,K)>>15;K=$(F<<1,H);F=((Z-K|0)-($(H,Y)>>15)|0)+aa|0;aa=$(B,I);Y=b[l+(aa<<2)>>1]|0;H=S|0;K=c[H>>2]|0;Z=K>>16;ac=$(Z,Y);ab=K&65535;K=$(ab,Y)>>15;E=b[l+(aa<<2)+2>>1]|0;aa=S+4|0;ad=c[aa>>2]|0;ae=ad>>16;af=$(ae,E);ag=ad&65535;ad=(($(ag,E)>>15)+K|0)+(af+ac<<1)|0;ac=$(Y<<1,ae);ae=$(ag,Y)>>15;Y=$(Z<<1,E);Z=((ac-Y|0)-($(E,ab)>>15)|0)+ae|0;ae=$(I<<2,k);ab=b[l+(ae<<2)>>1]|0;E=Q|0;Y=c[E>>2]|0;ac=Y>>16;ag=$(ac,ab);af=Y&65535;Y=$(af,ab)>>15;K=b[l+(ae<<2)+2>>1]|0;ae=Q+4|0;ah=c[ae>>2]|0;ai=ah>>16;aj=$(ai,K);ak=ah&65535;ah=(($(ak,K)>>15)+Y|0)+(aj+ag<<1)|0;ag=$(ab<<1,ai);ai=$(ak,ab)>>15;ab=$(ac<<1,K);ac=((ag-ab|0)-($(K,af)>>15)|0)+ai|0;ai=ah+W|0;af=ac+L|0;K=W-ah|0;ah=L-ac|0;ac=ad+_|0;L=Z+F|0;W=_-ad|0;ad=F-Z|0;c[P>>2]=(ac+G|0)+ai|0;c[T>>2]=(L+C|0)+af|0;T=ai>>16;P=$(T,A);Z=ai&65535;ai=$(Z,A)>>15;F=ac>>16;_=$(F,z);ab=ac&65535;ac=((($(ab,z)>>15)+G|0)+ai|0)+(P+_<<1)|0;_=af>>16;P=$(_,A);ai=af&65535;af=$(ai,A)>>15;ag=L>>16;ak=$(ag,z);aj=L&65535;L=((($(aj,z)>>15)+C|0)+af|0)+(P+ak<<1)|0;ak=ah>>16;P=$(ak,t);af=ah&65535;ah=$(af,y)>>15;Y=ad>>16;al=$(Y,u);am=ad&65535;ad=((($(am,x)>>15)+al|0)+P|0)+ah|0;ah=K>>16;P=$(ah,y);al=K&65535;K=$(al,y)>>15;an=W>>16;ao=$(an,x);ap=W&65535;W=(K+($(ap,x)>>15)|0)+(P+ao<<1)|0;c[U>>2]=ac+ad|0;c[O>>2]=L-W|0;c[E>>2]=ac-ad|0;c[ae>>2]=L+W|0;W=$(T,z);T=$(Z,z)>>15;Z=$(F,A);F=((($(ab,A)>>15)+G|0)+T|0)+(W+Z<<1)|0;Z=$(_,z);_=$(ai,z)>>15;ai=$(ag,A);ag=((($(aj,A)>>15)+C|0)+_|0)+(Z+ai<<1)|0;ai=$(ak,u);ak=$(af,x)>>15;af=$(Y,t);Y=(ai-(($(am,y)>>15)+af|0)|0)+ak|0;ak=$(ah,u);ah=$(al,x)>>15;al=$(an,t);an=((($(ap,y)>>15)+al|0)-ak|0)-ah|0;c[M>>2]=F+Y|0;c[X>>2]=ag+an|0;c[H>>2]=F-Y|0;c[aa>>2]=ag-an|0;an=I+1|0;if((an|0)<(o|0)){I=an;Q=Q+8|0;S=S+8|0;N=N+8|0;J=J+8|0;D=D+8|0}else{break L1381}}}}while(0);V=R+1|0;if((V|0)<(v|0)){R=V}else{break L1367}}}else if((h|0)==2){R=c[g+(p<<2)>>2]|0;v=R<<j;if((R|0)<=0){break}y=(o|0)>0;t=0;while(1){x=$(t,q);L1390:do{if(y){u=c[d>>2]|0;A=e+(x+o<<3)|0;z=0;l=e+(x<<3)|0;while(1){k=b[u>>1]|0;B=A|0;m=c[B>>2]|0;n=m>>16;s=$(n,k);w=m&65535;m=$(w,k)>>15;V=b[u+2>>1]|0;D=A+4|0;J=c[D>>2]|0;N=J>>16;S=$(N,V);Q=J&65535;J=(($(Q,V)>>15)+m|0)+(S+s<<1)|0;s=$(k<<1,N);N=$(Q,k)>>15;k=$(n<<1,V);n=((s-k|0)-($(V,w)>>15)|0)+N|0;N=l|0;c[B>>2]=(c[N>>2]|0)-J|0;B=l+4|0;c[D>>2]=(c[B>>2]|0)-n|0;c[N>>2]=J+(c[N>>2]|0)|0;c[B>>2]=n+(c[B>>2]|0)|0;B=z+1|0;if((B|0)<(o|0)){u=u+(v<<2)|0;A=A+8|0;z=B;l=l+8|0}else{break L1390}}}}while(0);x=t+1|0;if((x|0)<(R|0)){t=x}else{break L1367}}}else if((h|0)==3){t=c[g+(p<<2)>>2]|0;R=t<<j;v=o<<1;if((t|0)<=0){break}y=c[d>>2]|0;x=R<<1;l=(-(b[y+($(R,o)<<2)+2>>1]|0)&65535)<<16>>16;z=l<<1;A=0;u=y;while(1){y=e+($(A,q)<<3)|0;B=o;n=u;N=u;while(1){J=b[n>>1]|0;D=y+(o<<3)|0;w=c[D>>2]|0;V=w>>16;k=$(V,J);s=w&65535;w=$(s,J)>>15;Q=b[n+2>>1]|0;S=y+(o<<3)+4|0;m=c[S>>2]|0;I=m>>16;an=$(I,Q);ag=m&65535;m=(($(ag,Q)>>15)+w|0)+(an+k<<1)|0;k=$(J<<1,I);I=$(ag,J)>>15;J=$(V<<1,Q);V=((k-J|0)-($(Q,s)>>15)|0)+I|0;I=b[N>>1]|0;s=y+(v<<3)|0;Q=c[s>>2]|0;J=Q>>16;k=$(J,I);ag=Q&65535;Q=$(ag,I)>>15;an=b[N+2>>1]|0;w=y+(v<<3)+4|0;aa=c[w>>2]|0;Y=aa>>16;F=$(Y,an);H=aa&65535;aa=(($(H,an)>>15)+Q|0)+(F+k<<1)|0;k=$(I<<1,Y);Y=$(H,I)>>15;I=$(J<<1,an);J=((k-I|0)-($(an,ag)>>15)|0)+Y|0;Y=aa+m|0;ag=J+V|0;an=m-aa|0;aa=V-J|0;J=y|0;c[D>>2]=(c[J>>2]|0)-(Y>>1)|0;V=y+4|0;c[S>>2]=(c[V>>2]|0)-(ag>>1)|0;m=$(an>>16,z);I=($(an&65535,l)>>15)+m|0;m=$(aa>>16,z);an=($(aa&65535,l)>>15)+m|0;c[J>>2]=Y+(c[J>>2]|0)|0;c[V>>2]=ag+(c[V>>2]|0)|0;c[s>>2]=an+(c[D>>2]|0)|0;c[w>>2]=(c[S>>2]|0)-I|0;c[D>>2]=(c[D>>2]|0)-an|0;c[S>>2]=I+(c[S>>2]|0)|0;S=B-1|0;if((S|0)==0){break}else{y=y+8|0;B=S;n=n+(R<<2)|0;N=N+(x<<2)|0}}N=A+1|0;if((N|0)>=(t|0)){break L1367}A=N;u=c[d>>2]|0}}}while(0);if((p|0)>0){o=q;p=p-1|0}else{break}}i=f;return}function a6(a){a=a|0;var b=0,c=0,d=0,e=0;b=a&131071;a=b>>>0>65536?131072-b|0:b;if((a&32767|0)==0){if((a&65535|0)!=0){c=0;return c|0}c=(a&131071|0)==0?32767:-32767;return c|0}if(a>>>0<32768){b=a<<16>>16;d=($(b,b)+16384|0)>>>15<<16>>16;b=($((($((((d*-626&-1)+16384|0)>>>15<<16)+542441472>>16,d)+16384|0)>>>15<<16)-501415936>>16,d)+16384>>15)+(32767-d|0)|0;if((b|0)>32766){c=32767;return c|0}c=b+1&65535;return c|0}else{b=65536-a<<16>>16;a=($(b,b)+16384|0)>>>15<<16>>16;b=($((($((((a*-626&-1)+16384|0)>>>15<<16)+542441472>>16,a)+16384|0)>>>15<<16)-501415936>>16,a)+16384>>15)+(32767-a|0)|0;if((b|0)>32766){e=32767}else{e=b+1&65535}c=-e&65535;return c|0}return 0}function a7(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=a+28|0;g=c[f>>2]|0;h=g>>>15;c[a+36>>2]=h;i=a+32|0;j=c[i>>2]|0;k=(j>>>0)/(h>>>0)>>>0;l=32767-k&((k+1|0)>>>0<32769)<<31>>31;do{if(l>>>0<b>>>0){m=b;n=0;o=0}else{k=($(16384-e|0,32736-b|0)>>>15)+1|0;L1427:do{if(k>>>0>1){p=b;q=1;r=k;while(1){s=r<<1;t=s+p|0;if(l>>>0<t>>>0){u=q;v=p;w=r;break L1427}x=q+1|0;y=($(s-2|0,e)>>>15)+1|0;if(y>>>0>1){p=t;q=x;r=y}else{z=t;A=x;B=y;C=988;break L1427}}}else{z=b;A=1;B=k;C=988}}while(0);if((C|0)==988){k=(l-z|0)>>>1;u=k+A|0;v=(k<<1)+z|0;w=B}k=v+w|0;if(l>>>0>=k>>>0){m=w;n=u;o=k;break}m=w;n=-u|0;o=v}}while(0);v=m+o|0;m=v>>>0<32768?v:32768;v=$(32768-m|0,h);u=j-v|0;c[i>>2]=u;if((o|0)==0){D=g-v|0}else{D=$(m-o|0,h)}c[f>>2]=D;if(D>>>0>=8388609){return n|0}h=a+20|0;o=a+40|0;m=a+24|0;v=a|0;g=c[a+4>>2]|0;a=c[h>>2]|0;j=D;D=c[o>>2]|0;w=c[m>>2]|0;l=u;while(1){u=a+8|0;c[h>>2]=u;B=j<<8;c[f>>2]=B;if(w>>>0<g>>>0){z=w+1|0;c[m>>2]=z;E=d[(c[v>>2]|0)+w|0]|0;F=z}else{E=0;F=w}c[o>>2]=E;z=((E|D<<8)>>>1&255|l<<8&2147483392)^255;c[i>>2]=z;if(B>>>0<8388609){a=u;j=B;D=E;w=F;l=z}else{break}}return n|0}function a8(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0;c=65567-(b2(b|0)|0)<<16>>16;d=c-29|0;if((d|0)>0){e=b>>d;f=a>>d}else{d=29-c|0;e=b<<d;f=a<<d}d=e+32768>>16;a=65567-(b2(d|0)|0)<<16>>16;b=a-15|0;if((b|0)>0){g=d>>b}else{g=d<<15-a}d=(g<<16^-2147483648)>>16;g=(d*-15420&-1)>>>15<<16;b=g+2021130240>>16;c=b-($((g-126353408|0)+($(b,d)>>>15<<16)>>16,b)>>>15)<<16;b=c>>16;g=a-16|0;h=b-((($(($(b,d)>>>15<<16)+(c^-2147483648)>>16,b)>>>15<<16)+65536|0)>>>16)<<16>>16;if((g|0)>0){i=h>>g}else{i=h<<16-a}a=(i+4|0)>>>3<<16;i=a>>16;h=$(f>>16<<1,i);g=($(i,f&65535)>>15)+h|0;h=g>>16;b=e>>16;c=$(b<<1,h);d=$(h,e&65535)>>15;e=(((f+2>>2)-c|0)-d|0)-($(g&65535,b)>>15)|0;b=$(a>>15,e>>16);a=(($(e&65535,i)>>15)+b<<2)+g|0;if((a|0)>536870911){return 2147483647}else{return((a|0)<-536870911?-2147483647:a<<2)|0}return 0}function a9(a,d,e,f,g,h,j){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;k=i;l=c[a>>2]>>h;m=l>>1;n=l>>2;o=i;i=i+(m*4&-1)|0;i=i+7>>3<<3;p=(m+25736|0)/(l|0)&-1&65535;l=a+24|0;q=c[l>>2]|0;L1466:do{if((n|0)>0){r=p<<16>>16;s=r<<1;t=j<<1;u=-t|0;v=o;w=d+($(m-1|0,j)<<2)|0;x=d;y=0;while(1){z=b[q+(y<<h<<1)>>1]|0;A=c[w>>2]|0;B=A>>16;C=z<<1;D=$(C,B);E=A&65535;A=$(E,z)>>15;F=b[q+(n-y<<h<<1)>>1]|0;G=c[x>>2]|0;H=G>>16;I=$(F<<1,H);J=G&65535;G=(I-(A+D|0)|0)+($(J,F)>>15)|0;D=$(B<<1,F);B=D+($(F,E)>>15)|0;E=$(C,H);H=(($(J,z)>>15)+E|0)+B|0;B=-H|0;E=$(s,B>>16);c[v>>2]=(G-E|0)-($(B&65535,r)>>15)|0;B=$(s,G>>16);c[v+4>>2]=(B-H|0)+($(G&65535,r)>>15)|0;G=y+1|0;if((G|0)<(n|0)){v=v+8|0;w=w+(u<<2)|0;x=x+(t<<2)|0;y=G}else{break L1466}}}}while(0);q=g>>1;d=e+(q<<2)|0;a5(c[a+8+(h<<2)>>2]|0,o,d);o=c[l>>2]|0;l=n+1>>1;L1471:do{if((l|0)>0){a=p<<16>>16;j=a<<1;y=e+((q-2|0)+m<<2)|0;t=d;x=0;while(1){u=c[t>>2]|0;w=t+4|0;v=c[w>>2]|0;r=n-x|0;s=b[o+(r<<h<<1)>>1]|0;G=b[o+(x<<h<<1)>>1]|0;H=u>>16;B=$(H<<1,G);E=u&65535;u=$(G,E)>>15;z=s<<16>>16;s=v>>16;J=$(s<<1,z);C=v&65535;v=((u+B|0)-J|0)-($(z,C)>>15)|0;J=$(G,s);s=$(G,C)>>15;C=$(z,H);H=(($(z,E)>>15)+s|0)+(C+J<<1)|0;J=c[y>>2]|0;C=y+4|0;s=c[C>>2]|0;E=$(j,H>>16);c[t>>2]=(E-v|0)+($(H&65535,a)>>15)|0;E=$(j,v>>16);c[C>>2]=(E+H|0)+($(v&65535,a)>>15)|0;v=x+1|0;H=b[o+(v<<h<<1)>>1]|0;E=b[o+(r-1<<h<<1)>>1]|0;r=J>>16;C=$(r<<1,E);z=J&65535;J=$(E,z)>>15;G=H<<16>>16;H=s>>16;B=$(H<<1,G);u=s&65535;s=((J+C|0)-B|0)-($(G,u)>>15)|0;B=$(E,H);H=$(E,u)>>15;u=$(G,r);r=(($(G,z)>>15)+H|0)+(u+B<<1)|0;B=$(j,r>>16);c[y>>2]=(B-s|0)+($(r&65535,a)>>15)|0;B=$(j,s>>16);c[w>>2]=(B+r|0)+($(s&65535,a)>>15)|0;if((v|0)<(l|0)){y=y-8|0;t=t+8|0;x=v}else{break L1471}}}}while(0);l=g-1|0;h=(g|0)/2&-1;if((g|0)<=1){i=k;return}g=e+(l<<2)|0;o=e;e=f;n=f+(l<<1)|0;l=0;while(1){f=c[g>>2]|0;d=c[o>>2]|0;m=b[n>>1]|0;q=d>>16;p=$(q<<1,m);x=d&65535;d=$(m,x)>>15;t=b[e>>1]|0;y=f>>16;a=$(y<<1,t);j=f&65535;c[o>>2]=((d+p|0)-a|0)-($(t,j)>>15)|0;a=$(t,q);q=$(t,x)>>15;x=$(m,y);c[g>>2]=(($(m,j)>>15)+q|0)+(x+a<<1)|0;a=l+1|0;if((a|0)<(h|0)){g=g-4|0;o=o+4|0;e=e+2|0;n=n-2|0;l=a}else{break}}i=k;return}function ba(a,d,f,g){a=a|0;d=d|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;h=i;i=i+32|0;j=h|0;k=h+24|0;l=c[a>>2]|0;m=(f|0)>0;L1483:do{if(m){n=0;o=0;p=0;while(1){q=c[l+(n<<2)>>2]|0;r=(o|0)>(q|0)?o:q;s=(p|0)<(q|0)?p:q;q=n+1|0;if((q|0)<(f|0)){n=q;o=r;p=s}else{t=r;u=s;break L1483}}}else{t=0;u=0}}while(0);p=-u|0;u=(t|0)>(p|0)?t:p;p=(g|0)==2;if(p){g=c[a+4>>2]|0;L1489:do{if(m){t=0;o=0;n=0;while(1){s=c[g+(t<<2)>>2]|0;r=(o|0)>(s|0)?o:s;q=(n|0)<(s|0)?n:s;s=t+1|0;if((s|0)<(f|0)){t=s;o=r;n=q}else{v=r;w=q;break L1489}}}else{v=0;w=0}}while(0);g=-w|0;w=(v|0)>(g|0)?v:g;x=(u|0)>(w|0)?u:w}else{x=u}u=(65567-(b2(((x|0)<1?1:x)|0)|0)<<16>>16)-10|0;x=((u|0)<0?0:u)+(p&1)|0;u=f>>1;f=(u|0)>1;L1494:do{if(f){w=1;while(1){g=w<<1;b[d+(w<<1)>>1]=((c[l+((g|1)<<2)>>2]|0)+(c[l+(g-1<<2)>>2]|0)>>1)+(c[l+(g<<2)>>2]|0)>>1>>x&65535;g=w+1|0;if((g|0)<(u|0)){w=g}else{break L1494}}}}while(0);w=(c[l+4>>2]>>1)+(c[l>>2]|0)>>1>>x&65535;b[d>>1]=w;if(p){p=c[a+4>>2]|0;if(f){f=1;while(1){a=f<<1;l=d+(f<<1)|0;b[l>>1]=(((c[p+((a|1)<<2)>>2]|0)+(c[p+(a-1<<2)>>2]|0)>>1)+(c[p+(a<<2)>>2]|0)>>1>>x)+(e[l>>1]|0)&65535;l=f+1|0;if((l|0)<(u|0)){f=l}else{break}}y=b[d>>1]|0}else{y=w}b[d>>1]=((c[p+4>>2]>>1)+(c[p>>2]|0)>>1>>x)+(y&65535)&65535}y=j|0;bi(d,y,0,0,4,u);x=c[y>>2]|0;c[y>>2]=(x>>13)+x|0;x=j+4|0;p=c[x>>2]|0;c[x>>2]=(p-(p>>16<<2)|0)-(p>>>14&3)|0;p=j+8|0;x=c[p>>2]|0;c[p>>2]=(x-(x>>16<<4)|0)-(x>>>12&15)|0;x=j+12|0;p=c[x>>2]|0;c[x>>2]=(p+((p>>16)*-36&-1)|0)-(((p&65535)*18&-1)>>>15)|0;p=j+16|0;j=c[p>>2]|0;c[p>>2]=(j-(j>>16<<6)|0)-(j>>>10&63)|0;j=k|0;be(j,y,4);y=((b[j>>1]|0)*29490&-1)>>>15&65535;b[j>>1]=y;j=k+2|0;p=((b[j>>1]|0)*26540&-1)>>>15;x=p&65535;b[j>>1]=x;j=k+4|0;w=((b[j>>1]|0)*23885&-1)>>>15;f=w&65535;b[j>>1]=f;j=k+6|0;k=((b[j>>1]|0)*21496&-1)>>>15;l=k&65535;b[j>>1]=l;if((u|0)<=0){i=h;return}j=(y+3277&65535)<<16>>16;a=(((y<<16>>16)*26214&-1)>>>15)+p<<16>>16;p=(((x<<16>>16)*26214&-1)>>>15)+w<<16>>16;w=(((f<<16>>16)*26214&-1)>>>15)+k<<16>>16;k=((l<<16>>16)*26214&-1)>>>15<<16>>16;l=0;f=0;x=0;y=0;g=0;v=0;while(1){m=d+(v<<1)|0;n=b[m>>1]|0;o=$(l<<16>>16,j);t=$(f<<16>>16,a);q=$(x<<16>>16,p);r=$(y<<16>>16,w);b[m>>1]=(((((($(g<<16>>16,k)+2048|0)+r|0)+q|0)+t|0)+o|0)+(n<<16>>16<<12)|0)>>>12&65535;o=v+1|0;if((o|0)<(u|0)){g=y;y=x;x=f;f=l;l=n;v=o}else{break}}i=h;return}function bb(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0;h=g-3|0;L1513:do{if((h|0)>0){i=f-3|0;j=(i|0)>0;k=0;l=1;while(1){m=k|1;n=b[d+(k<<1)>>1]|0;o=k|2;p=b[d+(m<<1)>>1]|0;q=k|3;r=d+(q<<1)|0;s=b[d+(o<<1)>>1]|0;L1517:do{if(j){t=p;u=s;v=n;w=0;x=r;y=a;z=0;A=0;B=0;C=0;while(1){D=b[x>>1]|0;E=b[y>>1]|0;F=$(E,v<<16>>16)+z|0;G=t<<16>>16;H=$(E,G)+A|0;I=u<<16>>16;J=$(E,I)+B|0;K=D<<16>>16;L=$(K,E)+C|0;E=b[x+2>>1]|0;M=b[y+2>>1]|0;N=F+$(M,G)|0;G=H+$(M,I)|0;H=J+$(M,K)|0;J=E<<16>>16;F=L+$(J,M)|0;M=b[x+4>>1]|0;L=b[y+4>>1]|0;O=N+$(L,I)|0;I=G+$(L,K)|0;G=H+$(L,J)|0;H=M<<16>>16;N=F+$(H,L)|0;L=y+8|0;F=x+8|0;P=b[x+6>>1]|0;Q=b[y+6>>1]|0;R=O+$(Q,K)|0;K=I+$(Q,J)|0;J=G+$(Q,H)|0;H=N+$(P<<16>>16,Q)|0;Q=w+4|0;if((Q|0)<(i|0)){t=M;u=P;v=E;w=Q;x=F;y=L;z=R;A=K;B=J;C=H}else{S=M;T=P;U=D;V=E;W=Q;X=F;Y=L;Z=R;_=K;aa=J;ab=H;break L1517}}}else{S=p;T=s;U=0;V=n;W=0;X=r;Y=a;Z=0;_=0;aa=0;ab=0}}while(0);r=W|1;if((W|0)<(f|0)){n=b[X>>1]|0;s=b[Y>>1]|0;p=$(s,V<<16>>16)+Z|0;C=$(s,S<<16>>16)+_|0;B=$(s,T<<16>>16)+aa|0;ac=Y+2|0;ad=X+2|0;ae=n;af=p;ag=C;ah=B;ai=$(n<<16>>16,s)+ab|0}else{ac=Y;ad=X;ae=U;af=Z;ag=_;ah=aa;ai=ab}if((r|0)<(f|0)){s=b[ad>>1]|0;n=b[ac>>1]|0;B=$(n,S<<16>>16)+af|0;C=$(n,T<<16>>16)+ag|0;p=$(n,ae<<16>>16)+ah|0;aj=ac+2|0;ak=ad+2|0;al=s;am=B;an=C;ao=p;ap=$(s<<16>>16,n)+ai|0}else{aj=ac;ak=ad;al=V;am=af;an=ag;ao=ah;ap=ai}if((r+1|0)<(f|0)){r=b[ak>>1]|0;n=b[aj>>1]|0;s=$(n,T<<16>>16)+am|0;p=$(n,ae<<16>>16)+an|0;C=$(n,al<<16>>16)+ao|0;aq=s;ar=p;as=C;at=$(r<<16>>16,n)+ap|0}else{aq=am;ar=an;as=ao;at=ap}c[e+(k<<2)>>2]=aq;c[e+(m<<2)>>2]=ar;c[e+(o<<2)>>2]=as;c[e+(q<<2)>>2]=at;n=(aq|0)>(ar|0)?aq:ar;r=(as|0)>(at|0)?as:at;C=(n|0)>(r|0)?n:r;r=(l|0)>(C|0)?l:C;C=k+4|0;if((C|0)<(h|0)){k=C;l=r}else{au=C;av=r;break L1513}}}else{au=0;av=1}}while(0);if((au|0)>=(g|0)){aw=av;return aw|0}h=(f|0)>0;at=au;au=av;while(1){L1536:do{if(h){av=0;as=0;while(1){ar=$(b[d+(av+at<<1)>>1]|0,b[a+(av<<1)>>1]|0)+as|0;aq=av+1|0;if((aq|0)<(f|0)){av=aq;as=ar}else{ax=ar;break L1536}}}else{ax=0}}while(0);c[e+(at<<2)>>2]=ax;as=(au|0)>(ax|0)?au:ax;av=at+1|0;if((av|0)<(g|0)){at=av;au=as}else{aw=as;break}}return aw|0}function bc(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;h=i;i=i+8|0;j=h|0;k=j;c[j>>2]=0;c[j+4>>2]=0;l=e>>2;m=i;i=i+(l*2&-1)|0;i=i+7>>3<<3;n=f+e>>2;o=i;i=i+(n*2&-1)|0;i=i+7>>3<<3;p=f>>1;q=i;i=i+(p*4&-1)|0;i=i+7>>3<<3;r=(l|0)>0;L1542:do{if(r){s=0;while(1){b[m+(s<<1)>>1]=b[a+(s<<1<<1)>>1]|0;t=s+1|0;if((t|0)<(l|0)){s=t}else{break L1542}}}}while(0);s=(n|0)>0;L1546:do{if(s){t=0;while(1){b[o+(t<<1)>>1]=b[d+(t<<1<<1)>>1]|0;u=t+1|0;if((u|0)<(n|0)){t=u}else{break L1546}}}}while(0);if(r){t=0;u=0;v=0;while(1){w=b[m+(t<<1)>>1]|0;x=u<<16>>16>w<<16>>16?u:w;y=v<<16>>16<w<<16>>16?v:w;w=t+1|0;if((w|0)<(l|0)){t=w;u=x;v=y}else{break}}z=y<<16>>16;A=x<<16>>16}else{z=0;A=0}x=-z|0;z=(A|0)>(x|0)?A:x;if(s){x=0;A=0;y=0;while(1){v=b[o+(x<<1)>>1]|0;B=A<<16>>16>v<<16>>16?A:v;C=y<<16>>16<v<<16>>16?y:v;v=x+1|0;if((v|0)<(n|0)){x=v;A=B;y=C}else{break}}D=C<<16>>16;E=B<<16>>16}else{D=0;E=0}B=-D|0;D=(E|0)>(B|0)?E:B;B=(z|0)>(D|0)?z:D;D=(65567-(b2(((B|0)<1?1:B)|0)|0)<<16>>16)-11|0;if((D|0)>0){L1562:do{if(r){B=0;while(1){z=m+(B<<1)|0;b[z>>1]=(b[z>>1]|0)>>D&65535;z=B+1|0;if((z|0)<(l|0)){B=z}else{break L1562}}}}while(0);L1566:do{if(s){r=0;while(1){B=o+(r<<1)|0;b[B>>1]=(b[B>>1]|0)>>D&65535;B=r+1|0;if((B|0)<(n|0)){r=B}else{break L1566}}}}while(0);F=D<<1}else{F=0}D=f>>2;f=j;bd(q,o,l,D,f,0,bb(m,o,q,l,D)|0);L1571:do{if((p|0)>0){D=c[f>>2]<<1;l=k+4|0;o=e>>1;m=(o|0)>0;j=1;n=0;while(1){s=q+(n<<2)|0;c[s>>2]=0;r=n-D|0;do{if((((r|0)>-1?r:-r|0)|0)>2){B=n-(c[l>>2]<<1)|0;if((((B|0)>-1?B:-B|0)|0)>2){G=j;break}else{H=1085;break}}else{H=1085}}while(0);if((H|0)==1085){H=0;L1579:do{if(m){r=0;B=0;while(1){z=($(b[d+(B+n<<1)>>1]|0,b[a+(B<<1)>>1]|0)>>F)+r|0;E=B+1|0;if((E|0)<(o|0)){r=z;B=E}else{I=z;break L1579}}}else{I=0}}while(0);c[s>>2]=(I|0)<-1?-1:I;G=(j|0)>(I|0)?j:I}B=n+1|0;if((B|0)<(p|0)){j=G;n=B}else{J=G;K=o;break L1571}}}else{J=1;K=e>>1}}while(0);bd(q,d,K,p,f,F|1,J);J=c[f>>2]|0;if((J|0)<=0){L=0;M=J<<1;N=M-L|0;c[g>>2]=N;i=h;return}if((J|0)>=(p-1|0)){L=0;M=J<<1;N=M-L|0;c[g>>2]=N;i=h;return}p=c[q+(J-1<<2)>>2]|0;f=c[q+(J<<2)>>2]|0;F=c[q+(J+1<<2)>>2]|0;q=f-p|0;if((F-p|0)>((((q&65535)*22938&-1)>>>15)+((q>>16)*45876&-1)|0)){L=1;M=J<<1;N=M-L|0;c[g>>2]=N;i=h;return}q=f-F|0;L=((p-F|0)>((((q&65535)*22938&-1)>>>15)+((q>>16)*45876&-1)|0))<<31>>31;M=J<<1;N=M-L|0;c[g>>2]=N;i=h;return}function bd(a,d,e,f,g,h,i){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;j=65567-(b2(i|0)|0)<<16>>16;i=j-14|0;c[g>>2]=0;k=g+4|0;c[k>>2]=1;L1597:do{if((e|0)>0){l=1;m=0;while(1){n=b[d+(m<<1)>>1]|0;o=($(n,n)>>>(h>>>0))+l|0;n=m+1|0;if((n|0)<(e|0)){l=o;m=n}else{p=o;break L1597}}}else{p=1}}while(0);if((f|0)<=0){return}m=(i|0)>0;l=14-j|0;j=-1;o=-1;n=0;q=0;r=p;p=0;s=0;while(1){t=c[a+(p<<2)>>2]|0;do{if((t|0)>0){u=(m?t>>i:t<<l)<<16>>16;v=$(u,u)>>>15&65535;u=v<<16>>16;w=$(n>>16<<1,u);x=($(u,n&65535)>>15)+w|0;w=j<<16>>16;y=r>>16;z=$(w<<1,y);A=r&65535;if((x|0)<=(($(A,w)>>15)+z|0)){B=q;C=n;D=o;E=j;F=s;break}z=$(q>>16<<1,u);w=($(u,q&65535)>>15)+z|0;z=o<<16>>16;u=$(z<<1,y);if((w|0)>(($(A,z)>>15)+u|0)){c[k>>2]=s;c[g>>2]=p;B=r;C=q;D=v;E=o;F=p;break}else{c[k>>2]=p;B=q;C=r;D=o;E=v;F=s;break}}else{B=q;C=n;D=o;E=j;F=s}}while(0);t=b[d+(p+e<<1)>>1]|0;v=$(t,t)>>>(h>>>0);t=b[d+(p<<1)>>1]|0;u=(v-($(t,t)>>>(h>>>0))|0)+r|0;t=p+1|0;if((t|0)<(f|0)){j=E;o=D;n=C;q=B;r=(u|0)<1?1:u;p=t;s=F}else{break}}return}function be(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=i;i=i+96|0;g=f|0;h=c[d>>2]|0;j=(e|0)>0;if(j){b1(g|0,0,e<<2|0)}L1618:do{if((h|0)!=0){k=0;l=h;while(1){if((k|0)>=(e|0)){break L1618}if((k|0)>0){m=0;n=0;while(1){o=c[g+(n<<2)>>2]|0;p=o>>16;q=c[d+(k-n<<2)>>2]|0;r=q>>16;s=$(p<<1,r);t=$(q&65535,p)>>15;u=((s+m|0)+t|0)+($(r,o&65535)>>15)|0;o=n+1|0;if((o|0)<(k|0)){m=u;n=o}else{break}}v=u<<3}else{v=0}n=k+1|0;m=-(a8((c[d+(n<<2)>>2]|0)+v&-8,l)|0)|0;c[g+(k<<2)>>2]=m>>3;o=n>>1;L1627:do{if((o|0)>0){r=k-1|0;t=m>>16;s=t<<1;p=m&65535;q=0;while(1){w=g+(q<<2)|0;x=c[w>>2]|0;y=g+(r-q<<2)|0;z=c[y>>2]|0;A=z>>16;B=$(s,A);C=$(z&65535,t)>>15;c[w>>2]=((B+x|0)+C|0)+($(A,p)>>15)|0;A=x>>16;C=$(s,A);B=$(x&65535,t)>>15;c[y>>2]=((C+z|0)+B|0)+($(A,p)>>15)|0;A=q+1|0;if((A|0)<(o|0)){q=A}else{D=t;E=s;F=p;break L1627}}}else{p=m>>16;D=p;E=p<<1;F=m&65535}}while(0);m=$(E,D);o=($(D,F)>>15<<1)+m|0;m=o>>16;p=l>>16;s=$(p<<1,m);t=$(m,l&65535)>>15;m=((l-s|0)-t|0)-($(o&65534,p)>>15)|0;if((m|0)<(h>>10|0)){break L1618}else{k=n;l=m}}}}while(0);if(j){G=0}else{i=f;return}while(1){b[a+(G<<1)>>1]=((c[g+(G<<2)>>2]|0)+32768|0)>>>16&65535;j=G+1|0;if((j|0)<(e|0)){G=j}else{break}}i=f;return}function bf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;g=b[d>>1]|0;h=b[d+2>>1]|0;i=d+6|0;j=b[d+4>>1]|0;d=f-3|0;L1640:do{if((d|0)>0){k=e+4|0;l=e+8|0;m=e+12|0;n=h;o=j;p=g;q=0;r=i;s=a;t=c[e>>2]|0;u=c[k>>2]|0;v=c[l>>2]|0;w=c[m>>2]|0;while(1){x=b[r>>1]|0;y=b[s>>1]|0;z=t+$(y,p<<16>>16)|0;c[e>>2]=z;A=n<<16>>16;B=u+$(y,A)|0;c[k>>2]=B;C=o<<16>>16;D=v+$(y,C)|0;c[l>>2]=D;E=x<<16>>16;F=w+$(E,y)|0;c[m>>2]=F;y=b[r+2>>1]|0;G=b[s+2>>1]|0;H=z+$(G,A)|0;c[e>>2]=H;A=B+$(G,C)|0;c[k>>2]=A;B=D+$(G,E)|0;c[l>>2]=B;D=y<<16>>16;z=F+$(D,G)|0;c[m>>2]=z;G=b[r+4>>1]|0;F=b[s+4>>1]|0;I=H+$(F,C)|0;c[e>>2]=I;C=A+$(F,E)|0;c[k>>2]=C;A=B+$(F,D)|0;c[l>>2]=A;B=G<<16>>16;H=z+$(B,F)|0;c[m>>2]=H;F=s+8|0;z=r+8|0;J=b[r+6>>1]|0;K=b[s+6>>1]|0;L=I+$(K,E)|0;c[e>>2]=L;E=C+$(K,D)|0;c[k>>2]=E;D=A+$(K,B)|0;c[l>>2]=D;B=H+$(J<<16>>16,K)|0;c[m>>2]=B;K=q+4|0;if((K|0)<(d|0)){n=G;o=J;p=y;q=K;r=z;s=F;t=L;u=E;v=D;w=B}else{M=G;N=J;O=x;P=y;Q=K;R=z;S=F;break L1640}}}else{M=h;N=j;O=0;P=g;Q=0;R=i;S=a}}while(0);a=Q|1;if((Q|0)<(f|0)){Q=b[R>>1]|0;i=c[e>>2]|0;g=b[S>>1]|0;c[e>>2]=i+$(g,P<<16>>16)|0;i=e+4|0;j=c[i>>2]|0;c[i>>2]=j+$(g,M<<16>>16)|0;j=e+8|0;i=c[j>>2]|0;c[j>>2]=i+$(g,N<<16>>16)|0;i=e+12|0;j=c[i>>2]|0;c[i>>2]=j+$(Q<<16>>16,g)|0;T=S+2|0;U=R+2|0;V=Q}else{T=S;U=R;V=O}if((a|0)<(f|0)){O=b[U>>1]|0;R=c[e>>2]|0;S=b[T>>1]|0;c[e>>2]=R+$(S,M<<16>>16)|0;M=e+4|0;R=c[M>>2]|0;c[M>>2]=R+$(S,N<<16>>16)|0;R=e+8|0;M=c[R>>2]|0;c[R>>2]=M+$(S,V<<16>>16)|0;M=e+12|0;R=c[M>>2]|0;c[M>>2]=R+$(O<<16>>16,S)|0;W=T+2|0;X=U+2|0;Y=O}else{W=T;X=U;Y=P}if((a+1|0)>=(f|0)){return}f=b[X>>1]|0;X=c[e>>2]|0;a=b[W>>1]|0;c[e>>2]=X+$(a,N<<16>>16)|0;N=e+4|0;X=c[N>>2]|0;c[N>>2]=X+$(a,V<<16>>16)|0;V=e+8|0;X=c[V>>2]|0;c[V>>2]=X+$(a,Y<<16>>16)|0;Y=e+12|0;e=c[Y>>2]|0;c[Y>>2]=e+$(f<<16>>16,a)|0;return}function bg(a,d,f,g,h,j){a=a|0;d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;l=a;m=i;i=i+16|0;n=i;i=i+(h*2&-1)|0;i=i+7>>3<<3;o=i;i=i+((h+g|0)*2&-1)|0;i=i+7>>3<<3;p=(h|0)>0;L1656:do{if(p){q=h-1|0;r=0;while(1){b[n+(r<<1)>>1]=b[d+(q-r<<1)>>1]|0;s=r+1|0;if((s|0)<(h|0)){r=s}else{break}}if(!p){break}r=h-1|0;q=0;while(1){b[o+(q<<1)>>1]=b[j+(r-q<<1)>>1]|0;s=q+1|0;if((s|0)<(h|0)){q=s}else{break L1656}}}}while(0);if((g|0)>0){b3(o+(h<<1)|0,l|0,g<<1)}L1668:do{if(p){l=g-1|0;d=0;while(1){b[j+(d<<1)>>1]=b[a+(l-d<<1)>>1]|0;q=d+1|0;if((q|0)<(h|0)){d=q}else{break L1668}}}}while(0);j=g-3|0;L1673:do{if((j|0)>0){d=m;l=m|0;q=m+4|0;r=m+8|0;s=m+12|0;t=0;while(1){b1(d|0,0,16);bf(n,o+(t<<1)|0,l,h);b[f+(t<<1)>>1]=(((c[l>>2]|0)+2048|0)>>>12)+(e[a+(t<<1)>>1]|0)&65535;u=t|1;b[f+(u<<1)>>1]=(((c[q>>2]|0)+2048|0)>>>12)+(e[a+(u<<1)>>1]|0)&65535;u=t|2;b[f+(u<<1)>>1]=(((c[r>>2]|0)+2048|0)>>>12)+(e[a+(u<<1)>>1]|0)&65535;u=t|3;b[f+(u<<1)>>1]=(((c[s>>2]|0)+2048|0)>>>12)+(e[a+(u<<1)>>1]|0)&65535;u=t+4|0;if((u|0)<(j|0)){t=u}else{v=u;break L1673}}}else{v=0}}while(0);if((v|0)<(g|0)){w=v}else{i=k;return}while(1){if(p){v=0;j=0;while(1){x=$(b[o+(v+w<<1)>>1]|0,b[n+(v<<1)>>1]|0)+j|0;m=v+1|0;if((m|0)<(h|0)){v=m;j=x}else{break}}y=(x+2048|0)>>>12}else{y=0}b[f+(w<<1)>>1]=(e[a+(w<<1)>>1]|0)+y&65535;j=w+1|0;if((j|0)<(g|0)){w=j}else{break}}i=k;return}function bh(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;j=i;i=i+16|0;k=j|0;l=i;i=i+(g*2&-1)|0;i=i+7>>3<<3;m=g+f|0;n=i;i=i+(m*2&-1)|0;i=i+7>>3<<3;o=(g|0)>0;L1689:do{if(o){p=g-1|0;q=0;while(1){b[l+(q<<1)>>1]=b[d+(p-q<<1)>>1]|0;r=q+1|0;if((r|0)<(g|0)){q=r}else{break}}if(!o){s=0;break}q=g-1|0;p=0;while(1){b[n+(p<<1)>>1]=-(b[h+(q-p<<1)>>1]|0)&65535;r=p+1|0;if((r|0)<(g|0)){p=r}else{s=g;break L1689}}}else{s=0}}while(0);if((s|0)<(m|0)){b1(n+(s<<1)|0,0,m-s<<1|0)}s=f-3|0;L1701:do{if((s|0)>0){m=k|0;p=k+4|0;q=k+8|0;r=k+12|0;t=d+2|0;u=d+4|0;v=0;while(1){c[m>>2]=c[a+(v<<2)>>2]|0;w=v|1;c[p>>2]=c[a+(w<<2)>>2]|0;x=v|2;c[q>>2]=c[a+(x<<2)>>2]|0;y=v|3;c[r>>2]=c[a+(y<<2)>>2]|0;bf(l,n+(v<<1)|0,m,g);z=c[m>>2]|0;A=-((z+2048|0)>>>12)&65535;B=v+g|0;b[n+(B<<1)>>1]=A;c[e+(v<<2)>>2]=z;z=c[p>>2]|0;C=A<<16>>16;A=$(b[d>>1]|0,C)+z|0;c[p>>2]=A;z=-((A+2048|0)>>>12)&65535;b[n+(B+1<<1)>>1]=z;c[e+(w<<2)>>2]=A;A=c[q>>2]|0;w=z<<16>>16;z=$(b[d>>1]|0,w)+A|0;A=$(b[t>>1]|0,C)+z|0;c[q>>2]=A;z=-((A+2048|0)>>>12)&65535;b[n+(B+2<<1)>>1]=z;c[e+(x<<2)>>2]=A;A=c[r>>2]|0;x=$(b[d>>1]|0,z<<16>>16)+A|0;A=$(b[t>>1]|0,w)+x|0;x=$(b[u>>1]|0,C)+A|0;c[r>>2]=x;b[n+(B+3<<1)>>1]=-((x+2048|0)>>>12)&65535;c[e+(y<<2)>>2]=x;x=v+4|0;if((x|0)<(s|0)){v=x}else{D=x;break L1701}}}else{D=0}}while(0);L1706:do{if((D|0)<(f|0)){s=D;while(1){d=c[a+(s<<2)>>2]|0;L1709:do{if(o){k=0;v=d;while(1){r=v-$(b[n+(k+s<<1)>>1]|0,b[l+(k<<1)>>1]|0)|0;u=k+1|0;if((u|0)<(g|0)){k=u;v=r}else{E=r;break L1709}}}else{E=d}}while(0);b[n+(s+g<<1)>>1]=(E+2048|0)>>>12&65535;c[e+(s<<2)>>2]=E;d=s+1|0;if((d|0)<(f|0)){s=d}else{break L1706}}}}while(0);if(!o){i=j;return}o=f-1|0;f=0;while(1){b[h+(f<<1)>>1]=c[e+(o-f<<2)>>2]&65535;E=f+1|0;if((E|0)<(g|0)){f=E}else{break}}i=j;return}function bi(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;k=h-g|0;l=i;i=i+(h*2&-1)|0;i=i+7>>3<<3;m=(h|0)>0;if(m){b3(l|0,a|0,h<<1)}L1724:do{if((f|0)>0){n=0;while(1){o=b[e+(n<<1)>>1]|0;b[l+(n<<1)>>1]=$(o,b[a+(n<<1)>>1]|0)>>>15&65535;p=(h-n|0)-1|0;b[l+(p<<1)>>1]=$(o,b[a+(p<<1)>>1]|0)>>>15&65535;p=n+1|0;if((p|0)<(f|0)){n=p}else{break L1724}}}}while(0);f=h+1|0;a=h&1;if((a|0)==0){q=f;r=0}else{e=b[l>>1]|0;q=($(e,e)>>>9)+f|0;r=a}L1731:do{if((r|0)<(h|0)){a=r;f=q;while(1){e=b[l+(a<<1)>>1]|0;n=($(e,e)>>>9)+f|0;e=b[l+(a+1<<1)>>1]|0;p=n+($(e,e)>>>9)|0;e=a+2|0;if((e|0)<(h|0)){a=e;f=p}else{s=p;break L1731}}}else{s=q}}while(0);q=(65567-(b2(s|0)|0)<<16>>16)-19|0;s=(q|0)/2&-1;L1735:do{if(m){r=(q|0)>1;f=-s|0;a=0;while(1){p=l+(a<<1)|0;e=b[p>>1]|0;b[p>>1]=(r?e>>s:e<<f)&65535;e=a+1|0;if((e|0)<(h|0)){a=e}else{break L1735}}}}while(0);bb(l,l,d,k,g+1|0);if((g|0)>-1){t=g}else{u=c[d>>2]|0;v=u+10|0;c[d>>2]=v;i=j;return}while(1){g=t+k|0;L1744:do{if((g|0)<(h|0)){s=g;q=0;while(1){m=$(b[l+(s-t<<1)>>1]|0,b[l+(s<<1)>>1]|0)+q|0;a=s+1|0;if((a|0)<(h|0)){s=a;q=m}else{w=m;break L1744}}}else{w=0}}while(0);g=d+(t<<2)|0;c[g>>2]=(c[g>>2]|0)+w|0;if((t|0)>0){t=t-1|0}else{break}}u=c[d>>2]|0;v=u+10|0;c[d>>2]=v;i=j;return}function bj(a,f,g,h,i,j,k){a=a|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;if((f|0)>=(g|0)){return}l=j+12|0;m=j+16|0;n=j+8|0;o=j+4|0;p=j|0;q=j+20|0;j=a+8|0;a=f;while(1){f=i+(a<<2)|0;r=c[f>>2]|0;L1755:do{if((r|0)>=1){s=0;t=r;while(1){u=c[l>>2]|0;v=c[m>>2]|0;if(v>>>0<t>>>0){w=v+8|0;x=((w|0)>25?v+7|0:24)-v|0;y=c[o>>2]|0;z=u;A=v;B=c[n>>2]|0;while(1){if(B>>>0<y>>>0){C=B+1|0;c[n>>2]=C;D=d[(c[p>>2]|0)+(y-C|0)|0]|0;E=C}else{D=0;E=B}F=D<<A|z;C=A+8|0;if((C|0)<25){z=F;A=C;B=E}else{break}}G=F;H=w+(x&-8)|0}else{G=u;H=v}c[l>>2]=G>>>(t>>>0);c[m>>2]=H-t|0;c[q>>2]=(c[q>>2]|0)+t|0;B=((((G&(1<<t)+4194303)<<10|512)>>c[f>>2]<<16)-33554432|0)>>>16;A=h+($(c[j>>2]|0,s)+a<<1)|0;b[A>>1]=B+(e[A>>1]|0)&65535;A=s+1|0;if((A|0)>=(k|0)){break L1755}s=A;t=c[f>>2]|0}}}while(0);f=a+1|0;if((f|0)<(g|0)){a=f}else{break}}return}function bk(a,f,g,h,i,j,k,l,m){a=a|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=(f|0)>=(g|0);o=l+12|0;p=l+16|0;q=l+8|0;r=l+4|0;s=l|0;t=l+20|0;l=a+8|0;a=(m|0)>1?-m|0:-1;u=0;v=k;while(1){L1773:do{if(n|(v|0)<(m|0)){w=v}else{k=f;x=v;while(1){y=i+(k<<2)|0;do{if((c[y>>2]|0)>7){z=x}else{if((c[j+(k<<2)>>2]|0)==(u|0)){A=0}else{z=x;break}while(1){B=c[o>>2]|0;C=c[p>>2]|0;if((C|0)==0){D=c[q>>2]|0;E=c[r>>2]|0;if(D>>>0<E>>>0){F=D+1|0;c[q>>2]=F;G=d[(c[s>>2]|0)+(E-F|0)|0]|0;H=F}else{G=0;H=D}if(H>>>0<E>>>0){D=H+1|0;c[q>>2]=D;I=(d[(c[s>>2]|0)+(E-D|0)|0]|0)<<8;J=D}else{I=0;J=H}if(J>>>0<E>>>0){D=J+1|0;c[q>>2]=D;K=(d[(c[s>>2]|0)+(E-D|0)|0]|0)<<16;L=D}else{K=0;L=J}if(L>>>0<E>>>0){D=L+1|0;c[q>>2]=D;M=(d[(c[s>>2]|0)+(E-D|0)|0]|0)<<24}else{M=0}N=M|(K|(I|(G|B)));O=32}else{N=B;O=C}c[o>>2]=N>>>1;c[p>>2]=O-1|0;c[t>>2]=(c[t>>2]|0)+1|0;C=(N<<10&1024)-512>>(c[y>>2]|0)+1;B=h+($(c[l>>2]|0,A)+k<<1)|0;b[B>>1]=(e[B>>1]|0)+C&65535;C=A+1|0;if((C|0)<(m|0)){A=C}else{break}}z=a+x|0}}while(0);y=k+1|0;if((y|0)>=(g|0)|(z|0)<(m|0)){w=z;break L1773}else{k=y;x=z}}}}while(0);x=u+1|0;if((x|0)<2){u=x;v=w}else{break}}return}function bl(d,e,f,g,h,i){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=(e|0)>0;k=d+8|0;d=0;while(1){L1802:do{if(j){l=0;while(1){c[g+($(c[k>>2]|0,d)+l<<2)>>2]=0;m=l+1|0;if((m|0)<(e|0)){l=m}else{n=e;break L1802}}}else{n=0}}while(0);L1806:do{if((n|0)<(f|0)){l=n;while(1){m=$(c[k>>2]|0,d)+l|0;o=(((a[l+10352|0]|0)<<6)+(b[h+(m<<1)>>1]|0)&65535)<<16>>16;p=o>>10;do{if((p|0)>14){q=2130706432}else{if((p|0)<-15){q=0;break}r=o-(p<<10)<<20>>16;s=-2-p|0;t=($(($(((r*10204&-1)>>>15<<16)+971177984>>16,r)>>>15<<16)+1494482944>>16,r)>>>15<<16)+1073676288>>16;if((s|0)>0){q=t>>s;break}else{q=t<<-s;break}}}while(0);c[g+(m<<2)>>2]=q+8>>4;p=l+1|0;if((p|0)<(f|0)){l=p}else{u=f;break L1806}}}else{u=n}}while(0);l=c[k>>2]|0;L1817:do{if((u|0)<(l|0)){p=u;o=l;while(1){c[g+($(o,d)+p<<2)>>2]=0;s=p+1|0;t=c[k>>2]|0;if((s|0)<(t|0)){p=s;o=t}else{break L1817}}}}while(0);l=d+1|0;if((l|0)<(i|0)){d=l}else{break}}return}function bm(a,e,f,g,h,j,k,l){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;m=i;i=i+8|0;n=m|0;o=n;c[n>>2]=0;c[n+4>>2]=0;if((h|0)==0){p=b[4768+(l<<1)>>1]|0;q=b[11232+(l<<1)>>1]|0}else{p=0;q=4915}n=j+4|0;r=c[n>>2]<<3;if((e|0)>=(f|0)){i=m;return}s=j+20|0;t=j+28|0;u=a+8|0;a=j+32|0;v=j+40|0;w=j+24|0;x=j|0;y=e;while(1){e=(y|0)<20?y<<1:40;z=10016+(l*84&-1)+(h*42&-1)+e|0;A=(e|1)+(10016+(l*84&-1)+(h*42&-1))|0;e=0;while(1){B=c[s>>2]|0;C=c[t>>2]|0;D=(r-B|0)-(b2(C|0)|-32)|0;do{if((D|0)>14){E=a7(j,(d[z]|0)<<7,(d[A]|0)<<6)|0}else{if((D|0)>1){F=c[a>>2]|0;G=C>>>2;H=-1;I=C;while(1){J=H+1|0;K=$(d[J+312|0]|0,G);if(F>>>0<K>>>0){H=J;I=K}else{break}}H=F-K|0;c[a>>2]=H;G=I-K|0;c[t>>2]=G;L1840:do{if(G>>>0<8388609){L=c[n>>2]|0;M=B;N=G;O=c[v>>2]|0;P=c[w>>2]|0;Q=H;while(1){R=M+8|0;c[s>>2]=R;S=N<<8;c[t>>2]=S;if(P>>>0<L>>>0){T=P+1|0;c[w>>2]=T;U=d[(c[x>>2]|0)+P|0]|0;V=T}else{U=0;V=P}c[v>>2]=U;T=((U|O<<8)>>>1&255|Q<<8&2147483392)^255;c[a>>2]=T;if(S>>>0<8388609){M=R;N=S;O=U;P=V;Q=T}else{break L1840}}}}while(0);E=J>>1^-(J&1);break}if((D|0)<=0){E=-1;break}H=c[a>>2]|0;G=C>>>1;I=H>>>0<G>>>0;F=I&1;if(I){W=G;X=H}else{I=H-G|0;c[a>>2]=I;W=C-G|0;X=I}c[t>>2]=W;L1853:do{if(W>>>0<8388609){I=c[n>>2]|0;G=B;H=W;Q=c[v>>2]|0;P=c[w>>2]|0;O=X;while(1){N=G+8|0;c[s>>2]=N;M=H<<8;c[t>>2]=M;if(P>>>0<I>>>0){L=P+1|0;c[w>>2]=L;Y=d[(c[x>>2]|0)+P|0]|0;Z=L}else{Y=0;Z=P}c[v>>2]=Y;L=((Y|Q<<8)>>>1&255|O<<8&2147483392)^255;c[a>>2]=L;if(M>>>0<8388609){G=N;H=M;Q=Y;P=Z;O=L}else{break L1853}}}}while(0);E=-F|0}}while(0);B=g+($(c[u>>2]|0,e)+y<<1)|0;C=b[B>>1]|0;b[B>>1]=C<<16>>16<-9216?-9216:C;C=g+($(c[u>>2]|0,e)+y<<1)|0;B=$(b[C>>1]|0,p)+128>>8;D=o+(e<<2)|0;O=c[D>>2]|0;P=E<<17;Q=(O+P|0)+B|0;b[C>>1]=(Q|0)<-3670016?-28672:(Q+64|0)>>>7&65535;c[D>>2]=(P-$(E<<18>>16,q)|0)+O|0;O=e+1|0;if((O|0)<(k|0)){e=O}else{break}}e=y+1|0;if((e|0)<(f|0)){y=e}else{break}}i=m;return}function bn(a,e,f,g,h,j,k,l,m,n,o,p,q,r,s,t,u,v,w){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;u=u|0;v=v|0;w=w|0;var x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0;x=i;y=(m|0)>0?m:0;m=c[a+8>>2]|0;z=(y|0)>7?8:0;A=y-z|0;y=(r|0)==2;do{if(y){B=d[11960+(f-e|0)|0]|0;if((B|0)>(A|0)){C=A;D=0;E=0;break}F=A-B|0;G=(F|0)>7?8:0;C=F-G|0;D=G;E=B}else{C=A;D=0;E=0}}while(0);A=i;i=i+(m*4&-1)|0;i=i+7>>3<<3;B=i;i=i+(m*4&-1)|0;i=i+7>>3<<3;G=i;i=i+(m*4&-1)|0;i=i+7>>3<<3;F=i;i=i+(m*4&-1)|0;i=i+7>>3<<3;H=(e|0)<(f|0);L1870:do{if(H){I=r<<3;J=a+24|0;K=c[J>>2]|0;L=f-1|0;M=$((j-5|0)-s|0,r);N=s+3|0;O=e;P=b[K+(e<<1)>>1]|0;while(1){Q=O+1|0;R=b[K+(Q<<1)>>1]|0;S=(R<<16>>16)-(P<<16>>16)|0;T=(S*3&-1)<<s<<3>>4;c[G+(O<<2)>>2]=(I|0)>(T|0)?I:T;c[F+(O<<2)>>2]=($($(M,L-O|0),S)<<N>>6)-((S<<s|0)==1?I:0)|0;if((Q|0)<(f|0)){O=Q;P=R}else{U=J;V=I;break L1870}}}else{U=a+24|0;V=r<<3}}while(0);j=c[a+40>>2]|0;I=a+44|0;J=1;P=j-1|0;while(1){O=J+P>>1;L1878:do{if(H){N=c[U>>2]|0;L=$(O,m);M=c[I>>2]|0;K=1;R=0;Q=f;S=b[N+(f<<1)>>1]|0;while(1){T=R;W=Q;X=S;while(1){Y=W-1|0;Z=b[N+(Y<<1)>>1]|0;_=$((X<<16>>16)-(Z<<16>>16)|0,r);aa=$(_,d[M+(Y+L|0)|0]|0)<<s>>2;if((aa|0)>0){_=(c[F+(Y<<2)>>2]|0)+aa|0;ab=(_|0)<0?0:_}else{ab=aa}ac=(c[g+(Y<<2)>>2]|0)+ab|0;if(!((ac|0)<(c[G+(Y<<2)>>2]|0)&K)){break}aa=((ac|0)<(V|0)?0:V)+T|0;if((Y|0)>(e|0)){T=aa;W=Y;X=Z}else{ad=aa;break L1878}}X=c[h+(Y<<2)>>2]|0;W=((ac|0)<(X|0)?ac:X)+T|0;if((Y|0)>(e|0)){K=0;R=W;Q=Y;S=Z}else{ad=W;break L1878}}}else{ad=0}}while(0);S=(ad|0)>(C|0);Q=S?O-1|0:P;ae=S?J:O+1|0;if((ae|0)>(Q|0)){break}else{J=ae;P=Q}}P=ae-1|0;L1891:do{if(H){J=c[U>>2]|0;ad=$(P,m);Z=c[I>>2]|0;Y=(ae|0)<(j|0);ac=$(ae,m);ab=(P|0)>0;Q=e;S=e;R=b[J+(e<<1)>>1]|0;while(1){K=S+1|0;L=b[J+(K<<1)>>1]|0;M=$((L<<16>>16)-(R<<16>>16)|0,r);N=$(M,d[Z+(S+ad|0)|0]|0)<<s>>2;if(Y){af=$(d[Z+(S+ac|0)|0]|0,M)<<s>>2}else{af=c[h+(S<<2)>>2]|0}if((N|0)>0){M=(c[F+(S<<2)>>2]|0)+N|0;ag=(M|0)<0?0:M}else{ag=N}if((af|0)>0){N=(c[F+(S<<2)>>2]|0)+af|0;ah=(N|0)<0?0:N}else{ah=af}N=c[g+(S<<2)>>2]|0;M=ag+(ab?N:0)|0;W=(N|0)>0?S:Q;X=(ah-M|0)+N|0;c[A+(S<<2)>>2]=M;c[B+(S<<2)>>2]=(X|0)<0?0:X;if((K|0)<(f|0)){Q=W;S=K;R=L}else{ai=W;break L1891}}}else{ai=e}}while(0);ah=(r|0)>1;ag=0;g=64;af=0;while(1){F=g+af>>1;L1908:do{if(H){P=1;m=0;ae=f;while(1){j=m;I=ae;while(1){aj=I-1|0;R=c[A+(aj<<2)>>2]|0;ak=($(c[B+(aj<<2)>>2]|0,F)>>6)+R|0;if(!((ak|0)<(c[G+(aj<<2)>>2]|0)&P)){break}R=((ak|0)<(V|0)?0:V)+j|0;if((aj|0)>(e|0)){j=R;I=aj}else{al=R;break L1908}}I=c[h+(aj<<2)>>2]|0;T=((ak|0)<(I|0)?ak:I)+j|0;if((aj|0)>(e|0)){P=0;m=T;ae=aj}else{al=T;break L1908}}}else{al=0}}while(0);ae=(al|0)>(C|0);am=ae?af:F;m=ag+1|0;if((m|0)<6){ag=m;g=ae?F:g;af=am}else{break}}af=ah&1;g=s<<3;L1917:do{if(H){ag=0;al=0;aj=f;while(1){ak=aj-1|0;ae=c[A+(ak<<2)>>2]|0;m=($(c[B+(ak<<2)>>2]|0,am)>>6)+ae|0;if((m|0)<(c[G+(ak<<2)>>2]|0)&(ag|0)==0){an=(m|0)<(V|0)?0:V;ao=0}else{an=m;ao=1}m=c[h+(ak<<2)>>2]|0;ae=(an|0)<(m|0)?an:m;c[o+(ak<<2)>>2]=ae;m=ae+al|0;if((ak|0)>(e|0)){ag=ao;al=m;aj=ak}else{ap=m;break L1917}}}else{ap=0}}while(0);ao=f-1|0;L1924:do{if((ao|0)>(ai|0)){an=V+8|0;am=(u|0)==0;B=t+28|0;A=t+32|0;H=t+20|0;aj=t+40|0;al=t+24|0;ag=t+4|0;F=t|0;m=e+2|0;ak=f;ae=ap;P=E;T=ao;L1926:while(1){I=C-ae|0;R=c[U>>2]|0;S=b[R+(ak<<1)>>1]|0;Q=b[R+(e<<1)>>1]|0;ab=S-Q|0;ac=(I|0)/(ab|0)&-1;Z=I-$(ab,ac)|0;ab=b[R+(T<<1)>>1]|0;R=Z+(Q-ab|0)|0;Q=S-ab|0;ab=o+(T<<2)|0;S=c[ab>>2]|0;Z=($(Q,ac)+S|0)+((R|0)>0?R:0)|0;R=c[G+(T<<2)>>2]|0;if((Z|0)<(((R|0)>(an|0)?R:an)|0)){aq=ae;ar=Z;as=S}else{L1930:do{if(am){S=c[B>>2]|0;R=c[A>>2]|0;ac=S>>>1;I=R>>>0<ac>>>0;if(I){at=ac;au=R}else{Y=R-ac|0;c[A>>2]=Y;at=S-ac|0;au=Y}c[B>>2]=at;L1935:do{if(at>>>0<8388609){Y=c[ag>>2]|0;ac=c[H>>2]|0;S=at;R=c[aj>>2]|0;ad=c[al>>2]|0;J=au;while(1){O=ac+8|0;c[H>>2]=O;W=S<<8;c[B>>2]=W;if(ad>>>0<Y>>>0){L=ad+1|0;c[al>>2]=L;av=d[(c[F>>2]|0)+ad|0]|0;aw=L}else{av=0;aw=ad}c[aj>>2]=av;L=((av|R<<8)>>>1&255|J<<8&2147483392)^255;c[A>>2]=L;if(W>>>0<8388609){ac=O;S=W;R=av;ad=aw;J=L}else{break L1935}}}}while(0);if(I){ax=C;ay=ak;az=ae;aA=P;break L1924}}else{if((ak|0)<=(m|0)){break L1926}if(!((Z|0)<=($(Q,(T|0)<(v|0)?7:9)<<s<<3>>4|0)|(T|0)>(w|0))){break L1926}j=c[B>>2]|0;J=j-(j>>>1)|0;c[B>>2]=J;if(J>>>0>=8388609){break}J=c[A>>2]|0;while(1){a4(t,J>>>23);j=c[A>>2]<<8&2147483392;c[A>>2]=j;ad=c[B>>2]<<8;c[B>>2]=ad;c[H>>2]=(c[H>>2]|0)+8|0;if(ad>>>0<8388609){J=j}else{break L1930}}}}while(0);aq=ae+8|0;ar=Z-8|0;as=c[ab>>2]|0}if((P|0)>0){aB=d[11960+(T-e|0)|0]|0}else{aB=P}Q=(ar|0)<(V|0)?0:V;J=((aq-(as+P|0)|0)+Q|0)+aB|0;c[ab>>2]=Q;Q=T-1|0;if((Q|0)>(ai|0)){ak=T;ae=J;P=aB;T=Q}else{aC=T;aD=J;aE=aB;aF=1319;break L1924}}T=c[B>>2]|0;m=T>>>1;aj=(T-m|0)+(c[A>>2]|0)|0;c[A>>2]=aj;c[B>>2]=m;if(T>>>0<16777218){aG=aj}else{ax=C;ay=ak;az=ae;aA=P;break}while(1){a4(t,aG>>>23);aj=c[A>>2]<<8&2147483392;c[A>>2]=aj;T=c[B>>2]<<8;c[B>>2]=T;c[H>>2]=(c[H>>2]|0)+8|0;if(T>>>0<8388609){aG=aj}else{ax=C;ay=ak;az=ae;aA=P;break L1924}}}else{aC=f;aD=ap;aE=E;aF=1319}}while(0);if((aF|0)==1319){ax=C+z|0;ay=aC;az=aD;aA=aE}do{if((aA|0)>0){if((u|0)==0){aE=(a2(t,(1-e|0)+ay|0)|0)+e|0;c[k>>2]=aE;aH=aE;break}else{aE=c[k>>2]|0;aD=(aE|0)<(ay|0)?aE:ay;c[k>>2]=aD;a3(t,aD-e|0,(1-e|0)+ay|0);aH=c[k>>2]|0;break}}else{c[k>>2]=0;aH=0}}while(0);aA=(aH|0)>(e|0);aH=aA?0:D;L1967:do{if(aA&(D|0)!=0){if((u|0)!=0){aD=t+28|0;aE=c[aD>>2]|0;aC=t+32|0;z=aE>>>1;C=aE-z|0;aE=(c[l>>2]|0)!=0;if(aE){c[aC>>2]=(c[aC>>2]|0)+C|0}aF=aE?z:C;c[aD>>2]=aF;if(aF>>>0>=8388609){break}aF=t+20|0;C=c[aC>>2]|0;while(1){a4(t,C>>>23);z=c[aC>>2]<<8&2147483392;c[aC>>2]=z;aE=c[aD>>2]<<8;c[aD>>2]=aE;c[aF>>2]=(c[aF>>2]|0)+8|0;if(aE>>>0<8388609){C=z}else{break L1967}}}C=t+28|0;aF=c[C>>2]|0;aD=t+32|0;aC=c[aD>>2]|0;z=aF>>>1;aE=aC>>>0<z>>>0;E=aE&1;if(aE){aI=z;aJ=aC}else{aE=aC-z|0;c[aD>>2]=aE;aI=aF-z|0;aJ=aE}c[C>>2]=aI;L1982:do{if(aI>>>0<8388609){aE=t+20|0;z=t+40|0;aF=t+24|0;aC=t|0;ap=c[t+4>>2]|0;aG=c[aE>>2]|0;aB=aI;ai=c[z>>2]|0;as=c[aF>>2]|0;aq=aJ;while(1){ar=aG+8|0;c[aE>>2]=ar;w=aB<<8;c[C>>2]=w;if(as>>>0<ap>>>0){v=as+1|0;c[aF>>2]=v;aK=d[(c[aC>>2]|0)+as|0]|0;aL=v}else{aK=0;aL=as}c[z>>2]=aK;v=((aK|ai<<8)>>>1&255|aq<<8&2147483392)^255;c[aD>>2]=v;if(w>>>0<8388609){aG=ar;aB=w;ai=aK;as=aL;aq=v}else{break L1982}}}}while(0);c[l>>2]=E}else{c[l>>2]=0}}while(0);aL=aH+(ax-az|0)|0;az=c[U>>2]|0;ax=b[az+(e<<1)>>1]|0;aH=(b[az+(ay<<1)>>1]|0)-ax|0;aK=(aL|0)/(aH|0)&-1;aJ=aL-$(aH,aK)|0;L1991:do{if((ay|0)>(e|0)){aH=e+1|0;aL=$((b[az+(aH<<1)>>1]|0)-ax|0,aK);aI=o+(e<<2)|0;c[aI>>2]=aL+(c[aI>>2]|0)|0;L1993:do{if((aH|0)<(ay|0)){aI=aH;while(1){aL=c[U>>2]|0;t=aI+1|0;u=$((b[aL+(t<<1)>>1]|0)-(b[aL+(aI<<1)>>1]|0)|0,aK);aL=o+(aI<<2)|0;c[aL>>2]=u+(c[aL>>2]|0)|0;if((t|0)<(ay|0)){aI=t}else{aM=aJ;aN=e;break L1993}}}else{aM=aJ;aN=e}}while(0);while(1){aH=aN+1|0;E=c[U>>2]|0;aI=(b[E+(aH<<1)>>1]|0)-(b[E+(aN<<1)>>1]|0)|0;E=(aM|0)<(aI|0)?aM:aI;aI=o+(aN<<2)|0;c[aI>>2]=E+(c[aI>>2]|0)|0;if((aH|0)>=(ay|0)){break}aM=aM-E|0;aN=aH}aH=a+48|0;E=ah?4:3;aI=0;t=e;while(1){aL=t+1|0;u=c[U>>2]|0;D=(b[u+(aL<<1)>>1]|0)-(b[u+(t<<1)>>1]|0)<<s;u=o+(t<<2)|0;aA=(c[u>>2]|0)+aI|0;if((D|0)>1){aD=aA-(c[h+(t<<2)>>2]|0)|0;C=(aD|0)>0?aD:0;aD=aA-C|0;c[u>>2]=aD;aq=$(D,r);do{if(y&(D|0)>2){if((c[l>>2]|0)!=0){aO=0;break}aO=(t|0)<(c[k>>2]|0)&1}else{aO=0}}while(0);as=aO+aq|0;ai=$((b[(c[aH>>2]|0)+(t<<1)>>1]|0)+g|0,as);aB=(ai>>1)+(as*-21&-1)|0;if((D|0)==2){aP=aB+(as<<3>>2)|0}else{aP=aB}aB=aP+aD|0;do{if((aB|0)<(as<<4|0)){aQ=aP+(ai>>2)|0}else{if((aB|0)>=(as*24&-1|0)){aQ=aP;break}aQ=aP+(ai>>3)|0}}while(0);ai=as<<3;aB=(((as<<2)+aD|0)+aQ|0)/(ai|0)&-1;D=(aB|0)<0?0:aB;aB=p+(t<<2)|0;c[aB>>2]=D;aq=$(D,r);aG=c[u>>2]|0;if((aq|0)>(aG>>3|0)){aq=aG>>af>>3;c[aB>>2]=aq;aR=aq}else{aR=D}D=(aR|0)<8?aR:8;c[aB>>2]=D;aq=$(D,ai);c[q+(t<<2)>>2]=(aq|0)>=((c[u>>2]|0)+aQ|0)&1;aq=$(c[aB>>2]|0,V);c[u>>2]=(c[u>>2]|0)-aq|0;aS=C}else{aq=aA-V|0;aB=(aq|0)<0?0:aq;c[u>>2]=aA-aB|0;c[p+(t<<2)>>2]=0;c[q+(t<<2)>>2]=1;aS=aB}if((aS|0)>0){aB=aS>>E;aq=p+(t<<2)|0;ai=c[aq>>2]|0;D=8-ai|0;aG=(aB|0)<(D|0)?aB:D;c[aq>>2]=aG+ai|0;ai=$(aG,V);c[q+(t<<2)>>2]=(ai|0)>=(aS-aI|0)&1;aT=aS-ai|0}else{aT=aS}if((aL|0)<(ay|0)){aI=aT;t=aL}else{aU=aT;aV=ay;break L1991}}}else{aU=0;aV=e}}while(0);c[n>>2]=aU;if((aV|0)<(f|0)){aW=aV}else{i=x;return ay|0}while(1){aV=o+(aW<<2)|0;aU=p+(aW<<2)|0;c[aU>>2]=c[aV>>2]>>af>>3;c[aV>>2]=0;c[q+(aW<<2)>>2]=(c[aU>>2]|0)<1&1;aU=aW+1|0;if((aU|0)<(f|0)){aW=aU}else{break}}i=x;return ay|0}function bo(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;j=i;k=i;i=i+(d*2&-1)|0;i=i+7>>3<<3;l=i;i=i+(d*4&-1)|0;i=i+7>>3<<3;m=i;i=i+(d*2&-1)|0;i=i+7>>3<<3;bp(a,d,1,g,e,f);f=(d|0)>1?d:1;b1(l|0,0,f<<2|0);b1(k|0,0,f<<1|0);f=0;while(1){n=a+(f<<1)|0;o=b[n>>1]|0;p=m+(f<<1)|0;if(o<<16>>16>0){b[p>>1]=1}else{b[p>>1]=-1;b[n>>1]=-o&65535}o=f+1|0;if((o|0)<(d|0)){f=o}else{break}}L2038:do{if((d>>1|0)<(e|0)){f=0;o=0;while(1){q=(b[a+(f<<1)>>1]|0)+o|0;n=f+1|0;if((n|0)<(d|0)){f=n;o=q}else{break}}if((q|0)>(e|0)){r=q}else{b[a>>1]=16384;b1(a+2|0,0,((d|0)>2?(d<<1)-2|0:2)|0);r=16384}o=65567-(b2(r|0)|0)<<16>>16;f=o-15|0;n=(f|0)>0;if(n){s=r>>f}else{s=r<<15-o}p=(s<<16^-2147483648)>>16;t=(p*-15420&-1)>>>15<<16;u=t+2021130240>>16;v=u-($((t-126353408|0)+($(u,p)>>>15<<16)>>16,u)>>>15)<<16;u=v>>16;t=o-16|0;w=(t|0)>0;x=u-((($(($(u,p)>>>15<<16)+(v^-2147483648)>>16,u)>>>15<<16)+65536|0)>>>16)<<16>>16;if(w){y=x>>t}else{y=x<<16-o}if(n){z=r>>f}else{z=r<<15-o}f=(z<<16^-2147483648)>>16;n=(f*-15420&-1)>>>15<<16;x=n+2021130240>>16;u=x-($((n-126353408|0)+($(x,f)>>>15<<16)>>16,x)>>>15)<<16;x=u>>16;n=x-((($(($(x,f)>>>15<<16)+(u^-2147483648)>>16,x)>>>15<<16)+65536|0)>>>16)<<16>>16;if(w){A=n>>t}else{A=n<<16-o}o=$(A&65535|y&-65536,(e<<16)-65536>>16)>>16;n=0;t=e;w=0;x=0;while(1){u=b[a+(n<<1)>>1]|0;f=$(u,o)>>15;c[l+(n<<2)>>2]=f;v=f&65535;p=$(v,v)+x&65535;B=$(v<<16>>16,u)+w|0;b[k+(n<<1)>>1]=f<<1&65535;u=t-f|0;f=n+1|0;if((f|0)<(d|0)){n=f;t=u;w=B;x=p}else{C=u;D=B;E=p;break L2038}}}else{C=e;D=0;E=0}}while(0);L2064:do{if((C|0)>(d+3|0)){c[l>>2]=(c[l>>2]|0)+C|0;F=0;break}else{if((C|0)<=0){F=0;break}y=(e+1|0)-C|0;A=E;z=D;r=0;while(1){s=(65567-(b2(y+r|0)|0)<<16>>16)+1|0;q=A+1&65535;x=0;w=0;t=-32767;n=0;while(1){o=(b[k+(x<<1)>>1]|0)+q&65535;p=(b[a+(x<<1)>>1]|0)+z>>s<<16>>16;B=$(p,p)>>>15&65535;p=$(B<<16>>16,w<<16>>16);u=(p|0)>($(o<<16>>16,t<<16>>16)|0);G=u?x:n;p=x+1|0;if((p|0)>=(d|0)){break}x=p;w=u?o:w;t=u?B:t;n=G}n=(b[a+(G<<1)>>1]|0)+z|0;t=k+(G<<1)|0;w=b[t>>1]|0;b[t>>1]=w+2&65535;t=l+(G<<2)|0;c[t>>2]=(c[t>>2]|0)+1|0;t=r+1|0;if((t|0)<(C|0)){A=w+q&65535;z=n;r=t}else{F=0;break L2064}}}}while(0);while(1){C=b[m+(F<<1)>>1]|0;G=a+(F<<1)|0;b[G>>1]=$(b[G>>1]|0,C);if(C<<16>>16<0){C=l+(F<<2)|0;c[C>>2]=-(c[C>>2]|0)|0}C=F+1|0;if((C|0)<(d|0)){F=C}else{break}}a0(l,d,e,h);if((g|0)<2){H=1;i=j;return H|0}h=(d|0)/(g|0)&-1;d=0;e=0;while(1){F=$(d,h);a=0;m=e;while(1){I=((c[l+(a+F<<2)>>2]|0)!=0&1)<<d|m;C=a+1|0;if((C|0)<(h|0)){a=C;m=I}else{break}}m=d+1|0;if((m|0)<(g|0)){d=m;e=I}else{H=I;break}}i=j;return H|0}function bp(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;if((g<<1|0)>=(d|0)|(h|0)==0){return}i=(d<<16>>16)*32767&-1;j=i>>16;k=$(c[9952+(h-1<<2)>>2]|0,g)+d|0;g=65567-(b2(k|0)|0)<<16>>16;h=g-15|0;l=(h|0)>0;if(l){m=k>>h}else{m=k<<15-g}n=(m<<16^-2147483648)>>16;m=(n*-15420&-1)>>>15<<16;o=m+2021130240>>16;p=o-($((m-126353408|0)+($(o,n)>>>15<<16)>>16,o)>>>15)<<16;o=p>>16;m=g-16|0;q=(m|0)>0;r=o-((($(($(o,n)>>>15<<16)+(p^-2147483648)>>16,o)>>>15<<16)+65536|0)>>>16)<<16>>16;if(q){s=r>>m}else{s=r<<16-g}r=$(j<<1,s>>16);if(l){t=k>>h}else{t=k<<15-g}s=(t<<16^-2147483648)>>16;t=(s*-15420&-1)>>>15<<16;o=t+2021130240>>16;p=o-($((t-126353408|0)+($(o,s)>>>15<<16)>>16,o)>>>15)<<16;o=p>>16;t=o-((($(($(o,s)>>>15<<16)+(p^-2147483648)>>16,o)>>>15<<16)+65536|0)>>>16)<<16>>16;if(q){u=t>>m}else{u=t<<16-g}t=($(u&65535,j)>>>15)+r|0;if(l){v=k>>h}else{v=k<<15-g}k=(v<<16^-2147483648)>>16;v=(k*-15420&-1)>>>15<<16;h=v+2021130240>>16;l=h-($((v-126353408|0)+($(h,k)>>>15<<16)>>16,h)>>>15)<<16;h=l>>16;v=h-((($(($(h,k)>>>15<<16)+(l^-2147483648)>>16,h)>>>15<<16)+65536|0)>>>16)<<16>>16;if(q){w=v>>m}else{w=v<<16-g}g=t+($(w>>16,i&65535)>>>15)<<16>>16;i=$(g,g)>>>16;g=a6(i)|0;w=a6(i^32767)|0;L2117:do{if((f<<3|0)>(d|0)){x=0}else{i=f>>2;t=1;while(1){if(($($(t,t)+t|0,f)+i|0)<(d|0)){t=t+1|0}else{x=t;break L2117}}}}while(0);t=(d|0)/(f|0)&-1;if((f|0)<=0){return}d=(e|0)<0;e=(x|0)==0;i=t-1|0;v=(i|0)>0;m=g<<16>>16;q=w<<16>>16;h=t-3|0;l=(t-2|0)>0;k=t-x|0;r=(k|0)>0;j=t-(x<<1)|0;u=j-1|0;o=(j|0)>0;j=(-w&65535)<<16>>16;w=(-g&65535)<<16>>16;g=0;while(1){p=$(g,t);L2127:do{if(d){L2129:do{if(!e){L2131:do{if(r){s=a+(p<<1)|0;n=0;while(1){y=b[s>>1]|0;z=s+(x<<1)|0;A=b[z>>1]|0;B=$(A,q);C=y<<16>>16;b[z>>1]=(B+$(C,m)|0)>>>15&65535;B=$(C,q);b[s>>1]=(B-$(A,m)|0)>>>15&65535;A=n+1|0;if((A|0)<(k|0)){s=s+2|0;n=A}else{break L2131}}}}while(0);if(!o){break}n=a+(p+u<<1)|0;s=u;while(1){A=b[n>>1]|0;B=n+(x<<1)|0;C=b[B>>1]|0;z=$(C,q);y=A<<16>>16;b[B>>1]=(z+$(y,m)|0)>>>15&65535;z=$(y,q);b[n>>1]=(z-$(C,m)|0)>>>15&65535;if((s|0)>0){n=n-2|0;s=s-1|0}else{break L2129}}}}while(0);L2140:do{if(v){s=a+(p<<1)|0;n=s;C=0;z=b[s>>1]|0;while(1){s=n+2|0;y=b[s>>1]|0;B=$(y,m);A=z<<16>>16;D=(B+$(A,q)|0)>>>15&65535;b[s>>1]=D;B=$(A,m);b[n>>1]=(B-$(y,q)|0)>>>15&65535;y=C+1|0;if((y|0)<(i|0)){n=s;C=y;z=D}else{break L2140}}}}while(0);if(!l){break}z=a+(p+h<<1)|0;C=h;while(1){n=b[z>>1]|0;D=z+2|0;y=b[D>>1]|0;s=$(y,m);B=n<<16>>16;b[D>>1]=(s+$(B,q)|0)>>>15&65535;s=$(B,m);b[z>>1]=(s-$(y,q)|0)>>>15&65535;if((C|0)>0){z=z-2|0;C=C-1|0}else{break L2127}}}else{C=a+(p<<1)|0;L2149:do{if(v){z=C;y=0;s=b[C>>1]|0;while(1){B=z+2|0;D=b[B>>1]|0;n=$(D,m);A=s<<16>>16;E=(n+$(A,j)|0)>>>15&65535;b[B>>1]=E;n=$(A,m);b[z>>1]=(n-$(D,j)|0)>>>15&65535;D=y+1|0;if((D|0)<(i|0)){z=B;y=D;s=E}else{break L2149}}}}while(0);L2154:do{if(l){s=a+(p+h<<1)|0;y=h;while(1){z=b[s>>1]|0;E=s+2|0;D=b[E>>1]|0;B=$(D,m);n=z<<16>>16;b[E>>1]=(B+$(n,j)|0)>>>15&65535;B=$(n,m);b[s>>1]=(B-$(D,j)|0)>>>15&65535;if((y|0)>0){s=s-2|0;y=y-1|0}else{break L2154}}}}while(0);if(e){break}L2160:do{if(r){y=C;s=0;while(1){D=b[y>>1]|0;B=y+(x<<1)|0;n=b[B>>1]|0;E=$(n,q);z=D<<16>>16;b[B>>1]=(E+$(z,w)|0)>>>15&65535;E=$(z,q);b[y>>1]=(E-$(n,w)|0)>>>15&65535;n=s+1|0;if((n|0)<(k|0)){y=y+2|0;s=n}else{break L2160}}}}while(0);if(!o){break}C=a+(p+u<<1)|0;s=u;while(1){y=b[C>>1]|0;n=C+(x<<1)|0;E=b[n>>1]|0;z=$(E,q);B=y<<16>>16;b[n>>1]=(z+$(B,w)|0)>>>15&65535;z=$(B,q);b[C>>1]=(z-$(E,w)|0)>>>15&65535;if((s|0)>0){C=C-2|0;s=s-1|0}else{break L2127}}}}while(0);p=g+1|0;if((p|0)<(f|0)){g=p}else{break}}return}function bq(a,d,e,f,g,h,j){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;l=i;i=i+(d*4&-1)|0;i=i+7>>3<<3;a1(l,d,e,h);h=0;m=0;while(1){n=c[l+(h<<2)>>2]<<16>>16;o=$(n,n)+m|0;n=h+1|0;if((n|0)<(d|0)){h=n;m=o}else{break}}m=65567-(b2(o|0)|0)<<16>>17;h=m<<1;n=h-14|0;if((n|0)>0){p=o>>n}else{p=o<<14-h}h=(p<<16^-2147483648)>>16;p=($(((h*6713&-1)>>>15<<16)-884080640>>16,h)>>>15<<16)+1543831552>>16;o=$(p,p)>>>15<<16>>16;n=(($(o,h)>>>15)+o<<17^-2147483648)>>16;o=($(($($(((n*12288&-1)>>>15<<16)-1073741824>>16,n)>>>15<<16>>16,p)>>>15)+p<<16>>16,j<<16>>16)+16384|0)>>>15<<16>>16;j=m+1|0;m=1<<j>>1;p=0;while(1){b[a+(p<<1)>>1]=$(c[l+(p<<2)>>2]<<16>>16,o)+m>>j&65535;n=p+1|0;if((n|0)<(d|0)){p=n}else{break}}bp(a,d,-1,g,e,f);if((g|0)<2){q=1;i=k;return q|0}f=(d|0)/(g|0)&-1;d=0;e=0;while(1){a=$(d,f);p=0;j=e;while(1){r=((c[l+(p+a<<2)>>2]|0)!=0&1)<<d|j;m=p+1|0;if((m|0)<(f|0)){p=m;j=r}else{break}}j=d+1|0;if((j|0)<(g|0)){d=j;e=r}else{q=r;break}}i=k;return q|0}function br(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=(c|0)>0;L2190:do{if(e){f=1;g=0;h=a;while(1){i=b[h>>1]|0;j=$(i,i)+f|0;i=g+1|0;if((i|0)<(c|0)){f=j;g=i;h=h+2|0}else{k=j;break L2190}}}else{k=1}}while(0);h=65567-(b2(k|0)|0)<<16>>17;g=h<<1;f=g-14|0;if((f|0)>0){l=k>>f}else{l=k<<14-g}g=(l<<16^-2147483648)>>16;l=($(((g*6713&-1)>>>15<<16)-884080640>>16,g)>>>15<<16)+1543831552>>16;k=$(l,l)>>>15<<16>>16;f=(($(k,g)>>>15)+k<<17^-2147483648)>>16;if(!e){return}e=($(($($(((f*12288&-1)>>>15<<16)-1073741824>>16,f)>>>15<<16>>16,l)>>>15)+l<<16>>16,d<<16>>16)+16384|0)>>>15<<16>>16;d=h+1|0;h=1<<d>>1;l=0;f=a;while(1){b[f>>1]=$(b[f>>1]|0,e)+h>>d&65535;a=l+1|0;if((a|0)<(c|0)){l=a;f=f+2|0}else{break}}return}function bs(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;f=(e|0)>0;L2205:do{if((d|0)==0){if(f){g=1;h=1;i=0}else{j=1;k=1;l=1520;break}while(1){m=b[c+(i<<1)>>1]|0;n=b[a+(i<<1)>>1]|0;o=$(n,n)+h|0;n=m<<16>>16;m=$(n,n)+g|0;n=i+1|0;if((n|0)<(e|0)){g=m;h=o;i=n}else{p=o;q=m;l=1518;break L2205}}}else{if(f){r=1;s=1;t=0}else{j=1;k=1;l=1520;break}while(1){m=(b[a+(t<<1)>>1]|0)>>>1<<16>>16;o=(b[c+(t<<1)>>1]|0)>>>1<<16>>16;n=o+m<<16>>16;u=$(n,n)+s|0;n=m-o<<16>>16;o=$(n,n)+r|0;n=t+1|0;if((n|0)<(e|0)){r=o;s=u;t=n}else{p=u;q=o;l=1518;break L2205}}}}while(0);do{if((l|0)==1518){if((p|0)==0){v=0;w=q;break}if((p|0)>1073741823){v=32767;w=q;break}else{j=p;k=q;l=1520;break}}}while(0);do{if((l|0)==1520){q=65567-(b2(j|0)|0)<<16>>17;p=q<<1;t=p-14|0;if((t|0)>0){x=j>>t}else{x=j<<14-p}p=(x<<16^-2147483648)>>16;t=($(($(($(((p*-664&-1)>>>15<<16)+111345664>>16,p)>>>15<<16)-197328896>>16,p)>>>15<<16)+757661696>>16,p)>>>15<<16)+1518796800>>16;p=14-q|0;if((p|0)>0){v=t>>p&65535;w=k;break}else{v=t<<-p&65535;w=k;break}}}while(0);do{if((w|0)==0){y=0;l=1535}else{if((w|0)>1073741823){z=32767;A=v<<16>>16;break}k=65567-(b2(w|0)|0)<<16>>17;x=k<<1;j=x-14|0;if((j|0)>0){B=w>>j}else{B=w<<14-x}x=(B<<16^-2147483648)>>16;j=($(($(($(((x*-664&-1)>>>15<<16)+111345664>>16,x)>>>15<<16)-197328896>>16,x)>>>15<<16)+757661696>>16,x)>>>15<<16)+1518796800>>16;x=14-k|0;if((x|0)>0){y=j>>x&65535;l=1535;break}else{y=j<<-x&65535;l=1535;break}}}while(0);do{if((l|0)==1535){B=y<<16>>16;w=v<<16>>16;if(y<<16>>16>=v<<16>>16){z=B;A=w;break}x=B>>>1<<16;j=65567-(b2(w|0)|0)<<16>>16;k=j-15|0;p=(k|0)>0;if(p){C=w>>k}else{C=w<<15-j}t=(C<<16^-2147483648)>>16;q=(t*-15420&-1)>>>15<<16;s=q+2021130240>>16;r=s-($((q-126353408|0)+($(s,t)>>>15<<16)>>16,s)>>>15)<<16;s=r>>16;q=j-16|0;e=(q|0)>0;c=s-((($(($(s,t)>>>15<<16)+(r^-2147483648)>>16,s)>>>15<<16)+65536|0)>>>16)<<16>>16;if(e){D=c>>q}else{D=c<<16-j}c=$(D>>16,x>>15);if(p){E=w>>k}else{E=w<<15-j}s=(E<<16^-2147483648)>>16;r=(s*-15420&-1)>>>15<<16;t=r+2021130240>>16;a=t-($((r-126353408|0)+($(t,s)>>>15<<16)>>16,t)>>>15)<<16;t=a>>16;r=t-((($(($(t,s)>>>15<<16)+(a^-2147483648)>>16,t)>>>15<<16)+65536|0)>>>16)<<16>>16;if(e){F=r>>q}else{F=r<<16-j}r=($(F&65535,x>>16)>>15)+c|0;if(p){G=w>>k}else{G=w<<15-j}w=(G<<16^-2147483648)>>16;k=(w*-15420&-1)>>>15<<16;p=k+2021130240>>16;c=p-($((k-126353408|0)+($(p,w)>>>15<<16)>>16,p)>>>15)<<16;p=c>>16;k=p-((($(($(p,w)>>>15<<16)+(c^-2147483648)>>16,p)>>>15<<16)+65536|0)>>>16)<<16>>16;if(e){H=k>>q}else{H=k<<16-j}j=r+($(H>>16,B<<15&32768)>>15)|0;B=(j|0)>32766?32767:j<<16>>16;I=($((($((($((((B*4936&-1)+16384|0)>>>15<<16)-782696448>>16,B)+16384|0)>>>15<<16)-1376256>>16,B)+16384|0)>>>15<<16)+2147418112>>16,B)+16384|0)>>>15<<16>>16>>>1&65535;J=I<<16>>16;K=J*20861&-1;L=K>>15;return L|0}}while(0);H=A>>>1<<16;G=65567-(b2(z|0)|0)<<16>>16;F=G-15|0;E=(F|0)>0;if(E){M=z>>F}else{M=z<<15-G}D=(M<<16^-2147483648)>>16;M=(D*-15420&-1)>>>15<<16;C=M+2021130240>>16;v=C-($((M-126353408|0)+($(C,D)>>>15<<16)>>16,C)>>>15)<<16;C=v>>16;M=G-16|0;y=(M|0)>0;l=C-((($(($(C,D)>>>15<<16)+(v^-2147483648)>>16,C)>>>15<<16)+65536|0)>>>16)<<16>>16;if(y){N=l>>M}else{N=l<<16-G}l=$(N>>16,H>>15);if(E){O=z>>F}else{O=z<<15-G}N=(O<<16^-2147483648)>>16;O=(N*-15420&-1)>>>15<<16;C=O+2021130240>>16;v=C-($((O-126353408|0)+($(C,N)>>>15<<16)>>16,C)>>>15)<<16;C=v>>16;O=C-((($(($(C,N)>>>15<<16)+(v^-2147483648)>>16,C)>>>15<<16)+65536|0)>>>16)<<16>>16;if(y){P=O>>M}else{P=O<<16-G}O=($(P&65535,H>>16)>>15)+l|0;if(E){Q=z>>F}else{Q=z<<15-G}z=(Q<<16^-2147483648)>>16;Q=(z*-15420&-1)>>>15<<16;F=Q+2021130240>>16;E=F-($((Q-126353408|0)+($(F,z)>>>15<<16)>>16,F)>>>15)<<16;F=E>>16;Q=F-((($(($(F,z)>>>15<<16)+(E^-2147483648)>>16,F)>>>15<<16)+65536|0)>>>16)<<16>>16;if(y){R=Q>>M}else{R=Q<<16-G}G=O+($(R>>16,A<<15&32768)>>15)|0;A=(G|0)>32766?32767:G<<16>>16;I=25736-(($((($((($((((A*4936&-1)+16384|0)>>>15<<16)-782696448>>16,A)+16384|0)>>>15<<16)-1376256>>16,A)+16384|0)>>>15<<16)+2147418112>>16,A)+16384|0)>>>15<<16>>16>>>1)&65535;J=I<<16>>16;K=J*20861&-1;L=K>>15;return L|0}function bt(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;k=i;i=i+8|0;l=k|0;a[l+1|0]=0;m=((g<<1)+h<<16>>16)*7&-1;h=f+8>>4;if((h|0)<=0){i=k;return}f=l|0;g=b+28|0;n=b+32|0;o=b+20|0;p=b+40|0;q=b+24|0;r=b+4|0;s=b|0;b=0;t=e;while(1){e=c[j+(b<<2)>>2]|0;L2297:do{if((e|0)>0){u=e&31;a[f]=a[448+((u>>>0<6?u:6)+m|0)|0]|0;u=0;while(1){v=t+(u<<2)|0;if((c[v>>2]|0)>0){w=c[g>>2]|0;x=c[n>>2]|0;y=w>>>8;z=0;A=w;while(1){B=$(d[l+z|0]|0,y);if(x>>>0>=B>>>0){break}z=z+1|0;A=B}y=x-B|0;c[n>>2]=y;w=A-B|0;c[g>>2]=w;L2307:do{if(w>>>0<8388609){C=c[r>>2]|0;D=c[o>>2]|0;E=w;F=c[p>>2]|0;G=c[q>>2]|0;H=y;while(1){I=D+8|0;c[o>>2]=I;J=E<<8;c[g>>2]=J;if(G>>>0<C>>>0){K=G+1|0;c[q>>2]=K;L=d[(c[s>>2]|0)+G|0]|0;M=K}else{L=0;M=G}c[p>>2]=L;K=((L|F<<8)>>>1&255|H<<8&2147483392)^255;c[n>>2]=K;if(J>>>0<8388609){D=I;E=J;F=L;G=M;H=K}else{break L2307}}}}while(0);c[v>>2]=$(c[v>>2]|0,(z<<1)-1|0)}y=u+1|0;if((y|0)<16){u=y}else{break L2297}}}}while(0);e=b+1|0;if((e|0)<(h|0)){b=e;t=t+64|0}else{break}}i=k;return}function bu(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0;g=i;i=i+32|0;h=g|0;j=a+2772|0;k=a+2316|0;l=c[k>>2]|0;m=a+4156|0;if((l|0)!=(c[m>>2]|0)){n=a+2340|0;o=c[n>>2]|0;p=32767/(o+1|0)&-1;if((o|0)>0){o=0;q=0;while(1){r=q+p|0;b[a+4052+(o<<1)>>1]=r&65535;s=o+1|0;if((s|0)<(c[n>>2]|0)){o=s;q=r}else{break}}t=c[k>>2]|0}else{t=l}c[a+4148>>2]=0;c[a+4152>>2]=3176576;c[m>>2]=t}t=a+4160|0;do{if((c[t>>2]|0)==0){if((c[a+4164>>2]|0)==0){m=a+2340|0;L2331:do{if((c[m>>2]|0)>0){l=0;while(1){k=a+4052+(l<<1)|0;q=b[k>>1]|0;o=(b[a+2344+(l<<1)>>1]|0)-q|0;b[k>>1]=(((o>>16)*16348&-1)+q|0)+(((o&65535)*16348&-1)>>>16)&65535;o=l+1|0;if((o|0)<(c[m>>2]|0)){l=o}else{break L2331}}}}while(0);m=a+2324|0;l=c[m>>2]|0;L2335:do{if((l|0)>0){o=0;q=0;k=0;while(1){n=c[d+16+(k<<2)>>2]|0;p=(n|0)>(o|0);r=p?k:q;s=k+1|0;if((s|0)<(l|0)){o=p?n:o;q=r;k=s}else{u=r;break L2335}}}else{u=0}}while(0);k=a+2332|0;q=c[k>>2]|0;o=j;b4(a+2772+(q<<2)|0,o|0,$((l<<2)-4|0,q)|0);q=c[k>>2]|0;b3(o|0,a+4+($(q,u)<<2)|0,q<<2);q=c[m>>2]|0;L2339:do{if((q|0)>0){o=a+4148|0;k=0;r=c[o>>2]|0;while(1){s=(c[d+16+(k<<2)>>2]|0)-r|0;n=(((s>>16)*4634&-1)+r|0)+(((s&65535)*4634&-1)>>>16)|0;c[o>>2]=n;s=k+1|0;if((s|0)<(q|0)){k=s;r=n}else{break L2339}}}}while(0);if((c[t>>2]|0)!=0){break}}b1(a+4084|0,0,c[a+2340>>2]<<2|0);i=g;return}}while(0);t=av()|0;d=i;i=i+((f+16|0)*4&-1)|0;i=i+7>>3<<3;u=c[a+4148>>2]|0;j=255;while(1){if((j|0)>(f|0)){j=j>>1}else{break}}q=a+4152|0;m=c[q>>2]|0;l=(f|0)>0;L2350:do{if(l){r=u>>>4<<16>>16;k=(u>>19)+1>>1;o=0;n=m;while(1){s=$(n,196314165)+907633515|0;p=c[a+2772+((s>>24&j)<<2)>>2]|0;v=$(p>>16,r);w=$(p&65535,r)>>16;x=(v+$(p,k)|0)+w|0;do{if((x|0)>32767){y=32767}else{if((x|0)<-32768){y=-32768;break}y=x<<16>>16}}while(0);c[d+(o+16<<2)>>2]=y;x=o+1|0;if((x|0)<(f|0)){o=x;n=s}else{z=s;break L2350}}}else{z=m}}while(0);c[q>>2]=z;z=h|0;q=a+2340|0;bN(z,a+4052|0,c[q>>2]|0);m=a+4084|0;b3(d|0,m|0,64);L2359:do{if(l){a=b[z>>1]|0;y=b[h+2>>1]|0;j=b[h+4>>1]|0;u=b[h+6>>1]|0;n=b[h+8>>1]|0;o=b[h+10>>1]|0;k=b[h+12>>1]|0;r=b[h+14>>1]|0;x=b[h+16>>1]|0;w=b[h+18>>1]|0;p=b[h+20>>1]|0;v=b[h+22>>1]|0;A=b[h+24>>1]|0;B=b[h+26>>1]|0;C=b[h+28>>1]|0;D=b[h+30>>1]|0;E=0;F=c[d+60>>2]|0;G=c[d+52>>2]|0;H=c[d+44>>2]|0;I=c[d+36>>2]|0;J=c[d+28>>2]|0;while(1){K=c[q>>2]|0;L=$(a,F>>16);M=$(a,F&65535)>>16;N=c[d+(E+14<<2)>>2]|0;O=$(y,N>>16);P=$(y,N&65535)>>16;Q=$(j,G>>16);R=$(j,G&65535)>>16;S=c[d+(E+12<<2)>>2]|0;T=$(u,S>>16);U=$(u,S&65535)>>16;V=$(n,H>>16);W=$(n,H&65535)>>16;X=c[d+(E+10<<2)>>2]|0;Y=$(o,X>>16);Z=$(o,X&65535)>>16;_=$(k,I>>16);aa=$(k,I&65535)>>16;ab=c[d+(E+8<<2)>>2]|0;ac=$(r,ab>>16);ad=$(r,ab&65535)>>16;ae=$(x,J>>16);af=$(x,J&65535)>>16;ag=c[d+(E+6<<2)>>2]|0;ah=$(w,ag>>16);ai=(((((((((((((((((((L+(K>>1)|0)+M|0)+O|0)+P|0)+Q|0)+R|0)+T|0)+U|0)+V|0)+W|0)+Y|0)+Z|0)+_|0)+aa|0)+ac|0)+ad|0)+ae|0)+af|0)+ah|0)+($(w,ag&65535)>>16)|0;if((K|0)==16){K=c[d+(E+5<<2)>>2]|0;ag=$(p,K>>16);ah=$(p,K&65535)>>16;K=c[d+(E+4<<2)>>2]|0;af=$(v,K>>16);ae=$(v,K&65535)>>16;K=c[d+(E+3<<2)>>2]|0;ad=$(A,K>>16);ac=$(A,K&65535)>>16;K=c[d+(E+2<<2)>>2]|0;aa=$(B,K>>16);_=$(B,K&65535)>>16;K=c[d+(E+1<<2)>>2]|0;Z=$(C,K>>16);Y=$(C,K&65535)>>16;K=c[d+(E<<2)>>2]|0;W=$(D,K>>16);aj=(((((((((((ag+ai|0)+ah|0)+af|0)+ae|0)+ad|0)+ac|0)+aa|0)+_|0)+Z|0)+Y|0)+W|0)+($(D,K&65535)>>16)|0}else{aj=ai}ai=d+(E+16<<2)|0;K=(c[ai>>2]|0)+(aj<<4)|0;c[ai>>2]=K;ai=e+(E<<1)|0;W=(b[ai>>1]|0)+((aj>>5)+1>>1)|0;if((W|0)>32767){ak=32767}else{ak=(W|0)<-32768?-32768:W&65535}b[ai>>1]=ak;ai=E+1|0;if((ai|0)<(f|0)){E=ai;F=K;G=N;H=S;I=X;J=ab}else{break L2359}}}}while(0);b3(m|0,d+(f<<2)|0,64);an(t|0);i=g;return}function bv(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0;h=i;i=i+32|0;j=h|0;k=d+2336|0;l=c[k>>2]|0;m=i;i=i+(l*2&-1)|0;i=i+7>>3<<3;n=d+2328|0;o=c[n>>2]|0;p=i;i=i+((o+l|0)*4&-1)|0;i=i+7>>3<<3;l=d+2332|0;q=c[l>>2]|0;r=i;i=i+(q*4&-1)|0;i=i+7>>3<<3;s=i;i=i+((q+16|0)*4&-1)|0;i=i+7>>3<<3;q=d+2765|0;t=a[d+2767|0]|0;L2372:do{if((o|0)>0){u=(b[1904+((a[q]|0)>>1<<2)+((a[d+2766|0]|0)<<1)>>1]|0)<<4;v=a[d+2770|0]|0;w=0;while(1){x=$(v,196314165)+907633515|0;y=g+(w<<2)|0;z=c[y>>2]<<14;A=d+4+(w<<2)|0;c[A>>2]=z;do{if((z|0)>0){B=z-1280|0;c[A>>2]=B;C=B}else{if((z|0)>=0){C=0;break}B=z|1280;c[A>>2]=B;C=B}}while(0);z=C+u|0;c[A>>2]=(x|0)<0?-z|0:z;z=w+1|0;if((z|0)<(c[n>>2]|0)){v=(c[y>>2]|0)+x|0;w=z}else{break L2372}}}}while(0);n=s;C=d+1284|0;b3(n|0,C|0,64);g=d+2324|0;if((c[g>>2]|0)<=0){b3(C|0,n|0,64);i=h;return}o=d+2340|0;w=j;v=d|0;u=d+4160|0;z=e+136|0;B=t<<24>>24>3;t=f;E=j|0;F=j+2|0;G=j+4|0;H=j+6|0;I=j+8|0;J=j+10|0;K=j+12|0;L=j+14|0;M=j+16|0;N=j+18|0;O=j+20|0;P=j+22|0;Q=j+24|0;R=j+26|0;S=j+28|0;T=j+30|0;j=d+4164|0;U=d+2308|0;V=f;f=c[k>>2]|0;W=0;X=d+4|0;while(1){Y=e+32+(W>>1<<5)|0;b3(w|0,Y|0,c[o>>2]<<1);Z=W*5&-1;_=e+96+(Z<<1)|0;aa=a[q]|0;ab=c[e+16+(W<<2)>>2]|0;ac=ab>>>6;ad=(ab|0)>0?ab:-ab|0;ae=(ad|0)==0;if(ae){af=32}else{af=b2(ad|0)|0}ag=ab<<af-1;ah=ag>>16;ai=536870911/(ah|0)&-1;aj=ai<<16;ak=aj>>16;al=$(ah,ak);ah=(536870912-al|0)-($(ag&65535,ak)>>16)<<3;ag=$(ah>>16,ak);al=$(ah&65528,ak)>>16;ak=(($(ah,(ai>>15)+1>>1)+aj|0)+ag|0)+al|0;al=62-af|0;ag=al-47|0;if((ag|0)<1){aj=47-al|0;al=-2147483648>>aj;ai=2147483647>>>(aj>>>0);do{if((al|0)>(ai|0)){if((ak|0)>(al|0)){am=al;break}am=(ak|0)<(ai|0)?ai:ak}else{if((ak|0)>(ai|0)){am=ai;break}am=(ak|0)<(al|0)?al:ak}}while(0);an=am<<aj}else{an=(ag|0)<32?ak>>ag:0}al=c[v>>2]|0;L2400:do{if((ab|0)==(al|0)){ao=65536}else{ai=(al|0)>0?al:-al|0;if((ai|0)==0){ap=32}else{ap=b2(ai|0)|0}ai=al<<ap-1;if(ae){aq=31}else{aq=(b2(ad|0)|0)-1|0}ah=ab<<aq;ar=(536870911/(ah>>16|0)&-1)<<16>>16;as=$(ar,ai>>16);at=($(ar,ai&65535)>>16)+as|0;as=ah;au=(ah|0)<0?-1:0;ah=at;av=(at|0)<0?-1:0;cf(ah,av,as,au);au=ai-(D<<3|0>>>29)|0;ai=$(au>>16,ar);as=(ai+at|0)+($(au&65535,ar)>>16)|0;ar=(ap+28|0)-aq|0;au=ar-16|0;if((au|0)<0){at=16-ar|0;ar=-2147483648>>at;ai=2147483647>>>(at>>>0);do{if((ar|0)>(ai|0)){if((as|0)>(ar|0)){aw=ar;break}aw=(as|0)<(ai|0)?ai:as}else{if((as|0)>(ai|0)){aw=ai;break}aw=(as|0)<(ar|0)?ar:as}}while(0);ax=aw<<at}else{ax=(au|0)<32?as>>au:0}ar=ax>>16;ai=ax&65535;x=0;while(1){y=s+(x<<2)|0;A=c[y>>2]|0;av=A<<16>>16;ah=$(av,ar);ay=($(av,ai)>>16)+ah|0;c[y>>2]=ay+$((A>>15)+1>>1,ax)|0;A=x+1|0;if((A|0)<16){x=A}else{ao=ax;break L2400}}}}while(0);c[v>>2]=ab;do{if((c[u>>2]|0)==0){az=1669}else{if((c[j>>2]|0)!=2){az=1669;break}if(!(aa<<24>>24!=2&(W|0)<2)){az=1669;break}b1(_|0,0,10);b[e+96+(Z+2<<1)>>1]=4096;ad=c[U>>2]|0;c[e+(W<<2)>>2]=ad;aA=ad;az=1672;break}}while(0);do{if((az|0)==1669){az=0;if(aa<<24>>24==2){aA=c[e+(W<<2)>>2]|0;az=1672;break}else{aB=X;aC=f;aD=c[l>>2]|0;az=1688;break}}}while(0);L2430:do{if((az|0)==1672){az=0;aa=(W|0)==0;L2432:do{if(aa){ad=c[k>>2]|0;ae=c[o>>2]|0;aE=((-2-aA|0)+ad|0)-ae|0;aF=ad;aG=ae;az=1676;break}else{if(!((W|0)!=2|B)){ae=c[k>>2]|0;ad=((-2-aA|0)+ae|0)-(c[o>>2]|0)|0;b3(d+1348+(ae<<1)|0,t|0,c[l>>2]<<2);aE=ad;aF=c[k>>2]|0;aG=c[o>>2]|0;az=1676;break}if((ao|0)==65536){break}ad=aA+2|0;if((ad|0)<=0){break}ae=ao>>16;al=f-1|0;ag=ao&65535;ak=0;while(1){aj=p+(al-ak<<2)|0;x=c[aj>>2]|0;ai=x<<16>>16;ar=$(ai,ae);au=($(ai,ag)>>16)+ar|0;c[aj>>2]=au+$((x>>15)+1>>1,ao)|0;x=ak+1|0;if((x|0)<(ad|0)){ak=x}else{break L2432}}}}while(0);L2442:do{if((az|0)==1676){az=0;bJ(m+(aE<<1)|0,d+1348+($(c[l>>2]|0,W)+aE<<1)|0,Y,aF-aE|0,aG);if(aa){ak=c[z>>2]<<16>>16;ad=$(ak,an>>16);aH=($(ak,an&65535)>>16)+ad<<2}else{aH=an}ad=aA+2|0;if((ad|0)<=0){break}ak=aH>>16;ag=c[k>>2]|0;ae=aH&65535;al=f-1|0;x=0;au=0;while(1){aj=b[m+((au-1|0)+ag<<1)>>1]|0;ar=$(aj,ak);c[p+(al+au<<2)>>2]=($(aj,ae)>>16)+ar|0;ar=x+1|0;aj=x^-1;if((ar|0)<(ad|0)){x=ar;au=aj}else{break L2442}}}}while(0);aa=c[l>>2]|0;if((aa|0)<=0){aI=aa;aJ=f;break}au=b[_>>1]|0;x=b[e+96+(Z+1<<1)>>1]|0;ad=b[e+96+(Z+2<<1)>>1]|0;ae=b[e+96+(Z+3<<1)>>1]|0;al=b[e+96+(Z+4<<1)>>1]|0;ak=f;ag=p+((f+2|0)-aA<<2)|0;aj=0;while(1){ar=c[ag>>2]|0;ai=au<<16>>16;as=$(ai,ar>>16);at=$(ai,ar&65535)>>16;ar=c[ag-4>>2]|0;ai=x<<16>>16;A=$(ai,ar>>16);ay=$(ai,ar&65535)>>16;ar=c[ag-8>>2]|0;ai=ad<<16>>16;y=$(ai,ar>>16);ah=$(ai,ar&65535)>>16;ar=c[ag-12>>2]|0;ai=ae<<16>>16;av=$(ai,ar>>16);aK=$(ai,ar&65535)>>16;ar=c[ag-16>>2]|0;ai=al<<16>>16;aL=$(ai,ar>>16);aM=(((((((((as+2|0)+at|0)+A|0)+ay|0)+y|0)+ah|0)+av|0)+aK|0)+aL|0)+($(ai,ar&65535)>>16)|0;ar=(aM<<1)+(c[X+(aj<<2)>>2]|0)|0;c[r+(aj<<2)>>2]=ar;c[p+(ak<<2)>>2]=ar<<1;ar=ak+1|0;aM=aj+1|0;if((aM|0)<(aa|0)){ak=ar;ag=ag+4|0;aj=aM}else{aB=r;aC=ar;aD=aa;az=1688;break L2430}}}}while(0);L2454:do{if((az|0)==1688){az=0;if((aD|0)<=0){aI=aD;aJ=aC;break}Z=ac<<16>>16;_=(ab>>21)+1>>1;Y=0;while(1){aa=c[o>>2]|0;aj=c[s+(Y+15<<2)>>2]|0;ag=b[E>>1]|0;ak=$(ag,aj>>16);al=$(ag,aj&65535)>>16;aj=c[s+(Y+14<<2)>>2]|0;ag=b[F>>1]|0;ae=$(ag,aj>>16);ad=$(ag,aj&65535)>>16;aj=c[s+(Y+13<<2)>>2]|0;ag=b[G>>1]|0;x=$(ag,aj>>16);au=$(ag,aj&65535)>>16;aj=c[s+(Y+12<<2)>>2]|0;ag=b[H>>1]|0;ar=$(ag,aj>>16);aM=$(ag,aj&65535)>>16;aj=c[s+(Y+11<<2)>>2]|0;ag=b[I>>1]|0;ai=$(ag,aj>>16);aL=$(ag,aj&65535)>>16;aj=c[s+(Y+10<<2)>>2]|0;ag=b[J>>1]|0;aK=$(ag,aj>>16);av=$(ag,aj&65535)>>16;aj=c[s+(Y+9<<2)>>2]|0;ag=b[K>>1]|0;ah=$(ag,aj>>16);y=$(ag,aj&65535)>>16;aj=c[s+(Y+8<<2)>>2]|0;ag=b[L>>1]|0;ay=$(ag,aj>>16);A=$(ag,aj&65535)>>16;aj=c[s+(Y+7<<2)>>2]|0;ag=b[M>>1]|0;at=$(ag,aj>>16);as=$(ag,aj&65535)>>16;aj=c[s+(Y+6<<2)>>2]|0;ag=b[N>>1]|0;aN=$(ag,aj>>16);aO=(((((((((((((((((((ak+(aa>>1)|0)+al|0)+ae|0)+ad|0)+x|0)+au|0)+ar|0)+aM|0)+ai|0)+aL|0)+aK|0)+av|0)+ah|0)+y|0)+ay|0)+A|0)+at|0)+as|0)+aN|0)+($(ag,aj&65535)>>16)|0;if((aa|0)==16){aa=c[s+(Y+5<<2)>>2]|0;aj=b[O>>1]|0;ag=$(aj,aa>>16);aN=$(aj,aa&65535)>>16;aa=c[s+(Y+4<<2)>>2]|0;aj=b[P>>1]|0;as=$(aj,aa>>16);at=$(aj,aa&65535)>>16;aa=c[s+(Y+3<<2)>>2]|0;aj=b[Q>>1]|0;A=$(aj,aa>>16);ay=$(aj,aa&65535)>>16;aa=c[s+(Y+2<<2)>>2]|0;aj=b[R>>1]|0;y=$(aj,aa>>16);ah=$(aj,aa&65535)>>16;aa=c[s+(Y+1<<2)>>2]|0;aj=b[S>>1]|0;av=$(aj,aa>>16);aK=$(aj,aa&65535)>>16;aa=c[s+(Y<<2)>>2]|0;aj=b[T>>1]|0;aL=$(aj,aa>>16);aP=(((((((((((ag+aO|0)+aN|0)+as|0)+at|0)+A|0)+ay|0)+y|0)+ah|0)+av|0)+aK|0)+aL|0)+($(aj,aa&65535)>>16)|0}else{aP=aO}aO=(c[aB+(Y<<2)>>2]|0)+(aP<<4)|0;c[s+(Y+16<<2)>>2]=aO;aa=$(aO>>16,Z);aj=$(aO&65535,Z)>>16;aL=((aa+$(aO,_)|0)+aj>>7)+1>>1;if((aL|0)>32767){aQ=32767}else{aQ=(aL|0)<-32768?-32768:aL&65535}b[V+(Y<<1)>>1]=aQ;aL=Y+1|0;aj=c[l>>2]|0;if((aL|0)<(aj|0)){Y=aL}else{aI=aj;aJ=aC;break L2454}}}}while(0);b3(n|0,s+(aI<<2)|0,64);ab=W+1|0;if((ab|0)>=(c[g>>2]|0)){break}V=V+(aI<<1)|0;f=aJ;W=ab;X=X+(aI<<2)|0}b3(C|0,n|0,64);i=h;return}function bw(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;i=i+144|0;k=j|0;l=b+2328|0;m=c[l>>2]|0;n=i;i=i+((m+15&-16)*4&-1)|0;i=i+7>>3<<3;o=k|0;c[k+136>>2]=0;do{if((g|0)==2){p=c[b+2388>>2]|0;if((c[b+2420+(p<<2)>>2]|0)==1){q=p;r=1703;break}else{r=1704;break}}else if((g|0)==0){q=c[b+2388>>2]|0;r=1703;break}else{r=1704}}while(0);if((r|0)==1703){by(b,d,q,g,h);g=b+2765|0;bz(d,n,a[g]|0,a[b+2766|0]|0,c[l>>2]|0);bx(b,o,h);bv(b,o,e,n);bE(b,o,e,0);c[b+4160>>2]=0;c[b+4164>>2]=a[g]|0;c[b+2376>>2]=0}else if((r|0)==1704){r=c[b+2316>>2]|0;g=b+4248|0;if((r|0)!=(c[g>>2]|0)){c[b+4168>>2]=m<<7;c[b+4240>>2]=65536;c[b+4244>>2]=65536;c[b+4256>>2]=20;c[b+4252>>2]=2;c[g>>2]=r}bF(b,o,e);r=b+4160|0;c[r>>2]=(c[r>>2]|0)+1|0}r=c[l>>2]|0;g=(c[b+2336>>2]|0)-r|0;b4(b+1348|0,b+1348+(r<<1)|0,g<<1|0);b3(b+1348+(g<<1)|0,e|0,c[l>>2]<<1);bG(b,e,m);bu(b,o,e,m);c[b+2308>>2]=c[k+((c[b+2324>>2]|0)-1<<2)>>2]|0;c[f>>2]=m;i=j;return 0}function bx(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+64|0;h=g|0;j=g+32|0;k=d+2324|0;bC(e+16|0,d+2736|0,d+2312|0,(f|0)==2&1,c[k>>2]|0);f=h|0;bD(f,d+2744|0,c[d+2732>>2]|0);l=e+32|0;m=e+64|0;n=d+2340|0;bN(m|0,f,c[n>>2]|0);f=d+2767|0;do{if((c[d+2376>>2]|0)==1){a[f]=4;o=1715;break}else{p=a[f]|0;if(p<<24>>24>=4){o=1715;break}q=c[n>>2]|0;L2484:do{if((q|0)>0){r=p<<24>>24;s=0;while(1){t=b[d+2344+(s<<1)>>1]|0;b[j+(s<<1)>>1]=($((b[h+(s<<1)>>1]|0)-t|0,r)>>>2)+t&65535;t=s+1|0;if((t|0)<(q|0)){s=t}else{break L2484}}}}while(0);bN(l|0,j|0,q);break}}while(0);if((o|0)==1715){b3(l|0,m|0,c[n>>2]<<1)}m=c[n>>2]|0;b3(d+2344|0,h|0,m<<1);if((c[d+4160>>2]|0)!=0){h=m-1|0;L2494:do{if((h|0)>0){m=0;l=63570;while(1){o=e+32+(m<<1)|0;b[o>>1]=(($(b[o>>1]|0,l)>>>15)+1|0)>>>1&65535;o=(((l*-1966&-1)>>15)+1>>1)+l|0;j=m+1|0;if((j|0)<(h|0)){m=j;l=o}else{u=o;break L2494}}}else{u=63570}}while(0);l=e+32+(h<<1)|0;b[l>>1]=(($(b[l>>1]|0,u)>>>15)+1|0)>>>1&65535;u=(c[n>>2]|0)-1|0;L2498:do{if((u|0)>0){n=0;l=63570;while(1){h=e+64+(n<<1)|0;b[h>>1]=(($(b[h>>1]|0,l)>>>15)+1|0)>>>1&65535;h=(((l*-1966&-1)>>15)+1>>1)+l|0;m=n+1|0;if((m|0)<(u|0)){n=m;l=h}else{v=h;break L2498}}}else{v=63570}}while(0);l=e+64+(u<<1)|0;b[l>>1]=(($(b[l>>1]|0,v)>>>15)+1|0)>>>1&65535}if((a[d+2765|0]|0)!=2){b1(e|0,0,c[k>>2]<<2|0);b1(e+96|0,0,(c[k>>2]|0)*10&-1|0);a[d+2768|0]=0;c[e+136>>2]=0;i=g;return}v=c[d+2316>>2]|0;l=c[k>>2]|0;u=(l|0)==4;if((v|0)==8){w=u?4688:4680;x=u?11:3}else{w=u?4544:4520;x=u?34:12}u=v<<16;v=u>>15;n=(u>>16)*18&-1;u=v+(b[d+2762>>1]|0)|0;L2511:do{if((l|0)>0){h=a[d+2764|0]|0;m=(v|0)>(n|0);q=0;while(1){o=u+(a[w+($(q,x)+h|0)|0]|0)|0;j=e+(q<<2)|0;c[j>>2]=o;do{if(m){if((o|0)>(v|0)){y=v;break}y=(o|0)<(n|0)?n:o}else{if((o|0)>(n|0)){y=n;break}y=(o|0)<(v|0)?v:o}}while(0);c[j>>2]=y;o=q+1|0;if((o|0)<(l|0)){q=o}else{break}}q=c[3832+((a[d+2768|0]|0)<<2)>>2]|0;if((c[k>>2]|0)>0){z=0}else{break}while(1){m=(a[z+(d+2740)|0]|0)*5&-1;h=z*5&-1;b[e+96+(h<<1)>>1]=(a[q+m|0]|0)<<7;b[e+96+(h+1<<1)>>1]=(a[q+(m+1|0)|0]|0)<<7;b[e+96+(h+2<<1)>>1]=(a[q+(m+2|0)|0]|0)<<7;b[e+96+(h+3<<1)>>1]=(a[q+(m+3|0)|0]|0)<<7;b[e+96+(h+4<<1)>>1]=(a[q+(m+4|0)|0]|0)<<7;m=z+1|0;if((m|0)<(c[k>>2]|0)){z=m}else{break L2511}}}}while(0);c[e+136>>2]=b[4208+((a[d+2769|0]|0)<<1)>>1]|0;i=g;return}function by(f,g,h,j,k){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0;l=i;i=i+32|0;m=l|0;do{if((j|0)==0){if((c[f+2404+(h<<2)>>2]|0)!=0){n=1743;break}o=g+28|0;p=c[o>>2]|0;q=g+32|0;r=c[q>>2]|0;s=p>>>8;t=-1;u=p;while(1){v=t+1|0;w=$(d[v+360|0]|0,s);if(r>>>0<w>>>0){t=v;u=w}else{break}}t=r-w|0;c[q>>2]=t;s=u-w|0;c[o>>2]=s;L2533:do{if(s>>>0<8388609){p=g+20|0;x=g+40|0;y=g+24|0;z=g|0;A=c[g+4>>2]|0;B=c[p>>2]|0;C=s;D=c[x>>2]|0;E=c[y>>2]|0;F=t;while(1){G=B+8|0;c[p>>2]=G;H=C<<8;c[o>>2]=H;if(E>>>0<A>>>0){I=E+1|0;c[y>>2]=I;J=d[(c[z>>2]|0)+E|0]|0;K=I}else{J=0;K=E}c[x>>2]=J;I=((J|D<<8)>>>1&255|F<<8&2147483392)^255;c[q>>2]=I;if(H>>>0<8388609){B=G;C=H;D=J;E=K;F=I}else{break L2533}}}}while(0);L=v&255;M=v>>>1&255;break}else{n=1743}}while(0);if((n|0)==1743){v=g+28|0;K=c[v>>2]|0;J=g+32|0;w=c[J>>2]|0;h=K>>>8;j=-1;q=K;while(1){K=j+1|0;N=$(d[K+368|0]|0,h);if(w>>>0<N>>>0){j=K;q=N}else{break}}h=w-N|0;c[J>>2]=h;w=q-N|0;c[v>>2]=w;L2546:do{if(w>>>0<8388609){N=g+20|0;q=g+40|0;K=g+24|0;o=g|0;t=c[g+4>>2]|0;s=c[N>>2]|0;u=w;r=c[q>>2]|0;F=c[K>>2]|0;E=h;while(1){D=s+8|0;c[N>>2]=D;C=u<<8;c[v>>2]=C;if(F>>>0<t>>>0){B=F+1|0;c[K>>2]=B;O=d[(c[o>>2]|0)+F|0]|0;P=B}else{O=0;P=F}c[q>>2]=O;B=((O|r<<8)>>>1&255|E<<8&2147483392)^255;c[J>>2]=B;if(C>>>0<8388609){s=D;u=C;r=O;F=P;E=B}else{break L2546}}}}while(0);P=j+3|0;L=P&255;M=P>>>1&255}P=f+2736|0;j=f+2765|0;a[j]=M;a[f+2766|0]=L&1;L=(k|0)==2;if(L){O=g+28|0;J=c[O>>2]|0;v=g+32|0;h=c[v>>2]|0;w=J>>>8;E=-1;F=J;while(1){Q=E+1|0;R=$(d[Q+1600|0]|0,w);if(h>>>0<R>>>0){E=Q;F=R}else{break}}E=h-R|0;c[v>>2]=E;h=F-R|0;c[O>>2]=h;L2560:do{if(h>>>0<8388609){R=g+20|0;F=g+40|0;w=g+24|0;J=g|0;r=c[g+4>>2]|0;u=c[R>>2]|0;s=h;q=c[F>>2]|0;o=c[w>>2]|0;K=E;while(1){t=u+8|0;c[R>>2]=t;N=s<<8;c[O>>2]=N;if(o>>>0<r>>>0){B=o+1|0;c[w>>2]=B;S=d[(c[J>>2]|0)+o|0]|0;T=B}else{S=0;T=o}c[F>>2]=S;B=((S|q<<8)>>>1&255|K<<8&2147483392)^255;c[v>>2]=B;if(N>>>0<8388609){u=t;s=N;q=S;o=T;K=B}else{break L2560}}}}while(0);a[P|0]=Q&255}else{Q=M<<24>>24;M=g+28|0;T=c[M>>2]|0;S=g+32|0;v=c[S>>2]|0;O=T>>>8;E=-1;h=T;while(1){U=E+1|0;V=$(d[1576+(Q<<3)+U|0]|0,O);if(v>>>0<V>>>0){E=U;h=V}else{break}}E=v-V|0;c[S>>2]=E;v=h-V|0;c[M>>2]=v;L2572:do{if(v>>>0<8388609){V=g+20|0;h=g+40|0;O=g+24|0;Q=g|0;T=c[g+4>>2]|0;K=c[V>>2]|0;o=v;q=c[h>>2]|0;s=c[O>>2]|0;u=E;while(1){F=K+8|0;c[V>>2]=F;J=o<<8;c[M>>2]=J;if(s>>>0<T>>>0){w=s+1|0;c[O>>2]=w;W=d[(c[Q>>2]|0)+s|0]|0;X=w}else{W=0;X=s}c[h>>2]=W;w=((W|q<<8)>>>1&255|u<<8&2147483392)^255;c[S>>2]=w;if(J>>>0<8388609){K=F;o=J;q=W;s=X;u=w}else{break L2572}}}}while(0);X=P|0;a[X]=U<<3&255;U=c[M>>2]|0;P=c[S>>2]|0;W=U>>>8;E=-1;v=U;while(1){Y=E+1|0;Z=$(d[Y+320|0]|0,W);if(P>>>0<Z>>>0){E=Y;v=Z}else{break}}E=P-Z|0;c[S>>2]=E;P=v-Z|0;c[M>>2]=P;L2583:do{if(P>>>0<8388609){Z=g+20|0;v=g+40|0;W=g+24|0;U=g|0;u=c[g+4>>2]|0;s=c[Z>>2]|0;q=P;o=c[v>>2]|0;K=c[W>>2]|0;h=E;while(1){Q=s+8|0;c[Z>>2]=Q;O=q<<8;c[M>>2]=O;if(K>>>0<u>>>0){T=K+1|0;c[W>>2]=T;_=d[(c[U>>2]|0)+K|0]|0;aa=T}else{_=0;aa=K}c[v>>2]=_;T=((_|o<<8)>>>1&255|h<<8&2147483392)^255;c[S>>2]=T;if(O>>>0<8388609){s=Q;q=O;o=_;K=aa;h=T}else{break L2583}}}}while(0);a[X]=(d[X]|0)+Y&255}Y=f+2324|0;X=g+28|0;aa=g+32|0;L2592:do{if((c[Y>>2]|0)>1){_=g+20|0;S=g+40|0;M=g+24|0;E=g+4|0;P=g|0;h=1;while(1){K=c[X>>2]|0;o=c[aa>>2]|0;q=K>>>8;s=-1;v=K;while(1){ab=s+1|0;ac=$(d[ab+1600|0]|0,q);if(o>>>0<ac>>>0){s=ab;v=ac}else{break}}s=o-ac|0;c[aa>>2]=s;q=v-ac|0;c[X>>2]=q;L2599:do{if(q>>>0<8388609){K=c[E>>2]|0;U=c[_>>2]|0;W=q;u=c[S>>2]|0;Z=c[M>>2]|0;T=s;while(1){O=U+8|0;c[_>>2]=O;Q=W<<8;c[X>>2]=Q;if(Z>>>0<K>>>0){V=Z+1|0;c[M>>2]=V;ad=d[(c[P>>2]|0)+Z|0]|0;ae=V}else{ad=0;ae=Z}c[S>>2]=ad;V=((ad|u<<8)>>>1&255|T<<8&2147483392)^255;c[aa>>2]=V;if(Q>>>0<8388609){U=O;W=Q;u=ad;Z=ae;T=V}else{break L2599}}}}while(0);a[h+(f+2736)|0]=ab&255;s=h+1|0;if((s|0)<(c[Y>>2]|0)){h=s}else{break L2592}}}}while(0);ab=f+2732|0;ae=c[ab>>2]|0;ad=$(b[ae>>1]|0,(a[j]|0)>>1);ac=c[ae+12>>2]|0;ae=c[X>>2]|0;h=c[aa>>2]|0;S=ae>>>8;P=-1;M=ae;while(1){af=P+1|0;ag=$(d[ac+(af+ad|0)|0]|0,S);if(h>>>0<ag>>>0){P=af;M=ag}else{break}}P=h-ag|0;c[aa>>2]=P;h=M-ag|0;c[X>>2]=h;L2611:do{if(h>>>0<8388609){ag=g+20|0;M=g+40|0;S=g+24|0;ad=g|0;ac=c[g+4>>2]|0;ae=c[ag>>2]|0;_=h;E=c[M>>2]|0;s=c[S>>2]|0;q=P;while(1){v=ae+8|0;c[ag>>2]=v;o=_<<8;c[X>>2]=o;if(s>>>0<ac>>>0){T=s+1|0;c[S>>2]=T;ah=d[(c[ad>>2]|0)+s|0]|0;ai=T}else{ah=0;ai=s}c[M>>2]=ah;T=((ah|E<<8)>>>1&255|q<<8&2147483392)^255;c[aa>>2]=T;if(o>>>0<8388609){ae=v;_=o;E=ah;s=ai;q=T}else{break L2611}}}}while(0);ai=af&255;a[f+2744|0]=ai;af=c[ab>>2]|0;ah=b[af+2>>1]|0;P=ah<<16>>16>0;L2619:do{if(P){h=ah<<16>>16;q=$(h,ai<<24>>24);s=0;E=(c[af+20>>2]|0)+((q|0)/2&-1)|0;while(1){q=a[E]|0;b[m+(s<<1)>>1]=((q&255)>>>1&7)*9&65535;b[m+((s|1)<<1)>>1]=((q&255)>>>5&255)*9&65535;q=s+2|0;if((q|0)<(h|0)){s=q;E=E+1|0}else{break}}if(!P){break}E=g+20|0;s=g+40|0;h=g+24|0;q=g+4|0;_=g|0;ae=0;M=af;while(1){ad=b[m+(ae<<1)>>1]|0;S=c[M+24>>2]|0;ac=c[X>>2]|0;ag=c[aa>>2]|0;T=ac>>>8;o=-1;v=ac;while(1){aj=o+1|0;ak=$(d[S+(aj+ad|0)|0]|0,T);if(ag>>>0<ak>>>0){o=aj;v=ak}else{break}}T=ag-ak|0;c[aa>>2]=T;ad=v-ak|0;c[X>>2]=ad;L2630:do{if(ad>>>0<8388609){S=c[q>>2]|0;ac=c[E>>2]|0;Z=ad;u=c[s>>2]|0;W=c[h>>2]|0;U=T;while(1){K=ac+8|0;c[E>>2]=K;V=Z<<8;c[X>>2]=V;if(W>>>0<S>>>0){Q=W+1|0;c[h>>2]=Q;al=d[(c[_>>2]|0)+W|0]|0;am=Q}else{al=0;am=W}c[s>>2]=al;Q=((al|u<<8)>>>1&255|U<<8&2147483392)^255;c[aa>>2]=Q;if(V>>>0<8388609){ac=K;Z=V;u=al;W=am;U=Q}else{an=V;ao=Q;break L2630}}}else{an=ad;ao=T}}while(0);if((o|0)==7){T=an>>>8;ad=-1;v=an;while(1){ap=ad+1|0;aq=$(d[ap+1976|0]|0,T);if(ao>>>0<aq>>>0){ad=ap;v=aq}else{break}}ad=ao-aq|0;c[aa>>2]=ad;T=v-aq|0;c[X>>2]=T;L2643:do{if(T>>>0<8388609){ag=c[q>>2]|0;U=c[E>>2]|0;W=T;u=c[s>>2]|0;Z=c[h>>2]|0;ac=ad;while(1){S=U+8|0;c[E>>2]=S;Q=W<<8;c[X>>2]=Q;if(Z>>>0<ag>>>0){V=Z+1|0;c[h>>2]=V;ar=d[(c[_>>2]|0)+Z|0]|0;as=V}else{ar=0;as=Z}c[s>>2]=ar;V=((ar|u<<8)>>>1&255|ac<<8&2147483392)^255;c[aa>>2]=V;if(Q>>>0<8388609){U=S;W=Q;u=ar;Z=as;ac=V}else{break L2643}}}}while(0);at=ap+aj|0}else if((o|0)==(-1|0)){ad=an>>>8;T=-1;v=an;while(1){au=T+1|0;av=$(d[au+1976|0]|0,ad);if(ao>>>0<av>>>0){T=au;v=av}else{break}}T=ao-av|0;c[aa>>2]=T;ad=v-av|0;c[X>>2]=ad;L2655:do{if(ad>>>0<8388609){o=c[q>>2]|0;ac=c[E>>2]|0;Z=ad;u=c[s>>2]|0;W=c[h>>2]|0;U=T;while(1){ag=ac+8|0;c[E>>2]=ag;V=Z<<8;c[X>>2]=V;if(W>>>0<o>>>0){Q=W+1|0;c[h>>2]=Q;aw=d[(c[_>>2]|0)+W|0]|0;ax=Q}else{aw=0;ax=W}c[s>>2]=aw;Q=((aw|u<<8)>>>1&255|U<<8&2147483392)^255;c[aa>>2]=Q;if(V>>>0<8388609){ac=ag;Z=V;u=aw;W=ax;U=Q}else{break L2655}}}}while(0);at=aj-au|0}else{at=aj}T=ae+1|0;a[T+(f+2744)|0]=at+252&255;ad=c[ab>>2]|0;if((T|0)<(b[ad+2>>1]|0|0)){ae=T;M=ad}else{break L2619}}}}while(0);if((c[Y>>2]|0)==4){ab=c[X>>2]|0;at=c[aa>>2]|0;aj=ab>>>8;au=-1;ax=ab;while(1){ay=au+1|0;az=$(d[ay+1912|0]|0,aj);if(at>>>0<az>>>0){au=ay;ax=az}else{break}}au=at-az|0;c[aa>>2]=au;at=ax-az|0;c[X>>2]=at;L2670:do{if(at>>>0<8388609){az=g+20|0;ax=g+40|0;aj=g+24|0;ab=g|0;aw=c[g+4>>2]|0;av=c[az>>2]|0;ao=at;an=c[ax>>2]|0;ap=c[aj>>2]|0;as=au;while(1){ar=av+8|0;c[az>>2]=ar;aq=ao<<8;c[X>>2]=aq;if(ap>>>0<aw>>>0){am=ap+1|0;c[aj>>2]=am;aA=d[(c[ab>>2]|0)+ap|0]|0;aB=am}else{aA=0;aB=ap}c[ax>>2]=aA;am=((aA|an<<8)>>>1&255|as<<8&2147483392)^255;c[aa>>2]=am;if(aq>>>0<8388609){av=ar;ao=aq;an=aA;ap=aB;as=am}else{break L2670}}}}while(0);a[f+2767|0]=ay&255}else{a[f+2767|0]=4}do{if((a[j]|0)==2){do{if(L){if((c[f+2396>>2]|0)!=2){n=1852;break}ay=c[X>>2]|0;aB=c[aa>>2]|0;aA=ay>>>8;au=-1;at=ay;while(1){aC=au+1|0;aD=$(d[aC+1464|0]|0,aA);if(aB>>>0<aD>>>0){au=aC;at=aD}else{break}}aA=aB-aD|0;c[aa>>2]=aA;ay=at-aD|0;c[X>>2]=ay;L2688:do{if(ay>>>0<8388609){as=g+20|0;ap=g+40|0;an=g+24|0;ao=g|0;av=c[g+4>>2]|0;ax=c[as>>2]|0;ab=ay;aj=c[ap>>2]|0;aw=c[an>>2]|0;az=aA;while(1){am=ax+8|0;c[as>>2]=am;aq=ab<<8;c[X>>2]=aq;if(aw>>>0<av>>>0){ar=aw+1|0;c[an>>2]=ar;aE=d[(c[ao>>2]|0)+aw|0]|0;aF=ar}else{aE=0;aF=aw}c[ap>>2]=aE;ar=((aE|aj<<8)>>>1&255|az<<8&2147483392)^255;c[aa>>2]=ar;if(aq>>>0<8388609){ax=am;ab=aq;aj=aE;aw=aF;az=ar}else{break L2688}}}}while(0);if((aC<<16|0)<=0){n=1852;break}aA=f+2400|0;ay=(au+65528|0)+(e[aA>>1]|0)&65535;b[f+2762>>1]=ay;aG=ay;aH=aA;break}else{n=1852}}while(0);if((n|0)==1852){aA=c[X>>2]|0;ay=c[aa>>2]|0;at=aA>>>8;aB=-1;az=aA;while(1){aI=aB+1|0;aJ=$(d[aI+1432|0]|0,at);if(ay>>>0<aJ>>>0){aB=aI;az=aJ}else{break}}aB=ay-aJ|0;c[aa>>2]=aB;at=az-aJ|0;c[X>>2]=at;L2702:do{if(at>>>0<8388609){aA=g+20|0;aw=g+40|0;aj=g+24|0;ab=g|0;ax=c[g+4>>2]|0;ap=c[aA>>2]|0;ao=at;an=c[aw>>2]|0;av=c[aj>>2]|0;as=aB;while(1){ar=ap+8|0;c[aA>>2]=ar;aq=ao<<8;c[X>>2]=aq;if(av>>>0<ax>>>0){am=av+1|0;c[aj>>2]=am;aK=d[(c[ab>>2]|0)+av|0]|0;aL=am}else{aK=0;aL=av}c[aw>>2]=aK;am=((aK|an<<8)>>>1&255|as<<8&2147483392)^255;c[aa>>2]=am;if(aq>>>0<8388609){ap=ar;ao=aq;an=aK;av=aL;as=am}else{break L2702}}}}while(0);aB=f+2762|0;b[aB>>1]=$(c[f+2316>>2]>>1,aI<<16>>16)&65535;at=c[f+2380>>2]|0;az=c[X>>2]|0;ay=c[aa>>2]|0;as=az>>>8;av=-1;an=az;while(1){aM=av+1|0;aN=$(d[at+aM|0]|0,as);if(ay>>>0<aN>>>0){av=aM;an=aN}else{break}}av=ay-aN|0;c[aa>>2]=av;as=an-aN|0;c[X>>2]=as;L2713:do{if(as>>>0<8388609){at=g+20|0;az=g+40|0;ao=g+24|0;ap=g|0;aw=c[g+4>>2]|0;ab=c[at>>2]|0;aj=as;ax=c[az>>2]|0;aA=c[ao>>2]|0;au=av;while(1){am=ab+8|0;c[at>>2]=am;aq=aj<<8;c[X>>2]=aq;if(aA>>>0<aw>>>0){ar=aA+1|0;c[ao>>2]=ar;aO=d[(c[ap>>2]|0)+aA|0]|0;aP=ar}else{aO=0;aP=aA}c[az>>2]=aO;ar=((aO|ax<<8)>>>1&255|au<<8&2147483392)^255;c[aa>>2]=ar;if(aq>>>0<8388609){ab=am;aj=aq;ax=aO;aA=aP;au=ar}else{break L2713}}}}while(0);av=(e[aB>>1]|0)+aM&65535;b[aB>>1]=av;aG=av;aH=f+2400|0}b[aH>>1]=aG;av=c[f+2384>>2]|0;as=c[X>>2]|0;an=c[aa>>2]|0;ay=as>>>8;au=-1;aA=as;while(1){aQ=au+1|0;aR=$(d[av+aQ|0]|0,ay);if(an>>>0<aR>>>0){au=aQ;aA=aR}else{break}}au=an-aR|0;c[aa>>2]=au;ay=aA-aR|0;c[X>>2]=ay;L2725:do{if(ay>>>0<8388609){av=g+20|0;aB=g+40|0;as=g+24|0;ax=g|0;aj=c[g+4>>2]|0;ab=c[av>>2]|0;az=ay;ap=c[aB>>2]|0;ao=c[as>>2]|0;aw=au;while(1){at=ab+8|0;c[av>>2]=at;ar=az<<8;c[X>>2]=ar;if(ao>>>0<aj>>>0){aq=ao+1|0;c[as>>2]=aq;aS=d[(c[ax>>2]|0)+ao|0]|0;aT=aq}else{aS=0;aT=ao}c[aB>>2]=aS;aq=((aS|ap<<8)>>>1&255|aw<<8&2147483392)^255;c[aa>>2]=aq;if(ar>>>0<8388609){ab=at;az=ar;ap=aS;ao=aT;aw=aq}else{break L2725}}}}while(0);a[f+2764|0]=aQ&255;au=c[X>>2]|0;ay=c[aa>>2]|0;aA=au>>>8;an=-1;aw=au;while(1){aU=an+1|0;aV=$(d[aU+3848|0]|0,aA);if(ay>>>0<aV>>>0){an=aU;aw=aV}else{break}}an=ay-aV|0;c[aa>>2]=an;aA=aw-aV|0;c[X>>2]=aA;L2736:do{if(aA>>>0<8388609){au=g+20|0;ao=g+40|0;ap=g+24|0;az=g|0;ab=c[g+4>>2]|0;aB=c[au>>2]|0;ax=aA;as=c[ao>>2]|0;aj=c[ap>>2]|0;av=an;while(1){aq=aB+8|0;c[au>>2]=aq;ar=ax<<8;c[X>>2]=ar;if(aj>>>0<ab>>>0){at=aj+1|0;c[ap>>2]=at;aW=d[(c[az>>2]|0)+aj|0]|0;aX=at}else{aW=0;aX=aj}c[ao>>2]=aW;at=((aW|as<<8)>>>1&255|av<<8&2147483392)^255;c[aa>>2]=at;if(ar>>>0<8388609){aB=aq;ax=ar;as=aW;aj=aX;av=at}else{break L2736}}}}while(0);an=aU&255;aA=f+2768|0;a[aA]=an;L2744:do{if((c[Y>>2]|0)>0){aw=g+20|0;ay=g+40|0;av=g+24|0;aj=g+4|0;as=g|0;ax=0;aB=an;while(1){ao=c[4136+(aB<<24>>24<<2)>>2]|0;az=c[X>>2]|0;ap=c[aa>>2]|0;ab=az>>>8;au=-1;at=az;while(1){aY=au+1|0;aZ=$(d[ao+aY|0]|0,ab);if(ap>>>0<aZ>>>0){au=aY;at=aZ}else{break}}au=ap-aZ|0;c[aa>>2]=au;ab=at-aZ|0;c[X>>2]=ab;L2751:do{if(ab>>>0<8388609){ao=c[aj>>2]|0;az=c[aw>>2]|0;ar=ab;aq=c[ay>>2]|0;am=c[av>>2]|0;al=au;while(1){ak=az+8|0;c[aw>>2]=ak;m=ar<<8;c[X>>2]=m;if(am>>>0<ao>>>0){af=am+1|0;c[av>>2]=af;a_=d[(c[as>>2]|0)+am|0]|0;a$=af}else{a_=0;a$=am}c[ay>>2]=a_;af=((a_|aq<<8)>>>1&255|al<<8&2147483392)^255;c[aa>>2]=af;if(m>>>0<8388609){az=ak;ar=m;aq=a_;am=a$;al=af}else{break L2751}}}}while(0);a[ax+(f+2740)|0]=aY&255;au=ax+1|0;if((au|0)>=(c[Y>>2]|0)){break L2744}ax=au;aB=a[aA]|0}}}while(0);if((k|0)!=0){a[f+2769|0]=0;break}aA=c[X>>2]|0;an=c[aa>>2]|0;aB=aA>>>8;ax=-1;ay=aA;while(1){a0=ax+1|0;a1=$(d[a0+3824|0]|0,aB);if(an>>>0<a1>>>0){ax=a0;ay=a1}else{break}}ax=an-a1|0;c[aa>>2]=ax;aB=ay-a1|0;c[X>>2]=aB;L2767:do{if(aB>>>0<8388609){aA=g+20|0;as=g+40|0;av=g+24|0;aw=g|0;aj=c[g+4>>2]|0;au=c[aA>>2]|0;ab=aB;at=c[as>>2]|0;ap=c[av>>2]|0;al=ax;while(1){am=au+8|0;c[aA>>2]=am;aq=ab<<8;c[X>>2]=aq;if(ap>>>0<aj>>>0){ar=ap+1|0;c[av>>2]=ar;a2=d[(c[aw>>2]|0)+ap|0]|0;a3=ar}else{a2=0;a3=ap}c[as>>2]=a2;ar=((a2|at<<8)>>>1&255|al<<8&2147483392)^255;c[aa>>2]=ar;if(aq>>>0<8388609){au=am;ab=aq;at=a2;ap=a3;al=ar}else{break L2767}}}}while(0);a[f+2769|0]=a0&255}}while(0);c[f+2396>>2]=a[j]|0;j=c[X>>2]|0;a0=c[aa>>2]|0;a3=j>>>8;a2=-1;a1=j;while(1){a4=a2+1|0;a5=$(d[a4+344|0]|0,a3);if(a0>>>0<a5>>>0){a2=a4;a1=a5}else{break}}a2=a0-a5|0;c[aa>>2]=a2;a0=a1-a5|0;c[X>>2]=a0;if(a0>>>0>=8388609){a6=a4&255;a7=f+2770|0;a[a7]=a6;i=l;return}a5=g+20|0;a1=g+40|0;a3=g+24|0;j=g|0;k=c[g+4>>2]|0;g=c[a5>>2]|0;Y=a0;a0=c[a1>>2]|0;aY=c[a3>>2]|0;a$=a2;while(1){a2=g+8|0;c[a5>>2]=a2;a_=Y<<8;c[X>>2]=a_;if(aY>>>0<k>>>0){aZ=aY+1|0;c[a3>>2]=aZ;a8=d[(c[j>>2]|0)+aY|0]|0;a9=aZ}else{a8=0;a9=aY}c[a1>>2]=a8;aZ=((a8|a0<<8)>>>1&255|a$<<8&2147483392)^255;c[aa>>2]=aZ;if(a_>>>0<8388609){g=a2;Y=a_;a0=a8;aY=a9;a$=aZ}else{break}}a6=a4&255;a7=f+2770|0;a[a7]=a6;i=l;return}function bz(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0;h=i;i=i+160|0;j=h|0;k=h+80|0;l=e>>1;m=a+28|0;n=c[m>>2]|0;o=a+32|0;p=c[o>>2]|0;q=n>>>8;r=-1;s=n;while(1){t=r+1|0;u=$(d[1224+(l*9&-1)+t|0]|0,q);if(p>>>0<u>>>0){r=t;s=u}else{break}}r=p-u|0;c[o>>2]=r;p=s-u|0;c[m>>2]=p;L2792:do{if(p>>>0<8388609){u=a+20|0;s=a+40|0;q=a+24|0;l=a|0;n=c[a+4>>2]|0;v=c[u>>2]|0;w=p;x=c[s>>2]|0;y=c[q>>2]|0;z=r;while(1){A=v+8|0;c[u>>2]=A;B=w<<8;c[m>>2]=B;if(y>>>0<n>>>0){C=y+1|0;c[q>>2]=C;D=d[(c[l>>2]|0)+y|0]|0;E=C}else{D=0;E=y}c[s>>2]=D;C=((D|x<<8)>>>1&255|z<<8&2147483392)^255;c[o>>2]=C;if(B>>>0<8388609){v=A;w=B;x=D;y=E;z=C}else{F=B;G=C;break L2792}}}else{F=p;G=r}}while(0);r=g>>4;p=((r<<4|0)<(g|0)&1)+r|0;r=(p|0)>0;if(!r){H=j|0;bt(a,b,g,e,f,H);i=h;return}E=a+20|0;D=a+40|0;z=a+24|0;y=a+4|0;x=a|0;w=0;v=F;F=G;while(1){G=k+(w<<2)|0;c[G>>2]=0;s=v>>>8;l=-1;q=v;while(1){I=l+1|0;J=$(d[1248+(t*18&-1)+I|0]|0,s);if(F>>>0<J>>>0){l=I;q=J}else{break}}l=F-J|0;c[o>>2]=l;s=q-J|0;c[m>>2]=s;L2808:do{if(s>>>0<8388609){n=c[y>>2]|0;u=c[E>>2]|0;C=s;B=c[D>>2]|0;A=c[z>>2]|0;K=l;while(1){L=u+8|0;c[E>>2]=L;M=C<<8;c[m>>2]=M;if(A>>>0<n>>>0){N=A+1|0;c[z>>2]=N;O=d[(c[x>>2]|0)+A|0]|0;P=N}else{O=0;P=A}c[D>>2]=O;N=((O|B<<8)>>>1&255|K<<8&2147483392)^255;c[o>>2]=N;if(M>>>0<8388609){u=L;C=M;B=O;A=P;K=N}else{Q=M;R=N;break L2808}}}else{Q=s;R=l}}while(0);l=j+(w<<2)|0;c[l>>2]=I;if((I|0)==17){s=0;q=Q;K=R;while(1){S=s+1|0;A=(S|0)==10&1;B=q>>>8;C=-1;u=q;while(1){T=C+1|0;U=$(d[1410+(T+A|0)|0]|0,B);if(K>>>0<U>>>0){C=T;u=U}else{break}}C=K-U|0;c[o>>2]=C;B=u-U|0;c[m>>2]=B;L2822:do{if(B>>>0<8388609){A=c[y>>2]|0;n=c[E>>2]|0;N=B;M=c[D>>2]|0;L=c[z>>2]|0;V=C;while(1){W=n+8|0;c[E>>2]=W;X=N<<8;c[m>>2]=X;if(L>>>0<A>>>0){Y=L+1|0;c[z>>2]=Y;Z=d[(c[x>>2]|0)+L|0]|0;_=Y}else{Z=0;_=L}c[D>>2]=Z;Y=((Z|M<<8)>>>1&255|V<<8&2147483392)^255;c[o>>2]=Y;if(X>>>0<8388609){n=W;N=X;M=Z;L=_;V=Y}else{aa=X;ab=Y;break L2822}}}else{aa=B;ab=C}}while(0);if((T|0)==17){s=S;q=aa;K=ab}else{break}}c[G>>2]=S;c[l>>2]=T;ac=aa;ad=ab}else{ac=Q;ad=R}K=w+1|0;if((K|0)<(p|0)){w=K;v=ac;F=ad}else{break}}if(r){ae=0}else{H=j|0;bt(a,b,g,e,f,H);i=h;return}while(1){ad=c[j+(ae<<2)>>2]|0;F=b+(ae<<16>>12<<2)|0;if((ad|0)>0){bH(F,a,ad)}else{b1(F|0,0,64)}F=ae+1|0;if((F|0)<(p|0)){ae=F}else{break}}if(!r){H=j|0;bt(a,b,g,e,f,H);i=h;return}r=a+20|0;ae=a+40|0;F=a+24|0;ad=a+4|0;ac=a|0;v=0;while(1){w=c[k+(v<<2)>>2]|0;if((w|0)>0){R=v<<16>>12;Q=0;while(1){ab=b+(Q+R<<2)|0;aa=c[ab>>2]|0;T=0;S=c[m>>2]|0;_=c[o>>2]|0;while(1){Z=S>>>8;D=-1;x=S;while(1){af=D+1|0;ag=$(d[af+1568|0]|0,Z);if(_>>>0<ag>>>0){D=af;x=ag}else{break}}D=aa<<1;Z=_-ag|0;c[o>>2]=Z;z=x-ag|0;c[m>>2]=z;L2856:do{if(z>>>0<8388609){E=c[ad>>2]|0;y=c[r>>2]|0;U=z;I=c[ae>>2]|0;P=c[F>>2]|0;O=Z;while(1){J=y+8|0;c[r>>2]=J;t=U<<8;c[m>>2]=t;if(P>>>0<E>>>0){K=P+1|0;c[F>>2]=K;ah=d[(c[ac>>2]|0)+P|0]|0;ai=K}else{ah=0;ai=P}c[ae>>2]=ah;K=((ah|I<<8)>>>1&255|O<<8&2147483392)^255;c[o>>2]=K;if(t>>>0<8388609){y=J;U=t;I=ah;P=ai;O=K}else{aj=t;ak=K;break L2856}}}else{aj=z;ak=Z}}while(0);al=af+D|0;Z=T+1|0;if((Z|0)<(w|0)){aa=al;T=Z;S=aj;_=ak}else{break}}c[ab>>2]=al;_=Q+1|0;if((_|0)<16){Q=_}else{break}}Q=j+(v<<2)|0;c[Q>>2]=c[Q>>2]|w<<5}Q=v+1|0;if((Q|0)<(p|0)){v=Q}else{break}}H=j|0;bt(a,b,g,e,f,H);i=h;return}function bA(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=d<<16>>16;c[b+2332>>2]=f*5&-1;g=b+2324|0;h=$(c[g>>2]<<16>>16,(f*327680&-1)>>16);i=b+2316|0;j=b+2320|0;do{if((c[i>>2]|0)==(d|0)){if((c[j>>2]|0)==(e|0)){k=0;l=1968;break}else{l=1967;break}}else{l=1967}}while(0);do{if((l|0)==1967){m=bO(b+2432|0,f*1e3&-1,e,0)|0;c[j>>2]=e;if((c[i>>2]|0)==(d|0)){k=m;l=1968;break}else{n=m;o=0;break}}}while(0);do{if((l|0)==1968){if((h|0)==(c[b+2328>>2]|0)){p=k}else{n=k;o=1;break}return p|0}}while(0);k=(d|0)==8;l=(c[g>>2]|0)==4;g=b+2384|0;do{if(k){if(l){c[g>>2]=1528;break}else{c[g>>2]=1560;break}}else{if(l){c[g>>2]=1488;break}else{c[g>>2]=1544;break}}}while(0);if(!o){c[b+2336>>2]=f*20&-1;f=b+2340|0;if((d|0)==12|(d|0)==8){c[f>>2]=10;c[b+2732>>2]=2088}else{c[f>>2]=16;c[b+2732>>2]=2048}do{if((d|0)==16){c[b+2380>>2]=320}else if((d|0)==12){c[b+2380>>2]=328}else{if(!k){break}c[b+2380>>2]=344}}while(0);c[b+2376>>2]=1;c[b+2308>>2]=100;a[b+2312|0]=10;c[b+4164>>2]=0;b1(b+1284|0,0,1024)}c[i>>2]=d;c[b+2328>>2]=h;p=n;return p|0}function bB(f,g,h,j,k,l,m){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0;n=i;i=i+24|0;o=n|0;p=n+8|0;q=n+16|0;r=q;s=i;i=i+1280|0;c[q>>2]=0;c[q+4>>2]=0;t=f;u=f;w=g+4|0;x=c[w>>2]|0;L2902:do{if((j|0)!=0&(x|0)>0){y=0;while(1){c[u+(y*4260&-1)+2388>>2]=0;z=y+1|0;A=c[w>>2]|0;if((z|0)<(A|0)){y=z}else{B=A;break L2902}}}else{B=x}}while(0);x=g+4|0;w=f+8536|0;j=c[w>>2]|0;if((B|0)>(j|0)){y=f+4260|0;b1(y|0,0,4252);c[f+6636>>2]=1;c[y>>2]=65536;c[f+8408>>2]=0;c[f+8412>>2]=3176576;c[f+8428>>2]=0;c[f+8500>>2]=65536;c[f+8504>>2]=65536;c[f+8516>>2]=20;c[f+8512>>2]=2;C=c[x>>2]|0}else{C=B}if((C|0)==1&(j|0)==2){D=(c[g+12>>2]|0)==((c[f+2316>>2]|0)*1e3&-1|0)}else{D=0}j=f+2388|0;L2912:do{if((c[j>>2]|0)==0&(C|0)>0){B=g+16|0;y=g+12|0;A=g+8|0;z=0;E=0;while(1){F=c[B>>2]|0;if((F|0)==40){c[u+(E*4260&-1)+2392>>2]=2;c[u+(E*4260&-1)+2324>>2]=4}else if((F|0)==10){c[u+(E*4260&-1)+2392>>2]=1;c[u+(E*4260&-1)+2324>>2]=2}else if((F|0)==60){c[u+(E*4260&-1)+2392>>2]=3;c[u+(E*4260&-1)+2324>>2]=4}else if((F|0)==20){c[u+(E*4260&-1)+2392>>2]=1;c[u+(E*4260&-1)+2324>>2]=4}else if((F|0)==0){c[u+(E*4260&-1)+2392>>2]=1;c[u+(E*4260&-1)+2324>>2]=2}else{G=-203;H=2128;break}F=c[y>>2]>>10;if(!((F|0)==15|(F|0)==11|(F|0)==7)){G=-200;H=2126;break}I=(bA(u+(E*4260&-1)|0,F+1|0,c[A>>2]|0)|0)+z|0;F=E+1|0;J=c[x>>2]|0;if((F|0)<(J|0)){z=I;E=F}else{K=I;L=J;break L2912}}if((H|0)==2126){i=n;return G|0}else if((H|0)==2128){i=n;return G|0}}else{K=0;L=C}}while(0);C=g|0;E=c[C>>2]|0;do{if((E|0)==2){if((L|0)!=2){M=2;break}if((c[f+8532>>2]|0)!=1){if((c[w>>2]|0)!=1){M=2;break}}z=f+8520|0;v=0;b[z>>1]=v&65535;b[z+2>>1]=v>>16;z=f+8528|0;v=0;b[z>>1]=v&65535;b[z+2>>1]=v>>16;b3(f+6692|0,f+2432|0,300);M=c[C>>2]|0}else{M=E}}while(0);c[f+8532>>2]=M;c[w>>2]=c[x>>2]|0;M=g+8|0;if(((c[M>>2]|0)-8e3|0)>>>0>4e4){G=-200;i=n;return G|0}E=(h|0)==1;L2938:do{if(E){N=0}else{if((c[j>>2]|0)!=0){N=0;break}L=c[x>>2]|0;L2941:do{if((L|0)>0){z=k+28|0;A=k+32|0;y=k+20|0;B=k+40|0;J=k+24|0;I=k+4|0;F=k|0;O=0;while(1){P=u+(O*4260&-1)+2392|0;Q=0;while(1){R=(Q|0)<(c[P>>2]|0);S=c[z>>2]|0;T=c[A>>2]|0;U=S>>>1;V=T>>>0<U>>>0;W=V&1;if(V){X=U;Y=T}else{V=T-U|0;c[A>>2]=V;X=S-U|0;Y=V}c[z>>2]=X;L2950:do{if(X>>>0<8388609){V=c[I>>2]|0;U=c[y>>2]|0;S=X;T=c[B>>2]|0;Z=c[J>>2]|0;_=Y;while(1){aa=U+8|0;c[y>>2]=aa;ab=S<<8;c[z>>2]=ab;if(Z>>>0<V>>>0){ac=Z+1|0;c[J>>2]=ac;ad=d[(c[F>>2]|0)+Z|0]|0;ae=ac}else{ad=0;ae=Z}c[B>>2]=ad;ac=((ad|T<<8)>>>1&255|_<<8&2147483392)^255;c[A>>2]=ac;if(ab>>>0<8388609){U=aa;S=ab;T=ad;Z=ae;_=ac}else{break L2950}}}}while(0);if(!R){break}c[u+(O*4260&-1)+2404+(Q<<2)>>2]=W;Q=Q+1|0}c[u+(O*4260&-1)+2416>>2]=W;Q=O+1|0;af=c[x>>2]|0;if((Q|0)<(af|0)){O=Q}else{break}}if((af|0)<=0){ag=af;break}O=k+28|0;A=k+32|0;B=k+20|0;F=k+40|0;J=k+24|0;z=k+4|0;y=k|0;I=0;while(1){Q=u+(I*4260&-1)+2420|0;b1(Q|0,0,12);L2964:do{if((c[u+(I*4260&-1)+2416>>2]|0)!=0){P=u+(I*4260&-1)+2392|0;_=c[P>>2]|0;if((_|0)==1){c[Q>>2]=1;break}Z=c[4480+(_-2<<2)>>2]|0;_=c[O>>2]|0;T=c[A>>2]|0;S=_>>>8;U=-1;V=_;while(1){_=U+1|0;ah=$(d[Z+_|0]|0,S);if(T>>>0<ah>>>0){U=_;V=ah}else{break}}S=T-ah|0;c[A>>2]=S;Z=V-ah|0;c[O>>2]=Z;L2972:do{if(Z>>>0<8388609){R=c[z>>2]|0;_=c[B>>2]|0;ac=Z;ab=c[F>>2]|0;aa=c[J>>2]|0;ai=S;while(1){aj=_+8|0;c[B>>2]=aj;ak=ac<<8;c[O>>2]=ak;if(aa>>>0<R>>>0){al=aa+1|0;c[J>>2]=al;am=d[(c[y>>2]|0)+aa|0]|0;ao=al}else{am=0;ao=aa}c[F>>2]=am;al=((am|ab<<8)>>>1&255|ai<<8&2147483392)^255;c[A>>2]=al;if(ak>>>0<8388609){_=aj;ac=ak;ab=am;aa=ao;ai=al}else{break L2972}}}}while(0);S=U+2|0;if((c[P>>2]|0)>0){ap=0}else{break}while(1){c[u+(I*4260&-1)+2420+(ap<<2)>>2]=S>>>(ap>>>0)&1;Z=ap+1|0;if((Z|0)<(c[P>>2]|0)){ap=Z}else{break L2964}}}}while(0);Q=I+1|0;P=c[x>>2]|0;if((Q|0)<(P|0)){I=Q}else{ag=P;break L2941}}}else{ag=L}}while(0);if((h|0)!=0){N=0;break}L=f+2392|0;I=c[L>>2]|0;if((I|0)<=0){N=0;break}A=q;F=f+6680|0;y=k+28|0;J=k+32|0;O=k+20|0;B=k+40|0;z=k+24|0;P=k+4|0;Q=k|0;S=s|0;U=0;Z=0;V=ag;T=I;while(1){if((V|0)>0){I=F+(Z<<2)|0;ai=(Z|0)>0;aa=Z-1|0;ab=U;ac=0;_=V;while(1){R=u+(ac*4260&-1)|0;if((c[u+(ac*4260&-1)+2420+(Z<<2)>>2]|0)==0){aq=ab;ar=_}else{L2994:do{if((_|0)==2&(ac|0)==0){bS(k,A);if((c[I>>2]|0)!=0){as=ab;break}al=c[y>>2]|0;ak=c[J>>2]|0;aj=al>>>8;at=-1;au=al;while(1){aw=at+1|0;ax=$(d[aw+440|0]|0,aj);if(ak>>>0<ax>>>0){at=aw;au=ax}else{break}}at=ak-ax|0;c[J>>2]=at;aj=au-ax|0;c[y>>2]=aj;if(aj>>>0>=8388609){as=aw;break}al=c[P>>2]|0;ay=c[O>>2]|0;az=aj;aj=c[B>>2]|0;aA=c[z>>2]|0;aB=at;while(1){at=ay+8|0;c[O>>2]=at;aC=az<<8;c[y>>2]=aC;if(aA>>>0<al>>>0){aD=aA+1|0;c[z>>2]=aD;aE=d[(c[Q>>2]|0)+aA|0]|0;aF=aD}else{aE=0;aF=aA}c[B>>2]=aE;aD=((aE|aj<<8)>>>1&255|aB<<8&2147483392)^255;c[J>>2]=aD;if(aC>>>0<8388609){ay=at;az=aC;aj=aE;aA=aF;aB=aD}else{as=aw;break L2994}}}else{as=ab}}while(0);do{if(ai){if((c[u+(ac*4260&-1)+2420+(aa<<2)>>2]|0)==0){H=2059;break}else{aG=2;break}}else{H=2059}}while(0);if((H|0)==2059){H=0;aG=0}by(R,k,Z,1,aG);bz(k,S,a[u+(ac*4260&-1)+2765|0]|0,a[u+(ac*4260&-1)+2766|0]|0,c[u+(ac*4260&-1)+2328>>2]|0);aq=as;ar=c[x>>2]|0}aB=ac+1|0;if((aB|0)<(ar|0)){ab=aq;ac=aB;_=ar}else{break}}aH=aq;aI=ar;aJ=c[L>>2]|0}else{aH=U;aI=V;aJ=T}_=Z+1|0;if((_|0)<(aJ|0)){U=aH;Z=_;V=aI;T=aJ}else{N=aH;break L2938}}}}while(0);aH=c[x>>2]|0;do{if((aH|0)==2){do{if((h|0)==2){if((c[(f+2420|0)+(c[j>>2]<<2)>>2]|0)!=1){H=2066;break}bS(k,q);if((c[(f+6680|0)+(c[j>>2]<<2)>>2]|0)==0){H=2070;break}else{aK=0;break}}else if((h|0)==0){bS(k,q);if((c[(f+6664|0)+(c[j>>2]<<2)>>2]|0)==0){H=2070;break}else{aK=0;break}}else{H=2066}}while(0);L3022:do{if((H|0)==2066){c[q>>2]=b[f+8520>>1]|0;c[r+4>>2]=b[f+8522>>1]|0;aK=N}else if((H|0)==2070){aJ=k+28|0;aI=c[aJ>>2]|0;ar=k+32|0;aq=c[ar>>2]|0;as=aI>>>8;aG=-1;aw=aI;while(1){aL=aG+1|0;aM=$(d[aL+440|0]|0,as);if(aq>>>0<aM>>>0){aG=aL;aw=aM}else{break}}aG=aq-aM|0;c[ar>>2]=aG;as=aw-aM|0;c[aJ>>2]=as;if(as>>>0>=8388609){aK=aL;break}aI=k+20|0;aF=k+40|0;aE=k+24|0;ax=k|0;ag=c[k+4>>2]|0;s=c[aI>>2]|0;ap=as;as=c[aF>>2]|0;ao=c[aE>>2]|0;am=aG;while(1){aG=s+8|0;c[aI>>2]=aG;ah=ap<<8;c[aJ>>2]=ah;if(ao>>>0<ag>>>0){af=ao+1|0;c[aE>>2]=af;aN=d[(c[ax>>2]|0)+ao|0]|0;aO=af}else{aN=0;aO=ao}c[aF>>2]=aN;af=((aN|as<<8)>>>1&255|am<<8&2147483392)^255;c[ar>>2]=af;if(ah>>>0<8388609){s=aG;ap=ah;as=aN;ao=aO;am=af}else{aK=aL;break L3022}}}}while(0);am=c[x>>2]|0;if(!((am|0)==2&(aK|0)==0)){aP=aK;aQ=am;break}if((c[f+8540>>2]|0)!=1){aP=0;aQ=2;break}b1(f+5544|0,0,1024);c[f+6568>>2]=100;a[f+6572|0]=10;c[f+8424>>2]=0;c[f+6636>>2]=1;aP=0;aQ=c[x>>2]|0}else{aP=N;aQ=aH}}while(0);aH=f+2328|0;N=$((c[aH>>2]|0)+2|0,aQ);aQ=av()|0;aK=i;i=i+(N*2&-1)|0;i=i+7>>3<<3;c[p>>2]=aK;N=aK+((c[aH>>2]|0)+2<<1)|0;c[p+4>>2]=N;do{if((h|0)==0){aR=(aP|0)==0&1;H=2085;break}else{if((c[f+8540>>2]|0)==0){aR=1;H=2085;break}aH=c[x>>2]|0;if(!((aH|0)==2&(h|0)==2)){aS=0;aT=aH;break}aR=(c[(f+6680|0)+(c[f+6648>>2]<<2)>>2]|0)==1&1;H=2085;break}}while(0);if((H|0)==2085){aS=aR;aT=c[x>>2]|0}do{if((aT|0)>0){aR=(aS|0)==0;aH=(h|0)==2;aL=f+8540|0;aO=0;while(1){if((aO|0)!=0&aR){b1((c[p+(aO<<2)>>2]|0)+4|0,0,c[o>>2]<<1|0)}else{aN=(c[j>>2]|0)-aO|0;do{if((aN|0)<1){aU=0}else{if(aH){aU=(c[u+(aO*4260&-1)+2420+(aN-1<<2)>>2]|0)!=0?2:0;break}if((aO|0)>0){if((c[aL>>2]|0)!=0){aU=1;break}}aU=2}}while(0);aN=u+(aO*4260&-1)|0;aM=(c[p+(aO<<2)>>2]|0)+4|0;bw(aN,k,aM,o,h,aU)}aM=u+(aO*4260&-1)+2388|0;c[aM>>2]=(c[aM>>2]|0)+1|0;aM=aO+1|0;aV=c[x>>2]|0;if((aM|0)<(aV|0)){aO=aM}else{break}}if(!((c[C>>2]|0)==2&(aV|0)==2)){H=2100;break}aO=f+2316|0;aL=c[o>>2]|0;bI(f+8520|0,aK,N,q,c[aO>>2]|0,aL);aW=aL;aX=aO;break}else{H=2100}}while(0);if((H|0)==2100){H=f+8524|0;c[aK>>2]=e[H>>1]|e[H+2>>1]<<16;q=c[o>>2]|0;o=aK+(q<<1)|0;v=e[o>>1]|e[o+2>>1]<<16;b[H>>1]=v&65535;b[H+2>>1]=v>>16;aW=q;aX=f+2316|0}q=$(c[M>>2]|0,aW);M=(q|0)/((c[aX>>2]<<16>>16)*1e3&-1|0)&-1;c[m>>2]=M;q=c[C>>2]|0;if((q|0)==2){H=i;i=i+(M*2&-1)|0;i=i+7>>3<<3;aY=H}else{aY=l}H=c[x>>2]|0;L3071:do{if((((q|0)<(H|0)?q:H)|0)>0){M=0;o=aK;while(1){bP(u+(M*4260&-1)+2432|0,aY,o+2|0,aW);N=c[C>>2]|0;do{if((N|0)==2){if((c[m>>2]|0)>0){aZ=0}else{a_=2;break}while(1){b[l+((aZ<<1)+M<<1)>>1]=b[aY+(aZ<<1)>>1]|0;aV=aZ+1|0;if((aV|0)<(c[m>>2]|0)){aZ=aV}else{break}}a_=c[C>>2]|0}else{a_=N}}while(0);N=M+1|0;R=c[x>>2]|0;if((N|0)>=(((a_|0)<(R|0)?a_:R)|0)){a$=a_;a0=R;break L3071}M=N;o=c[p+(N<<2)>>2]|0}}else{a$=q;a0=H}}while(0);L3082:do{if((a$|0)==2&(a0|0)==1){if(D){H=f+6692|0;q=aK+2|0;bP(H,aY,q,aW);if((c[m>>2]|0)>0){a1=0}else{break}while(1){b[l+((a1<<1|1)<<1)>>1]=b[aY+(a1<<1)>>1]|0;q=a1+1|0;if((q|0)<(c[m>>2]|0)){a1=q}else{break L3082}}}else{if((c[m>>2]|0)>0){a2=0}else{break}while(1){q=a2<<1;b[l+((q|1)<<1)>>1]=b[l+(q<<1)>>1]|0;q=a2+1|0;if((q|0)<(c[m>>2]|0)){a2=q}else{break L3082}}}}}while(0);if((c[f+4164>>2]|0)==2){c[g+20>>2]=$(c[4504+((c[aX>>2]|0)-8>>2<<2)>>2]|0,c[f+2308>>2]|0)}else{c[g+20>>2]=0}L3096:do{if(E){if((c[w>>2]|0)>0){a3=0}else{break}while(1){a[t+(a3*4260&-1)+2312|0]=10;g=a3+1|0;if((g|0)<(c[w>>2]|0)){a3=g}else{break L3096}}}else{c[f+8540>>2]=aP}}while(0);an(aQ|0);G=K;i=n;return G|0}function bC(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((g|0)>0){h=0}else{return}while(1){i=a[d+h|0]|0;do{if((h|f|0)==0){j=(a[e]|0)-16|0;k=((i|0)>(j|0)?i:j)&255;a[e]=k;l=k}else{k=i-4|0;j=a[e]|0;if((k|0)>(j+8|0)){m=(k<<1)+248&255;a[e]=m;l=m;break}else{m=j+k&255;a[e]=m;l=m;break}}}while(0);if(l<<24>>24>63){n=63}else{n=l<<24>>24<0?0:l}a[e]=n;i=n<<24>>24;m=((i*29&-1)+2090|0)+((i*7281&-1)>>16)|0;i=(m|0)<3967?m:3967;if((i|0)<0){o=0}else{m=i>>7;k=1<<m;j=i&127;if((i|0)<2048){p=($(j*-174&-1,128-j|0)>>16)+j<<m>>7}else{p=$(($(j*-174&-1,128-j|0)>>16)+j|0,k>>7)}o=p+k|0}c[b+(h<<2)>>2]=o;k=h+1|0;if((k|0)<(g|0)){h=k}else{break}}return}function bD(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;j=i;i=i+80|0;k=j|0;l=j+16|0;m=j+48|0;n=h+2|0;o=b[n>>1]|0;p=$(o<<16>>16,a[g]|0);q=c[h+8>>2]|0;L3127:do{if(o<<16>>16>0){r=0;while(1){b[f+(r<<1)>>1]=(d[q+(r+p|0)|0]|0)<<7;s=r+1|0;t=b[n>>1]|0;u=t<<16>>16;if((s|0)<(u|0)){r=s}else{break}}L3131:do{if(t<<16>>16>0){r=$(a[g]|0,u);s=c[h+16>>2]|0;v=0;w=(c[h+20>>2]|0)+((r|0)/2&-1)|0;while(1){r=d[w]|0;x=t<<16>>16;y=x-1|0;a[k+v|0]=a[s+((y&-(r&1))+v|0)|0]|0;z=v|1;a[k+z|0]=a[s+((y&-(r>>>4&1))+z|0)|0]|0;z=v+2|0;if((z|0)<(x|0)){v=z;w=w+1|0}else{break L3131}}}}while(0);if(t<<16>>16<=0){A=t;B=2152;break}w=t<<16>>16;v=b[h+4>>1]|0;s=0;z=w;while(1){x=z-1|0;r=$(d[k+x|0]|0,s)>>8;y=(a[g+z|0]|0)<<10;if((y|0)>0){C=y-102|0}else{C=(y|0)<0?y|102:y}y=$(C>>16,v);D=(y+r|0)+($(C&65535,v)>>16)|0;b[l+(x<<1)>>1]=D&65535;if((x|0)>0){s=D<<16>>16;z=x}else{E=w;break L3127}}}else{A=o;B=2152}}while(0);if((B|0)==2152){E=A<<16>>16}bM(m|0,f,E);E=b[n>>1]|0;if(E<<16>>16>0){F=0}else{G=E<<16>>16;H=h+32|0;I=c[H>>2]|0;bL(f,I,G);i=j;return}while(1){E=(e[m+(F<<1)>>1]|0)<<16;if((E|0)<1){J=0}else{A=b2(E|0)|0;B=24-A|0;do{if((A|0)==24){K=E;L=24}else{if((B|0)<0){K=E>>>((B+32|0)>>>0)|E<<-B;L=A;break}else{K=E<<32-B|E>>>(B>>>0);L=A;break}}}while(0);A=((L&1|0)==0?46214:32768)>>>(L>>>1>>>0);B=$(K&127,13959168)>>>16;E=$(A>>16,B);J=(E+A|0)+($(A&65535,B)>>>16)|0}B=f+(F<<1)|0;A=(((b[l+(F<<1)>>1]|0)<<14|0)/(J|0)&-1)+(b[B>>1]|0)|0;if((A|0)>32767){M=32767}else{M=(A|0)<0?0:A&65535}b[B>>1]=M;B=F+1|0;A=b[n>>1]|0;if((B|0)<(A|0)){F=B}else{G=A;break}}H=h+32|0;I=c[H>>2]|0;bL(f,I,G);i=j;return}function bE(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;h=c[d+2316>>2]|0;i=d+4248|0;if((h|0)!=(c[i>>2]|0)){c[d+4168>>2]=c[d+2328>>2]<<7;c[d+4240>>2]=65536;c[d+4244>>2]=65536;c[d+4256>>2]=20;c[d+4252>>2]=2;c[i>>2]=h}if((g|0)!=0){bF(d,e,f);f=d+4160|0;c[f>>2]=(c[f>>2]|0)+1|0;return}f=d+4168|0;g=a[d+2765|0]|0;c[d+4164>>2]=g<<24>>24;L3171:do{if(g<<24>>24==2){i=d+2332|0;j=c[d+2324>>2]|0;k=j-1|0;l=e+(k<<2)|0;m=c[l>>2]|0;n=d+4172|0;o=n;do{if((m|0)<1|(j|0)==0){b1(n|0,0,10);p=0;q=0;r=d+4176|0}else{s=f|0;t=j+65535|0;u=0;v=0;w=0;x=m;while(1){y=k+w|0;z=y*5&-1;A=((((b[e+96+(z+1<<1)>>1]|0)+(b[e+96+(z<<1)>>1]|0)|0)+(b[e+96+(z+2<<1)>>1]|0)|0)+(b[e+96+(z+3<<1)>>1]|0)|0)+(b[e+96+(z+4<<1)>>1]|0)|0;if((A|0)>(v|0)){z=e+96+(((t+w<<16>>16)*5&-1)<<1)|0;b[o>>1]=b[z>>1]|0;b[o+2>>1]=b[z+2>>1]|0;b[o+4>>1]=b[z+4>>1]|0;b[o+6>>1]=b[z+6>>1]|0;b[o+8>>1]=b[z+8>>1]|0;c[s>>2]=c[e+(y<<2)>>2]<<8;B=A;C=c[l>>2]|0}else{B=v;C=x}A=u+1|0;y=u^-1;if(($(c[i>>2]|0,A)|0)>=(C|0)|(A|0)==(j|0)){break}else{u=A;v=B;w=y;x=C}}b1(o|0,0,10);x=B&65535;w=d+4176|0;b[w>>1]=x;if((B|0)<11469){p=B;q=x;r=w;break}if((B|0)<=15565){D=j;E=i;break L3171}b[d+4172>>1]=0;b[d+4174>>1]=0;b[w>>1]=$((255016960/(B|0)&-1)<<16>>16,x<<16>>16)>>>14&65535;b[d+4178>>1]=0;b[d+4180>>1]=0;D=j;E=i;break L3171}}while(0);b[d+4172>>1]=0;b[d+4174>>1]=0;b[r>>1]=$((11744256/(((p|0)>1?p:1)|0)&-1)<<16>>16,q<<16>>16)>>>10&65535;b[d+4178>>1]=0;b[d+4180>>1]=0;D=j;E=i}else{c[f>>2]=(h<<16>>16)*4608&-1;b1(d+4172|0,0,10);D=c[d+2324>>2]|0;E=d+2332|0}}while(0);b3(d+4182|0,e+64|0,c[d+2340>>2]<<1);b[d+4236>>1]=c[e+136>>2]&65535;h=e+16+(D-2<<2)|0;e=d+4240|0;f=c[h+4>>2]|0;c[e>>2]=c[h>>2]|0;c[e+4>>2]=f;c[d+4256>>2]=c[E>>2]|0;c[d+4252>>2]=D;return}
function bF(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0;f=i;i=i+160|0;g=f|0;h=f+128|0;j=c[a+4256>>2]|0;k=i;i=i+((j<<1)*2&-1)|0;i=i+7>>3<<3;l=a+2336|0;m=c[l>>2]|0;n=i;i=i+(m*2&-1)|0;i=i+7>>3<<3;o=a+2328|0;p=i;i=i+(((c[o>>2]|0)+m|0)*4&-1)|0;i=i+7>>3<<3;m=c[a+4240>>2]|0;q=m>>>6;r=a+4244|0;s=c[r>>2]|0;t=s>>6;if((c[a+2376>>2]|0)!=0){b1(a+4182|0,0,32)}u=a+4252|0;v=(j|0)>0;L4:do{if(v){w=c[u>>2]|0;x=0;while(1){y=c[a+4+($(w-2|0,j)+x<<2)>>2]|0;z=q<<16>>16;A=$(z,y>>16);B=($(z,y&65535)>>16)+A|0;A=B+$((m>>21)+1>>1,y)>>8;if((A|0)>32767){C=32767}else{C=(A|0)<-32768?-32768:A&65535}b[k+(x<<1)>>1]=C;A=x+1|0;if((A|0)<(j|0)){x=A}else{break}}if(!v){break}x=c[u>>2]|0;w=0;while(1){A=c[a+4+($(x-1|0,j)+w<<2)>>2]|0;y=t<<16>>16;B=$(y,A>>16);z=($(y,A&65535)>>16)+B|0;B=z+$((s>>21)+1>>1,A)>>8;if((B|0)>32767){D=32767}else{D=(B|0)<-32768?-32768:B&65535}b[k+(j+w<<1)>>1]=D;B=w+1|0;if((B|0)<(j|0)){w=B}else{break L4}}}}while(0);D=j-1|0;v=0;C=0;while(1){if((C|0)>=(D|0)){E=C;F=0;G=v;break}H=b[k+(C<<1)>>1]|0;m=H<<16>>16;q=$(m,m)+v|0;m=b[k+((C|1)<<1)>>1]|0;I=q+$(m,m)|0;if((I|0)<0){J=10;break}else{v=I;C=C+2|0}}L22:do{if((J|0)==10){v=C;m=2;q=I>>>2;w=H;while(1){x=w<<16>>16;B=$(x,x);x=b[k+((v|1)<<1)>>1]|0;A=(($(x,x)+B|0)>>>(m>>>0))+q|0;if((A|0)<0){K=A>>>2;L=m+2|0}else{K=A;L=m}A=v+2|0;if((A|0)>=(D|0)){E=A;F=L;G=K;break L22}v=A;m=L;q=K;w=b[k+(A<<1)>>1]|0}}}while(0);if((E|0)==(D|0)){E=b[k+(D<<1)>>1]|0;M=($(E,E)>>>(F>>>0))+G|0}else{M=G}if(M>>>0>1073741823){N=M>>>2;O=F+2|0}else{N=M;O=F}F=0;M=0;while(1){if((M|0)>=(D|0)){P=M;Q=0;R=F;break}G=b[k+(M+j<<1)>>1]|0;E=$(G,G)+F|0;G=b[k+((M|1)+j<<1)>>1]|0;S=E+$(G,G)|0;if((S|0)<0){J=22;break}else{F=S;M=M+2|0}}L40:do{if((J|0)==22){F=M;G=2;E=S>>>2;while(1){K=b[k+(F+j<<1)>>1]|0;L=$(K,K);K=b[k+((F|1)+j<<1)>>1]|0;H=(($(K,K)+L|0)>>>(G>>>0))+E|0;if((H|0)<0){T=H>>>2;U=G+2|0}else{T=H;U=G}H=F+2|0;if((H|0)<(D|0)){F=H;G=U;E=T}else{P=H;Q=U;R=T;break L40}}}}while(0);if((P|0)==(D|0)){P=b[k+(D+j<<1)>>1]|0;V=($(P,P)>>>(Q>>>0))+R|0}else{V=R}if(V>>>0>1073741823){W=V>>>2;X=Q+2|0}else{W=V;X=Q}Q=c[u>>2]|0;if((N>>X|0)<(W>>O|0)){O=$(j,Q-1|0)-128|0;Y=(O|0)<0?0:O}else{O=$(j,Q)-128|0;Y=(O|0)<0?0:O}O=a+4172|0;Q=a+4224|0;j=b[Q>>1]|0;W=a+4160|0;X=c[W>>2]|0;N=(X|0)>1?1:X;X=b[11984+(N<<1)>>1]|0;u=a+4164|0;V=b[((c[u>>2]|0)==2?11944:11952)+(N<<1)>>1]|0;N=a+4182|0;R=a+2340|0;P=(c[R>>2]|0)-1|0;L58:do{if((P|0)>0){D=0;k=64881;while(1){T=a+4182+(D<<1)|0;b[T>>1]=(($(b[T>>1]|0,k)>>>15)+1|0)>>>1&65535;T=(((k*-655&-1)>>15)+1>>1)+k|0;U=D+1|0;if((U|0)<(P|0)){D=U;k=T}else{Z=T;break L58}}}else{Z=64881}}while(0);k=a+4182+(P<<1)|0;b[k>>1]=(($(b[k>>1]|0,Z)>>>15)+1|0)>>>1&65535;Z=c[R>>2]|0;b3(h|0,N|0,Z<<1);do{if((c[W>>2]|0)==0){if((c[u>>2]|0)==2){N=((((16384-(b[O>>1]|0)&65535)-(b[a+4174>>1]|0)&65535)-(b[a+4176>>1]|0)&65535)-(b[a+4178>>1]|0)&65535)-(b[a+4180>>1]|0)&65535;_=$(b[a+4236>>1]|0,N<<16>>16<3277?3277:N<<16>>16)>>>14&65535;aa=V;ab=Z;break}N=Z&1;do{if((Z|0)>0){k=0;P=0;while(1){D=b[a+4182+(k<<1)>>1]|0;ac=D+P|0;c[g+(N<<6)+(k<<2)>>2]=D<<12;D=k+1|0;if((D|0)<(Z|0)){k=D;P=ac}else{break}}if((ac|0)>4095){ad=0;ae=Z;break}else{J=42;break}}else{J=42}}while(0);if((J|0)==42){N=bK(g|0,Z)|0;ad=N;ae=c[R>>2]|0}N=(ad|0)>134217728?134217728:ad;P=(N|0)<4194304?33554432:N<<3;N=V<<16>>16;k=$(P>>16,N);_=16384;aa=(($(P&65528,N)>>16)+k|0)>>>14&65535;ab=ae}else{_=j;aa=V;ab=Z}}while(0);Z=a+4220|0;V=c[Z>>2]|0;j=a+4168|0;ae=(c[j>>2]>>7)+1>>1;ad=c[l>>2]|0;g=((ad-2|0)-ab|0)-ae|0;J=h|0;bJ(n+(g<<1)|0,a+1348+(g<<1)|0,J,ad-g|0,ab);ab=c[r>>2]|0;r=(ab|0)>0?ab:-ab|0;if((r|0)==0){af=32}else{af=b2(r|0)|0}r=ab<<af-1;ab=r>>16;ac=536870911/(ab|0)&-1;u=ac<<16;W=u>>16;k=$(ab,W);ab=(536870912-k|0)-($(r&65535,W)>>16)<<3;r=$(ab>>16,W);k=$(ab&65528,W)>>16;W=(($(ab,(ac>>15)+1>>1)+u|0)+r|0)+k|0;k=62-af|0;af=k-46|0;if((af|0)<1){r=46-k|0;k=-2147483648>>r;u=2147483647>>>(r>>>0);do{if((k|0)>(u|0)){if((W|0)>(k|0)){ag=k;break}ag=(W|0)<(u|0)?u:W}else{if((W|0)>(u|0)){ag=u;break}ag=(W|0)<(k|0)?k:W}}while(0);ah=ag<<r}else{ah=(af|0)<32?W>>af:0}af=(ah|0)<1073741823?ah:1073741823;ah=c[R>>2]|0;W=ah+g|0;g=c[l>>2]|0;L88:do{if((W|0)<(g|0)){l=af>>16;r=af&65535;ag=W;while(1){k=b[n+(ag<<1)>>1]|0;u=$(k,l);c[p+(ag<<2)>>2]=($(k,r)>>16)+u|0;u=ag+1|0;if((u|0)<(g|0)){ag=u}else{break L88}}}}while(0);n=c[a+2324>>2]|0;L93:do{if((n|0)>0){W=X<<16>>16;af=aa<<16>>16;ag=a+2316|0;r=a+4174|0;l=a+4176|0;u=a+4178|0;k=a+4180|0;ac=c[a+2332>>2]|0;ab=V;N=_;P=ad;D=ae;T=0;while(1){L97:do{if((ac|0)>0){U=N<<16>>16;S=b[O>>1]|0;M=b[r>>1]|0;E=b[l>>1]|0;G=b[u>>1]|0;F=b[k>>1]|0;H=p+((P+2|0)-D<<2)|0;L=ab;K=P;I=0;while(1){C=c[H>>2]|0;w=S<<16>>16;q=$(w,C>>16);m=$(w,C&65535)>>16;C=c[H-4>>2]|0;w=M<<16>>16;v=$(w,C>>16);A=$(w,C&65535)>>16;C=c[H-8>>2]|0;w=E<<16>>16;B=$(w,C>>16);x=$(w,C&65535)>>16;C=c[H-12>>2]|0;w=G<<16>>16;z=$(w,C>>16);y=$(w,C&65535)>>16;C=c[H-16>>2]|0;w=F<<16>>16;ai=$(w,C>>16);aj=$(w,C&65535)>>16;C=$(L,196314165)+907633515|0;w=c[a+4+((C>>>25)+Y<<2)>>2]|0;ak=$(w>>16,U);c[p+(K<<2)>>2]=(((((((((((q+2|0)+m|0)+v|0)+A|0)+B|0)+x|0)+z|0)+y|0)+ai|0)+aj|0)+ak|0)+($(w&65535,U)>>16)<<2;w=K+1|0;ak=I+1|0;if((ak|0)<(ac|0)){H=H+4|0;L=C;K=w;I=ak}else{al=C;am=w;an=S;ao=M;ap=E;aq=G;ar=F;as=U;break L97}}}else{al=ab;am=P;an=b[O>>1]|0;ao=b[r>>1]|0;ap=b[l>>1]|0;aq=b[u>>1]|0;ar=b[k>>1]|0;as=N<<16>>16}}while(0);b[O>>1]=$(an<<16>>16,W)>>>15&65535;b[r>>1]=$(ao<<16>>16,W)>>>15&65535;b[l>>1]=$(ap<<16>>16,W)>>>15&65535;b[u>>1]=$(aq<<16>>16,W)>>>15&65535;b[k>>1]=$(ar<<16>>16,W)>>>15&65535;U=$(as,af)>>>15&65535;F=c[j>>2]|0;G=(((F>>16)*655&-1)+F|0)+(((F&65535)*655&-1)>>>16)|0;F=(c[ag>>2]<<16>>16)*4608&-1;E=(G|0)<(F|0)?G:F;c[j>>2]=E;F=(E>>7)+1>>1;E=T+1|0;if((E|0)<(n|0)){ab=al;N=U;P=am;D=F;T=E}else{at=al;au=U;av=F;break L93}}}else{at=V;au=_;av=ae}}while(0);ae=g-16|0;_=a+1284|0;b3(p+(ae<<2)|0,_|0,64);a=c[o>>2]|0;if((a|0)<=0){aw=a;ax=aw+ae|0;ay=p+(ax<<2)|0;az=ay;b3(_|0,az|0,64);c[Z>>2]=at;b[Q>>1]=au;aA=d|0;c[aA>>2]=av;aB=d+4|0;c[aB>>2]=av;aC=d+8|0;c[aC>>2]=av;aD=d+12|0;c[aD>>2]=av;i=f;return}a=g-1|0;V=b[J>>1]|0;J=g-2|0;al=b[h+2>>1]|0;am=g-3|0;n=b[h+4>>1]|0;j=g-4|0;as=b[h+6>>1]|0;ar=g-5|0;aq=b[h+8>>1]|0;ap=g-6|0;ao=b[h+10>>1]|0;an=g-7|0;O=b[h+12>>1]|0;Y=g-8|0;ad=b[h+14>>1]|0;aa=g-9|0;X=b[h+16>>1]|0;T=g-10|0;D=b[h+18>>1]|0;P=t<<16>>16;t=(s>>21)+1>>1;s=0;N=ah;while(1){ah=a+s|0;ab=c[p+(ah<<2)>>2]|0;ag=$(V,ab>>16);af=$(V,ab&65535)>>16;ab=c[p+(J+s<<2)>>2]|0;W=$(al,ab>>16);k=$(al,ab&65535)>>16;ab=c[p+(am+s<<2)>>2]|0;u=$(n,ab>>16);l=$(n,ab&65535)>>16;ab=c[p+(j+s<<2)>>2]|0;r=$(as,ab>>16);ac=$(as,ab&65535)>>16;ab=c[p+(ar+s<<2)>>2]|0;F=$(aq,ab>>16);U=$(aq,ab&65535)>>16;ab=c[p+(ap+s<<2)>>2]|0;E=$(ao,ab>>16);G=$(ao,ab&65535)>>16;ab=c[p+(an+s<<2)>>2]|0;M=$(O,ab>>16);S=$(O,ab&65535)>>16;ab=c[p+(Y+s<<2)>>2]|0;I=$(ad,ab>>16);K=$(ad,ab&65535)>>16;ab=c[p+(aa+s<<2)>>2]|0;L=$(X,ab>>16);H=$(X,ab&65535)>>16;ab=c[p+(T+s<<2)>>2]|0;w=$(D,ab>>16);C=(((((((((((((((((((ag+(N>>1)|0)+af|0)+W|0)+k|0)+u|0)+l|0)+r|0)+ac|0)+F|0)+U|0)+E|0)+G|0)+M|0)+S|0)+I|0)+K|0)+L|0)+H|0)+w|0)+($(D,ab&65535)>>16)|0;L109:do{if((N|0)>10){ab=C;w=10;while(1){H=c[p+(ah-w<<2)>>2]|0;L=b[h+(w<<1)>>1]|0;K=$(L,H>>16);I=(K+ab|0)+($(L,H&65535)>>16)|0;H=w+1|0;if((H|0)<(N|0)){ab=I;w=H}else{aE=I;break L109}}}else{aE=C}}while(0);C=p+(s+g<<2)|0;ah=(c[C>>2]|0)+(aE<<4)|0;c[C>>2]=ah;C=$(P,ah>>16);w=($(P,ah&65535)>>16)+C|0;C=(w+$(t,ah)>>7)+1>>1;if((C|0)>32767){aF=32767}else{aF=(C|0)<-32768?-32768:C&65535}b[e+(s<<1)>>1]=aF;C=s+1|0;ah=c[o>>2]|0;if((C|0)>=(ah|0)){aw=ah;break}s=C;N=c[R>>2]|0}ax=aw+ae|0;ay=p+(ax<<2)|0;az=ay;b3(_|0,az|0,64);c[Z>>2]=at;b[Q>>1]=au;aA=d|0;c[aA>>2]=av;aB=d+4|0;c[aB>>2]=av;aC=d+8|0;c[aC>>2]=av;aD=d+12|0;c[aD>>2]=av;i=f;return}function bG(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;if((c[a+4160>>2]|0)!=0){f=a+4228|0;g=a+4232|0;h=e-1|0;i=0;j=0;while(1){if((j|0)>=(h|0)){k=j;l=0;m=i;break}n=b[d+(j<<1)>>1]|0;o=n<<16>>16;p=$(o,o)+i|0;o=b[d+((j|1)<<1)>>1]|0;q=p+$(o,o)|0;if((q|0)<0){r=83;break}else{i=q;j=j+2|0}}L124:do{if((r|0)==83){i=j;o=2;p=q>>>2;s=n;while(1){t=s<<16>>16;u=$(t,t);t=b[d+((i|1)<<1)>>1]|0;v=(($(t,t)+u|0)>>>(o>>>0))+p|0;if((v|0)<0){w=v>>>2;x=o+2|0}else{w=v;x=o}v=i+2|0;if((v|0)>=(h|0)){k=v;l=x;m=w;break L124}i=v;o=x;p=w;s=b[d+(v<<1)>>1]|0}}}while(0);if((k|0)==(h|0)){k=b[d+(h<<1)>>1]|0;y=($(k,k)>>>(l>>>0))+m|0}else{y=m}if(y>>>0>1073741823){z=y>>>2;A=l+2|0}else{z=y;A=l}c[g>>2]=A;c[f>>2]=z;c[a+4216>>2]=1;return}z=a+4216|0;L141:do{if((c[z>>2]|0)!=0){f=e-1|0;A=0;g=0;while(1){if((g|0)>=(f|0)){B=g;C=0;D=A;break}E=b[d+(g<<1)>>1]|0;l=E<<16>>16;y=$(l,l)+A|0;l=b[d+((g|1)<<1)>>1]|0;F=y+$(l,l)|0;if((F|0)<0){r=97;break}else{A=F;g=g+2|0}}L146:do{if((r|0)==97){A=g;l=2;y=F>>>2;m=E;while(1){k=m<<16>>16;h=$(k,k);k=b[d+((A|1)<<1)>>1]|0;w=(($(k,k)+h|0)>>>(l>>>0))+y|0;if((w|0)<0){G=w>>>2;H=l+2|0}else{G=w;H=l}w=A+2|0;if((w|0)>=(f|0)){B=w;C=H;D=G;break L146}A=w;l=H;y=G;m=b[d+(w<<1)>>1]|0}}}while(0);if((B|0)==(f|0)){g=b[d+(f<<1)>>1]|0;I=($(g,g)>>>(C>>>0))+D|0}else{I=D}if(I>>>0>1073741823){J=I>>>2;K=C+2|0}else{J=I;K=C}g=c[a+4232>>2]|0;do{if((K|0)>(g|0)){m=a+4228|0;c[m>>2]=c[m>>2]>>K-g;L=J}else{if((K|0)>=(g|0)){L=J;break}L=J>>g-K}}while(0);g=a+4228|0;f=c[g>>2]|0;if((L|0)<=(f|0)){break}if((f|0)==0){M=32}else{M=b2(f|0)|0}m=f<<M-1;c[g>>2]=m;g=25-M|0;f=L>>((g|0)>0?g:0);g=(m|0)/(((f|0)>1?f:1)|0)&-1;if((g|0)<1){N=0}else{f=b2(g|0)|0;m=24-f|0;do{if((f|0)==24){O=g;P=24}else{if((m|0)<0){O=g>>>((m+32|0)>>>0)|g<<-m;P=f;break}else{O=g<<32-m|g>>>(m>>>0);P=f;break}}}while(0);f=((P&1|0)==0?46214:32768)>>>(P>>>1>>>0);m=$(O&127,13959168)>>>16;g=$(f>>16,m);N=(g+f|0)+($(f&65535,m)>>>16)<<4}m=((65536-N|0)/(e|0)&-1)<<2;f=N;g=0;while(1){if((g|0)>=(e|0)){break L141}y=d+(g<<1)|0;l=b[y>>1]|0;A=$(l,f>>16);b[y>>1]=($(l,f&65532)>>>16)+A&65535;A=f+m|0;if((A|0)>65536){break L141}else{f=A;g=g+1|0}}}}while(0);c[z>>2]=0;return}function bH(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0;do{if((e|0)>0){f=d[e+496|0]|0;g=b+28|0;h=c[g>>2]|0;i=b+32|0;j=c[i>>2]|0;k=h>>>8;l=-1;m=h;while(1){n=l+1|0;o=$(d[520+(n+f|0)|0]|0,k);if(j>>>0<o>>>0){l=n;m=o}else{break}}l=j-o|0;c[i>>2]=l;k=m-o|0;c[g>>2]=k;L190:do{if(k>>>0<8388609){f=b+20|0;h=b+40|0;p=b+24|0;q=b|0;r=c[b+4>>2]|0;s=c[f>>2]|0;t=k;u=c[h>>2]|0;v=c[p>>2]|0;w=l;while(1){x=s+8|0;c[f>>2]=x;y=t<<8;c[g>>2]=y;if(v>>>0<r>>>0){z=v+1|0;c[p>>2]=z;A=d[(c[q>>2]|0)+v|0]|0;B=z}else{A=0;B=v}c[h>>2]=A;z=((A|u<<8)>>>1&255|w<<8&2147483392)^255;c[i>>2]=z;if(y>>>0<8388609){s=x;t=y;u=A;v=B;w=z}else{C=y;D=z;break L190}}}else{C=k;D=l}}while(0);l=e-n|0;if((n|0)<=0){E=l;F=0;G=151;break}k=d[n+496|0]|0;m=C>>>8;j=-1;w=C;while(1){H=j+1|0;I=$(d[672+(H+k|0)|0]|0,m);if(D>>>0<I>>>0){j=H;w=I}else{break}}j=D-I|0;c[i>>2]=j;m=w-I|0;c[g>>2]=m;L202:do{if(m>>>0<8388609){k=b+20|0;v=b+40|0;u=b+24|0;t=b|0;s=c[b+4>>2]|0;h=c[k>>2]|0;q=m;p=c[v>>2]|0;r=c[u>>2]|0;f=j;while(1){z=h+8|0;c[k>>2]=z;y=q<<8;c[g>>2]=y;if(r>>>0<s>>>0){x=r+1|0;c[u>>2]=x;J=d[(c[t>>2]|0)+r|0]|0;K=x}else{J=0;K=r}c[v>>2]=J;x=((J|p<<8)>>>1&255|f<<8&2147483392)^255;c[i>>2]=x;if(y>>>0<8388609){h=z;q=y;p=J;r=K;f=x}else{L=y;M=x;break L202}}}else{L=m;M=j}}while(0);j=n-H|0;if((H|0)<=0){E=l;F=j;G=151;break}m=d[H+496|0]|0;w=L>>>8;f=-1;r=L;while(1){N=f+1|0;O=$(d[824+(N+m|0)|0]|0,w);if(M>>>0<O>>>0){f=N;r=O}else{break}}f=M-O|0;c[i>>2]=f;w=r-O|0;c[g>>2]=w;L214:do{if(w>>>0<8388609){m=b+20|0;p=b+40|0;q=b+24|0;h=b|0;v=c[b+4>>2]|0;t=c[m>>2]|0;u=w;s=c[p>>2]|0;k=c[q>>2]|0;x=f;while(1){y=t+8|0;c[m>>2]=y;z=u<<8;c[g>>2]=z;if(k>>>0<v>>>0){P=k+1|0;c[q>>2]=P;Q=d[(c[h>>2]|0)+k|0]|0;R=P}else{Q=0;R=k}c[p>>2]=Q;P=((Q|s<<8)>>>1&255|x<<8&2147483392)^255;c[i>>2]=P;if(z>>>0<8388609){t=y;u=z;s=Q;k=R;x=P}else{S=z;T=P;break L214}}}else{S=w;T=f}}while(0);f=H-N|0;w=a+4|0;if((N|0)<=0){U=j;V=l;W=f;X=w;G=161;break}r=d[N+496|0]|0;x=S>>>8;k=-1;s=S;while(1){Y=k+1|0;Z=$(d[976+(Y+r|0)|0]|0,x);if(T>>>0<Z>>>0){k=Y;s=Z}else{break}}k=T-Z|0;c[i>>2]=k;x=s-Z|0;c[g>>2]=x;L226:do{if(x>>>0<8388609){r=b+20|0;u=b+40|0;t=b+24|0;p=b|0;h=c[b+4>>2]|0;q=c[r>>2]|0;v=x;m=c[u>>2]|0;P=c[t>>2]|0;z=k;while(1){y=q+8|0;c[r>>2]=y;_=v<<8;c[g>>2]=_;if(P>>>0<h>>>0){aa=P+1|0;c[t>>2]=aa;ab=d[(c[p>>2]|0)+P|0]|0;ac=aa}else{ab=0;ac=P}c[u>>2]=ab;aa=((ab|m<<8)>>>1&255|z<<8&2147483392)^255;c[i>>2]=aa;if(_>>>0<8388609){q=y;v=_;m=ab;P=ac;z=aa}else{break L226}}}}while(0);c[a>>2]=Y;ad=N-Y|0;ae=j;af=l;ag=f;ah=w;break}else{E=0;F=0;G=151}}while(0);do{if((G|0)==151){U=F;V=E;W=0;X=a+4|0;G=161;break}}while(0);if((G|0)==161){c[a>>2]=0;ad=0;ae=U;af=V;ag=W;ah=X}c[ah>>2]=ad;ad=a+8|0;ah=a+12|0;if((ag|0)>0){X=d[ag+496|0]|0;W=b+28|0;V=c[W>>2]|0;U=b+32|0;E=c[U>>2]|0;F=V>>>8;Y=-1;N=V;while(1){ai=Y+1|0;aj=$(d[976+(ai+X|0)|0]|0,F);if(E>>>0<aj>>>0){Y=ai;N=aj}else{break}}Y=E-aj|0;c[U>>2]=Y;E=N-aj|0;c[W>>2]=E;L244:do{if(E>>>0<8388609){aj=b+20|0;N=b+40|0;F=b+24|0;X=b|0;V=c[b+4>>2]|0;ac=c[aj>>2]|0;ab=E;Z=c[N>>2]|0;T=c[F>>2]|0;S=Y;while(1){H=ac+8|0;c[aj>>2]=H;R=ab<<8;c[W>>2]=R;if(T>>>0<V>>>0){Q=T+1|0;c[F>>2]=Q;ak=d[(c[X>>2]|0)+T|0]|0;al=Q}else{ak=0;al=T}c[N>>2]=ak;Q=((ak|Z<<8)>>>1&255|S<<8&2147483392)^255;c[U>>2]=Q;if(R>>>0<8388609){ac=H;ab=R;Z=ak;T=al;S=Q}else{break L244}}}}while(0);c[ad>>2]=ai;am=ag-ai|0}else{c[ad>>2]=0;am=0}c[ah>>2]=am;do{if((ae|0)>0){am=d[ae+496|0]|0;ah=b+28|0;ad=c[ah>>2]|0;ai=b+32|0;ag=c[ai>>2]|0;al=ad>>>8;ak=-1;U=ad;while(1){an=ak+1|0;ao=$(d[824+(an+am|0)|0]|0,al);if(ag>>>0<ao>>>0){ak=an;U=ao}else{break}}ak=ag-ao|0;c[ai>>2]=ak;al=U-ao|0;c[ah>>2]=al;L260:do{if(al>>>0<8388609){am=b+20|0;ad=b+40|0;W=b+24|0;Y=b|0;E=c[b+4>>2]|0;S=c[am>>2]|0;T=al;Z=c[ad>>2]|0;ab=c[W>>2]|0;ac=ak;while(1){N=S+8|0;c[am>>2]=N;X=T<<8;c[ah>>2]=X;if(ab>>>0<E>>>0){F=ab+1|0;c[W>>2]=F;ap=d[(c[Y>>2]|0)+ab|0]|0;aq=F}else{ap=0;aq=ab}c[ad>>2]=ap;F=((ap|Z<<8)>>>1&255|ac<<8&2147483392)^255;c[ai>>2]=F;if(X>>>0<8388609){S=N;T=X;Z=ap;ab=aq;ac=F}else{ar=X;as=F;break L260}}}else{ar=al;as=ak}}while(0);ak=ae-an|0;al=a+16|0;U=a+20|0;if((an|0)<=0){at=ak;au=al;av=U;G=190;break}ag=d[an+496|0]|0;ac=ar>>>8;ab=-1;Z=ar;while(1){aw=ab+1|0;ax=$(d[976+(aw+ag|0)|0]|0,ac);if(as>>>0<ax>>>0){ab=aw;Z=ax}else{break}}ab=as-ax|0;c[ai>>2]=ab;ac=Z-ax|0;c[ah>>2]=ac;L272:do{if(ac>>>0<8388609){ag=b+20|0;T=b+40|0;S=b+24|0;ad=b|0;Y=c[b+4>>2]|0;W=c[ag>>2]|0;E=ac;am=c[T>>2]|0;F=c[S>>2]|0;X=ab;while(1){N=W+8|0;c[ag>>2]=N;V=E<<8;c[ah>>2]=V;if(F>>>0<Y>>>0){aj=F+1|0;c[S>>2]=aj;ay=d[(c[ad>>2]|0)+F|0]|0;az=aj}else{ay=0;az=F}c[T>>2]=ay;aj=((ay|am<<8)>>>1&255|X<<8&2147483392)^255;c[ai>>2]=aj;if(V>>>0<8388609){W=N;E=V;am=ay;F=az;X=aj}else{break L272}}}}while(0);c[al>>2]=aw;aA=an-aw|0;aB=ak;aC=U;break}else{at=0;au=a+16|0;av=a+20|0;G=190;break}}while(0);if((G|0)==190){c[au>>2]=0;aA=0;aB=at;aC=av}c[aC>>2]=aA;aA=a+24|0;aC=a+28|0;if((aB|0)>0){av=d[aB+496|0]|0;at=b+28|0;au=c[at>>2]|0;aw=b+32|0;an=c[aw>>2]|0;az=au>>>8;ay=-1;ax=au;while(1){aD=ay+1|0;aE=$(d[976+(aD+av|0)|0]|0,az);if(an>>>0<aE>>>0){ay=aD;ax=aE}else{break}}ay=an-aE|0;c[aw>>2]=ay;an=ax-aE|0;c[at>>2]=an;L288:do{if(an>>>0<8388609){aE=b+20|0;ax=b+40|0;az=b+24|0;av=b|0;au=c[b+4>>2]|0;as=c[aE>>2]|0;ar=an;ae=c[ax>>2]|0;aq=c[az>>2]|0;ap=ay;while(1){ao=as+8|0;c[aE>>2]=ao;ai=ar<<8;c[at>>2]=ai;if(aq>>>0<au>>>0){ah=aq+1|0;c[az>>2]=ah;aF=d[(c[av>>2]|0)+aq|0]|0;aG=ah}else{aF=0;aG=aq}c[ax>>2]=aF;ah=((aF|ae<<8)>>>1&255|ap<<8&2147483392)^255;c[aw>>2]=ah;if(ai>>>0<8388609){as=ao;ar=ai;ae=aF;aq=aG;ap=ah}else{break L288}}}}while(0);c[aA>>2]=aD;aH=aB-aD|0}else{c[aA>>2]=0;aH=0}c[aC>>2]=aH;do{if((af|0)>0){aH=d[af+496|0]|0;aC=b+28|0;aA=c[aC>>2]|0;aD=b+32|0;aB=c[aD>>2]|0;aG=aA>>>8;aF=-1;aw=aA;while(1){aI=aF+1|0;aJ=$(d[672+(aI+aH|0)|0]|0,aG);if(aB>>>0<aJ>>>0){aF=aI;aw=aJ}else{break}}aF=aB-aJ|0;c[aD>>2]=aF;aG=aw-aJ|0;c[aC>>2]=aG;L303:do{if(aG>>>0<8388609){aH=b+20|0;aA=b+40|0;at=b+24|0;ay=b|0;an=c[b+4>>2]|0;ap=c[aH>>2]|0;aq=aG;ae=c[aA>>2]|0;ar=c[at>>2]|0;as=aF;while(1){ax=ap+8|0;c[aH>>2]=ax;av=aq<<8;c[aC>>2]=av;if(ar>>>0<an>>>0){az=ar+1|0;c[at>>2]=az;aK=d[(c[ay>>2]|0)+ar|0]|0;aL=az}else{aK=0;aL=ar}c[aA>>2]=aK;az=((aK|ae<<8)>>>1&255|as<<8&2147483392)^255;c[aD>>2]=az;if(av>>>0<8388609){ap=ax;aq=av;ae=aK;ar=aL;as=az}else{aM=av;aN=az;break L303}}}else{aM=aG;aN=aF}}while(0);aF=af-aI|0;if((aI|0)<=0){aO=aF;G=217;break}aG=d[aI+496|0]|0;aw=aM>>>8;aB=-1;as=aM;while(1){aP=aB+1|0;aQ=$(d[824+(aP+aG|0)|0]|0,aw);if(aN>>>0<aQ>>>0){aB=aP;as=aQ}else{break}}aB=aN-aQ|0;c[aD>>2]=aB;aw=as-aQ|0;c[aC>>2]=aw;L315:do{if(aw>>>0<8388609){aG=b+20|0;ar=b+40|0;ae=b+24|0;aq=b|0;ap=c[b+4>>2]|0;aA=c[aG>>2]|0;ay=aw;at=c[ar>>2]|0;an=c[ae>>2]|0;aH=aB;while(1){az=aA+8|0;c[aG>>2]=az;av=ay<<8;c[aC>>2]=av;if(an>>>0<ap>>>0){ax=an+1|0;c[ae>>2]=ax;aR=d[(c[aq>>2]|0)+an|0]|0;aS=ax}else{aR=0;aS=an}c[ar>>2]=aR;ax=((aR|at<<8)>>>1&255|aH<<8&2147483392)^255;c[aD>>2]=ax;if(av>>>0<8388609){aA=az;ay=av;at=aR;an=aS;aH=ax}else{aT=av;aU=ax;break L315}}}else{aT=aw;aU=aB}}while(0);aB=aI-aP|0;aw=a+32|0;as=a+36|0;if((aP|0)<=0){aV=aF;aW=aB;aX=aw;aY=as;G=227;break}aH=d[aP+496|0]|0;an=aT>>>8;at=-1;ay=aT;while(1){aZ=at+1|0;a_=$(d[976+(aZ+aH|0)|0]|0,an);if(aU>>>0<a_>>>0){at=aZ;ay=a_}else{break}}at=aU-a_|0;c[aD>>2]=at;an=ay-a_|0;c[aC>>2]=an;L327:do{if(an>>>0<8388609){aH=b+20|0;aA=b+40|0;ar=b+24|0;aq=b|0;ae=c[b+4>>2]|0;ap=c[aH>>2]|0;aG=an;ax=c[aA>>2]|0;av=c[ar>>2]|0;az=at;while(1){au=ap+8|0;c[aH>>2]=au;aE=aG<<8;c[aC>>2]=aE;if(av>>>0<ae>>>0){U=av+1|0;c[ar>>2]=U;a$=d[(c[aq>>2]|0)+av|0]|0;a0=U}else{a$=0;a0=av}c[aA>>2]=a$;U=((a$|ax<<8)>>>1&255|az<<8&2147483392)^255;c[aD>>2]=U;if(aE>>>0<8388609){ap=au;aG=aE;ax=a$;av=a0;az=U}else{break L327}}}}while(0);c[aw>>2]=aZ;a1=aP-aZ|0;a2=aF;a3=aB;a4=as;break}else{aO=0;G=217}}while(0);do{if((G|0)==217){aV=aO;aW=0;aX=a+32|0;aY=a+36|0;G=227;break}}while(0);if((G|0)==227){c[aX>>2]=0;a1=0;a2=aV;a3=aW;a4=aY}c[a4>>2]=a1;a1=a+40|0;a4=a+44|0;if((a3|0)>0){aY=d[a3+496|0]|0;aW=b+28|0;aV=c[aW>>2]|0;aX=b+32|0;aO=c[aX>>2]|0;aZ=aV>>>8;aP=-1;a0=aV;while(1){a5=aP+1|0;a6=$(d[976+(a5+aY|0)|0]|0,aZ);if(aO>>>0<a6>>>0){aP=a5;a0=a6}else{break}}aP=aO-a6|0;c[aX>>2]=aP;aO=a0-a6|0;c[aW>>2]=aO;L345:do{if(aO>>>0<8388609){a6=b+20|0;a0=b+40|0;aZ=b+24|0;aY=b|0;aV=c[b+4>>2]|0;a$=c[a6>>2]|0;a_=aO;aU=c[a0>>2]|0;aT=c[aZ>>2]|0;aI=aP;while(1){aS=a$+8|0;c[a6>>2]=aS;aR=a_<<8;c[aW>>2]=aR;if(aT>>>0<aV>>>0){aQ=aT+1|0;c[aZ>>2]=aQ;a7=d[(c[aY>>2]|0)+aT|0]|0;a8=aQ}else{a7=0;a8=aT}c[a0>>2]=a7;aQ=((a7|aU<<8)>>>1&255|aI<<8&2147483392)^255;c[aX>>2]=aQ;if(aR>>>0<8388609){a$=aS;a_=aR;aU=a7;aT=a8;aI=aQ}else{break L345}}}}while(0);c[a1>>2]=a5;a9=a3-a5|0}else{c[a1>>2]=0;a9=0}c[a4>>2]=a9;do{if((a2|0)>0){a9=d[a2+496|0]|0;a4=b+28|0;a1=c[a4>>2]|0;a5=b+32|0;a3=c[a5>>2]|0;a8=a1>>>8;a7=-1;aX=a1;while(1){ba=a7+1|0;bb=$(d[824+(ba+a9|0)|0]|0,a8);if(a3>>>0<bb>>>0){a7=ba;aX=bb}else{break}}a7=a3-bb|0;c[a5>>2]=a7;a8=aX-bb|0;c[a4>>2]=a8;L361:do{if(a8>>>0<8388609){a9=b+20|0;a1=b+40|0;aW=b+24|0;aP=b|0;aO=c[b+4>>2]|0;aI=c[a9>>2]|0;aT=a8;aU=c[a1>>2]|0;a_=c[aW>>2]|0;a$=a7;while(1){a0=aI+8|0;c[a9>>2]=a0;aY=aT<<8;c[a4>>2]=aY;if(a_>>>0<aO>>>0){aZ=a_+1|0;c[aW>>2]=aZ;bc=d[(c[aP>>2]|0)+a_|0]|0;bd=aZ}else{bc=0;bd=a_}c[a1>>2]=bc;aZ=((bc|aU<<8)>>>1&255|a$<<8&2147483392)^255;c[a5>>2]=aZ;if(aY>>>0<8388609){aI=a0;aT=aY;aU=bc;a_=bd;a$=aZ}else{be=aY;bf=aZ;break L361}}}else{be=a8;bf=a7}}while(0);a7=a2-ba|0;a8=a+48|0;aX=a+52|0;if((ba|0)<=0){bg=a7;bh=a8;bi=aX;G=256;break}a3=d[ba+496|0]|0;a$=be>>>8;a_=-1;aU=be;while(1){bj=a_+1|0;bk=$(d[976+(bj+a3|0)|0]|0,a$);if(bf>>>0<bk>>>0){a_=bj;aU=bk}else{break}}a_=bf-bk|0;c[a5>>2]=a_;a$=aU-bk|0;c[a4>>2]=a$;L373:do{if(a$>>>0<8388609){a3=b+20|0;aT=b+40|0;aI=b+24|0;a1=b|0;aP=c[b+4>>2]|0;aW=c[a3>>2]|0;aO=a$;a9=c[aT>>2]|0;aZ=c[aI>>2]|0;aY=a_;while(1){a0=aW+8|0;c[a3>>2]=a0;aV=aO<<8;c[a4>>2]=aV;if(aZ>>>0<aP>>>0){a6=aZ+1|0;c[aI>>2]=a6;bl=d[(c[a1>>2]|0)+aZ|0]|0;bm=a6}else{bl=0;bm=aZ}c[aT>>2]=bl;a6=((bl|a9<<8)>>>1&255|aY<<8&2147483392)^255;c[a5>>2]=a6;if(aV>>>0<8388609){aW=a0;aO=aV;a9=bl;aZ=bm;aY=a6}else{break L373}}}}while(0);c[a8>>2]=bj;bn=ba-bj|0;bo=a7;bp=aX;break}else{bg=0;bh=a+48|0;bi=a+52|0;G=256;break}}while(0);if((G|0)==256){c[bh>>2]=0;bn=0;bo=bg;bp=bi}c[bp>>2]=bn;bn=a+56|0;bp=a+60|0;if((bo|0)<=0){c[bn>>2]=0;bq=0;c[bp>>2]=bq;return}a=d[bo+496|0]|0;bi=b+28|0;bg=c[bi>>2]|0;bh=b+32|0;G=c[bh>>2]|0;bj=bg>>>8;ba=-1;bm=bg;while(1){br=ba+1|0;bs=$(d[976+(br+a|0)|0]|0,bj);if(G>>>0<bs>>>0){ba=br;bm=bs}else{break}}ba=G-bs|0;c[bh>>2]=ba;G=bm-bs|0;c[bi>>2]=G;L391:do{if(G>>>0<8388609){bs=b+20|0;bm=b+40|0;bj=b+24|0;a=b|0;bg=c[b+4>>2]|0;bl=c[bs>>2]|0;bk=G;bf=c[bm>>2]|0;be=c[bj>>2]|0;a2=ba;while(1){bd=bl+8|0;c[bs>>2]=bd;bc=bk<<8;c[bi>>2]=bc;if(be>>>0<bg>>>0){bb=be+1|0;c[bj>>2]=bb;bt=d[(c[a>>2]|0)+be|0]|0;bu=bb}else{bt=0;bu=be}c[bm>>2]=bt;bb=((bt|bf<<8)>>>1&255|a2<<8&2147483392)^255;c[bh>>2]=bb;if(bc>>>0<8388609){bl=bd;bk=bc;bf=bt;be=bu;a2=bb}else{break L391}}}}while(0);c[bn>>2]=br;bq=bo-br|0;c[bp>>2]=bq;return}function bI(a,d,f,g,h,i){a=a|0;d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;j=a+4|0;k=d;v=e[j>>1]|e[j+2>>1]<<16;b[k>>1]=v&65535;b[k+2>>1]=v>>16;k=a+8|0;l=f;v=e[k>>1]|e[k+2>>1]<<16;b[l>>1]=v&65535;b[l+2>>1]=v>>16;l=d+(i<<1)|0;v=e[l>>1]|e[l+2>>1]<<16;b[j>>1]=v&65535;b[j+2>>1]=v>>16;j=f+(i<<1)|0;v=e[j>>1]|e[j+2>>1]<<16;b[k>>1]=v&65535;b[k+2>>1]=v>>16;k=a|0;j=b[k>>1]|0;l=a+2|0;a=b[l>>1]|0;m=h<<3;h=(65536/(m|0)&-1)<<16>>16;n=($((c[g>>2]|0)-j<<16>>16,h)>>15)+1>>1;o=g+4|0;p=($((c[o>>2]|0)-a<<16>>16,h)>>15)+1>>1;L401:do{if((m|0)>0){h=0;q=j;r=a;while(1){s=q+n|0;t=r+p|0;u=h+1|0;w=b[d+(u<<1)>>1]|0;x=((b[d+(h+2<<1)>>1]|0)+(b[d+(h<<1)>>1]|0)|0)+(w<<1)|0;y=f+(u<<1)|0;z=(b[y>>1]|0)<<8;A=s<<16>>16;B=$(x>>7,A);C=$(x<<9&65024,A)>>16;A=t<<16>>16;x=$(w>>5,A);D=((((x+z|0)+B|0)+($(w<<11&63488,A)>>16)|0)+C>>7)+1>>1;if((D|0)>32767){E=32767}else{E=(D|0)<-32768?-32768:D&65535}b[y>>1]=E;if((u|0)<(m|0)){h=u;q=s;r=t}else{break L401}}}}while(0);L408:do{if((m|0)<(i|0)){E=c[g>>2]<<16>>16;p=c[o>>2]<<16>>16;n=m;while(1){a=n+1|0;j=b[d+(a<<1)>>1]|0;r=((b[d+(n+2<<1)>>1]|0)+(b[d+(n<<1)>>1]|0)|0)+(j<<1)|0;q=f+(a<<1)|0;h=(b[q>>1]|0)<<8;t=$(r>>7,E);s=$(r<<9&65024,E)>>16;r=$(j>>5,p);u=((((r+h|0)+t|0)+($(j<<11&63488,p)>>16)|0)+s>>7)+1>>1;if((u|0)>32767){F=32767}else{F=(u|0)<-32768?-32768:u&65535}b[q>>1]=F;if((a|0)<(i|0)){n=a}else{break L408}}}}while(0);b[k>>1]=c[g>>2]&65535;b[l>>1]=c[o>>2]&65535;if((i|0)>0){G=0}else{return}while(1){o=G+1|0;l=d+(o<<1)|0;g=b[l>>1]|0;k=f+(o<<1)|0;F=b[k>>1]|0;m=F+g|0;n=g-F|0;if((m|0)>32767){H=32767}else{H=(m|0)<-32768?-32768:m&65535}b[l>>1]=H;if((n|0)>32767){I=32767}else{I=(n|0)<-32768?-32768:n&65535}b[k>>1]=I;if((o|0)<(i|0)){G=o}else{break}}return}function bJ(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((f|0)>=(e|0)){g=a;h=f<<1;b1(g|0,0,h|0);return}i=d+2|0;j=d+4|0;k=d+6|0;l=d+8|0;m=d+10|0;n=(f|0)>6;o=f;while(1){p=o-1|0;q=$(b[d>>1]|0,b[c+(p<<1)>>1]|0);r=$(b[i>>1]|0,b[c+(o-2<<1)>>1]|0)+q|0;q=r+$(b[j>>1]|0,b[c+(o-3<<1)>>1]|0)|0;r=q+$(b[k>>1]|0,b[c+(o-4<<1)>>1]|0)|0;q=r+$(b[l>>1]|0,b[c+(o-5<<1)>>1]|0)|0;r=q+$(b[m>>1]|0,b[c+(o-6<<1)>>1]|0)|0;L433:do{if(n){q=r;s=6;while(1){t=$(b[d+(s<<1)>>1]|0,b[c+(p-s<<1)>>1]|0)+q|0;u=t+$(b[d+((s|1)<<1)>>1]|0,b[c+(p+(s^-1)<<1)>>1]|0)|0;t=s+2|0;if((t|0)<(f|0)){q=u;s=t}else{v=u;break L433}}}else{v=r}}while(0);r=(((b[c+(o<<1)>>1]|0)<<12)-v>>11)+1>>1;if((r|0)>32767){w=32767}else{w=(r|0)<-32768?-32768:r&65535}b[a+(o<<1)>>1]=w;r=o+1|0;if((r|0)<(e|0)){o=r}else{break}}g=a;h=f<<1;b1(g|0,0,h|0);return}function bK(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=b&1;e=b-1|0;L442:do{if((e|0)>0){b=0;f=1073741824;g=d;h=e;while(1){i=c[a+(g<<6)+(h<<2)>>2]|0;if((i+16773022|0)>>>0>33546044){j=0;break}k=-(i<<7)|0;i=k;l=(k|0)<0?-1:0;cf(i,l,i,l);k=1073741824-D|0;m=(k|0)>0?k:-k|0;if((m|0)==0){n=32;o=0;p=30}else{q=b2(m|0)|0;m=32-q|0;n=q;o=m;p=m+30|0}m=k<<n-1;q=m>>16;r=536870911/(q|0)&-1;s=r<<16;t=s>>16;u=$(q,t);q=(536870912-u|0)-($(m&65535,t)>>16)<<3;m=$(q>>16,t);u=$(q&65528,t)>>16;t=(($(q,(r>>15)+1>>1)+s|0)+m|0)+u|0;u=(62-n|0)-p|0;if((u|0)<1){m=-u|0;s=-2147483648>>m;r=2147483647>>>(m>>>0);do{if((s|0)>(r|0)){if((t|0)>(s|0)){v=s;break}v=(t|0)<(r|0)?r:t}else{if((t|0)>(r|0)){v=r;break}v=(t|0)<(s|0)?s:t}}while(0);w=v<<m}else{w=(u|0)<32?t>>u:0}cf(k,(k|0)<0?-1:0,f,b);s=D;r=h&1;q=h-1|0;x=(o|0)==1;y=w;z=(w|0)<0?-1:0;A=o-1|0;B=0;while(1){C=c[a+(g<<6)+(B<<2)>>2]|0;E=c[a+(g<<6)+(q-B<<2)>>2]|0;F=cf(E,(E|0)<0?-1:0,i,l)|0;E=D;G=b6(F>>>30|E<<2,E>>>30|0<<2,1,0)|0;E=C-(G>>>1|D<<31)|0;G=cf(E,(E|0)<0?-1:0,y,z)|0;E=D;if(x){C=b6(G>>>1|E<<31,E>>>1|0<<31,G&1,E&0)|0;H=C}else{C=ca(G|0,E|0,A|0)|0;E=D;G=b6(C,E,1,0)|0;H=G>>>1|D<<31}c[a+(r<<6)+(B<<2)>>2]=H;G=B+1|0;if((G|0)<(h|0)){B=G}else{break}}B=s<<2|0>>>30;A=B;x=(B|0)<0?-1:0;if((q|0)>0){b=x;f=A;g=r;h=q}else{I=x;J=A;K=r;break L442}}return j|0}else{I=0;J=1073741824;K=d}}while(0);d=c[a+(K<<6)>>2]|0;if((d+16773022|0)>>>0>33546044){j=0;return j|0}K=-(d<<7)|0;d=K;a=(K|0)<0?-1:0;cf(d,a,d,a);a=1073741824-D|0;cf(a,(a|0)<0?-1:0,J,I);j=D<<2|0>>>30;return j|0}function bL(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=d-1|0;f=(e|0)<1;g=c+(d<<1)|0;h=1;while(1){i=b[a>>1]|0;j=b[c>>1]|0;k=(i<<16>>16)-(j<<16>>16)|0;L475:do{if(f){l=0;m=k}else{n=0;o=1;p=k;q=i;while(1){r=b[a+(o<<1)>>1]|0;s=((r<<16>>16)-(q<<16>>16)|0)-(b[c+(o<<1)>>1]|0)|0;t=(s|0)<(p|0);u=t?o:n;v=t?s:p;s=o+1|0;if((s|0)>(e|0)){l=u;m=v;break L475}else{n=u;o=s;p=v;q=r}}}}while(0);w=a+(e<<1)|0;i=b[g>>1]|0;k=(32768-(b[w>>1]|0)|0)-(i<<16>>16)|0;q=(k|0)<(m|0);p=q?d:l;if(((q?k:m)|0)>-1){x=362;break}do{if((p|0)==0){b[a>>1]=j}else{if((p|0)==(d|0)){b[w>>1]=-32768-i&65535;break}L486:do{if((p|0)>0){k=1;q=0;o=j;while(1){n=(o<<16>>16)+q|0;if((k|0)>=(p|0)){y=n;break L486}r=b[c+(k<<1)>>1]|0;k=k+1|0;q=n;o=r}}else{y=0}}while(0);o=c+(p<<1)|0;q=b[o>>1]|0;k=q>>1;r=k+y|0;L491:do{if((p|0)<(d|0)){n=d;v=32768;s=i;while(1){u=v-(s<<16>>16)|0;t=n-1|0;if((t|0)<=(p|0)){z=u;break L491}n=t;v=u;s=b[c+(t<<1)>>1]|0}}else{z=32768}}while(0);s=z-k|0;v=a+(p-1<<1)|0;n=a+(p<<1)|0;t=(b[n>>1]|0)+(b[v>>1]|0)|0;u=(t>>1)+(t&1)|0;do{if((r|0)>(s|0)){if((u|0)>(r|0)){A=r&65535;break}if((u|0)<(s|0)){A=s&65535;break}else{A=u&65535;break}}else{if((u|0)>(s|0)){A=s&65535;break}if((u|0)<(r|0)){A=r&65535;break}else{A=u&65535;break}}}while(0);u=(A&65535)-(q>>>1)&65535;b[v>>1]=u;b[n>>1]=u+(b[o>>1]|0)&65535}}while(0);if((h|0)>=20){break}h=h+1|0}if((x|0)==362){return}if((h|0)!=20){return}h=(d|0)>1;L520:do{if(h){x=1;while(1){A=b[a+(x<<1)>>1]|0;z=x;while(1){y=z-1|0;m=b[a+(y<<1)>>1]|0;if(A<<16>>16>=m<<16>>16){B=z;break}b[a+(z<<1)>>1]=m;if((y|0)>0){z=y}else{B=y;break}}b[a+(B<<1)>>1]=A;z=x+1|0;if((z|0)<(d|0)){x=z}else{break}}x=b[a>>1]|0;z=b[c>>1]|0;o=x<<16>>16>z<<16>>16?x:z;b[a>>1]=o;if(h){C=1;D=o}else{break}while(1){o=a+(C<<1)|0;z=b[o>>1]|0;x=(b[c+(C<<1)>>1]|0)+(D<<16>>16)|0;n=((z|0)>(x|0)?z:x)&65535;b[o>>1]=n;o=C+1|0;if((o|0)<(d|0)){C=o;D=n}else{break L520}}}else{n=b[a>>1]|0;o=b[c>>1]|0;b[a>>1]=n<<16>>16>o<<16>>16?n:o}}while(0);D=b[w>>1]|0;C=32768-(b[g>>1]|0)|0;g=((D|0)<(C|0)?D:C)&65535;b[w>>1]=g;w=d-2|0;if((w|0)>-1){E=w;F=g}else{return}while(1){g=a+(E<<1)|0;w=b[g>>1]|0;d=(F<<16>>16)-(b[c+(E+1<<1)>>1]|0)|0;C=((w|0)<(d|0)?w:d)&65535;b[g>>1]=C;if((E|0)>0){E=E-1|0;F=C}else{break}}return}function bM(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b[c>>1]|0;f=(b[c+2>>1]|0)-e|0;g=131072/(((f|0)>1?f:1)|0)&-1;f=g+(131072/(((e|0)>1?e:1)|0)&-1)|0;b[a>>1]=(f|0)<32767?f&65535:32767;f=d-1|0;L538:do{if((f|0)>1){d=1;e=g;while(1){h=d+1|0;i=c+(h<<1)|0;j=(b[i>>1]|0)-(b[c+(d<<1)>>1]|0)|0;k=131072/(((j|0)>1?j:1)|0)&-1;j=k+e|0;b[a+(d<<1)>>1]=(j|0)<32767?j&65535:32767;j=d+2|0;l=(b[c+(j<<1)>>1]|0)-(b[i>>1]|0)|0;i=131072/(((l|0)>1?l:1)|0)&-1;l=i+k|0;b[a+(h<<1)>>1]=(l|0)<32767?l&65535:32767;if((j|0)<(f|0)){d=j;e=i}else{m=i;break L538}}}else{m=g}}while(0);g=32768-(b[c+(f<<1)>>1]|0)|0;c=(131072/(((g|0)>1?g:1)|0)&-1)+m|0;b[a+(f<<1)>>1]=(c|0)<32767?c&65535:32767;return}function bN(a,e,f){a=a|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0;g=i;i=i+336|0;h=g|0;j=g+128|0;k=g+192|0;l=g+232|0;m=g+272|0;n=(f|0)==16?3792:3808;o=(f|0)>0;if(o){p=0;while(1){q=b[e+(p<<1)>>1]|0;r=q>>8;s=b[4216+(r<<1)>>1]|0;t=($((b[4216+(r+1<<1)>>1]|0)-s|0,q-(r<<8)|0)+(s<<8)>>3)+1>>1;c[j+((d[n+p|0]|0)<<2)>>2]=t;t=p+1|0;if((t|0)<(f|0)){p=t}else{break}}u=c[j>>2]|0}else{u=0}p=f>>1;n=k|0;c[n>>2]=65536;e=-u|0;u=k+4|0;c[u>>2]=e;t=(p|0)>1;L548:do{if(t){s=1;r=65536;q=e;while(1){v=c[j+(s<<1<<2)>>2]|0;w=v;x=(v|0)<0?-1:0;y=k+(s<<2)|0;z=cf(w,x,q,(q|0)<0?-1:0)|0;A=D;B=b6(z>>>15|A<<17,A>>>15|0<<17,1,0)|0;A=s+1|0;z=k+(A<<2)|0;c[z>>2]=(r<<1)-(B>>>1|D<<31)|0;L551:do{if((s|0)>1){B=s;C=r;E=q;while(1){F=c[k+(B-2<<2)>>2]|0;G=B-1|0;H=cf(C,(C|0)<0?-1:0,w,x)|0;I=D;J=b6(H>>>15|I<<17,I>>>15|0<<17,1,0)|0;c[k+(B<<2)>>2]=(F+E|0)-(J>>>1|D<<31)|0;if((G|0)<=1){break L551}B=G;C=F;E=c[k+(G<<2)>>2]|0}}}while(0);c[u>>2]=(c[u>>2]|0)-v|0;if((A|0)>=(p|0)){break L548}s=A;r=c[y>>2]|0;q=c[z>>2]|0}}}while(0);u=l|0;c[u>>2]=65536;e=-(c[j+4>>2]|0)|0;q=l+4|0;c[q>>2]=e;L558:do{if(t){r=1;s=65536;x=e;while(1){w=c[j+((r<<1|1)<<2)>>2]|0;E=w;C=(w|0)<0?-1:0;B=l+(r<<2)|0;G=cf(E,C,x,(x|0)<0?-1:0)|0;F=D;J=b6(G>>>15|F<<17,F>>>15|0<<17,1,0)|0;F=r+1|0;G=l+(F<<2)|0;c[G>>2]=(s<<1)-(J>>>1|D<<31)|0;L561:do{if((r|0)>1){J=r;I=s;H=x;while(1){K=c[l+(J-2<<2)>>2]|0;L=J-1|0;M=cf(I,(I|0)<0?-1:0,E,C)|0;N=D;O=b6(M>>>15|N<<17,N>>>15|0<<17,1,0)|0;c[l+(J<<2)>>2]=(K+H|0)-(O>>>1|D<<31)|0;if((L|0)<=1){break L561}J=L;I=K;H=c[l+(L<<2)>>2]|0}}}while(0);c[q>>2]=(c[q>>2]|0)-w|0;if((F|0)>=(p|0)){break L558}r=F;s=c[B>>2]|0;x=c[G>>2]|0}}}while(0);q=f-1|0;L568:do{if((p|0)>0){j=0;e=c[n>>2]|0;t=c[u>>2]|0;while(1){x=j+1|0;s=c[k+(x<<2)>>2]|0;r=e+s|0;C=c[l+(x<<2)>>2]|0;E=C-t|0;c[m+(j<<2)>>2]=-(E+r|0)|0;c[m+(q-j<<2)>>2]=E-r|0;if((x|0)<(p|0)){j=x;e=s;t=C}else{break L568}}}}while(0);p=(q|0)>0;l=m+(q<<2)|0;k=0;u=0;while(1){if(o){P=0;Q=u;R=0}else{S=k;break}while(1){n=c[m+(R<<2)>>2]|0;t=(n|0)>0?n:-n|0;n=(t|0)>(P|0);T=n?t:P;U=n?R:Q;n=R+1|0;if((n|0)<(f|0)){P=T;Q=U;R=n}else{break}}n=(T>>4)+1>>1;if((n|0)<=32767){S=k;break}t=(n|0)<163838?n:163838;n=65470-(((t<<14)-536854528|0)/($(t,U+1|0)>>2|0)&-1)|0;t=n-65536|0;e=n>>16;L579:do{if(p){j=0;C=n;s=e;while(1){x=m+(j<<2)|0;r=c[x>>2]|0;E=r<<16>>16;z=$(E,s);y=($(E,C&65535)>>16)+z|0;c[x>>2]=y+$((r>>15)+1>>1,C)|0;r=(($(C,t)>>15)+1>>1)+C|0;y=j+1|0;x=r>>16;if((y|0)<(q|0)){j=y;C=r;s=x}else{V=r;W=x;break L579}}}else{V=n;W=e}}while(0);e=c[l>>2]|0;n=e<<16>>16;t=$(n,W);s=($(n,V&65535)>>16)+t|0;c[l>>2]=s+$((e>>15)+1>>1,V)|0;e=k+1|0;if((e|0)<10){k=e;u=U}else{S=e;break}}L584:do{if((S|0)==10){if(o){X=0}else{break}while(1){U=m+(X<<2)|0;u=(c[U>>2]>>4)+1>>1;if((u|0)>32767){Y=32767}else{Y=(u|0)<-32768?-32768:u&65535}b[a+(X<<1)>>1]=Y;c[U>>2]=Y<<16>>16<<5;U=X+1|0;if((U|0)<(f|0)){X=U}else{break L584}}}else{if(o){Z=0}else{break}while(1){b[a+(Z<<1)>>1]=(((c[m+(Z<<2)>>2]|0)>>>4)+1|0)>>>1&65535;U=Z+1|0;if((U|0)<(f|0)){Z=U}else{break L584}}}}while(0);Z=f&1;X=h|0;Y=0;while(1){do{if(o){S=0;U=0;while(1){u=b[a+(S<<1)>>1]|0;_=u+U|0;c[h+(Z<<6)+(S<<2)>>2]=u<<12;u=S+1|0;if((u|0)<(f|0)){S=u;U=_}else{break}}if((_|0)>4095){break}else{aa=405;break}}else{aa=405}}while(0);if((aa|0)==405){aa=0;if((bK(X,f)|0)>=107374){aa=412;break}}U=65536-(2<<Y)|0;S=U-65536|0;u=U>>16;L604:do{if(p){k=0;V=U;W=u;while(1){T=m+(k<<2)|0;R=c[T>>2]|0;Q=R<<16>>16;P=$(Q,W);e=($(Q,V&65535)>>16)+P|0;c[T>>2]=e+$((R>>15)+1>>1,V)|0;R=(($(V,S)>>15)+1>>1)+V|0;e=k+1|0;T=R>>16;if((e|0)<(q|0)){k=e;V=R;W=T}else{ab=R;ac=T;break L604}}}else{ab=U;ac=u}}while(0);u=c[l>>2]|0;U=u<<16>>16;S=$(U,ac);W=($(U,ab&65535)>>16)+S|0;c[l>>2]=W+$((u>>15)+1>>1,ab)|0;L608:do{if(o){u=0;while(1){b[a+(u<<1)>>1]=(((c[m+(u<<2)>>2]|0)>>>4)+1|0)>>>1&65535;W=u+1|0;if((W|0)<(f|0)){u=W}else{break L608}}}}while(0);u=Y+1|0;if((u|0)<16){Y=u}else{aa=413;break}}if((aa|0)==412){i=g;return}else if((aa|0)==413){i=g;return}}function bO(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;b1(b|0,0,300);do{if((f|0)==0){if(!((d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;return g|0}if((e|0)==48e3|(e|0)==24e3|(e|0)==16e3|(e|0)==12e3|(e|0)==8e3){c[b+292>>2]=a[(((e>>12)-((e|0)>16e3&1)>>((e|0)>24e3&1))-1|0)+(10400+((((d>>12)-((d|0)>16e3&1)>>((d|0)>24e3&1))-1|0)*5&-1))|0]|0;break}else{g=-1;return g|0}}else{if(!((d|0)==48e3|(d|0)==24e3|(d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;return g|0}if((e|0)==16e3|(e|0)==12e3|(e|0)==8e3){c[b+292>>2]=a[((e>>12)-1|0)+(10384+((((d>>12)-((d|0)>16e3&1)>>((d|0)>24e3&1))-1|0)*3&-1))|0]|0;break}else{g=-1;return g|0}}}while(0);f=(d|0)/1e3&-1;c[b+284>>2]=f;c[b+288>>2]=(e|0)/1e3&-1;c[b+268>>2]=f*10&-1;do{if((e|0)>(d|0)){f=b+264|0;if((d<<1|0)==(e|0)){c[f>>2]=1;h=0;break}else{c[f>>2]=2;h=1;break}}else{f=b+264|0;if((e|0)>=(d|0)){c[f>>2]=0;h=0;break}c[f>>2]=3;f=e<<2;if((f|0)==(d*3&-1|0)){c[b+280>>2]=3;c[b+276>>2]=18;c[b+296>>2]=1648;h=0;break}i=e*3&-1;if((i|0)==(d<<1|0)){c[b+280>>2]=2;c[b+276>>2]=18;c[b+296>>2]=1712;h=0;break}if((e<<1|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=24;c[b+296>>2]=1872;h=0;break}if((i|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=1832;h=0;break}if((f|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=1792;h=0;break}if((e*6&-1|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=1752;h=0;break}else{g=-1;return g|0}}}while(0);f=e<<16>>16;i=(e>>15)+1>>1;j=d<<h;k=((d<<(h|14)|0)/(e|0)&-1)<<2;while(1){e=$(k>>16,f);h=$(k&65535,f)>>16;if(((e+$(k,i)|0)+h|0)<(j|0)){k=k+1|0}else{break}}c[b+272>>2]=k;g=0;return g|0}function bP(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a+284|0;g=a+292|0;h=c[g>>2]|0;i=(c[f>>2]|0)-h|0;j=a+168|0;b3(a+168+(h<<1)|0,d|0,i<<1);h=c[a+264>>2]|0;if((h|0)==1){k=a|0;bR(k,b,j|0,c[f>>2]|0);bR(k,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else if((h|0)==2){k=a;bT(k,b,j|0,c[f>>2]|0);bT(k,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else if((h|0)==3){h=a;bQ(h,b,j|0,c[f>>2]|0);bQ(h,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else{b3(b|0,j|0,c[f>>2]<<1);b3(b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)<<1)}f=c[g>>2]|0;b3(j|0,d+(e-f<<1)|0,f<<1);return 0}function bQ(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0;g=i;h=a+268|0;j=c[h>>2]|0;k=a+276|0;l=c[k>>2]|0;m=i;i=i+((l+j|0)*4&-1)|0;i=i+7>>3<<3;n=m;o=a+24|0;b3(n|0,o|0,l<<2);p=a+296|0;q=c[p>>2]|0;r=q+4|0;s=c[a+272>>2]|0;t=a;u=a+4|0;v=a+280|0;a=q+6|0;w=q+8|0;x=q+10|0;y=q+12|0;z=q+14|0;A=q+16|0;B=q+18|0;C=q+20|0;D=q+22|0;E=q+24|0;F=q+26|0;G=q+28|0;H=q+30|0;I=q+32|0;J=q+34|0;K=q+36|0;L=q+38|0;M=d;d=e;e=f;f=j;j=l;l=q;while(1){N=(e|0)<(f|0)?e:f;L674:do{if((N|0)>0){O=l+2|0;P=0;Q=c[t>>2]|0;R=c[u>>2]|0;while(1){S=((b[d+(P<<1)>>1]|0)<<8)+Q|0;c[m+(P+j<<2)>>2]=S;T=S<<2;S=T>>16;U=b[l>>1]|0;V=$(S,U);W=T&65532;T=(V+R|0)+($(W,U)>>16)|0;c[t>>2]=T;U=b[O>>1]|0;V=$(S,U);S=($(W,U)>>16)+V|0;c[u>>2]=S;V=P+1|0;if((V|0)<(N|0)){P=V;Q=T;R=S}else{break L674}}}}while(0);R=N<<16;Q=c[v>>2]|0;L679:do{if((j|0)==24){if((R|0)>0){X=0;Y=M}else{Z=M;break}while(1){P=X>>16;O=(c[m+(P+23<<2)>>2]|0)+(c[m+(P<<2)>>2]|0)|0;S=b[r>>1]|0;T=$(O>>16,S);V=$(O&65535,S)>>16;S=(c[m+(P+22<<2)>>2]|0)+(c[m+(P+1<<2)>>2]|0)|0;O=b[a>>1]|0;U=$(S>>16,O);W=$(S&65535,O)>>16;O=(c[m+(P+21<<2)>>2]|0)+(c[m+(P+2<<2)>>2]|0)|0;S=b[w>>1]|0;_=$(O>>16,S);aa=$(O&65535,S)>>16;S=(c[m+(P+20<<2)>>2]|0)+(c[m+(P+3<<2)>>2]|0)|0;O=b[x>>1]|0;ab=$(S>>16,O);ac=$(S&65535,O)>>16;O=(c[m+(P+19<<2)>>2]|0)+(c[m+(P+4<<2)>>2]|0)|0;S=b[y>>1]|0;ad=$(O>>16,S);ae=$(O&65535,S)>>16;S=(c[m+(P+18<<2)>>2]|0)+(c[m+(P+5<<2)>>2]|0)|0;O=b[z>>1]|0;af=$(S>>16,O);ag=$(S&65535,O)>>16;O=(c[m+(P+17<<2)>>2]|0)+(c[m+(P+6<<2)>>2]|0)|0;S=b[A>>1]|0;ah=$(O>>16,S);ai=$(O&65535,S)>>16;S=(c[m+(P+16<<2)>>2]|0)+(c[m+(P+7<<2)>>2]|0)|0;O=b[B>>1]|0;aj=$(S>>16,O);ak=$(S&65535,O)>>16;O=(c[m+(P+15<<2)>>2]|0)+(c[m+(P+8<<2)>>2]|0)|0;S=b[C>>1]|0;al=$(O>>16,S);am=$(O&65535,S)>>16;S=(c[m+(P+14<<2)>>2]|0)+(c[m+(P+9<<2)>>2]|0)|0;O=b[D>>1]|0;an=$(S>>16,O);ao=$(S&65535,O)>>16;O=(c[m+(P+13<<2)>>2]|0)+(c[m+(P+10<<2)>>2]|0)|0;S=b[E>>1]|0;ap=$(O>>16,S);aq=$(O&65535,S)>>16;S=(c[m+(P+12<<2)>>2]|0)+(c[m+(P+11<<2)>>2]|0)|0;P=b[F>>1]|0;O=$(S>>16,P);ar=(((((((((((((((((((((((V+T|0)+U|0)+W|0)+_|0)+aa|0)+ab|0)+ac|0)+ad|0)+ae|0)+af|0)+ag|0)+ah|0)+ai|0)+aj|0)+ak|0)+al|0)+am|0)+an|0)+ao|0)+ap|0)+aq|0)+O|0)+($(S&65535,P)>>16)>>5)+1>>1;if((ar|0)>32767){as=32767}else{as=(ar|0)<-32768?-32768:ar&65535}ar=Y+2|0;b[Y>>1]=as;P=X+s|0;if((P|0)<(R|0)){X=P;Y=ar}else{Z=ar;break L679}}}else if((j|0)==18){if((R|0)<=0){Z=M;break}ar=Q<<16>>16;P=Q-1|0;S=0;O=M;while(1){aq=S>>16;ap=$(S&65535,ar)>>16;ao=ap*9&-1;an=c[m+(aq<<2)>>2]|0;am=b[q+(ao+2<<1)>>1]|0;al=$(am,an>>16);ak=$(am,an&65535)>>16;an=c[m+(aq+1<<2)>>2]|0;am=b[q+(ao+3<<1)>>1]|0;aj=$(am,an>>16);ai=$(am,an&65535)>>16;an=c[m+(aq+2<<2)>>2]|0;am=b[q+(ao+4<<1)>>1]|0;ah=$(am,an>>16);ag=$(am,an&65535)>>16;an=c[m+(aq+3<<2)>>2]|0;am=b[q+(ao+5<<1)>>1]|0;af=$(am,an>>16);ae=$(am,an&65535)>>16;an=c[m+(aq+4<<2)>>2]|0;am=b[q+(ao+6<<1)>>1]|0;ad=$(am,an>>16);ac=$(am,an&65535)>>16;an=c[m+(aq+5<<2)>>2]|0;am=b[q+(ao+7<<1)>>1]|0;ab=$(am,an>>16);aa=$(am,an&65535)>>16;an=c[m+(aq+6<<2)>>2]|0;am=b[q+(ao+8<<1)>>1]|0;_=$(am,an>>16);W=$(am,an&65535)>>16;an=c[m+(aq+7<<2)>>2]|0;am=b[q+(ao+9<<1)>>1]|0;U=$(am,an>>16);T=$(am,an&65535)>>16;an=c[m+(aq+8<<2)>>2]|0;am=b[q+(ao+10<<1)>>1]|0;ao=$(am,an>>16);V=$(am,an&65535)>>16;an=(P-ap|0)*9&-1;ap=c[m+(aq+17<<2)>>2]|0;am=b[q+(an+2<<1)>>1]|0;at=$(am,ap>>16);au=$(am,ap&65535)>>16;ap=c[m+(aq+16<<2)>>2]|0;am=b[q+(an+3<<1)>>1]|0;av=$(am,ap>>16);aw=$(am,ap&65535)>>16;ap=c[m+(aq+15<<2)>>2]|0;am=b[q+(an+4<<1)>>1]|0;ax=$(am,ap>>16);ay=$(am,ap&65535)>>16;ap=c[m+(aq+14<<2)>>2]|0;am=b[q+(an+5<<1)>>1]|0;az=$(am,ap>>16);aA=$(am,ap&65535)>>16;ap=c[m+(aq+13<<2)>>2]|0;am=b[q+(an+6<<1)>>1]|0;aB=$(am,ap>>16);aC=$(am,ap&65535)>>16;ap=c[m+(aq+12<<2)>>2]|0;am=b[q+(an+7<<1)>>1]|0;aD=$(am,ap>>16);aE=$(am,ap&65535)>>16;ap=c[m+(aq+11<<2)>>2]|0;am=b[q+(an+8<<1)>>1]|0;aF=$(am,ap>>16);aG=$(am,ap&65535)>>16;ap=c[m+(aq+10<<2)>>2]|0;am=b[q+(an+9<<1)>>1]|0;aH=$(am,ap>>16);aI=$(am,ap&65535)>>16;ap=c[m+(aq+9<<2)>>2]|0;aq=b[q+(an+10<<1)>>1]|0;an=$(aq,ap>>16);am=(((((((((((((((((((((((((((((((((((ak+al|0)+aj|0)+ai|0)+ah|0)+ag|0)+af|0)+ae|0)+ad|0)+ac|0)+ab|0)+aa|0)+_|0)+W|0)+U|0)+T|0)+ao|0)+V|0)+at|0)+au|0)+av|0)+aw|0)+ax|0)+ay|0)+az|0)+aA|0)+aB|0)+aC|0)+aD|0)+aE|0)+aF|0)+aG|0)+aH|0)+aI|0)+an|0)+($(aq,ap&65535)>>16)>>5)+1>>1;if((am|0)>32767){aJ=32767}else{aJ=(am|0)<-32768?-32768:am&65535}am=O+2|0;b[O>>1]=aJ;ap=S+s|0;if((ap|0)<(R|0)){S=ap;O=am}else{Z=am;break L679}}}else if((j|0)==36){if((R|0)>0){aK=0;aL=M}else{Z=M;break}while(1){O=aK>>16;S=(c[m+(O+35<<2)>>2]|0)+(c[m+(O<<2)>>2]|0)|0;P=b[r>>1]|0;ar=$(S>>16,P);am=$(S&65535,P)>>16;P=(c[m+(O+34<<2)>>2]|0)+(c[m+(O+1<<2)>>2]|0)|0;S=b[a>>1]|0;ap=$(P>>16,S);aq=$(P&65535,S)>>16;S=(c[m+(O+33<<2)>>2]|0)+(c[m+(O+2<<2)>>2]|0)|0;P=b[w>>1]|0;an=$(S>>16,P);aI=$(S&65535,P)>>16;P=(c[m+(O+32<<2)>>2]|0)+(c[m+(O+3<<2)>>2]|0)|0;S=b[x>>1]|0;aH=$(P>>16,S);aG=$(P&65535,S)>>16;S=(c[m+(O+31<<2)>>2]|0)+(c[m+(O+4<<2)>>2]|0)|0;P=b[y>>1]|0;aF=$(S>>16,P);aE=$(S&65535,P)>>16;P=(c[m+(O+30<<2)>>2]|0)+(c[m+(O+5<<2)>>2]|0)|0;S=b[z>>1]|0;aD=$(P>>16,S);aC=$(P&65535,S)>>16;S=(c[m+(O+29<<2)>>2]|0)+(c[m+(O+6<<2)>>2]|0)|0;P=b[A>>1]|0;aB=$(S>>16,P);aA=$(S&65535,P)>>16;P=(c[m+(O+28<<2)>>2]|0)+(c[m+(O+7<<2)>>2]|0)|0;S=b[B>>1]|0;az=$(P>>16,S);ay=$(P&65535,S)>>16;S=(c[m+(O+27<<2)>>2]|0)+(c[m+(O+8<<2)>>2]|0)|0;P=b[C>>1]|0;ax=$(S>>16,P);aw=$(S&65535,P)>>16;P=(c[m+(O+26<<2)>>2]|0)+(c[m+(O+9<<2)>>2]|0)|0;S=b[D>>1]|0;av=$(P>>16,S);au=$(P&65535,S)>>16;S=(c[m+(O+25<<2)>>2]|0)+(c[m+(O+10<<2)>>2]|0)|0;P=b[E>>1]|0;at=$(S>>16,P);V=$(S&65535,P)>>16;P=(c[m+(O+24<<2)>>2]|0)+(c[m+(O+11<<2)>>2]|0)|0;S=b[F>>1]|0;ao=$(P>>16,S);T=$(P&65535,S)>>16;S=(c[m+(O+23<<2)>>2]|0)+(c[m+(O+12<<2)>>2]|0)|0;P=b[G>>1]|0;U=$(S>>16,P);W=$(S&65535,P)>>16;P=(c[m+(O+22<<2)>>2]|0)+(c[m+(O+13<<2)>>2]|0)|0;S=b[H>>1]|0;_=$(P>>16,S);aa=$(P&65535,S)>>16;S=(c[m+(O+21<<2)>>2]|0)+(c[m+(O+14<<2)>>2]|0)|0;P=b[I>>1]|0;ab=$(S>>16,P);ac=$(S&65535,P)>>16;P=(c[m+(O+20<<2)>>2]|0)+(c[m+(O+15<<2)>>2]|0)|0;S=b[J>>1]|0;ad=$(P>>16,S);ae=$(P&65535,S)>>16;S=(c[m+(O+19<<2)>>2]|0)+(c[m+(O+16<<2)>>2]|0)|0;P=b[K>>1]|0;af=$(S>>16,P);ag=$(S&65535,P)>>16;P=(c[m+(O+18<<2)>>2]|0)+(c[m+(O+17<<2)>>2]|0)|0;O=b[L>>1]|0;S=$(P>>16,O);ah=(((((((((((((((((((((((((((((((((((am+ar|0)+ap|0)+aq|0)+an|0)+aI|0)+aH|0)+aG|0)+aF|0)+aE|0)+aD|0)+aC|0)+aB|0)+aA|0)+az|0)+ay|0)+ax|0)+aw|0)+av|0)+au|0)+at|0)+V|0)+ao|0)+T|0)+U|0)+W|0)+_|0)+aa|0)+ab|0)+ac|0)+ad|0)+ae|0)+af|0)+ag|0)+S|0)+($(P&65535,O)>>16)>>5)+1>>1;if((ah|0)>32767){aM=32767}else{aM=(ah|0)<-32768?-32768:ah&65535}ah=aL+2|0;b[aL>>1]=aM;O=aK+s|0;if((O|0)<(R|0)){aK=O;aL=ah}else{Z=ah;break L679}}}else{Z=M}}while(0);R=e-N|0;if((R|0)<=1){break}Q=c[k>>2]|0;b3(n|0,m+(N<<2)|0,Q<<2);M=Z;d=d+(N<<1)|0;e=R;f=c[h>>2]|0;j=Q;l=c[p>>2]|0}b3(o|0,m+(N<<2)|0,c[k>>2]<<2);i=g;return}function bR(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if((f|0)<=0){return}g=a+4|0;h=a+8|0;i=a+12|0;j=a+16|0;k=a+20|0;l=0;while(1){m=(b[e+(l<<1)>>1]|0)<<10;n=c[a>>2]|0;o=m-n|0;p=(((o&65535)*1746&-1)>>>16)+((o>>16)*1746&-1)|0;o=p+n|0;c[a>>2]=p+m|0;p=c[g>>2]|0;n=o-p|0;q=(((n&65535)*14986&-1)>>>16)+((n>>16)*14986&-1)|0;n=q+p|0;c[g>>2]=q+o|0;o=n-(c[h>>2]|0)|0;q=(((o&65535)*-26453&-1)>>16)+((o>>16)*-26453&-1)|0;c[h>>2]=(o+n|0)+q|0;o=(q+n>>9)+1>>1;if((o|0)>32767){r=32767}else{r=(o|0)<-32768?-32768:o&65535}o=l<<1;b[d+(o<<1)>>1]=r;n=c[i>>2]|0;q=m-n|0;p=(((q&65535)*6854&-1)>>>16)+((q>>16)*6854&-1)|0;q=p+n|0;c[i>>2]=p+m|0;m=c[j>>2]|0;p=q-m|0;n=(((p&65535)*25769&-1)>>>16)+((p>>16)*25769&-1)|0;p=n+m|0;c[j>>2]=n+q|0;q=p-(c[k>>2]|0)|0;n=(((q&65535)*-9994&-1)>>16)+((q>>16)*-9994&-1)|0;c[k>>2]=(q+p|0)+n|0;q=(n+p>>9)+1>>1;if((q|0)>32767){s=32767}else{s=(q|0)<-32768?-32768:q&65535}b[d+((o|1)<<1)>>1]=s;o=l+1|0;if((o|0)<(f|0)){l=o}else{break}}return}function bS(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;f=i;i=i+24|0;g=f|0;h=a+28|0;j=c[h>>2]|0;k=a+32|0;l=c[k>>2]|0;m=j>>>8;n=-1;o=j;while(1){p=n+1|0;q=$(d[p+408|0]|0,m);if(l>>>0<q>>>0){n=p;o=q}else{break}}n=l-q|0;c[k>>2]=n;l=o-q|0;c[h>>2]=l;q=a+20|0;o=a+40|0;m=a+24|0;j=a+4|0;r=a|0;L719:do{if(l>>>0<8388609){a=c[j>>2]|0;s=c[q>>2]|0;t=l;u=c[o>>2]|0;v=c[m>>2]|0;w=n;while(1){x=s+8|0;c[q>>2]=x;y=t<<8;c[h>>2]=y;if(v>>>0<a>>>0){z=v+1|0;c[m>>2]=z;A=d[(c[r>>2]|0)+v|0]|0;B=z}else{A=0;B=v}c[o>>2]=A;z=((A|u<<8)>>>1&255|w<<8&2147483392)^255;c[k>>2]=z;if(y>>>0<8388609){s=x;t=y;u=A;v=B;w=z}else{C=y;D=z;break L719}}}else{C=l;D=n}}while(0);n=(p|0)/5&-1;l=g+8|0;c[l>>2]=n;B=g+20|0;c[B>>2]=(n*-5&-1)+p|0;p=0;n=C;C=D;while(1){D=n>>>8;A=-1;w=n;while(1){E=A+1|0;F=$(d[E+352|0]|0,D);if(C>>>0<F>>>0){A=E;w=F}else{break}}A=C-F|0;c[k>>2]=A;D=w-F|0;c[h>>2]=D;L732:do{if(D>>>0<8388609){v=c[j>>2]|0;u=c[q>>2]|0;t=D;s=c[o>>2]|0;a=c[m>>2]|0;z=A;while(1){y=u+8|0;c[q>>2]=y;x=t<<8;c[h>>2]=x;if(a>>>0<v>>>0){G=a+1|0;c[m>>2]=G;H=d[(c[r>>2]|0)+a|0]|0;I=G}else{H=0;I=a}c[o>>2]=H;G=((H|s<<8)>>>1&255|z<<8&2147483392)^255;c[k>>2]=G;if(x>>>0<8388609){u=y;t=x;s=H;a=I;z=G}else{J=x;K=G;break L732}}}else{J=D;K=A}}while(0);c[g+(p*12&-1)>>2]=E;A=J>>>8;D=-1;w=J;while(1){L=D+1|0;M=$(d[L+336|0]|0,A);if(K>>>0<M>>>0){D=L;w=M}else{break}}D=K-M|0;c[k>>2]=D;A=w-M|0;c[h>>2]=A;L743:do{if(A>>>0<8388609){z=c[j>>2]|0;a=c[q>>2]|0;s=A;t=c[o>>2]|0;u=c[m>>2]|0;v=D;while(1){G=a+8|0;c[q>>2]=G;x=s<<8;c[h>>2]=x;if(u>>>0<z>>>0){y=u+1|0;c[m>>2]=y;N=d[(c[r>>2]|0)+u|0]|0;O=y}else{N=0;O=u}c[o>>2]=N;y=((N|t<<8)>>>1&255|v<<8&2147483392)^255;c[k>>2]=y;if(x>>>0<8388609){a=G;s=x;t=N;u=O;v=y}else{P=x;Q=y;break L743}}}else{P=A;Q=D}}while(0);c[g+(p*12&-1)+4>>2]=L;D=p+1|0;if((D|0)<2){p=D;n=P;C=Q}else{break}}Q=g|0;C=(c[Q>>2]|0)+((c[l>>2]|0)*3&-1)|0;c[Q>>2]=C;Q=b[376+(C<<1)>>1]|0;l=(b[376+(C+1<<1)>>1]|0)-Q|0;C=$(l>>16,429522944)+((l&65535)*6554&-1)>>16;l=$(C,c[g+4>>2]<<17>>16|1)+Q|0;Q=g+12|0;C=(c[Q>>2]|0)+((c[B>>2]|0)*3&-1)|0;c[Q>>2]=C;Q=b[376+(C<<1)>>1]|0;B=(b[376+(C+1<<1)>>1]|0)-Q|0;C=$(B>>16,429522944)+((B&65535)*6554&-1)>>16;B=$(C,c[g+16>>2]<<17>>16|1)+Q|0;c[e+4>>2]=B;c[e>>2]=l-B|0;i=f;return}function bT(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=a+268|0;j=c[h>>2]|0;k=i;i=i+(((j<<1)+8|0)*2&-1)|0;i=i+7>>3<<3;l=k;m=a+24|0;b3(l|0,m|0,16);n=c[a+272>>2]|0;o=a;a=k+16|0;p=d;d=e;e=f;f=j;while(1){q=(e|0)<(f|0)?e:f;bR(o,a,d,q);j=q<<17;L755:do{if((j|0)>0){r=0;s=p;while(1){t=((r&65535)*12&-1)>>>16;u=r>>16;v=$(b[1128+(t<<3)>>1]|0,b[k+(u<<1)>>1]|0);w=$(b[1130+(t<<3)>>1]|0,b[k+(u+1<<1)>>1]|0)+v|0;v=w+$(b[1132+(t<<3)>>1]|0,b[k+(u+2<<1)>>1]|0)|0;w=v+$(b[1134+(t<<3)>>1]|0,b[k+(u+3<<1)>>1]|0)|0;v=11-t|0;t=w+$(b[1134+(v<<3)>>1]|0,b[k+(u+4<<1)>>1]|0)|0;w=t+$(b[1132+(v<<3)>>1]|0,b[k+(u+5<<1)>>1]|0)|0;t=w+$(b[1130+(v<<3)>>1]|0,b[k+(u+6<<1)>>1]|0)|0;w=(t+$(b[1128+(v<<3)>>1]|0,b[k+(u+7<<1)>>1]|0)>>14)+1>>1;if((w|0)>32767){x=32767}else{x=(w|0)<-32768?-32768:w&65535}w=s+2|0;b[s>>1]=x;u=r+n|0;if((u|0)<(j|0)){r=u;s=w}else{y=w;break L755}}}else{y=p}}while(0);j=e-q|0;if((j|0)<=0){break}b3(l|0,k+(q<<1<<1)|0,16);p=y;d=d+(q<<1)|0;e=j;f=c[h>>2]|0}b3(m|0,k+(q<<1<<1)|0,16);i=g;return}function bU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;if(!((b|0)==48e3|(b|0)==24e3|(b|0)==16e3|(b|0)==12e3|(b|0)==8e3)){f=-1;i=e;return f|0}if((d-1|0)>>>0>1){f=-1;i=e;return f|0}g=d*8720&-1;b1(a|0,0,g+9032|0);c[a+4>>2]=76;c[a>>2]=8620;h=a+76|0;j=a+8620|0;k=j;c[a+8>>2]=d;c[a+44>>2]=d;c[a+12>>2]=b;c[a+24>>2]=b;c[a+16>>2]=d;b1(h|0,0,4252);c[a+2452>>2]=1;c[h>>2]=65536;c[a+4224>>2]=0;c[a+4228>>2]=3176576;c[a+4244>>2]=0;c[a+4316>>2]=65536;c[a+4320>>2]=65536;c[a+4332>>2]=20;c[a+4328>>2]=2;h=a+4336|0;b1(h|0,0,4252);c[a+6712>>2]=1;c[h>>2]=65536;c[a+8484>>2]=0;c[a+8488>>2]=3176576;c[a+8504>>2]=0;c[a+8576>>2]=65536;c[a+8580>>2]=65536;c[a+8592>>2]=20;c[a+8588>>2]=2;b1(a+8596|0,0,12);c[a+8616>>2]=0;if(d>>>0>2|(j|0)==0){f=-3;i=e;return f|0}b1(j|0,0,g+412|0);c[j>>2]=4920;c[j+4>>2]=120;c[j+8>>2]=d;c[j+12>>2]=d;d=j+16|0;c[d>>2]=1;c[j+20>>2]=0;c[j+24>>2]=21;c[j+28>>2]=1;c[j+44>>2]=0;a$(k,4028,(u=i,i=i+1|0,i=i+7>>3<<3,c[u>>2]=0,u)|0);if((b|0)==24e3){l=2}else if((b|0)==16e3){l=3}else if((b|0)==12e3){l=4}else if((b|0)==8e3){l=6}else if((b|0)==48e3){l=1}else{c[d>>2]=0;f=-3;i=e;return f|0}c[d>>2]=l;a$(k,10016,(u=i,i=i+8|0,c[u>>2]=0,u)|0);c[a+56>>2]=0;c[a+60>>2]=(b|0)/400&-1;f=0;i=e;return f|0}function bV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;do{if((a|0)==48e3|(a|0)==24e3|(a|0)==16e3|(a|0)==12e3|(a|0)==8e3){if((b-1|0)>>>0>1){e=536;break}f=b_((b*8720&-1)+9032|0)|0;g=f;if((f|0)==0){if((d|0)==0){h=0;break}c[d>>2]=-7;h=0;break}i=bU(g,a,b)|0;if((d|0)!=0){c[d>>2]=i}if((i|0)==0){h=g;break}b$(f);h=0;break}else{e=536}}while(0);do{if((e|0)==536){if((d|0)==0){h=0;break}c[d>>2]=-1;h=0}}while(0);return h|0}function bW(e,f,g,h,i,j,k){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;if((j|0)==0){l=-1;return l|0}m=a[e]|0;n=m&255;do{if((n&128|0)==0){if((n&96|0)==96){o=(n&8|0)==0?480:960;break}p=n>>>3&3;if((p|0)==3){o=2880;break}o=(48e3<<p|0)/100&-1}else{o=(48e3<<(n>>>3&3)|0)/400&-1}}while(0);p=e+1|0;q=f-1|0;r=n&3;L811:do{if((r|0)==0){s=p;t=q;u=q;v=0;w=1;x=590}else if((r|0)==1){if((g|0)!=0){y=2;z=1;A=q;B=q;C=p;x=591;break}if((q&1|0)==0){n=(q|0)/2&-1;b[j>>1]=n&65535;s=p;t=n;u=q;v=1;w=2;x=590;break}else{l=-4;return l|0}}else if((r|0)==2){if((q|0)<1){b[j>>1]=-1;l=-4;return l|0}n=a[p]|0;D=n&255;do{if((n&255)<252){E=1;F=D;G=D}else{if((q|0)>=2){H=((d[e+2|0]|0)<<2)+D&65535;E=2;F=H;G=H;break}b[j>>1]=-1;l=-4;return l|0}}while(0);b[j>>1]=G;D=q-E|0;n=F<<16>>16;if(F<<16>>16<0|(n|0)>(D|0)){l=-4;return l|0}else{s=e+(E+1|0)|0;t=D-n|0;u=D;v=0;w=2;x=590;break}}else{if((q|0)<1){l=-4;return l|0}D=e+2|0;n=d[p]|0;H=n&63;if((H|0)==0){l=-4;return l|0}if(($(H,o)|0)>5760){l=-4;return l|0}I=f-2|0;L843:do{if((n&64|0)==0){J=D;K=I}else{L=D;M=I;while(1){if((M|0)<1){l=-4;break}N=L+1|0;O=a[L]|0;P=O<<24>>24==-1;Q=(M-1|0)+(P?-254:-(O&255)|0)|0;if(P){L=N;M=Q}else{J=N;K=Q;break L843}}return l|0}}while(0);if((K|0)<0){l=-4;return l|0}I=n>>>7^1;if((n&128|0)==0){if((g|0)!=0){y=H;z=I;A=K;B=q;C=J;x=591;break}D=(K|0)/(H|0)&-1;if(($(D,H)|0)!=(K|0)){l=-4;return l|0}M=H-1|0;if((M|0)<=0){s=J;t=D;u=K;v=I;w=H;x=590;break}L=D&65535;Q=0;while(1){b[j+(Q<<1)>>1]=L;N=Q+1|0;if((N|0)<(M|0)){Q=N}else{s=J;t=D;u=K;v=I;w=H;x=590;break L811}}}D=H-1|0;L862:do{if((D|0)>0){Q=0;M=K;L=K;n=J;while(1){R=j+(Q<<1)|0;if((M|0)<1){x=576;break}N=a[n]|0;P=N&255;if((N&255)<252){S=1;T=P;U=P}else{if((M|0)<2){x=580;break}N=((d[n+1|0]|0)<<2)+P&65535;S=2;T=N;U=N}b[R>>1]=U;N=M-S|0;P=T<<16>>16;if(T<<16>>16<0|(P|0)>(N|0)){l=-4;x=633;break}O=n+S|0;V=(L-S|0)-P|0;P=Q+1|0;if((P|0)<(D|0)){Q=P;M=N;L=V;n=O}else{W=N;X=V;Y=O;break L862}}if((x|0)==576){b[R>>1]=-1;l=-4;return l|0}else if((x|0)==580){b[R>>1]=-1;l=-4;return l|0}else if((x|0)==633){return l|0}}else{W=K;X=K;Y=J}}while(0);if((X|0)<0){l=-4}else{s=Y;t=X;u=W;v=I;w=H;x=590;break}return l|0}}while(0);do{if((x|0)==590){if((g|0)!=0){y=w;z=v;A=u;B=t;C=s;x=591;break}if((t|0)>1275){l=-4;return l|0}else{b[j+(w-1<<1)>>1]=t&65535;Z=s;_=w;break}}}while(0);L886:do{if((x|0)==591){w=y-1|0;s=j+(w<<1)|0;if((A|0)<1){b[s>>1]=-1;l=-4;return l|0}t=a[C]|0;u=t&255;do{if((t&255)<252){aa=1;ab=u;ac=u}else{if((A|0)>=2){v=((d[C+1|0]|0)<<2)+u&65535;aa=2;ab=v;ac=v;break}b[s>>1]=-1;l=-4;return l|0}}while(0);b[s>>1]=ac;u=A-aa|0;t=ab<<16>>16;if(ab<<16>>16<0|(t|0)>(u|0)){l=-4;return l|0}H=C+aa|0;if((z|0)==0){if((t|0)>(B|0)){l=-4}else{Z=H;_=y;break}return l|0}if(($(t,y)|0)>(u|0)){l=-4;return l|0}if((w|0)>0){ad=0;ae=ab}else{Z=H;_=y;break}while(1){b[j+(ad<<1)>>1]=ae;u=ad+1|0;if((u|0)>=(w|0)){Z=H;_=y;break L886}ad=u;ae=b[s>>1]|0}}}while(0);L914:do{if((i|0)!=0&(_|0)>0){ae=0;ad=Z;while(1){c[i+(ae<<2)>>2]=ad;y=ad+(b[j+(ae<<1)>>1]|0)|0;ab=ae+1|0;if((ab|0)<(_|0)){ae=ab;ad=y}else{af=y;break L914}}}else{af=Z}}while(0);if((h|0)!=0){a[h]=m}if((k|0)==0){l=_;return l|0}c[k>>2]=af-e|0;l=_;return l|0}function bX(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;m=i;i=i+112|0;n=m|0;o=m+8|0;p=m+16|0;if(j>>>0>1){q=-1;i=m;return q|0}r=(j|0)!=0;j=(f|0)==0;s=(e|0)==0;do{if(r|j|s){if(((h|0)%((c[d+12>>2]|0)/400&-1|0)|0)==0){break}else{q=-1}i=m;return q|0}}while(0);if(j|s){s=d+8|0;j=0;while(1){t=bY(d,0,0,g+($(c[s>>2]|0,j)<<1)|0,h-j|0,0)|0;if((t|0)<0){q=t;u=688;break}v=t+j|0;if((v|0)<(h|0)){j=v}else{break}}if((u|0)==688){i=m;return q|0}c[d+68>>2]=v;q=v;i=m;return q|0}if((f|0)<0){q=-1;i=m;return q|0}v=a[e]|0;j=v&255;do{if((j&128|0)==0){s=(j&96|0)==96?1001:1e3;if((j&96|0)==96){t=d+12|0;w=j>>>4&1|1104;x=t;y=t}else{t=d+12|0;w=(j>>>5&3)+1101|0;x=t;y=t}t=c[y>>2]|0;if((j&96|0)==96){if((j&8|0)==0){z=(t|0)/100&-1;A=s;B=w;C=x;break}else{z=(t|0)/50&-1;A=s;B=w;C=x;break}}else{D=j>>>3&3;if((D|0)==3){z=(t*60&-1|0)/1e3&-1;A=s;B=w;C=x;break}else{z=(t<<D|0)/100&-1;A=s;B=w;C=x;break}}}else{s=j>>>5&3;D=d+12|0;z=(c[D>>2]<<(j>>>3&3)|0)/400&-1;A=1002;B=(s|0)==0?1101:s+1102|0;C=D}}while(0);j=(v&4)!=0?2:1;v=p|0;x=bW(e,f,k,o,0,v,n)|0;o=c[n>>2]|0;n=e+o|0;if(!r){if((x|0)<0){q=x;i=m;return q|0}if(($(x,z)|0)>(h|0)){q=-2;i=m;return q|0}c[d+52>>2]=A;c[d+48>>2]=B;c[d+60>>2]=z;c[d+44>>2]=j;L971:do{if((x|0)>0){r=d+8|0;e=o;k=0;f=0;w=n;while(1){y=p+(f<<1)|0;D=b[y>>1]|0;s=bY(d,w,D,g+($(c[r>>2]|0,k)<<1)|0,h-k|0,0)|0;if((s|0)<0){q=s;break}D=b[y>>1]|0;y=D+e|0;t=s+k|0;s=f+1|0;if((s|0)<(x|0)){e=y;k=t;f=s;w=w+D|0}else{E=y;F=t;break L971}}i=m;return q|0}else{E=o;F=0}}while(0);if((l|0)!=0){c[l>>2]=E}c[d+68>>2]=F;q=F;i=m;return q|0}do{if(!((z|0)>(h|0)|(A|0)==1002)){F=d+52|0;if((c[F>>2]|0)==1002){break}E=d+68|0;l=c[E>>2]|0;o=h-z|0;L986:do{if((z|0)==(h|0)){G=d+8|0}else{L989:do{if(((o|0)%((c[C>>2]|0)/400&-1|0)|0)==0){x=d+8|0;p=0;while(1){w=bY(d,0,0,g+($(c[x>>2]|0,p)<<1)|0,o-p|0,0)|0;if((w|0)<0){H=w;break L989}I=w+p|0;if((I|0)<(o|0)){p=I}else{break}}c[E>>2]=I;if((I|0)<0){H=I}else{G=x;break L986}}else{H=-1}}while(0);c[E>>2]=l;q=H;i=m;return q|0}}while(0);c[F>>2]=A;c[d+48>>2]=B;c[d+60>>2]=z;c[d+44>>2]=j;l=b[v>>1]|0;p=bY(d,n,l,g+($(c[G>>2]|0,o)<<1)|0,z,1)|0;if((p|0)<0){q=p;i=m;return q|0}c[E>>2]=h;q=h;i=m;return q|0}}while(0);if(((h|0)%((c[C>>2]|0)/400&-1|0)|0)!=0){q=-1;i=m;return q|0}C=d+8|0;z=0;while(1){G=bY(d,0,0,g+($(c[C>>2]|0,z)<<1)|0,h-z|0,0)|0;if((G|0)<0){q=G;u=692;break}J=G+z|0;if((J|0)<(h|0)){z=J}else{break}}if((u|0)==692){i=m;return q|0}c[d+68>>2]=J;q=J;i=m;return q|0}function bY(a,e,f,g,h,j){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aZ=0,a_=0;k=i;i=i+88|0;l=k|0;m=k+8|0;n=k+56|0;o=k+64|0;p=k+72|0;q=k+80|0;c[o>>2]=0;r=a;s=c[a+4>>2]|0;t=r+s|0;v=r+(c[a>>2]|0)|0;w=a+12|0;x=c[w>>2]|0;y=(x|0)/50&-1;z=y>>1;A=y>>2;B=y>>3;if((B|0)>(h|0)){C=-2;i=k;return C|0}D=((x|0)/25&-1)*3&-1;x=(D|0)>(h|0)?h:D;do{if((f|0)<2){D=c[a+60>>2]|0;E=(x|0)<(D|0)?x:D;F=710;break}else{if((e|0)==0){E=x;F=710;break}D=c[a+60>>2]|0;h=c[a+52>>2]|0;c[m>>2]=e;c[m+4>>2]=f;c[m+8>>2]=0;c[m+12>>2]=0;c[m+16>>2]=0;G=m+20|0;c[G>>2]=9;H=m+24|0;c[H>>2]=0;I=m+28|0;c[I>>2]=128;if((f|0)==0){J=0;K=0}else{c[H>>2]=1;J=d[e]|0;K=1}L=m+40|0;c[L>>2]=J;M=J>>>1^127;N=m+32|0;c[N>>2]=M;c[m+44>>2]=0;if(K>>>0<f>>>0){O=K+1|0;c[H>>2]=O;P=d[e+K|0]|0;Q=O}else{P=0;Q=K}if(Q>>>0<f>>>0){O=Q+1|0;c[H>>2]=O;R=d[e+Q|0]|0;S=O}else{R=0;S=Q}if(S>>>0<f>>>0){c[H>>2]=S+1|0;T=d[e+S|0]|0}else{T=0}c[G>>2]=33;c[I>>2]=-2147483648;c[L>>2]=T;c[N>>2]=((((P|J<<8)>>>1&255|M<<8)<<8|(R|P<<8)>>>1&255)<<8&2147483392|(T|R<<8)>>>1&255)^16777215;U=D;V=h;W=x;X=e;Y=1;break}}while(0);do{if((F|0)==710){e=c[a+56>>2]|0;if((e|0)!=0){U=E;V=e;W=E;X=0;Y=0;break}e=a+8|0;if(($(c[e>>2]|0,E)|0)>0){Z=0}else{C=E;i=k;return C|0}while(1){b[g+(Z<<1)>>1]=0;x=Z+1|0;if((x|0)<($(c[e>>2]|0,E)|0)){Z=x}else{C=E;break}}i=k;return C|0}}while(0);E=(X|0)==0;Z=(V|0)==1e3;if(Z|E^1){_=W}else{_=(W|0)<(y|0)?W:y}do{if(Y){W=c[a+56>>2]|0;if((W|0)<=0){F=720;break}e=(V|0)==1002;x=(W|0)==1002;do{if(x|e^1){F=719}else{if((c[a+64>>2]|0)==0){break}else{F=719;break}}}while(0);if((F|0)==719){if(e|x^1){F=720;break}}W=$(c[a+8>>2]|0,A);R=e?0:W;T=av()|0;P=i;i=i+((e?W:0)*2&-1)|0;i=i+7>>3<<3;if(!e){aa=1;ab=R;ac=T;ad=P;break}W=(A|0)<(U|0)?A:U;bY(a,0,0,P,W,0);aa=1;ab=R;ac=T;ad=P;break}else{F=720}}while(0);if((F|0)==720){aa=0;ab=0;ac=av()|0;ad=l|0}L1057:do{if((U|0)>(_|0)){ae=-1}else{F=(V|0)!=1002;L1059:do{if(F){P=a+8|0;T=$(c[P>>2]|0,(z|0)>(U|0)?z:U);R=i;i=i+(T*2&-1)|0;i=i+7>>3<<3;if((c[a+56>>2]|0)==1002){b1(t|0,0,4252);c[r+(s+2376|0)>>2]=1;c[t>>2]=65536;c[r+(s+4148|0)>>2]=0;c[r+(s+4152|0)>>2]=3176576;c[r+(s+4168|0)>>2]=0;c[r+(s+4240|0)>>2]=65536;c[r+(s+4244|0)>>2]=65536;c[r+(s+4256|0)>>2]=20;c[r+(s+4252|0)>>2]=2;T=r+(s+4260|0)|0;b1(T|0,0,4252);c[r+(s+6636|0)>>2]=1;c[T>>2]=65536;c[r+(s+8408|0)>>2]=0;c[r+(s+8412|0)>>2]=3176576;c[r+(s+8428|0)>>2]=0;c[r+(s+8500|0)>>2]=65536;c[r+(s+8504|0)>>2]=65536;c[r+(s+8516|0)>>2]=20;c[r+(s+8512|0)>>2]=2;b1(r+(s+8520|0)|0,0,12);c[r+(s+8540|0)>>2]=0}T=(U*1e3&-1|0)/(c[w>>2]|0)&-1;W=a+16|0;c[a+32>>2]=(T|0)<10?10:T;do{if(Y){c[a+20>>2]=c[a+44>>2]|0;if(!Z){c[a+28>>2]=16e3;break}T=c[a+48>>2]|0;if((T|0)==1101){c[a+28>>2]=8e3;break}else if((T|0)==1102){c[a+28>>2]=12e3;break}else{c[a+28>>2]=16e3;break}}}while(0);T=E?1:j<<1;J=(T|0)==0;S=R;Q=0;while(1){L1077:do{if((bB(t,W,T,(Q|0)==0&1,m,S,n)|0)==0){af=c[P>>2]|0}else{if(J){ae=-4;break L1057}c[n>>2]=U;K=c[P>>2]|0;if(($(K,U)|0)>0){ag=0}else{af=K;break}while(1){b[S+(ag<<1)>>1]=0;K=ag+1|0;h=c[P>>2]|0;if((K|0)<($(h,U)|0)){ag=K}else{af=h;break L1077}}}}while(0);h=c[n>>2]|0;K=S+($(af,h)<<1)|0;D=h+Q|0;if((D|0)<(U|0)){S=K;Q=D}else{ah=R;break L1059}}}else{ah=l|0}}while(0);e=(j|0)!=0;do{if(e){ai=f;aj=0;ak=0;al=0}else{if(!F){ai=f;aj=0;ak=0;al=0;break}if(!Y){ai=f;aj=0;ak=0;al=0;break}x=m+20|0;R=c[x>>2]|0;Q=m+28|0;S=c[Q>>2]|0;P=b2(S|0)|-32;if((((R+17|0)+P|0)+(-((c[a+52>>2]|0)==1001&1)&20)|0)>(f<<3|0)){ai=f;aj=0;ak=0;al=0;break}P=(V|0)==1001;J=m+32|0;T=c[J>>2]|0;if(P){W=S>>>12;D=T>>>0<W>>>0;K=D&1;if(D){c[Q>>2]=W;am=T;ao=W}else{h=T-W|0;c[J>>2]=h;M=S-W|0;c[Q>>2]=M;if(M>>>0<8388609){am=h;ao=M}else{ai=f;aj=0;ak=0;al=0;break}}M=m+40|0;h=m+24|0;W=m|0;N=c[m+4>>2]|0;L=R;I=ao;G=c[M>>2]|0;H=c[h>>2]|0;O=am;while(1){ap=L+8|0;c[x>>2]=ap;aq=I<<8;c[Q>>2]=aq;if(H>>>0<N>>>0){ar=H+1|0;c[h>>2]=ar;as=d[(c[W>>2]|0)+H|0]|0;at=ar}else{as=0;at=H}c[M>>2]=as;au=((as|G<<8)>>>1&255|O<<8&2147483392)^255;c[J>>2]=au;if(aq>>>0<8388609){L=ap;I=aq;G=as;H=at;O=au}else{break}}if(D){aw=K;ax=aq;ay=ap;az=au}else{ai=f;aj=0;ak=0;al=0;break}}else{aw=1;ax=S;ay=R;az=T}O=m+32|0;H=ax>>>1;G=az>>>0<H>>>0;I=G&1;if(G){aA=H;aB=az}else{G=az-H|0;c[O>>2]=G;aA=ax-H|0;aB=G}c[Q>>2]=aA;L1106:do{if(aA>>>0<8388609){G=m+40|0;H=m+24|0;L=m|0;J=c[m+4>>2]|0;M=ay;W=aA;h=c[G>>2]|0;N=c[H>>2]|0;ar=aB;while(1){aC=M+8|0;c[x>>2]=aC;aD=W<<8;c[Q>>2]=aD;if(N>>>0<J>>>0){aE=N+1|0;c[H>>2]=aE;aF=d[(c[L>>2]|0)+N|0]|0;aG=aE}else{aF=0;aG=N}c[G>>2]=aF;aE=((aF|h<<8)>>>1&255|ar<<8&2147483392)^255;c[O>>2]=aE;if(aD>>>0<8388609){M=aC;W=aD;h=aF;N=aG;ar=aE}else{aH=aC;aI=aD;break L1106}}}else{aH=ay;aI=aA}}while(0);if(P){O=(a2(m,256)|0)+2|0;aJ=O;aK=c[x>>2]|0;aL=c[Q>>2]|0}else{aJ=f-((aH+7|0)+(b2(aI|0)|-32)>>3)|0;aK=aH;aL=aI}O=f-aJ|0;T=(O<<3|0)<((b2(aL|0)|-32)+aK|0);R=T?0:aJ;S=m+4|0;c[S>>2]=(c[S>>2]|0)-R|0;ai=T?0:O;aj=I;ak=R;al=T?0:aw}}while(0);T=F?17:0;R=c[a+48>>2]|0;if((R|0)==1104){aM=19}else if((R|0)==1101){aM=13}else if((R|0)==1102|(R|0)==1103){aM=17}else{aM=21}a$(v,10012,(u=i,i=i+8|0,c[u>>2]=aM,u)|0);R=c[a+44>>2]|0;a$(v,10008,(u=i,i=i+8|0,c[u>>2]=R,u)|0);R=(al|0)!=0;O=i;i=i+((R?0:ab)*2&-1)|0;i=i+7>>3<<3;S=(aa|0)!=0;K=S&(R^1);if(R|S^1|F^1){aN=ad}else{S=(A|0)<(U|0)?A:U;bY(a,0,0,O,S,0);aN=O}do{if(R){O=$(c[a+8>>2]|0,A);S=i;i=i+(O*2&-1)|0;i=i+7>>3<<3;if((aj|0)==0){aO=S;aP=1;aQ=1;break}a$(v,10010,(u=i,i=i+8|0,c[u>>2]=0,u)|0);O=X+ai|0;aY(v,O,ak,S,A,0);a$(v,4031,(u=i,i=i+8|0,c[u>>2]=o,u)|0);aO=S;aP=0;aQ=0}else{aO=l|0;aP=(aj|0)==0;aQ=1}}while(0);a$(v,10010,(u=i,i=i+8|0,c[u>>2]=T,u)|0);do{if(Z){b[p>>1]=-1;S=a+8|0;L1139:do{if(($(c[S>>2]|0,U)|0)>0){O=0;while(1){b[g+(O<<1)>>1]=0;D=O+1|0;if((D|0)<($(c[S>>2]|0,U)|0)){O=D}else{break L1139}}}}while(0);if((c[a+56>>2]|0)!=1001){aR=0;aS=aQ;break}if(!aQ){if((c[a+64>>2]|0)!=0){aR=0;aS=0;break}}a$(v,10010,(u=i,i=i+8|0,c[u>>2]=0,u)|0);S=p;aY(v,S,2,g,B,0);aR=0;aS=aQ}else{S=(y|0)<(U|0)?y:U;I=c[a+56>>2]|0;do{if((V|0)!=(I|0)&(I|0)>0){if((c[a+64>>2]|0)!=0){break}a$(v,4028,(u=i,i=i+1|0,i=i+7>>3<<3,c[u>>2]=0,u)|0)}}while(0);aR=aY(v,e?0:X,ai,g,S,m)|0;aS=aQ}}while(0);L1148:do{if(F){e=a+8|0;if(($(c[e>>2]|0,U)|0)>0){aT=0}else{break}while(1){T=g+(aT<<1)|0;I=(b[ah+(aT<<1)>>1]|0)+(b[T>>1]|0)|0;if((I|0)>32767){aU=32767}else{aU=(I|0)<-32768?-32768:I&65535}b[T>>1]=aU;T=aT+1|0;if((T|0)<($(c[e>>2]|0,U)|0)){aT=T}else{break L1148}}}}while(0);a$(v,10015,(u=i,i=i+8|0,c[u>>2]=q,u)|0);F=c[(c[q>>2]|0)+52>>2]|0;L1156:do{if(R&aP){a$(v,4028,(u=i,i=i+1|0,i=i+7>>3<<3,c[u>>2]=0,u)|0);a$(v,10010,(u=i,i=i+8|0,c[u>>2]=0,u)|0);e=X+ai|0;aY(v,e,ak,aO,A,0);a$(v,4031,(u=i,i=i+8|0,c[u>>2]=o,u)|0);e=c[a+8>>2]|0;S=$(e,U-B|0);T=$(e,B);I=48e3/(c[w>>2]|0)&-1;if((e|0)<=0){break}Q=(B|0)>0;x=0;while(1){L1161:do{if(Q){P=0;while(1){O=b[F+($(P,I)<<1)>>1]|0;D=$(O,O)>>>15<<16>>16;O=$(P,e)+x|0;ar=$(D,b[aO+(O+T<<1)>>1]|0);N=g+(O+S<<1)|0;b[N>>1]=($(32767-D<<16>>16,b[N>>1]|0)+ar|0)>>>15&65535;ar=P+1|0;if((ar|0)<(B|0)){P=ar}else{break L1161}}}}while(0);P=x+1|0;if((P|0)<(e|0)){x=P}else{break L1156}}}}while(0);L1166:do{if(!aS){x=a+8|0;e=c[x>>2]|0;if((e|0)<=0){break}S=(B|0)>0;T=0;I=e;while(1){L1171:do{if(S){e=0;Q=I;while(1){P=$(Q,e)+T|0;b[g+(P<<1)>>1]=b[aO+(P<<1)>>1]|0;P=e+1|0;ar=c[x>>2]|0;if((P|0)<(B|0)){e=P;Q=ar}else{aV=ar;break L1171}}}else{aV=I}}while(0);Q=T+1|0;if((Q|0)<(aV|0)){T=Q;I=aV}else{break}}I=$(aV,B);T=48e3/(c[w>>2]|0)&-1;if((aV|0)<=0){break}x=(B|0)>0;S=0;while(1){L1179:do{if(x){Q=0;while(1){e=b[F+($(Q,T)<<1)>>1]|0;ar=$(e,e)>>>15<<16>>16;e=($(Q,aV)+S|0)+I|0;P=g+(e<<1)|0;N=$(ar,b[P>>1]|0);b[P>>1]=($(32767-ar<<16>>16,b[aO+(e<<1)>>1]|0)+N|0)>>>15&65535;N=Q+1|0;if((N|0)<(B|0)){Q=N}else{break L1179}}}}while(0);Q=S+1|0;if((Q|0)<(aV|0)){S=Q}else{break L1166}}}}while(0);L1184:do{if(K){S=a+8|0;I=c[S>>2]|0;if((U|0)<(A|0)){T=48e3/(c[w>>2]|0)&-1;if((I|0)<=0){break}x=(B|0)>0;Q=0;while(1){L1191:do{if(x){N=0;while(1){e=b[F+($(N,T)<<1)>>1]|0;ar=$(e,e)>>>15<<16>>16;e=$(N,I)+Q|0;P=g+(e<<1)|0;D=$(ar,b[P>>1]|0);b[P>>1]=($(32767-ar<<16>>16,b[aN+(e<<1)>>1]|0)+D|0)>>>15&65535;D=N+1|0;if((D|0)<(B|0)){N=D}else{break L1191}}}}while(0);N=Q+1|0;if((N|0)<(I|0)){Q=N}else{break L1184}}}Q=$(I,B);L1196:do{if((Q|0)>0){T=0;while(1){b[g+(T<<1)>>1]=b[aN+(T<<1)>>1]|0;x=T+1|0;N=c[S>>2]|0;D=$(N,B);if((x|0)<(D|0)){T=x}else{aW=N;aX=D;break L1196}}}else{aW=I;aX=Q}}while(0);Q=48e3/(c[w>>2]|0)&-1;if((aW|0)<=0){break}I=(B|0)>0;S=0;while(1){L1203:do{if(I){T=0;while(1){D=b[F+($(T,Q)<<1)>>1]|0;N=$(D,D)>>>15<<16>>16;D=($(T,aW)+S|0)+aX|0;x=g+(D<<1)|0;e=$(N,b[x>>1]|0);b[x>>1]=($(32767-N<<16>>16,b[aN+(D<<1)>>1]|0)+e|0)>>>15&65535;e=T+1|0;if((e|0)<(B|0)){T=e}else{break L1203}}}}while(0);T=S+1|0;if((T|0)<(aW|0)){S=T}else{break L1184}}}}while(0);F=c[a+40>>2]|0;L1208:do{if((F|0)!=0){K=(((F<<16>>16)*21771&-1)+16384|0)>>>15;S=K<<16>>26;do{if((S|0)>14){aZ=2130706432}else{if((S|0)<-15){aZ=0;break}Q=K-(S<<10)<<20>>16;I=-2-S|0;T=($(($(((Q*10204&-1)>>>15<<16)+971177984>>16,Q)>>>15<<16)+1494482944>>16,Q)>>>15<<16)+1073676288>>16;if((I|0)>0){aZ=T>>I;break}else{aZ=T<<-I;break}}}while(0);S=a+8|0;if(($(c[S>>2]|0,U)|0)<=0){break}K=aZ>>16;I=aZ<<16>>16;T=0;while(1){Q=g+(T<<1)|0;e=b[Q>>1]|0;D=$(e,K);N=($(e,I)+32768>>16)+D|0;if((N|0)>32767){a_=32767}else{a_=(N|0)<-32767?-32767:N&65535}b[Q>>1]=a_;Q=T+1|0;if((Q|0)<($(c[S>>2]|0,U)|0)){T=Q}else{break L1208}}}}while(0);if((ai|0)<2){c[a+72>>2]=0}else{c[a+72>>2]=c[o>>2]^c[m+28>>2]}c[a+56>>2]=V;c[a+64>>2]=R?aP&1:0;ae=(aR|0)<0?aR:U}}while(0);an(ac|0);C=ae;i=k;return C|0}function bZ(a,d,e,f,h,j){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=i;l=a+8|0;m=$(c[l>>2]|0,h);n=i;i=i+(m*2&-1)|0;i=i+7>>3<<3;m=bX(a,d,e,n,h,j,0,0,0)|0;if((m|0)<=0){i=k;return m|0}if(($(c[l>>2]|0,m)|0)>0){o=0}else{i=k;return m|0}while(1){g[f+(o<<2)>>2]=+(b[n+(o<<1)>>1]|0|0)*30517578125.0e-15;j=o+1|0;if((j|0)<($(c[l>>2]|0,m)|0)){o=j}else{break}}i=k;return m|0}function b_(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ap=0,ar=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[2868]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=11512+(h<<2)|0;j=11512+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[2868]=e&(1<<g^-1)}else{if(l>>>0<(c[2872]|0)>>>0){as();return 0;return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{as();return 0;return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[2870]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=11512+(p<<2)|0;m=11512+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[2868]=e&(1<<r^-1)}else{if(l>>>0<(c[2872]|0)>>>0){as();return 0;return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{as();return 0;return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[2870]|0;if((l|0)!=0){q=c[2873]|0;d=l>>>3;l=d<<1;f=11512+(l<<2)|0;k=c[2868]|0;h=1<<d;do{if((k&h|0)==0){c[2868]=k|h;s=f;t=11512+(l+2<<2)|0}else{d=11512+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[2872]|0)>>>0){s=g;t=d;break}as();return 0;return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[2870]=m;c[2873]=e;n=i;return n|0}l=c[2869]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[11776+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[2872]|0;if(r>>>0<i>>>0){as();return 0;return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){as();return 0;return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L1418:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L1418}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){as();return 0;return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){as();return 0;return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){as();return 0;return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{as();return 0;return 0}}}while(0);L1440:do{if((e|0)!=0){f=d+28|0;i=11776+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[2869]=c[2869]&(1<<c[f>>2]^-1);break L1440}else{if(e>>>0<(c[2872]|0)>>>0){as();return 0;return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L1440}}}while(0);if(v>>>0<(c[2872]|0)>>>0){as();return 0;return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[2870]|0;if((f|0)!=0){e=c[2873]|0;i=f>>>3;f=i<<1;q=11512+(f<<2)|0;k=c[2868]|0;g=1<<i;do{if((k&g|0)==0){c[2868]=k|g;y=q;z=11512+(f+2<<2)|0}else{i=11512+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[2872]|0)>>>0){y=l;z=i;break}as();return 0;return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[2870]=p;c[2873]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[2869]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[11776+(A<<2)>>2]|0;L1248:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L1248}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L1248}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[11776+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L1263:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L1263}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[2870]|0)-g|0)>>>0){o=g;break}k=K;q=c[2872]|0;if(k>>>0<q>>>0){as();return 0;return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){as();return 0;return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L1276:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L1276}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){as();return 0;return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){as();return 0;return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){as();return 0;return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{as();return 0;return 0}}}while(0);L1298:do{if((e|0)!=0){i=K+28|0;q=11776+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[2869]=c[2869]&(1<<c[i>>2]^-1);break L1298}else{if(e>>>0<(c[2872]|0)>>>0){as();return 0;return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L1298}}}while(0);if(L>>>0<(c[2872]|0)>>>0){as();return 0;return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=11512+(e<<2)|0;r=c[2868]|0;j=1<<i;do{if((r&j|0)==0){c[2868]=r|j;O=q;P=11512+(e+2<<2)|0}else{i=11512+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[2872]|0)>>>0){O=d;P=i;break}as();return 0;return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=11776+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[2869]|0;l=1<<Q;if((q&l|0)==0){c[2869]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1005;break}else{l=l<<1;q=j}}if((T|0)==1005){if(S>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[2872]|0;if(q>>>0<i>>>0){as();return 0;return 0}if(j>>>0<i>>>0){as();return 0;return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[2870]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[2873]|0;if(S>>>0>15){R=J;c[2873]=R+o|0;c[2870]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[2870]=0;c[2873]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[2871]|0;if(o>>>0<J>>>0){S=J-o|0;c[2871]=S;J=c[2874]|0;K=J;c[2874]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1224]|0)==0){J=ao(8)|0;if((J-1&J|0)==0){c[1226]=J;c[1225]=J;c[1227]=-1;c[1228]=2097152;c[1229]=0;c[2979]=0;c[1224]=au(0)&-16^1431655768;break}else{as();return 0;return 0}}}while(0);J=o+48|0;S=c[1226]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[2978]|0;do{if((O|0)!=0){P=c[2976]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1507:do{if((c[2979]&4|0)==0){O=c[2874]|0;L1509:do{if((O|0)==0){T=1035}else{L=O;P=11920;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1035;break L1509}else{P=M}}if((P|0)==0){T=1035;break}L=R-(c[2871]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=at(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=1044;break}}while(0);do{if((T|0)==1035){O=at(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1225]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[2976]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[2978]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=at($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=1044;break}}while(0);L1529:do{if((T|0)==1044){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1055;break L1507}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1226]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((at(O|0)|0)==-1){at(q|0);W=Y;break L1529}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1055;break L1507}}}while(0);c[2979]=c[2979]|4;ad=W;T=1052;break}else{ad=0;T=1052}}while(0);do{if((T|0)==1052){if(S>>>0>=2147483647){break}W=at(S|0)|0;Z=at(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=1055;break}}}while(0);do{if((T|0)==1055){ad=(c[2976]|0)+aa|0;c[2976]=ad;if(ad>>>0>(c[2977]|0)>>>0){c[2977]=ad}ad=c[2874]|0;L1549:do{if((ad|0)==0){S=c[2872]|0;if((S|0)==0|ab>>>0<S>>>0){c[2872]=ab}c[2980]=ab;c[2981]=aa;c[2983]=0;c[2877]=c[1224]|0;c[2876]=-1;S=0;while(1){Y=S<<1;ac=11512+(Y<<2)|0;c[11512+(Y+3<<2)>>2]=ac;c[11512+(Y+2<<2)>>2]=ac;ac=S+1|0;if(ac>>>0<32){S=ac}else{break}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[2874]=ab+ae|0;c[2871]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[2875]=c[1228]|0}else{S=11920;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1067;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1067){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[2874]|0;Y=(c[2871]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[2874]=Z+ai|0;c[2871]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[2875]=c[1228]|0;break L1549}}while(0);if(ab>>>0<(c[2872]|0)>>>0){c[2872]=ab}S=ab+aa|0;Y=11920;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1077;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1077){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[2874]|0)){J=(c[2871]|0)+K|0;c[2871]=J;c[2874]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[2873]|0)){J=(c[2870]|0)+K|0;c[2870]=J;c[2873]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1594:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=11512+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[2872]|0)>>>0){as();return 0;return 0}if((c[U+12>>2]|0)==(Z|0)){break}as();return 0;return 0}}while(0);if((Q|0)==(U|0)){c[2868]=c[2868]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[2872]|0)>>>0){as();return 0;return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}as();return 0;return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L1596:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){an=0;break L1596}else{ap=M;ar=e;break}}else{ap=L;ar=g}}while(0);while(1){g=ap+20|0;L=c[g>>2]|0;if((L|0)!=0){ap=L;ar=g;continue}g=ap+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ap=L;ar=g}}if(ar>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[ar>>2]=0;an=ap;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[2872]|0)>>>0){as();return 0;return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){as();return 0;return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;an=P;break}else{as();return 0;return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=11776+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[2869]=c[2869]&(1<<c[P>>2]^-1);break L1594}else{if(q>>>0<(c[2872]|0)>>>0){as();return 0;return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[q+20>>2]=an}if((an|0)==0){break L1594}}}while(0);if(an>>>0<(c[2872]|0)>>>0){as();return 0;return 0}c[an+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);av=ab+(($|al)+aa|0)|0;aw=$+K|0}else{av=Z;aw=K}J=av+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=aw|1;c[ab+(aw+W|0)>>2]=aw;J=aw>>>3;if(aw>>>0<256){V=J<<1;X=11512+(V<<2)|0;P=c[2868]|0;q=1<<J;do{if((P&q|0)==0){c[2868]=P|q;ax=X;ay=11512+(V+2<<2)|0}else{J=11512+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[2872]|0)>>>0){ax=U;ay=J;break}as();return 0;return 0}}while(0);c[ay>>2]=_;c[ax+12>>2]=_;c[ab+(W+8|0)>>2]=ax;c[ab+(W+12|0)>>2]=X;break}V=ac;q=aw>>>8;do{if((q|0)==0){az=0}else{if(aw>>>0>16777215){az=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;az=aw>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=11776+(az<<2)|0;c[ab+(W+28|0)>>2]=az;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[2869]|0;Q=1<<az;if((X&Q|0)==0){c[2869]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((az|0)==31){aA=0}else{aA=25-(az>>>1)|0}Q=aw<<aA;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(aw|0)){break}aB=X+16+(Q>>>31<<2)|0;q=c[aB>>2]|0;if((q|0)==0){T=1150;break}else{Q=Q<<1;X=q}}if((T|0)==1150){if(aB>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[aB>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[2872]|0;if(X>>>0<$>>>0){as();return 0;return 0}if(q>>>0<$>>>0){as();return 0;return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=11920;while(1){aC=c[W>>2]|0;if(aC>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aC+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aC+(aD-39|0)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aC+((aD-47|0)+aF|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=(aa-40|0)-aG|0;c[2874]=ab+aG|0;c[2871]=_;c[ab+(aG+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[2875]=c[1228]|0;c[ac+4>>2]=27;c[W>>2]=c[2980]|0;c[W+4>>2]=c[11924>>2]|0;c[W+8>>2]=c[11928>>2]|0;c[W+12>>2]=c[11932>>2]|0;c[2980]=ab;c[2981]=aa;c[2983]=0;c[2982]=W;W=ac+28|0;c[W>>2]=7;L1713:do{if((ac+32|0)>>>0<aE>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aE>>>0){_=K}else{break L1713}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=11512+(K<<2)|0;S=c[2868]|0;q=1<<_;do{if((S&q|0)==0){c[2868]=S|q;aH=Z;aI=11512+(K+2<<2)|0}else{_=11512+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[2872]|0)>>>0){aH=Q;aI=_;break}as();return 0;return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aJ=0}else{if(W>>>0>16777215){aJ=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aJ=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=11776+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[2869]|0;Q=1<<aJ;if((Z&Q|0)==0){c[2869]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=W<<aK;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aL=Z+16+(Q>>>31<<2)|0;q=c[aL>>2]|0;if((q|0)==0){T=1185;break}else{Q=Q<<1;Z=q}}if((T|0)==1185){if(aL>>>0<(c[2872]|0)>>>0){as();return 0;return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[2872]|0;if(Z>>>0<q>>>0){as();return 0;return 0}if(W>>>0<q>>>0){as();return 0;return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[2871]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[2871]=W;ad=c[2874]|0;Q=ad;c[2874]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[aq()>>2]=12;n=0;return n|0}function b$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[2872]|0;if(b>>>0<e>>>0){as()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){as()}h=f&-8;i=a+(h-8|0)|0;j=i;L1766:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){as()}if((n|0)==(c[2873]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[2870]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=11512+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){as()}if((c[k+12>>2]|0)==(n|0)){break}as()}}while(0);if((s|0)==(k|0)){c[2868]=c[2868]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){as()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}as()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L1800:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L1800}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){as()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){as()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){as()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{as()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=11776+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[2869]=c[2869]&(1<<c[v>>2]^-1);q=n;r=o;break L1766}else{if(p>>>0<(c[2872]|0)>>>0){as()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1766}}}while(0);if(A>>>0<(c[2872]|0)>>>0){as()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[2872]|0)>>>0){as()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[2872]|0)>>>0){as()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){as()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){as()}do{if((e&2|0)==0){if((j|0)==(c[2874]|0)){B=(c[2871]|0)+r|0;c[2871]=B;c[2874]=q;c[q+4>>2]=B|1;if((q|0)==(c[2873]|0)){c[2873]=0;c[2870]=0}if(B>>>0<=(c[2875]|0)>>>0){return}b0(0);return}if((j|0)==(c[2873]|0)){B=(c[2870]|0)+r|0;c[2870]=B;c[2873]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1872:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=11512+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[2872]|0)>>>0){as()}if((c[u+12>>2]|0)==(j|0)){break}as()}}while(0);if((g|0)==(u|0)){c[2868]=c[2868]&(1<<C^-1);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[2872]|0)>>>0){as()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}as()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16|0)>>2]|0;t=c[a+(h|4)>>2]|0;L1893:do{if((t|0)==(b|0)){p=a+(h+12|0)|0;v=c[p>>2]|0;do{if((v|0)==0){m=a+(h+8|0)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break L1893}else{F=k;G=m;break}}else{F=v;G=p}}while(0);while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[2872]|0)>>>0){as()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[2872]|0)>>>0){as()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){as()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{as()}}}while(0);if((f|0)==0){break}t=a+(h+20|0)|0;u=11776+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[2869]=c[2869]&(1<<c[t>>2]^-1);break L1872}else{if(f>>>0<(c[2872]|0)>>>0){as()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1872}}}while(0);if(E>>>0<(c[2872]|0)>>>0){as()}c[E+24>>2]=f;b=c[a+(h+8|0)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[2872]|0)>>>0){as()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12|0)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[2872]|0)>>>0){as()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[2873]|0)){H=B;break}c[2870]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=11512+(d<<2)|0;A=c[2868]|0;E=1<<r;do{if((A&E|0)==0){c[2868]=A|E;I=e;J=11512+(d+2<<2)|0}else{r=11512+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[2872]|0)>>>0){I=h;J=r;break}as()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=(14-(E|J|d)|0)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=11776+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[2869]|0;d=1<<K;do{if((r&d|0)==0){c[2869]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1364;break}else{A=A<<1;J=E}}if((N|0)==1364){if(M>>>0<(c[2872]|0)>>>0){as()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[2872]|0;if(J>>>0<E>>>0){as()}if(B>>>0<E>>>0){as()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[2876]|0)-1|0;c[2876]=q;if((q|0)==0){O=11928}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[2876]=-1;return}function b0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;do{if((c[1224]|0)==0){b=ao(8)|0;if((b-1&b|0)==0){c[1226]=b;c[1225]=b;c[1227]=-1;c[1228]=2097152;c[1229]=0;c[2979]=0;c[1224]=au(0)&-16^1431655768;break}else{as();return 0;return 0}}}while(0);if(a>>>0>=4294967232){d=0;return d|0}b=c[2874]|0;if((b|0)==0){d=0;return d|0}e=c[2871]|0;do{if(e>>>0>(a+40|0)>>>0){f=c[1226]|0;g=$(((((((-40-a|0)-1|0)+e|0)+f|0)>>>0)/(f>>>0)>>>0)-1|0,f);h=b;i=11920;while(1){j=c[i>>2]|0;if(j>>>0<=h>>>0){if((j+(c[i+4>>2]|0)|0)>>>0>h>>>0){k=i;break}}j=c[i+8>>2]|0;if((j|0)==0){k=0;break}else{i=j}}if((c[k+12>>2]&8|0)!=0){break}i=at(0)|0;h=k+4|0;if((i|0)!=((c[k>>2]|0)+(c[h>>2]|0)|0)){break}j=at(-(g>>>0>2147483646?-2147483648-f|0:g)|0)|0;l=at(0)|0;if(!((j|0)!=-1&l>>>0<i>>>0)){break}j=i-l|0;if((i|0)==(l|0)){break}c[h>>2]=(c[h>>2]|0)-j|0;c[2976]=(c[2976]|0)-j|0;h=c[2874]|0;m=(c[2871]|0)-j|0;j=h;n=h+8|0;if((n&7|0)==0){o=0}else{o=-n&7}n=m-o|0;c[2874]=j+o|0;c[2871]=n;c[j+(o+4|0)>>2]=n|1;c[j+(m+4|0)>>2]=40;c[2875]=c[1228]|0;d=(i|0)!=(l|0)&1;return d|0}}while(0);if((c[2871]|0)>>>0<=(c[2875]|0)>>>0){d=0;return d|0}c[2875]=-1;d=0;return d|0}function b1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function b2(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function b3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function b4(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{b3(b,c,d)}}function b5(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function b6(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(D=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function b7(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(D=e,a-c>>>0|0)|0}function b8(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}D=a<<c-32;return 0}function b9(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=0;return b>>>c-32|0}function ca(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=(b|0)<0?-1:0;return b>>c-32|0}function cb(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function cc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=$(d,c);f=a>>>16;a=(e>>>16)+$(d,f)|0;d=b>>>16;b=$(d,c);return(D=((a>>>16)+$(d,f)|0)+(((a&65535)+b|0)>>>16)|0,0|(a+b<<16|e&65535))|0}function cd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=b7(e^a,f^b,e,f)|0;b=D;a=g^e;e=h^f;f=b7(ci(i,b,b7(g^c,h^d,g,h)|0,D,0)^a,D^e,a,e)|0;return(D=D,f)|0}function ce(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=b7(h^a,j^b,h,j)|0;b=D;ci(m,b,b7(k^d,l^e,k,l)|0,D,g);l=b7(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=D;i=f;return(D=j,l)|0}function cf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=cc(e,a)|0;f=D;return(D=($(b,a)+$(d,e)|0)+f|f&0,0|c&-1)|0}function cg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=ci(a,b,c,d,0)|0;return(D=D,e)|0}function ch(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;ci(a,b,d,e,g);i=f;return(D=c[g+4>>2]|0,c[g>>2]|0)|0}function ci(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(D=n,o)|0}else{if(!m){n=0;o=0;return(D=n,o)|0}c[f>>2]=a&-1;c[f+4>>2]=b&0;n=0;o=0;return(D=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(D=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(D=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=0|a&-1;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((cb(l|0)|0)>>>0);return(D=n,o)|0}p=(b2(l|0)|0)-(b2(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}else{if(!m){r=(b2(l|0)|0)-(b2(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=((b2(j|0)|0)+33|0)-(b2(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=0|a&-1;return(D=n,o)|0}else{p=cb(j|0)|0;n=0|i>>>(p>>>0);o=i<<32-p|g>>>(p>>>0)|0;return(D=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;E=u;F=t;G=0;H=0}else{g=0|d&-1;d=k|e&0;e=b6(g,d,-1,-1)|0;k=D;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=0|(u<<1|i>>>31);a=u>>>31|v<<1|0;b7(e,k,j,a);b=D;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=b7(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=D;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;E=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=0|F;c[f+4>>2]=E|0}n=(0|K)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(D=n,o)|0}function cj(a,b){a=a|0;b=b|0;return aw[a&1](b|0)|0}function ck(a){a=a|0;ax[a&1]()}function cl(a,b,c){a=a|0;b=b|0;c=c|0;return ay[a&1](b|0,c|0)|0}function cm(a,b){a=a|0;b=b|0;az[a&1](b|0)}function cn(a){a=a|0;aa(0);return 0}function co(){aa(1)}function cp(a,b){a=a|0;b=b|0;aa(2);return 0}function cq(a){a=a|0;aa(3)}
// EMSCRIPTEN_END_FUNCS
var aw=[cn,cn];var ax=[co,co];var ay=[cp,cp];var az=[cq,cq];return{_strlen:b5,_free:b$,_opus_decoder_create:bV,_memmove:b4,_opus_decode_float:bZ,_memset:b1,_malloc:b_,_memcpy:b3,_llvm_ctlz_i32:b2,stackAlloc:aA,stackSave:aB,stackRestore:aC,setThrew:aD,setTempRet0:aE,setTempRet1:aF,setTempRet2:aG,setTempRet3:aH,setTempRet4:aI,setTempRet5:aJ,setTempRet6:aK,setTempRet7:aL,setTempRet8:aM,setTempRet9:aN,dynCall_ii:cj,dynCall_v:ck,dynCall_iii:cl,dynCall_vi:cm}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "copyTempDouble": copyTempDouble, "copyTempFloat": copyTempFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_llvm_va_end": _llvm_va_end, "_llvm_lifetime_end": _llvm_lifetime_end, "_llvm_stackrestore": _llvm_stackrestore, "_sysconf": _sysconf, "___setErrNo": ___setErrNo, "___errno_location": ___errno_location, "_llvm_lifetime_start": _llvm_lifetime_start, "_abort": _abort, "_sbrk": _sbrk, "_time": _time, "_llvm_stacksave": _llvm_stacksave, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _opus_decoder_create = Module["_opus_decoder_create"] = asm["_opus_decoder_create"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _opus_decode_float = Module["_opus_decode_float"] = asm["_opus_decode_float"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _llvm_ctlz_i32 = Module["_llvm_ctlz_i32"] = asm["_llvm_ctlz_i32"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
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
Module['callMain'] = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
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
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module['callMain'](args);
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
      if (!ABORT) doRun();
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
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
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
            if (String.fromCharCode.apply(String, tag) === "OpusTags") {
                var stream = AV.Stream.fromBuffer(new AV.Buffer(packet));
                stream.advance(8);
                
                var metadata = {};
                var len = stream.readUInt32(true);
                metadata.vendor = stream.readString(len);
                
                var length = stream.readUInt32(true);
                
                for (var i = 0; i < length; i++) {
                    len = stream.readUInt32(true);
                    var str = stream.readString(len, 'utf8'),
                        idx = str.indexOf('=');
                        
                    metadata[str.slice(0, idx).toLowerCase()] = str.slice(idx + 1);
                }
                
                this.emit('metadata', metadata);
            } else {
                this.emit('data', new AV.Buffer(packet));
            }
        }
    });
});