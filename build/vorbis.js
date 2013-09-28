var VorbisDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('vorbis', this);
    AV.Decoder.register('vrbs', this);
    
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
STATICTOP = STATIC_BASE + 57912;
/* memory initializer */ allocate([198,63,120,51,98,136,11,53,151,200,193,53,80,233,61,54,183,247,156,54,46,124,234,54,153,192,35,55,244,2,90,55,56,3,140,55,227,228,174,55,177,166,213,55,108,36,0,56,146,101,23,56,201,150,48,56,18,184,75,56,81,201,104,56,94,229,131,56,29,94,148,56,229,206,165,56,167,55,184,56,128,152,203,56,85,241,223,56,36,66,245,56,126,197,5,57,238,101,17,57,99,130,29,57,207,26,42,57,63,47,55,57,179,191,68,57,30,204,82,57,141,84,97,57,243,88,112,57,94,217,127,57,227,234,135,57,18,39,144,57,64,161,152,57,105,89,161,57,146,79,170,57,181,131,179,57,215,245,188,57,245,165,198,57,14,148,208,57,34,192,218,57,46,42,229,57,57,210,239,57,60,184,250,57,27,238,2,58,22,159,8,58,13,111,14,58,0,94,20,58,239,107,26,58,218,152,32,58,192,228,38,58,161,79,45,58,124,217,51,58,83,130,58,58,37,74,65,58,240,48,72,58,182,54,79,58,116,91,86,58,45,159,93,58,222,1,101,58,136,131,108,58,42,36,116,58,196,227,123,58,44,225,129,58,241,223,133,58,49,238,137,58,238,11,142,58,37,57,146,58,215,117,150,58,5,194,154,58,174,29,159,58,209,136,163,58,110,3,168,58,134,141,172,58,24,39,177,58,36,208,181,58,169,136,186,58,169,80,191,58,33,40,196,58,19,15,201,58,126,5,206,58,98,11,211,58,191,32,216,58,148,69,221,58,225,121,226,58,166,189,231,58,227,16,237,58,152,115,242,58,196,229,247,58,103,103,253,58,65,124,1,59,137,76,4,59,141,36,7,59,76,4,10,59,198,235,12,59,251,218,15,59,235,209,18,59,149,208,21,59,251,214,24,59,26,229,27,59,244,250,30,59,136,24,34,59,215,61,37,59,223,106,40,59,161,159,43,59,29,220,46,59,83,32,50,59,66,108,53,59,234,191,56,59,76,27,60,59,103,126,63,59,59,233,66,59,199,91,70,59,12,214,73,59,10,88,77,59,193,225,80,59,48,115,84,59,86,12,88,59,53,173,91,59,204,85,95,59,26,6,99,59,32,190,102,59,222,125,106,59,82,69,110,59,127,20,114,59,97,235,117,59,251,201,121,59,76,176,125,59,41,207,128,59,8,202,130,59,194,200,132,59,87,203,134,59,198,209,136,59,17,220,138,59,55,234,140,59,55,252,142,59,18,18,145,59,199,43,147,59,87,73,149,59,194,106,151,59,6,144,153,59,37,185,155,59,30,230,157,59,241,22,160,59,158,75,162,59,37,132,164,59,134,192,166,59,192,0,169,59,212,68,171,59,193,140,173,59,137,216,175,59,41,40,178,59,163,123,180,59,245,210,182,59,33,46,185,59,38,141,187,59,4,240,189,59,186,86,192,59,73,193,194,59,177,47,197,59,242,161,199,59,10,24,202,59,251,145,204,59,196,15,207,59,102,145,209,59,223,22,212,59,49,160,214,59,90,45,217,59,91,190,219,59,51,83,222,59,227,235,224,59,107,136,227,59,201,40,230,59,255,204,232,59,12,117,235,59,240,32,238,59,171,208,240,59,61,132,243,59,165,59,246,59,228,246,248,59,250,181,251,59,229,120,254,59,212,159,0,60,32,5,2,60,87,108,3,60,121,213,4,60,134,64,6,60,126,173,7,60,96,28,9,60,45,141,10,60,229,255,11,60,136,116,13,60,21,235,14,60,141,99,16,60,239,221,17,60,59,90,19,60,114,216,20,60,147,88,22,60,158,218,23,60,147,94,25,60,115,228,26,60,60,108,28,60,240,245,29,60,141,129,31,60,20,15,33,60,133,158,34,60,224,47,36,60,36,195,37,60,82,88,39,60,105,239,40,60,106,136,42,60,84,35,44,60,40,192,45,60,229,94,47,60,139,255,48,60,26,162,50,60,146,70,52,60,243,236,53,60,61,149,55,60,112,63,57,60,140,235,58,60,145,153,60,60,126,73,62,60,84,251,63,60,18,175,65,60,185,100,67,60,72,28,69,60,192,213,70,60,31,145,72,60,103,78,74,60,151,13,76,60,175,206,77,60,176,145,79,60,152,86,81,60,103,29,83,60,31,230,84,60,190,176,86,60,69,125,88,60,179,75,90,60,9,28,92,60,71,238,93,60,107,194,95,60,119,152,97,60,106,112,99,60,68,74,101,60,5,38,103,60,173,3,105,60,60,227,106,60,178,196,108,60,14,168,110,60,81,141,112,60,123,116,114,60,139,93,116,60,130,72,118,60,95,53,120,60,34,36,122,60,203,20,124,60,90,7,126,60,208,251,127,60,22,249,128,60,54,245,129,60,74,242,130,60,80,240,131,60,73,239,132,60,53,239,133,60,19,240,134,60,229,241,135,60,169,244,136,60,95,248,137,60,8,253,138,60,164,2,140,60,50,9,141,60,178,16,142,60,37,25,143,60,139,34,144,60,226,44,145,60,44,56,146,60,104,68,147,60,150,81,148,60,182,95,149,60,201,110,150,60,205,126,151,60,196,143,152,60,172,161,153,60,135,180,154,60,83,200,155,60,17,221,156,60,193,242,157,60,98,9,159,60,245,32,160,60,122,57,161,60,241,82,162,60,89,109,163,60,178,136,164,60,253,164,165,60,57,194,166,60,103,224,167,60,134,255,168,60,151,31,170,60,152,64,171,60,139,98,172,60,111,133,173,60,68,169,174,60,10,206,175,60,193,243,176,60,105,26,178,60,2,66,179,60,139,106,180,60,6,148,181,60,113,190,182,60,205,233,183,60,26,22,185,60,87,67,186,60,133,113,187,60,163,160,188,60,177,208,189,60,177,1,191,60,160,51,192,60,128,102,193,60,80,154,194,60,16,207,195,60,193,4,197,60,97,59,198,60,242,114,199,60,114,171,200,60,227,228,201,60,67,31,203,60,147,90,204,60,211,150,205,60,3,212,206,60,34,18,208,60,49,81,209,60,48,145,210,60,30,210,211,60,252,19,213,60,201,86,214,60,133,154,215,60,49,223,216,60,204,36,218,60,86,107,219,60,208,178,220,60,56,251,221,60,144,68,223,60,214,142,224,60,12,218,225,60,48,38,227,60,67,115,228,60,69,193,229,60,54,16,231,60,21,96,232,60,227,176,233,60,160,2,235,60,75,85,236,60,228,168,237,60,108,253,238,60,226,82,240,60,70,169,241,60,153,0,243,60,218,88,244,60,8,178,245,60,37,12,247,60,48,103,248,60,41,195,249,60,15,32,251,60,228,125,252,60,166,220,253,60,85,60,255,60,121,78,0,61,63,255,0,61,123,176,1,61,46,98,2,61,88,20,3,61,248,198,3,61,15,122,4,61,156,45,5,61,161,225,5,61,27,150,6,61,12,75,7,61,116,0,8,61,82,182,8,61,167,108,9,61,113,35,10,61,179,218,10,61,106,146,11,61,152,74,12,61,60,3,13,61,87,188,13,61,231,117,14,61,238,47,15,61,107,234,15,61,94,165,16,61,199,96,17,61,166,28,18,61,251,216,18,61,198,149,19,61,7,83,20,61,190,16,21,61,234,206,21,61,141,141,22,61,165,76,23,61,52,12,24,61,56,204,24,61,177,140,25,61,161,77,26,61,6,15,27,61,224,208,27,61,48,147,28,61,246,85,29,61,49,25,30,61,226,220,30,61,8,161,31,61,164,101,32,61,181,42,33,61,59,240,33,61,55,182,34,61,168,124,35,61,142,67,36,61,233,10,37,61,186,210,37,61,255,154,38,61,186,99,39,61,234,44,40,61,143,246,40,61,168,192,41,61,55,139,42,61,59,86,43,61,180,33,44,61,161,237,44,61,4,186,45,61,219,134,46,61,38,84,47,61,231,33,48,61,28,240,48,61,198,190,49,61,229,141,50,61,120,93,51,61,127,45,52,61,251,253,52,61,236,206,53,61,81,160,54,61,42,114,55,61,120,68,56,61,58,23,57,61,112,234,57,61,27,190,58,61,58,146,59,61,204,102,60,61,211,59,61,61,79,17,62,61,62,231,62,61,161,189,63,61,120,148,64,61,195,107,65,61,130,67,66,61,181,27,67,61,92,244,67,61,118,205,68,61,4,167,69,61,6,129,70,61,124,91,71,61,101,54,72,61,194,17,73,61,146,237,73,61,214,201,74,61,141,166,75,61,184,131,76,61,86,97,77,61,104,63,78,61,236,29,79,61,229,252,79,61,80,220,80,61,46,188,81,61,128,156,82,61,69,125,83,61,125,94,84,61,40,64,85,61,69,34,86,61,214,4,87,61,218,231,87,61,81,203,88,61,58,175,89,61,150,147,90,61,101,120,91,61,167,93,92,61,91,67,93,61,130,41,94,61,28,16,95,61,40,247,95,61,167,222,96,61,152,198,97,61,251,174,98,61,209,151,99,61,25,129,100,61,212,106,101,61,0,85,102,61,159,63,103,61,176,42,104,61,51,22,105,61,41,2,106,61,144,238,106,61,105,219,107,61,180,200,108,61,113,182,109,61,160,164,110,61,65,147,111,61,84,130,112,61,216,113,113,61,206,97,114,61,54,82,115,61,15,67,116,61,89,52,117,61,22,38,118,61,67,24,119,61,226,10,120,61,243,253,120,61,117,241,121,61,104,229,122,61,204,217,123,61,162,206,124,61,232,195,125,61,160,185,126,61,201,175,127,61,49,83,128,61,183,206,128,61,117,74,129,61,107,198,129,61,154,66,130,61,1,191,130,61,160,59,131,61,120,184,131,61,136,53,132,61,209,178,132,61,81,48,133,61,10,174,133,61,251,43,134,61,37,170,134,61,134,40,135,61,32,167,135,61,242,37,136,61,252,164,136,61,62,36,137,61,184,163,137,61,106,35,138,61,84,163,138,61,118,35,139,61,209,163,139,61,99,36,140,61,45,165,140,61,46,38,141,61,104,167,141,61,218,40,142,61,131,170,142,61,100,44,143,61,125,174,143,61,206,48,144,61,86,179,144,61,23,54,145,61,14,185,145,61,62,60,146,61,165,191,146,61,67,67,147,61,26,199,147,61,39,75,148,61,109,207,148,61,234,83,149,61,158,216,149,61,138,93,150,61,173,226,150,61,7,104,151,61,153,237,151,61,98,115,152,61,99,249,152,61,155,127,153,61,10,6,154,61,176,140,154,61,142,19,155,61,163,154,155,61,239,33,156,61,114,169,156,61,44,49,157,61,29,185,157,61,69,65,158,61,165,201,158,61,59,82,159,61,8,219,159,61,13,100,160,61,72,237,160,61,186,118,161,61,99,0,162,61,67,138,162,61,90,20,163,61,167,158,163,61,43,41,164,61,230,179,164,61,216,62,165,61,0,202,165,61,95,85,166,61,245,224,166,61,193,108,167,61,196,248,167,61,254,132,168,61,110,17,169,61,20,158,169,61,241,42,170,61,4,184,170,61,78,69,171,61,206,210,171,61,133,96,172,61,113,238,172,61,149,124,173,61,238,10,174,61,126,153,174,61,67,40,175,61,63,183,175,61,114,70,176,61,218,213,176,61,120,101,177,61,77,245,177,61,88,133,178,61,152,21,179,61,15,166,179,61,187,54,180,61,158,199,180,61,182,88,181,61,4,234,181,61,137,123,182,61,67,13,183,61,50,159,183,61,88,49,184,61,179,195,184,61,68,86,185,61,11,233,185,61,7,124,186,61,57,15,187,61,160,162,187,61,61,54,188,61,16,202,188,61,24,94,189,61,85,242,189,61,200,134,190,61,112,27,191,61,78,176,191,61,97,69,192,61,170,218,192,61,39,112,193,61,218,5,194,61,194,155,194,61,224,49,195,61,50,200,195,61,186,94,196,61,119,245,196,61,104,140,197,61,143,35,198,61,235,186,198,61,124,82,199,61,66,234,199,61,61,130,200,61,108,26,201,61,209,178,201,61,106,75,202,61,57,228,202,61,59,125,203,61,115,22,204,61,224,175,204,61,129,73,205,61,86,227,205,61,97,125,206,61,159,23,207,61,19,178,207,61,187,76,208,61,151,231,208,61,168,130,209,61,237,29,210,61,103,185,210,61,21,85,211,61,248,240,211,61,14,141,212,61,89,41,213,61,216,197,213,61,140,98,214,61,115,255,214,61,143,156,215,61,223,57,216,61,99,215,216,61,27,117,217,61,7,19,218,61,38,177,218,61,122,79,219,61,2,238,219,61,189,140,220,61,173,43,221,61,208,202,221,61,39,106,222,61,178,9,223,61,112,169,223,61,98,73,224,61,136,233,224,61,226,137,225,61,111,42,226,61,47,203,226,61,35,108,227,61,74,13,228,61,165,174,228,61,52,80,229,61,245,241,229,61,234,147,230,61,19,54,231,61,110,216,231,61,253,122,232,61,191,29,233,61,180,192,233,61,221,99,234,61,56,7,235,61,199,170,235,61,136,78,236,61,125,242,236,61,164,150,237,61,255,58,238,61,140,223,238,61,76,132,239,61,63,41,240,61,101,206,240,61,189,115,241,61,73,25,242,61,7,191,242,61,247,100,243,61,26,11,244,61,112,177,244,61,248,87,245,61,179,254,245,61,160,165,246,61,192,76,247,61,18,244,247,61,151,155,248,61,77,67,249,61,55,235,249,61,82,147,250,61,159,59,251,61,31,228,251,61,209,140,252,61,181,53,253,61,203,222,253,61,19,136,254,61,141,49,255,61,57,219,255,61,140,66,0,62,148,151,0,62,181,236,0,62,238,65,1,62,65,151,1,62,173,236,1,62,49,66,2,62,206,151,2,62,132,237,2,62,83,67,3,62,59,153,3,62,59,239,3,62,84,69,4,62,134,155,4,62,209,241,4,62,52,72,5,62,176,158,5,62,68,245,5,62,242,75,6,62,183,162,6,62,150,249,6,62,141,80,7,62,156,167,7,62,196,254,7,62,5,86,8,62,94,173,8,62,207,4,9,62,89,92,9,62,252,179,9,62,183,11,10,62,138,99,10,62,118,187,10,62,122,19,11,62,150,107,11,62,203,195,11,62,24,28,12,62,125,116,12,62,250,204,12,62,144,37,13,62,62,126,13,62,4,215,13,62,227,47,14,62,217,136,14,62,232,225,14,62,15,59,15,62,78,148,15,62,165,237,15,62,20,71,16,62,155,160,16,62,58,250,16,62,241,83,17,62,193,173,17,62,168,7,18,62,167,97,18,62,190,187,18,62,237,21,19,62,51,112,19,62,146,202,19,62,9,37,20,62,151,127,20,62,61,218,20,62,251,52,21,62,209,143,21,62,190,234,21,62,195,69,22,62,224,160,22,62,21,252,22,62,97,87,23,62,197,178,23,62,64,14,24,62,211,105,24,62,126,197,24,62,64,33,25,62,26,125,25,62,11,217,25,62,20,53,26,62,52,145,26,62,108,237,26,62,187,73,27,62,34,166,27,62,160,2,28,62,53,95,28,62,226,187,28,62,166,24,29,62,129,117,29,62,116,210,29,62,126,47,30,62,159,140,30,62,215,233,30,62,39,71,31,62,141,164,31,62,11,2,32,62,160,95,32,62,76,189,32,62,16,27,33,62,234,120,33,62,219,214,33,62,228,52,34,62,3,147,34,62,58,241,34,62,135,79,35,62,235,173,35,62,103,12,36,62,249,106,36,62,162,201,36,62,98,40,37,62,56,135,37,62,38,230,37,62,42,69,38,62,69,164,38,62,119,3,39,62,192,98,39,62,31,194,39,62,149,33,40,62,33,129,40,62,197,224,40,62,126,64,41,62,79,160,41,62,54,0,42,62,51,96,42,62,72,192,42,62,114,32,43,62,179,128,43,62,11,225,43,62,121,65,44,62,253,161,44,62,152,2,45,62,73,99,45,62,16,196,45,62,238,36,46,62,226,133,46,62,237,230,46,62,13,72,47,62,68,169,47,62,145,10,48,62,245,107,48,62,110,205,48,62,254,46,49,62,163,144,49,62,95,242,49,62,49,84,50,62,25,182,50,62,23,24,51,62,43,122,51,62,85,220,51,62,148,62,52,62,234,160,52,62,86,3,53,62,216,101,53,62,111,200,53,62,28,43,54,62,223,141,54,62,184,240,54,62,167,83,55,62,171,182,55,62,197,25,56,62,245,124,56,62,59,224,56,62,150,67,57,62,7,167,57,62,141,10,58,62,41,110,58,62,219,209,58,62,162,53,59,62,126,153,59,62,112,253,59,62,120,97,60,62,149,197,60,62,199,41,61,62,15,142,61,62,108,242,61,62,222,86,62,62,102,187,62,62,3,32,63,62,181,132,63,62,125,233,63,62,90,78,64,62,75,179,64,62,83,24,65,62,111,125,65,62,160,226,65,62,231,71,66,62,66,173,66,62,179,18,67,62,57,120,67,62,211,221,67,62,131,67,68,62,71,169,68,62,33,15,69,62,15,117,69,62,18,219,69,62,42,65,70,62,87,167,70,62,153,13,71,62,240,115,71,62,91,218,71,62,219,64,72,62,111,167,72,62,25,14,73,62,215,116,73,62,169,219,73,62,144,66,74,62,140,169,74,62,157,16,75,62,193,119,75,62,251,222,75,62,73,70,76,62,171,173,76,62,34,21,77,62,173,124,77,62,76,228,77,62,0,76,78,62,200,179,78,62,164,27,79,62,149,131,79,62,154,235,79,62,179,83,80,62,225,187,80,62,34,36,81,62,120,140,81,62,225,244,81,62,95,93,82,62,241,197,82,62,151,46,83,62,81,151,83,62,31,0,84,62,1,105,84,62,247,209,84,62,0,59,85,62,30,164,85,62,79,13,86,62,149,118,86,62,238,223,86,62,91,73,87,62,219,178,87,62,112,28,88,62,24,134,88,62,211,239,88,62,163,89,89,62,134,195,89,62,124,45,90,62,134,151,90,62,164,1,91,62,213,107,91,62,26,214,91,62,114,64,92,62,221,170,92,62,92,21,93,62,239,127,93,62,148,234,93,62,77,85,94,62,26,192,94,62,249,42,95,62,236,149,95,62,242,0,96,62,11,108,96,62,55,215,96,62,119,66,97,62,202,173,97,62,47,25,98,62,168,132,98,62,52,240,98,62,210,91,99,62,132,199,99,62,73,51,100,62,32,159,100,62,11,11,101,62,8,119,101,62,24,227,101,62,59,79,102,62,113,187,102,62,186,39,103,62,21,148,103,62,131,0,104,62,3,109,104,62,151,217,104,62,60,70,105,62,245,178,105,62,192,31,106,62,157,140,106,62,141,249,106,62,144,102,107,62,165,211,107,62,204,64,108,62,6,174,108,62,82,27,109,62,176,136,109,62,33,246,109,62,164,99,110,62,57,209,110,62,225,62,111,62,154,172,111,62,102,26,112,62,68,136,112,62,52,246,112,62,55,100,113,62,75,210,113,62,113,64,114,62,169,174,114,62,243,28,115,62,80,139,115,62,190,249,115,62,61,104,116,62,207,214,116,62,115,69,117,62,40,180,117,62,239,34,118,62,200,145,118,62,179,0,119,62,175,111,119,62,189,222,119,62,221,77,120,62,14,189,120,62,80,44,121,62,165,155,121,62,10,11,122,62,130,122,122,62,10,234,122,62,164,89,123,62,80,201,123,62,13,57,124,62,219,168,124,62,186,24,125,62,171,136,125,62,173,248,125,62,192,104,126,62,228,216,126,62,26,73,127,62,96,185,127,62,220,20,128,62,16,77,128,62,77,133,128,62,147,189,128,62,225,245,128,62,55,46,129,62,150,102,129,62,253,158,129,62,109,215,129,62,229,15,130,62,102,72,130,62,238,128,130,62,128,185,130,62,25,242,130,62,187,42,131,62,102,99,131,62,24,156,131,62,211,212,131,62,150,13,132,62,98,70,132,62,53,127,132,62,17,184,132,62,245,240,132,62,226,41,133,62,214,98,133,62,211,155,133,62,216,212,133,62,229,13,134,62,250,70,134,62,23,128,134,62,61,185,134,62,106,242,134,62,160,43,135,62,221,100,135,62,35,158,135,62,112,215,135,62,198,16,136,62,35,74,136,62,137,131,136,62,247,188,136,62,108,246,136,62,233,47,137,62,111,105,137,62,252,162,137,62,145,220,137,62,46,22,138,62,211,79,138,62,127,137,138,62,52,195,138,62,240,252,138,62,180,54,139,62,128,112,139,62,84,170,139,62,47,228,139,62,18,30,140,62,253,87,140,62,239,145,140,62,233,203,140,62,235,5,141,62,245,63,141,62,6,122,141,62,31,180,141,62,63,238,141,62,103,40,142,62,150,98,142,62,205,156,142,62,12,215,142,62,82,17,143,62,159,75,143,62,245,133,143,62,81,192,143,62,181,250,143,62,33,53,144,62,147,111,144,62,14,170,144,62,143,228,144,62,25,31,145,62,169,89,145,62,65,148,145,62,224,206,145,62,134,9,146,62,52,68,146,62,233,126,146,62,165,185,146,62,105,244,146,62,52,47,147,62,6,106,147,62,223,164,147,62,191,223,147,62,167,26,148,62,150,85,148,62,139,144,148,62,136,203,148,62,140,6,149,62,152,65,149,62,170,124,149,62,195,183,149,62,227,242,149,62,11,46,150,62,57,105,150,62,111,164,150,62,171,223,150,62,238,26,151,62,56,86,151,62,138,145,151,62,226,204,151,62,65,8,152,62,167,67,152,62,19,127,152,62,135,186,152,62,1,246,152,62,130,49,153,62,10,109,153,62,153,168,153,62,47,228,153,62,203,31,154,62,110,91,154,62,24,151,154,62,200,210,154,62,127,14,155,62,61,74,155,62,2,134,155,62,205,193,155,62,158,253,155,62,119,57,156,62,85,117,156,62,59,177,156,62,39,237,156,62,25,41,157,62,18,101,157,62,18,161,157,62,24,221,157,62,36,25,158,62,55,85,158,62,80,145,158,62,112,205,158,62,150,9,159,62,195,69,159,62,246,129,159,62,47,190,159,62,111,250,159,62,180,54,160,62,1,115,160,62,83,175,160,62,172,235,160,62,11,40,161,62,112,100,161,62,219,160,161,62,77,221,161,62,196,25,162,62,66,86,162,62,198,146,162,62,81,207,162,62,225,11,163,62,119,72,163,62,20,133,163,62,182,193,163,62,95,254,163,62,13,59,164,62,194,119,164,62,125,180,164,62,61,241,164,62,4,46,165,62,208,106,165,62,162,167,165,62,123,228,165,62,89,33,166,62,61,94,166,62,39,155,166,62,23,216,166,62,12,21,167,62,7,82,167,62,8,143,167,62,15,204,167,62,28,9,168,62,46,70,168,62,70,131,168,62,100,192,168,62,136,253,168,62,177,58,169,62,223,119,169,62,20,181,169,62,78,242,169,62,141,47,170,62,211,108,170,62,29,170,170,62,109,231,170,62,195,36,171,62,31,98,171,62,127,159,171,62,230,220,171,62,81,26,172,62,194,87,172,62,57,149,172,62,181,210,172,62,54,16,173,62,189,77,173,62,73,139,173,62,218,200,173,62,113,6,174,62,13,68,174,62,174,129,174,62,85,191,174,62,0,253,174,62,177,58,175,62,103,120,175,62,35,182,175,62,227,243,175,62,169,49,176,62,116,111,176,62,68,173,176,62,25,235,176,62,243,40,177,62,210,102,177,62,182,164,177,62,160,226,177,62,142,32,178,62,129,94,178,62,121,156,178,62,119,218,178,62,121,24,179,62,128,86,179,62,140,148,179,62,157,210,179,62,178,16,180,62,205,78,180,62,236,140,180,62,16,203,180,62,57,9,181,62,103,71,181,62,154,133,181,62,209,195,181,62,13,2,182,62,78,64,182,62,147,126,182,62,221,188,182,62,44,251,182,62,127,57,183,62,215,119,183,62,52,182,183,62,149,244,183,62,251,50,184,62,101,113,184,62,212,175,184,62,71,238,184,62,191,44,185,62,59,107,185,62,188,169,185,62,65,232,185,62,202,38,186,62,88,101,186,62,235,163,186,62,129,226,186,62,28,33,187,62,188,95,187,62,95,158,187,62,7,221,187,62,180,27,188,62,100,90,188,62,25,153,188,62,210,215,188,62,143,22,189,62,80,85,189,62,22,148,189,62,223,210,189,62,173,17,190,62,127,80,190,62,85,143,190,62,47,206,190,62,13,13,191,62,239,75,191,62,213,138,191,62,191,201,191,62,173,8,192,62,159,71,192,62,149,134,192,62,143,197,192,62,141,4,193,62,143,67,193,62,148,130,193,62,158,193,193,62,171,0,194,62,188,63,194,62,209,126,194,62,234,189,194,62,6,253,194,62,38,60,195,62,74,123,195,62,113,186,195,62,157,249,195,62,204,56,196,62,254,119,196,62,52,183,196,62,110,246,196,62,171,53,197,62,236,116,197,62,49,180,197,62,121,243,197,62,196,50,198,62,19,114,198,62,102,177,198,62,188,240,198,62,21,48,199,62,114,111,199,62,210,174,199,62,54,238,199,62,157,45,200,62,7,109,200,62,117,172,200,62,230,235,200,62,90,43,201,62,209,106,201,62,76,170,201,62,202,233,201,62,75,41,202,62,208,104,202,62,88,168,202,62,226,231,202,62,112,39,203,62,1,103,203,62,149,166,203,62,45,230,203,62,199,37,204,62,100,101,204,62,4,165,204,62,168,228,204,62,78,36,205,62,248,99,205,62,164,163,205,62,83,227,205,62,5,35,206,62,186,98,206,62,114,162,206,62,45,226,206,62,234,33,207,62,171,97,207,62,110,161,207,62,52,225,207,62,253,32,208,62,200,96,208,62,150,160,208,62,103,224,208,62,59,32,209,62,17,96,209,62,234,159,209,62,198,223,209,62,164,31,210,62,133,95,210,62,104,159,210,62,78,223,210,62,55,31,211,62,33,95,211,62,15,159,211,62,255,222,211,62,241,30,212,62,230,94,212,62,221,158,212,62,215,222,212,62,211,30,213,62,209,94,213,62,210,158,213,62,213,222,213,62,219,30,214,62,226,94,214,62,236,158,214,62,248,222,214,62,7,31,215,62,24,95,215,62,42,159,215,62,63,223,215,62,87,31,216,62,112,95,216,62,139,159,216,62,169,223,216,62,200,31,217,62,234,95,217,62,14,160,217,62,51,224,217,62,91,32,218,62,133,96,218,62,176,160,218,62,222,224,218,62,13,33,219,62,63,97,219,62,114,161,219,62,167,225,219,62,222,33,220,62,23,98,220,62,82,162,220,62,142,226,220,62,204,34,221,62,12,99,221,62,78,163,221,62,146,227,221,62,215,35,222,62,29,100,222,62,102,164,222,62,176,228,222,62,252,36,223,62,73,101,223,62,152,165,223,62,232,229,223,62,58,38,224,62,142,102,224,62,227,166,224,62,57,231,224,62,145,39,225,62,234,103,225,62,69,168,225,62,161,232,225,62,255,40,226,62,94,105,226,62,190,169,226,62,32,234,226,62,131,42,227,62,231,106,227,62,76,171,227,62,179,235,227,62,27,44,228,62,132,108,228,62,238,172,228,62,90,237,228,62,199,45,229,62,52,110,229,62,163,174,229,62,19,239,229,62,133,47,230,62,247,111,230,62,106,176,230,62,222,240,230,62,83,49,231,62,202,113,231,62,65,178,231,62,185,242,231,62,50,51,232,62,172,115,232,62,38,180,232,62,162,244,232,62,31,53,233,62,156,117,233,62,26,182,233,62,153,246,233,62,25,55,234,62,153,119,234,62,26,184,234,62,156,248,234,62,31,57,235,62,162,121,235,62,38,186,235,62,170,250,235,62,47,59,236,62,181,123,236,62,59,188,236,62,194,252,236,62,73,61,237,62,209,125,237,62,89,190,237,62,226,254,237,62,107,63,238,62,245,127,238,62,127,192,238,62,10,1,239,62,149,65,239,62,32,130,239,62,171,194,239,62,55,3,240,62,196,67,240,62,80,132,240,62,221,196,240,62,106,5,241,62,247,69,241,62,132,134,241,62,18,199,241,62,160,7,242,62,45,72,242,62,187,136,242,62,74,201,242,62,216,9,243,62,102,74,243,62,244,138,243,62,131,203,243,62,17,12,244,62,159,76,244,62,46,141,244,62,188,205,244,62,74,14,245,62,216,78,245,62,102,143,245,62,244,207,245,62,129,16,246,62,15,81,246,62,156,145,246,62,41,210,246,62,182,18,247,62,67,83,247,62,207,147,247,62,91,212,247,62,231,20,248,62,115,85,248,62,254,149,248,62,136,214,248,62,19,23,249,62,157,87,249,62,38,152,249,62,175,216,249,62,56,25,250,62,192,89,250,62,72,154,250,62,207,218,250,62,86,27,251,62,220,91,251,62,97,156,251,62,230,220,251,62,106,29,252,62,238,93,252,62,113,158,252,62,243,222,252,62,117,31,253,62,245,95,253,62,118,160,253,62,245,224,253,62,116,33,254,62,241,97,254,62,110,162,254,62,235,226,254,62,102,35,255,62,224,99,255,62,90,164,255,62,211,228,255,62,165,18,0,63,225,50,0,63,27,83,0,63,86,115,0,63,144,147,0,63,201,179,0,63,2,212,0,63,58,244,0,63,114,20,1,63,169,52,1,63,224,84,1,63,22,117,1,63,76,149,1,63,129,181,1,63,181,213,1,63,233,245,1,63,28,22,2,63,78,54,2,63,128,86,2,63,178,118,2,63,226,150,2,63,18,183,2,63,65,215,2,63,112,247,2,63,157,23,3,63,203,55,3,63,247,87,3,63,35,120,3,63,78,152,3,63,120,184,3,63,161,216,3,63,202,248,3,63,242,24,4,63,25,57,4,63,63,89,4,63,101,121,4,63,137,153,4,63,173,185,4,63,208,217,4,63,243,249,4,63,20,26,5,63,52,58,5,63,84,90,5,63,115,122,5,63,145,154,5,63,173,186,5,63,202,218,5,63,229,250,5,63,255,26,6,63,24,59,6,63,48,91,6,63,72,123,6,63,94,155,6,63,116,187,6,63,136,219,6,63,155,251,6,63,174,27,7,63,191,59,7,63,208,91,7,63,223,123,7,63,237,155,7,63,250,187,7,63,7,220,7,63,18,252,7,63,28,28,8,63,37,60,8,63,44,92,8,63,51,124,8,63,57,156,8,63,61,188,8,63,64,220,8,63,67,252,8,63,68,28,9,63,68,60,9,63,66,92,9,63,64,124,9,63,60,156,9,63,55,188,9,63,49,220,9,63,41,252,9,63,33,28,10,63,23,60,10,63,12,92,10,63,255,123,10,63,242,155,10,63,227,187,10,63,211,219,10,63,193,251,10,63,174,27,11,63,154,59,11,63,133,91,11,63,110,123,11,63,86,155,11,63,60,187,11,63,33,219,11,63,5,251,11,63,231,26,12,63,200,58,12,63,168,90,12,63,134,122,12,63,98,154,12,63,62,186,12,63,23,218,12,63,240,249,12,63,199,25,13,63,156,57,13,63,112,89,13,63,66,121,13,63,19,153,13,63,227,184,13,63,176,216,13,63,125,248,13,63,72,24,14,63,17,56,14,63,216,87,14,63,159,119,14,63,99,151,14,63,38,183,14,63,232,214,14,63,167,246,14,63,101,22,15,63,34,54,15,63,221,85,15,63,150,117,15,63,78,149,15,63,4,181,15,63,184,212,15,63,106,244,15,63,27,20,16,63,202,51,16,63,120,83,16,63,36,115,16,63,206,146,16,63,118,178,16,63,28,210,16,63,193,241,16,63,100,17,17,63,6,49,17,63,165,80,17,63,67,112,17,63,223,143,17,63,121,175,17,63,17,207,17,63,167,238,17,63,60,14,18,63,206,45,18,63,95,77,18,63,238,108,18,63,123,140,18,63,7,172,18,63,144,203,18,63,23,235,18,63,157,10,19,63,32,42,19,63,162,73,19,63,34,105,19,63,159,136,19,63,27,168,19,63,149,199,19,63,13,231,19,63,131,6,20,63,247,37,20,63,104,69,20,63,216,100,20,63,70,132,20,63,178,163,20,63,27,195,20,63,131,226,20,63,233,1,21,63,76,33,21,63,174,64,21,63,13,96,21,63,106,127,21,63,197,158,21,63,31,190,21,63,117,221,21,63,202,252,21,63,29,28,22,63,109,59,22,63,188,90,22,63,8,122,22,63,82,153,22,63,153,184,22,63,223,215,22,63,34,247,22,63,100,22,23,63,162,53,23,63,223,84,23,63,26,116,23,63,82,147,23,63,136,178,23,63,187,209,23,63,237,240,23,63,28,16,24,63,73,47,24,63,115,78,24,63,155,109,24,63,193,140,24,63,228,171,24,63,6,203,24,63,36,234,24,63,65,9,25,63,91,40,25,63,115,71,25,63,136,102,25,63,155,133,25,63,171,164,25,63,185,195,25,63,197,226,25,63,206,1,26,63,213,32,26,63,217,63,26,63,219,94,26,63,218,125,26,63,215,156,26,63,210,187,26,63,202,218,26,63,191,249,26,63,178,24,27,63,162,55,27,63,144,86,27,63,123,117,27,63,100,148,27,63,74,179,27,63,46,210,27,63,15,241,27,63,237,15,28,63,201,46,28,63,162,77,28,63,121,108,28,63,77,139,28,63,31,170,28,63,237,200,28,63,185,231,28,63,131,6,29,63,74,37,29,63,14,68,29,63,207,98,29,63,142,129,29,63,74,160,29,63,3,191,29,63,186,221,29,63,110,252,29,63,31,27,30,63,205,57,30,63,121,88,30,63,34,119,30,63,200,149,30,63,107,180,30,63,12,211,30,63,170,241,30,63,69,16,31,63,221,46,31,63,114,77,31,63,5,108,31,63,148,138,31,63,33,169,31,63,171,199,31,63,50,230,31,63,182,4,32,63,56,35,32,63,182,65,32,63,50,96,32,63,170,126,32,63,32,157,32,63,147,187,32,63,3,218,32,63,112,248,32,63,218,22,33,63,65,53,33,63,165,83,33,63,6,114,33,63,100,144,33,63,191,174,33,63,23,205,33,63,108,235,33,63,190,9,34,63,13,40,34,63,89,70,34,63,162,100,34,63,232,130,34,63,43,161,34,63,107,191,34,63,167,221,34,63,225,251,34,63,24,26,35,63,75,56,35,63,123,86,35,63,168,116,35,63,211,146,35,63,249,176,35,63,29,207,35,63,62,237,35,63,91,11,36,63,118,41,36,63,141,71,36,63,161,101,36,63,177,131,36,63,191,161,36,63,201,191,36,63,208,221,36,63,212,251,36,63,213,25,37,63,210,55,37,63,204,85,37,63,195,115,37,63,183,145,37,63,167,175,37,63,148,205,37,63,126,235,37,63,101,9,38,63,72,39,38,63,40,69,38,63,4,99,38,63,221,128,38,63,179,158,38,63,134,188,38,63,85,218,38,63,33,248,38,63,233,21,39,63,174,51,39,63,112,81,39,63,46,111,39,63,233,140,39,63,160,170,39,63,84,200,39,63,4,230,39,63,178,3,40,63,91,33,40,63,1,63,40,63,164,92,40,63,67,122,40,63,223,151,40,63,120,181,40,63,12,211,40,63,158,240,40,63,43,14,41,63,182,43,41,63,60,73,41,63,192,102,41,63,63,132,41,63,187,161,41,63,52,191,41,63,169,220,41,63,26,250,41,63,136,23,42,63,242,52,42,63,89,82,42,63,188,111,42,63,28,141,42,63,119,170,42,63,208,199,42,63,36,229,42,63,117,2,43,63,194,31,43,63,12,61,43,63,82,90,43,63,148,119,43,63,211,148,43,63,14,178,43,63,69,207,43,63,120,236,43,63,168,9,44,63,212,38,44,63,252,67,44,63,33,97,44,63,66,126,44,63,95,155,44,63,120,184,44,63,142,213,44,63,159,242,44,63,173,15,45,63,184,44,45,63,190,73,45,63,193,102,45,63,191,131,45,63,186,160,45,63,177,189,45,63,165,218,45,63,148,247,45,63,128,20,46,63,103,49,46,63,75,78,46,63,43,107,46,63,7,136,46,63,224,164,46,63,180,193,46,63,132,222,46,63,81,251,46,63,26,24,47,63,222,52,47,63,159,81,47,63,92,110,47,63,21,139,47,63,202,167,47,63,123,196,47,63,40,225,47,63,209,253,47,63,118,26,48,63,23,55,48,63,180,83,48,63,77,112,48,63,226,140,48,63,115,169,48,63,0,198,48,63,137,226,48,63,14,255,48,63,142,27,49,63,11,56,49,63,132,84,49,63,248,112,49,63,105,141,49,63,214,169,49,63,62,198,49,63,162,226,49,63,2,255,49,63,95,27,50,63,182,55,50,63,10,84,50,63,90,112,50,63,166,140,50,63,237,168,50,63,48,197,50,63,111,225,50,63,170,253,50,63,225,25,51,63,19,54,51,63,66,82,51,63,108,110,51,63,146,138,51,63,180,166,51,63,209,194,51,63,234,222,51,63,0,251,51,63,16,23,52,63,29,51,52,63,37,79,52,63,41,107,52,63,41,135,52,63,37,163,52,63,28,191,52,63,15,219,52,63,253,246,52,63,232,18,53,63,206,46,53,63,176,74,53,63,141,102,53,63,102,130,53,63,59,158,53,63,11,186,53,63,215,213,53,63,159,241,53,63,98,13,54,63,33,41,54,63,220,68,54,63,146,96,54,63,68,124,54,63,241,151,54,63,154,179,54,63,63,207,54,63,223,234,54,63,123,6,55,63,18,34,55,63,165,61,55,63,52,89,55,63,190,116,55,63,67,144,55,63,196,171,55,63,65,199,55,63,185,226,55,63,45,254,55,63,156,25,56,63,7,53,56,63,109,80,56,63,207,107,56,63,44,135,56,63,133,162,56,63,217,189,56,63,40,217,56,63,115,244,56,63,186,15,57,63,252,42,57,63,57,70,57,63,114,97,57,63,166,124,57,63,214,151,57,63,1,179,57,63,40,206,57,63,74,233,57,63,103,4,58,63,128,31,58,63,148,58,58,63,163,85,58,63,174,112,58,63,180,139,58,63,182,166,58,63,179,193,58,63,171,220,58,63,159,247,58,63,142,18,59,63,120,45,59,63,94,72,59,63,63,99,59,63,27,126,59,63,243,152,59,63,197,179,59,63,148,206,59,63,93,233,59,63,34,4,60,63,226,30,60,63,157,57,60,63,84,84,60,63,5,111,60,63,178,137,60,63,91,164,60,63,254,190,60,63,157,217,60,63,55,244,60,63,204,14,61,63,93,41,61,63,232,67,61,63,111,94,61,63,241,120,61,63,110,147,61,63,231,173,61,63,91,200,61,63,201,226,61,63,51,253,61,63,152,23,62,63,249,49,62,63,84,76,62,63,171,102,62,63,252,128,62,63,73,155,62,63,145,181,62,63,212,207,62,63,19,234,62,63,76,4,63,63,128,30,63,63,176,56,63,63,219,82,63,63,0,109,63,63,33,135,63,63,61,161,63,63,84,187,63,63,102,213,63,63,115,239,63,63,123,9,64,63,127,35,64,63,125,61,64,63,118,87,64,63,106,113,64,63,90,139,64,63,68,165,64,63,42,191,64,63,10,217,64,63,229,242,64,63,188,12,65,63,141,38,65,63,90,64,65,63,33,90,65,63,228,115,65,63,161,141,65,63,89,167,65,63,13,193,65,63,187,218,65,63,100,244,65,63,8,14,66,63,167,39,66,63,65,65,66,63,214,90,66,63,102,116,66,63,241,141,66,63,119,167,66,63,248,192,66,63,115,218,66,63,234,243,66,63,91,13,67,63,199,38,67,63,47,64,67,63,145,89,67,63,238,114,67,63,69,140,67,63,152,165,67,63,230,190,67,63,46,216,67,63,113,241,67,63,175,10,68,63,232,35,68,63,28,61,68,63,75,86,68,63,116,111,68,63,153,136,68,63,184,161,68,63,210,186,68,63,230,211,68,63,246,236,68,63,0,6,69,63,5,31,69,63,5,56,69,63,0,81,69,63,245,105,69,63,230,130,69,63,209,155,69,63,182,180,69,63,151,205,69,63,114,230,69,63,72,255,69,63,25,24,70,63,229,48,70,63,171,73,70,63,108,98,70,63,40,123,70,63,222,147,70,63,143,172,70,63,59,197,70,63,226,221,70,63,131,246,70,63,31,15,71,63,182,39,71,63,71,64,71,63,211,88,71,63,90,113,71,63,220,137,71,63,88,162,71,63,207,186,71,63,64,211,71,63,172,235,71,63,19,4,72,63,116,28,72,63,209,52,72,63,39,77,72,63,121,101,72,63,197,125,72,63,11,150,72,63,77,174,72,63,137,198,72,63,191,222,72,63,240,246,72,63,28,15,73,63,66,39,73,63,99,63,73,63,127,87,73,63,149,111,73,63,166,135,73,63,177,159,73,63,183,183,73,63,183,207,73,63,178,231,73,63,168,255,73,63,152,23,74,63,131,47,74,63,104,71,74,63,72,95,74,63,34,119,74,63,247,142,74,63,199,166,74,63,145,190,74,63,85,214,74,63,20,238,74,63,206,5,75,63,130,29,75,63,49,53,75,63,218,76,75,63,126,100,75,63,28,124,75,63,181,147,75,63,72,171,75,63,213,194,75,63,93,218,75,63,224,241,75,63,93,9,76,63,213,32,76,63,71,56,76,63,179,79,76,63,26,103,76,63,124,126,76,63,216,149,76,63,46,173,76,63,127,196,76,63,202,219,76,63,16,243,76,63,80,10,77,63,139,33,77,63,192,56,77,63,240,79,77,63,26,103,77,63,62,126,77,63,93,149,77,63,118,172,77,63,137,195,77,63,151,218,77,63,160,241,77,63,163,8,78,63,160,31,78,63,151,54,78,63,137,77,78,63,118,100,78,63,93,123,78,63,62,146,78,63,25,169,78,63,239,191,78,63,192,214,78,63,138,237,78,63,79,4,79,63,15,27,79,63,201,49,79,63,125,72,79,63,43,95,79,63,212,117,79,63,119,140,79,63,21,163,79,63,172,185,79,63,63,208,79,63,203,230,79,63,82,253,79,63,211,19,80,63,79,42,80,63,197,64,80,63,53,87,80,63,159,109,80,63,4,132,80,63,99,154,80,63,189,176,80,63,16,199,80,63,94,221,80,63,167,243,80,63,233,9,81,63,38,32,81,63,93,54,81,63,143,76,81,63,187,98,81,63,225,120,81,63,1,143,81,63,28,165,81,63,48,187,81,63,64,209,81,63,73,231,81,63,77,253,81,63,75,19,82,63,67,41,82,63,53,63,82,63,34,85,82,63,9,107,82,63,234,128,82,63,198,150,82,63,155,172,82,63,107,194,82,63,53,216,82,63,250,237,82,63,185,3,83,63,113,25,83,63,37,47,83,63,210,68,83,63,121,90,83,63,27,112,83,63,183,133,83,63,77,155,83,63,222,176,83,63,104,198,83,63,237,219,83,63,108,241,83,63,230,6,84,63,89,28,84,63,199,49,84,63,46,71,84,63,145,92,84,63,237,113,84,63,67,135,84,63,148,156,84,63,223,177,84,63,35,199,84,63,99,220,84,63,156,241,84,63,207,6,85,63,253,27,85,63,37,49,85,63,71,70,85,63,99,91,85,63,121,112,85,63,138,133,85,63,149,154,85,63,153,175,85,63,152,196,85,63,146,217,85,63,133,238,85,63,114,3,86,63,90,24,86,63,60,45,86,63,24,66,86,63,238,86,86,63,190,107,86,63,136,128,86,63,76,149,86,63,11,170,86,63,196,190,86,63,118,211,86,63,35,232,86,63,203,252,86,63,108,17,87,63,7,38,87,63,156,58,87,63,44,79,87,63,182,99,87,63,58,120,87,63,183,140,87,63,47,161,87,63,162,181,87,63,14,202,87,63,116,222,87,63,213,242,87,63,47,7,88,63,132,27,88,63,211,47,88,63,28,68,88,63,95,88,88,63,156,108,88,63,211,128,88,63,4,149,88,63,47,169,88,63,85,189,88,63,116,209,88,63,142,229,88,63,162,249,88,63,175,13,89,63,183,33,89,63,185,53,89,63,181,73,89,63,171,93,89,63,155,113,89,63,134,133,89,63,106,153,89,63,72,173,89,63,33,193,89,63,243,212,89,63,192,232,89,63,135,252,89,63,71,16,90,63,2,36,90,63,183,55,90,63,102,75,90,63,15,95,90,63,178,114,90,63,79,134,90,63,230,153,90,63,119,173,90,63,3,193,90,63,136,212,90,63,7,232,90,63,129,251,90,63,244,14,91,63,98,34,91,63,201,53,91,63,43,73,91,63,135,92,91,63,220,111,91,63,44,131,91,63,118,150,91,63,186,169,91,63,248,188,91,63,47,208,91,63,97,227,91,63,141,246,91,63,179,9,92,63,212,28,92,63,238,47,92,63,2,67,92,63,16,86,92,63,24,105,92,63,26,124,92,63,23,143,92,63,13,162,92,63,253,180,92,63,232,199,92,63,204,218,92,63,171,237,92,63,131,0,93,63,86,19,93,63,34,38,93,63,233,56,93,63,169,75,93,63,100,94,93,63,24,113,93,63,199,131,93,63,112,150,93,63,18,169,93,63,175,187,93,63,70,206,93,63,215,224,93,63,97,243,93,63,230,5,94,63,101,24,94,63,222,42,94,63,81,61,94,63,190,79,94,63,36,98,94,63,133,116,94,63,224,134,94,63,53,153,94,63,132,171,94,63,205,189,94,63,16,208,94,63,77,226,94,63,132,244,94,63,181,6,95,63,224,24,95,63,5,43,95,63,36,61,95,63,61,79,95,63,80,97,95,63,93,115,95,63,101,133,95,63,102,151,95,63,97,169,95,63,86,187,95,63,69,205,95,63,46,223,95,63,18,241,95,63,239,2,96,63,198,20,96,63,151,38,96,63,98,56,96,63,40,74,96,63,231,91,96,63,160,109,96,63,84,127,96,63,1,145,96,63,168,162,96,63,73,180,96,63,229,197,96,63,122,215,96,63,10,233,96,63,147,250,96,63,22,12,97,63,148,29,97,63,11,47,97,63,125,64,97,63,232,81,97,63,77,99,97,63,173,116,97,63,6,134,97,63,90,151,97,63,167,168,97,63,239,185,97,63,48,203,97,63,108,220,97,63,162,237,97,63,209,254,97,63,251,15,98,63,30,33,98,63,60,50,98,63,84,67,98,63,101,84,98,63,113,101,98,63,119,118,98,63].concat([119,135,98,63,112,152,98,63,100,169,98,63,82,186,98,63,58,203,98,63,28,220,98,63,247,236,98,63,205,253,98,63,157,14,99,63,103,31,99,63,43,48,99,63,233,64,99,63,161,81,99,63,83,98,99,63,255,114,99,63,165,131,99,63,69,148,99,63,224,164,99,63,116,181,99,63,2,198,99,63,138,214,99,63,13,231,99,63,137,247,99,63,255,7,100,63,112,24,100,63,218,40,100,63,62,57,100,63,157,73,100,63,246,89,100,63,72,106,100,63,149,122,100,63,219,138,100,63,28,155,100,63,87,171,100,63,140,187,100,63,186,203,100,63,227,219,100,63,6,236,100,63,35,252,100,63,58,12,101,63,75,28,101,63,86,44,101,63,91,60,101,63,91,76,101,63,84,92,101,63,71,108,101,63,53,124,101,63,28,140,101,63,254,155,101,63,217,171,101,63,175,187,101,63,126,203,101,63,72,219,101,63,12,235,101,63,202,250,101,63,130,10,102,63,52,26,102,63,224,41,102,63,134,57,102,63,38,73,102,63,193,88,102,63,85,104,102,63,227,119,102,63,108,135,102,63,238,150,102,63,107,166,102,63,226,181,102,63,83,197,102,63,190,212,102,63,35,228,102,63,130,243,102,63,219,2,103,63,46,18,103,63,124,33,103,63,195,48,103,63,5,64,103,63,64,79,103,63,118,94,103,63,166,109,103,63,208,124,103,63,244,139,103,63,18,155,103,63,42,170,103,63,61,185,103,63,73,200,103,63,80,215,103,63,80,230,103,63,75,245,103,63,64,4,104,63,47,19,104,63,24,34,104,63,251,48,104,63,217,63,104,63,176,78,104,63,130,93,104,63,78,108,104,63,20,123,104,63,212,137,104,63,142,152,104,63,66,167,104,63,240,181,104,63,153,196,104,63,60,211,104,63,217,225,104,63,112,240,104,63,1,255,104,63,140,13,105,63,17,28,105,63,145,42,105,63,11,57,105,63,127,71,105,63,237,85,105,63,85,100,105,63,183,114,105,63,20,129,105,63,106,143,105,63,187,157,105,63,6,172,105,63,75,186,105,63,139,200,105,63,196,214,105,63,248,228,105,63,38,243,105,63,78,1,106,63,112,15,106,63,141,29,106,63,163,43,106,63,180,57,106,63,191,71,106,63,196,85,106,63,196,99,106,63,189,113,106,63,177,127,106,63,159,141,106,63,135,155,106,63,106,169,106,63,70,183,106,63,29,197,106,63,238,210,106,63,186,224,106,63,127,238,106,63,63,252,106,63,249,9,107,63,173,23,107,63,91,37,107,63,4,51,107,63,167,64,107,63,68,78,107,63,219,91,107,63,109,105,107,63,249,118,107,63,127,132,107,63,255,145,107,63,122,159,107,63,238,172,107,63,94,186,107,63,199,199,107,63,42,213,107,63,136,226,107,63,224,239,107,63,51,253,107,63,128,10,108,63,198,23,108,63,8,37,108,63,67,50,108,63,121,63,108,63,169,76,108,63,211,89,108,63,248,102,108,63,23,116,108,63,48,129,108,63,68,142,108,63,82,155,108,63,90,168,108,63,92,181,108,63,89,194,108,63,80,207,108,63,65,220,108,63,45,233,108,63,19,246,108,63,243,2,109,63,206,15,109,63,163,28,109,63,114,41,109,63,60,54,109,63,0,67,109,63,190,79,109,63,119,92,109,63,42,105,109,63,215,117,109,63,127,130,109,63,33,143,109,63,189,155,109,63,84,168,109,63,229,180,109,63,113,193,109,63,247,205,109,63,119,218,109,63,242,230,109,63,103,243,109,63,214,255,109,63,64,12,110,63,164,24,110,63,3,37,110,63,91,49,110,63,175,61,110,63,253,73,110,63,69,86,110,63,135,98,110,63,196,110,110,63,252,122,110,63,45,135,110,63,90,147,110,63,128,159,110,63,161,171,110,63,189,183,110,63,211,195,110,63,227,207,110,63,238,219,110,63,243,231,110,63,243,243,110,63,237,255,110,63,226,11,111,63,209,23,111,63,186,35,111,63,158,47,111,63,125,59,111,63,85,71,111,63,41,83,111,63,247,94,111,63,191,106,111,63,130,118,111,63,63,130,111,63,247,141,111,63,169,153,111,63,86,165,111,63,253,176,111,63,159,188,111,63,59,200,111,63,210,211,111,63,99,223,111,63,239,234,111,63,117,246,111,63,246,1,112,63,114,13,112,63,231,24,112,63,88,36,112,63,195,47,112,63,40,59,112,63,137,70,112,63,227,81,112,63,56,93,112,63,136,104,112,63,210,115,112,63,23,127,112,63,87,138,112,63,145,149,112,63,197,160,112,63,244,171,112,63,30,183,112,63,66,194,112,63,97,205,112,63,123,216,112,63,143,227,112,63,157,238,112,63,167,249,112,63,171,4,113,63,169,15,113,63,162,26,113,63,150,37,113,63,132,48,113,63,109,59,113,63,81,70,113,63,47,81,113,63,8,92,113,63,219,102,113,63,170,113,113,63,114,124,113,63,54,135,113,63,244,145,113,63,173,156,113,63,96,167,113,63,14,178,113,63,183,188,113,63,91,199,113,63,249,209,113,63,146,220,113,63,37,231,113,63,179,241,113,63,60,252,113,63,192,6,114,63,62,17,114,63,183,27,114,63,43,38,114,63,154,48,114,63,3,59,114,63,103,69,114,63,197,79,114,63,31,90,114,63,115,100,114,63,194,110,114,63,11,121,114,63,79,131,114,63,143,141,114,63,200,151,114,63,253,161,114,63,44,172,114,63,87,182,114,63,123,192,114,63,155,202,114,63,182,212,114,63,203,222,114,63,219,232,114,63,230,242,114,63,235,252,114,63,236,6,115,63,231,16,115,63,221,26,115,63,206,36,115,63,186,46,115,63,160,56,115,63,130,66,115,63,94,76,115,63,53,86,115,63,7,96,115,63,212,105,115,63,155,115,115,63,94,125,115,63,27,135,115,63,211,144,115,63,134,154,115,63,52,164,115,63,221,173,115,63,128,183,115,63,31,193,115,63,184,202,115,63,77,212,115,63,220,221,115,63,102,231,115,63,235,240,115,63,107,250,115,63,230,3,116,63,92,13,116,63,204,22,116,63,56,32,116,63,159,41,116,63,0,51,116,63,93,60,116,63,180,69,116,63,6,79,116,63,84,88,116,63,156,97,116,63,223,106,116,63,29,116,116,63,87,125,116,63,139,134,116,63,186,143,116,63,228,152,116,63,9,162,116,63,41,171,116,63,68,180,116,63,91,189,116,63,108,198,116,63,120,207,116,63,127,216,116,63,129,225,116,63,127,234,116,63,119,243,116,63,106,252,116,63,89,5,117,63,66,14,117,63,38,23,117,63,6,32,117,63,225,40,117,63,182,49,117,63,135,58,117,63,83,67,117,63,26,76,117,63,220,84,117,63,153,93,117,63,81,102,117,63,4,111,117,63,179,119,117,63,92,128,117,63,1,137,117,63,160,145,117,63,59,154,117,63,209,162,117,63,98,171,117,63,239,179,117,63,118,188,117,63,249,196,117,63,118,205,117,63,239,213,117,63,99,222,117,63,210,230,117,63,61,239,117,63,162,247,117,63,3,0,118,63,95,8,118,63,182,16,118,63,8,25,118,63,86,33,118,63,159,41,118,63,227,49,118,63,34,58,118,63,92,66,118,63,146,74,118,63,195,82,118,63,239,90,118,63,22,99,118,63,57,107,118,63,86,115,118,63,112,123,118,63,132,131,118,63,148,139,118,63,158,147,118,63,165,155,118,63,166,163,118,63,163,171,118,63,155,179,118,63,142,187,118,63,125,195,118,63,103,203,118,63,76,211,118,63,45,219,118,63,9,227,118,63,224,234,118,63,178,242,118,63,128,250,118,63,74,2,119,63,14,10,119,63,206,17,119,63,137,25,119,63,64,33,119,63,242,40,119,63,160,48,119,63,72,56,119,63,237,63,119,63,140,71,119,63,39,79,119,63,190,86,119,63,79,94,119,63,220,101,119,63,101,109,119,63,233,116,119,63,105,124,119,63,228,131,119,63,90,139,119,63,204,146,119,63,57,154,119,63,162,161,119,63,6,169,119,63,101,176,119,63,192,183,119,63,23,191,119,63,105,198,119,63,182,205,119,63,255,212,119,63,68,220,119,63,132,227,119,63,191,234,119,63,246,241,119,63,41,249,119,63,87,0,120,63,129,7,120,63,166,14,120,63,198,21,120,63,227,28,120,63,250,35,120,63,14,43,120,63,28,50,120,63,39,57,120,63,45,64,120,63,46,71,120,63,44,78,120,63,36,85,120,63,25,92,120,63,9,99,120,63,244,105,120,63,219,112,120,63,190,119,120,63,156,126,120,63,118,133,120,63,76,140,120,63,29,147,120,63,234,153,120,63,179,160,120,63,119,167,120,63,55,174,120,63,242,180,120,63,169,187,120,63,92,194,120,63,11,201,120,63,181,207,120,63,91,214,120,63,252,220,120,63,154,227,120,63,51,234,120,63,199,240,120,63,88,247,120,63,228,253,120,63,108,4,121,63,240,10,121,63,111,17,121,63,234,23,121,63,97,30,121,63,211,36,121,63,66,43,121,63,172,49,121,63,18,56,121,63,116,62,121,63,209,68,121,63,42,75,121,63,127,81,121,63,208,87,121,63,29,94,121,63,101,100,121,63,170,106,121,63,234,112,121,63,38,119,121,63,93,125,121,63,145,131,121,63,193,137,121,63,236,143,121,63,19,150,121,63,54,156,121,63,85,162,121,63,112,168,121,63,134,174,121,63,153,180,121,63,167,186,121,63,178,192,121,63,184,198,121,63,186,204,121,63,184,210,121,63,178,216,121,63,168,222,121,63,154,228,121,63,135,234,121,63,113,240,121,63,87,246,121,63,56,252,121,63,22,2,122,63,239,7,122,63,197,13,122,63,150,19,122,63,100,25,122,63,45,31,122,63,243,36,122,63,180,42,122,63,113,48,122,63,43,54,122,63,224,59,122,63,146,65,122,63,63,71,122,63,233,76,122,63,142,82,122,63,48,88,122,63,206,93,122,63,103,99,122,63,253,104,122,63,143,110,122,63,29,116,122,63,167,121,122,63,45,127,122,63,175,132,122,63,45,138,122,63,168,143,122,63,30,149,122,63,145,154,122,63,255,159,122,63,106,165,122,63,209,170,122,63,52,176,122,63,147,181,122,63,239,186,122,63,70,192,122,63,154,197,122,63,234,202,122,63,54,208,122,63,126,213,122,63,194,218,122,63,3,224,122,63,64,229,122,63,121,234,122,63,174,239,122,63,223,244,122,63,13,250,122,63,55,255,122,63,93,4,123,63,127,9,123,63,157,14,123,63,184,19,123,63,207,24,123,63,227,29,123,63,242,34,123,63,254,39,123,63,6,45,123,63,10,50,123,63,11,55,123,63,8,60,123,63,1,65,123,63,247,69,123,63,233,74,123,63,215,79,123,63,193,84,123,63,168,89,123,63,139,94,123,63,107,99,123,63,71,104,123,63,31,109,123,63,243,113,123,63,196,118,123,63,146,123,123,63,91,128,123,63,33,133,123,63,228,137,123,63,163,142,123,63,94,147,123,63,22,152,123,63,202,156,123,63,122,161,123,63,39,166,123,63,208,170,123,63,118,175,123,63,24,180,123,63,183,184,123,63,82,189,123,63,233,193,123,63,125,198,123,63,14,203,123,63,155,207,123,63,36,212,123,63,170,216,123,63,45,221,123,63,172,225,123,63,39,230,123,63,159,234,123,63,19,239,123,63,132,243,123,63,242,247,123,63,92,252,123,63,195,0,124,63,38,5,124,63,133,9,124,63,226,13,124,63,58,18,124,63,144,22,124,63,226,26,124,63,48,31,124,63,123,35,124,63,195,39,124,63,7,44,124,63,72,48,124,63,134,52,124,63,192,56,124,63,247,60,124,63,42,65,124,63,90,69,124,63,135,73,124,63,176,77,124,63,214,81,124,63,249,85,124,63,24,90,124,63,52,94,124,63,77,98,124,63,98,102,124,63,116,106,124,63,131,110,124,63,142,114,124,63,150,118,124,63,155,122,124,63,157,126,124,63,155,130,124,63,150,134,124,63,142,138,124,63,130,142,124,63,116,146,124,63,98,150,124,63,77,154,124,63,52,158,124,63,24,162,124,63,249,165,124,63,215,169,124,63,178,173,124,63,137,177,124,63,94,181,124,63,47,185,124,63,253,188,124,63,199,192,124,63,143,196,124,63,83,200,124,63,20,204,124,63,211,207,124,63,141,211,124,63,69,215,124,63,250,218,124,63,171,222,124,63,90,226,124,63,5,230,124,63,173,233,124,63,82,237,124,63,244,240,124,63,147,244,124,63,46,248,124,63,199,251,124,63,93,255,124,63,239,2,125,63,127,6,125,63,11,10,125,63,148,13,125,63,27,17,125,63,158,20,125,63,30,24,125,63,155,27,125,63,21,31,125,63,140,34,125,63,0,38,125,63,114,41,125,63,224,44,125,63,75,48,125,63,179,51,125,63,24,55,125,63,122,58,125,63,217,61,125,63,54,65,125,63,143,68,125,63,229,71,125,63,56,75,125,63,137,78,125,63,214,81,125,63,33,85,125,63,104,88,125,63,173,91,125,63,239,94,125,63,46,98,125,63,106,101,125,63,163,104,125,63,217,107,125,63,12,111,125,63,61,114,125,63,106,117,125,63,149,120,125,63,189,123,125,63,226,126,125,63,4,130,125,63,36,133,125,63,64,136,125,63,90,139,125,63,112,142,125,63,133,145,125,63,150,148,125,63,164,151,125,63,176,154,125,63,185,157,125,63,191,160,125,63,194,163,125,63,194,166,125,63,192,169,125,63,187,172,125,63,179,175,125,63,168,178,125,63,155,181,125,63,139,184,125,63,120,187,125,63,99,190,125,63,74,193,125,63,48,196,125,63,18,199,125,63,241,201,125,63,206,204,125,63,169,207,125,63,128,210,125,63,85,213,125,63,39,216,125,63,247,218,125,63,196,221,125,63,142,224,125,63,85,227,125,63,26,230,125,63,220,232,125,63,156,235,125,63,89,238,125,63,19,241,125,63,203,243,125,63,128,246,125,63,51,249,125,63,227,251,125,63,144,254,125,63,59,1,126,63,227,3,126,63,137,6,126,63,44,9,126,63,204,11,126,63,106,14,126,63,6,17,126,63,158,19,126,63,53,22,126,63,200,24,126,63,90,27,126,63,232,29,126,63,116,32,126,63,254,34,126,63,133,37,126,63,10,40,126,63,140,42,126,63,12,45,126,63,137,47,126,63,4,50,126,63,124,52,126,63,242,54,126,63,101,57,126,63,214,59,126,63,68,62,126,63,176,64,126,63,26,67,126,63,129,69,126,63,230,71,126,63,72,74,126,63,168,76,126,63,5,79,126,63,96,81,126,63,185,83,126,63,15,86,126,63,99,88,126,63,181,90,126,63,4,93,126,63,81,95,126,63,155,97,126,63,227,99,126,63,41,102,126,63,108,104,126,63,173,106,126,63,236,108,126,63,40,111,126,63,98,113,126,63,154,115,126,63,208,117,126,63,3,120,126,63,51,122,126,63,98,124,126,63,142,126,126,63,184,128,126,63,224,130,126,63,5,133,126,63,40,135,126,63,73,137,126,63,104,139,126,63,132,141,126,63,159,143,126,63,183,145,126,63,204,147,126,63,224,149,126,63,241,151,126,63,0,154,126,63,13,156,126,63,24,158,126,63,32,160,126,63,38,162,126,63,42,164,126,63,44,166,126,63,44,168,126,63,41,170,126,63,37,172,126,63,30,174,126,63,21,176,126,63,10,178,126,63,253,179,126,63,238,181,126,63,220,183,126,63,201,185,126,63,179,187,126,63,155,189,126,63,129,191,126,63,101,193,126,63,71,195,126,63,39,197,126,63,5,199,126,63,224,200,126,63,186,202,126,63,145,204,126,63,103,206,126,63,58,208,126,63,12,210,126,63,219,211,126,63,168,213,126,63,115,215,126,63,61,217,126,63,4,219,126,63,201,220,126,63,140,222,126,63,77,224,126,63,12,226,126,63,202,227,126,63,133,229,126,63,62,231,126,63,245,232,126,63,170,234,126,63,94,236,126,63,15,238,126,63,190,239,126,63,108,241,126,63,23,243,126,63,193,244,126,63,104,246,126,63,14,248,126,63,178,249,126,63,84,251,126,63,243,252,126,63,145,254,126,63,46,0,127,63,200,1,127,63,96,3,127,63,247,4,127,63,139,6,127,63,30,8,127,63,175,9,127,63,62,11,127,63,203,12,127,63,86,14,127,63,223,15,127,63,103,17,127,63,237,18,127,63,112,20,127,63,242,21,127,63,115,23,127,63,241,24,127,63,110,26,127,63,233,27,127,63,98,29,127,63,217,30,127,63,78,32,127,63,194,33,127,63,52,35,127,63,164,36,127,63,18,38,127,63,127,39,127,63,234,40,127,63,83,42,127,63,186,43,127,63,32,45,127,63,131,46,127,63,230,47,127,63,70,49,127,63,165,50,127,63,2,52,127,63,93,53,127,63,182,54,127,63,14,56,127,63,100,57,127,63,185,58,127,63,12,60,127,63,93,61,127,63,172,62,127,63,250,63,127,63,70,65,127,63,145,66,127,63,217,67,127,63,33,69,127,63,102,70,127,63,170,71,127,63,236,72,127,63,45,74,127,63,108,75,127,63,169,76,127,63,229,77,127,63,31,79,127,63,88,80,127,63,143,81,127,63,196,82,127,63,248,83,127,63,42,85,127,63,91,86,127,63,138,87,127,63,184,88,127,63,228,89,127,63,14,91,127,63,55,92,127,63,94,93,127,63,132,94,127,63,169,95,127,63,203,96,127,63,237,97,127,63,12,99,127,63,42,100,127,63,71,101,127,63,98,102,127,63,124,103,127,63,148,104,127,63,171,105,127,63,192,106,127,63,212,107,127,63,230,108,127,63,247,109,127,63,6,111,127,63,20,112,127,63,33,113,127,63,44,114,127,63,53,115,127,63,61,116,127,63,68,117,127,63,73,118,127,63,77,119,127,63,79,120,127,63,80,121,127,63,80,122,127,63,78,123,127,63,75,124,127,63,70,125,127,63,64,126,127,63,57,127,127,63,48,128,127,63,38,129,127,63,27,130,127,63,14,131,127,63,0,132,127,63,240,132,127,63,223,133,127,63,205,134,127,63,185,135,127,63,164,136,127,63,142,137,127,63,118,138,127,63,93,139,127,63,67,140,127,63,40,141,127,63,11,142,127,63,237,142,127,63,205,143,127,63,173,144,127,63,139,145,127,63,103,146,127,63,67,147,127,63,29,148,127,63,246,148,127,63,205,149,127,63,164,150,127,63,121,151,127,63,77,152,127,63,31,153,127,63,241,153,127,63,193,154,127,63,144,155,127,63,93,156,127,63,42,157,127,63,245,157,127,63,191,158,127,63,136,159,127,63,79,160,127,63,22,161,127,63,219,161,127,63,159,162,127,63,98,163,127,63,36,164,127,63,228,164,127,63,163,165,127,63,98,166,127,63,31,167,127,63,219,167,127,63,149,168,127,63,79,169,127,63,7,170,127,63,190,170,127,63,117,171,127,63,42,172,127,63,221,172,127,63,144,173,127,63,66,174,127,63,242,174,127,63,162,175,127,63,80,176,127,63,253,176,127,63,169,177,127,63,85,178,127,63,254,178,127,63,167,179,127,63,79,180,127,63,246,180,127,63,156,181,127,63,64,182,127,63,228,182,127,63,134,183,127,63,40,184,127,63,200,184,127,63,103,185,127,63,6,186,127,63,163,186,127,63,63,187,127,63,219,187,127,63,117,188,127,63,14,189,127,63,166,189,127,63,61,190,127,63,212,190,127,63,105,191,127,63,253,191,127,63,144,192,127,63,34,193,127,63,180,193,127,63,68,194,127,63,211,194,127,63,98,195,127,63,239,195,127,63,123,196,127,63,7,197,127,63,145,197,127,63,27,198,127,63,163,198,127,63,43,199,127,63,178,199,127,63,56,200,127,63,189,200,127,63,65,201,127,63,196,201,127,63,70,202,127,63,199,202,127,63,71,203,127,63,199,203,127,63,69,204,127,63,195,204,127,63,64,205,127,63,187,205,127,63,54,206,127,63,177,206,127,63,42,207,127,63,162,207,127,63,26,208,127,63,144,208,127,63,6,209,127,63,123,209,127,63,239,209,127,63,98,210,127,63,213,210,127,63,70,211,127,63,183,211,127,63,39,212,127,63,150,212,127,63,4,213,127,63,114,213,127,63,222,213,127,63,74,214,127,63,181,214,127,63,32,215,127,63,137,215,127,63,242,215,127,63,89,216,127,63,192,216,127,63,39,217,127,63,140,217,127,63,241,217,127,63,85,218,127,63,184,218,127,63,27,219,127,63,124,219,127,63,221,219,127,63,61,220,127,63,157,220,127,63,251,220,127,63,89,221,127,63,183,221,127,63,19,222,127,63,111,222,127,63,202,222,127,63,36,223,127,63,126,223,127,63,215,223,127,63,47,224,127,63,134,224,127,63,221,224,127,63,51,225,127,63,137,225,127,63,221,225,127,63,49,226,127,63,133,226,127,63,215,226,127,63,41,227,127,63,122,227,127,63,203,227,127,63,27,228,127,63,106,228,127,63,185,228,127,63,7,229,127,63,84,229,127,63,161,229,127,63,237,229,127,63,56,230,127,63,131,230,127,63,205,230,127,63,23,231,127,63,96,231,127,63,168,231,127,63,239,231,127,63,54,232,127,63,125,232,127,63,195,232,127,63,8,233,127,63,76,233,127,63,144,233,127,63,212,233,127,63,23,234,127,63,89,234,127,63,154,234,127,63,219,234,127,63,28,235,127,63,92,235,127,63,155,235,127,63,218,235,127,63,24,236,127,63,86,236,127,63,147,236,127,63,207,236,127,63,11,237,127,63,71,237,127,63,130,237,127,63,188,237,127,63,246,237,127,63,47,238,127,63,104,238,127,63,160,238,127,63,216,238,127,63,15,239,127,63,69,239,127,63,123,239,127,63,177,239,127,63,230,239,127,63,27,240,127,63,79,240,127,63,130,240,127,63,182,240,127,63,232,240,127,63,26,241,127,63,76,241,127,63,125,241,127,63,174,241,127,63,222,241,127,63,14,242,127,63,61,242,127,63,108,242,127,63,154,242,127,63,200,242,127,63,245,242,127,63,34,243,127,63,79,243,127,63,123,243,127,63,166,243,127,63,209,243,127,63,252,243,127,63,38,244,127,63,80,244,127,63,121,244,127,63,162,244,127,63,203,244,127,63,243,244,127,63,27,245,127,63,66,245,127,63,105,245,127,63,143,245,127,63,181,245,127,63,219,245,127,63,0,246,127,63,37,246,127,63,73,246,127,63,109,246,127,63,145,246,127,63,180,246,127,63,215,246,127,63,250,246,127,63,28,247,127,63,62,247,127,63,95,247,127,63,128,247,127,63,160,247,127,63,193,247,127,63,225,247,127,63,0,248,127,63,31,248,127,63,62,248,127,63,93,248,127,63,123,248,127,63,152,248,127,63,182,248,127,63,211,248,127,63,240,248,127,63,12,249,127,63,40,249,127,63,68,249,127,63,95,249,127,63,122,249,127,63,149,249,127,63,175,249,127,63,202,249,127,63,227,249,127,63,253,249,127,63,22,250,127,63,47,250,127,63,71,250,127,63,96,250,127,63,120,250,127,63,143,250,127,63,166,250,127,63,190,250,127,63,212,250,127,63,235,250,127,63,1,251,127,63,23,251,127,63,44,251,127,63,66,251,127,63,87,251,127,63,108,251,127,63,128,251,127,63,148,251,127,63,168,251,127,63,188,251,127,63,208,251,127,63,227,251,127,63,246,251,127,63,8,252,127,63,27,252,127,63,45,252,127,63,63,252,127,63,81,252,127,63,98,252,127,63,115,252,127,63,132,252,127,63,149,252,127,63,165,252,127,63,182,252,127,63,198,252,127,63,213,252,127,63,229,252,127,63,244,252,127,63,3,253,127,63,18,253,127,63,33,253,127,63,47,253,127,63,62,253,127,63,76,253,127,63,89,253,127,63,103,253,127,63,116,253,127,63,130,253,127,63,143,253,127,63,155,253,127,63,168,253,127,63,181,253,127,63,193,253,127,63,205,253,127,63,217,253,127,63,228,253,127,63,240,253,127,63,251,253,127,63,6,254,127,63,17,254,127,63,28,254,127,63,38,254,127,63,49,254,127,63,59,254,127,63,69,254,127,63,79,254,127,63,89,254,127,63,98,254,127,63,108,254,127,63,117,254,127,63,126,254,127,63,135,254,127,63,144,254,127,63,152,254,127,63,161,254,127,63,169,254,127,63,177,254,127,63,185,254,127,63,193,254,127,63,201,254,127,63,208,254,127,63,216,254,127,63,223,254,127,63,230,254,127,63,237,254,127,63,244,254,127,63,251,254,127,63,2,255,127,63,8,255,127,63,14,255,127,63,21,255,127,63,27,255,127,63,33,255,127,63,39,255,127,63,45,255,127,63,50,255,127,63,56,255,127,63,61,255,127,63,67,255,127,63,72,255,127,63,77,255,127,63,82,255,127,63,87,255,127,63,92,255,127,63,96,255,127,63,101,255,127,63,105,255,127,63,110,255,127,63,114,255,127,63,118,255,127,63,122,255,127,63,126,255,127,63,130,255,127,63,134,255,127,63,138,255,127,63,142,255,127,63,145,255,127,63,149,255,127,63,152,255,127,63,155,255,127,63,159,255,127,63,162,255,127,63,165,255,127,63,168,255,127,63,171,255,127,63,174,255,127,63,176,255,127,63,179,255,127,63,182,255,127,63,184,255,127,63,187,255,127,63,189,255,127,63,192,255,127,63,194,255,127,63,196,255,127,63,198,255,127,63,201,255,127,63,203,255,127,63,205,255,127,63,207,255,127,63,209,255,127,63,210,255,127,63,212,255,127,63,214,255,127,63,216,255,127,63,217,255,127,63,219,255,127,63,220,255,127,63,222,255,127,63,223,255,127,63,225,255,127,63,226,255,127,63,227,255,127,63,229,255,127,63,230,255,127,63,231,255,127,63,232,255,127,63,233,255,127,63,234,255,127,63,235,255,127,63,236,255,127,63,237,255,127,63,238,255,127,63,239,255,127,63,240,255,127,63,241,255,127,63,241,255,127,63,242,255,127,63,243,255,127,63,244,255,127,63,244,255,127,63,245,255,127,63,246,255,127,63,246,255,127,63,247,255,127,63,247,255,127,63,248,255,127,63,248,255,127,63,249,255,127,63,249,255,127,63,250,255,127,63,250,255,127,63,250,255,127,63,251,255,127,63,251,255,127,63,251,255,127,63,252,255,127,63,252,255,127,63,252,255,127,63,253,255,127,63,253,255,127,63,253,255,127,63,253,255,127,63,254,255,127,63,254,255,127,63,254,255,127,63,254,255,127,63,254,255,127,63,254,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,24,0,120,58,76,70,11,60,242,204,192,60,116,252,59,61,86,73,154,61,241,93,228,61,248,163,29,62,180,231,78,62,54,157,130,62,78,220,159,62,193,174,190,62,65,132,222,62,173,194,254,62,186,101,15,63,248,0,31,63,29,233,45,63,249,219,59,63,45,162,72,63,160,17,84,63,38,15,94,63,46,143,102,63,112,149,109,63,174,51,115,63,159,135,119,63,66,184,122,63,196,242,124,63,75,103,126,63,196,69,127,63,241,186,127,63,217,237,127,63,162,253,127,63,248,255,127,63,169,12,120,55,54,134,11,57,38,198,193,57,94,226,61,58,234,237,156,58,85,101,234,58,56,170,35,59,207,219,89,59,169,226,139,59,42,178,174,59,13,91,213,59,204,219,255,59,91,25,23,60,250,46,48,60,194,45,75,60,156,20,104,60,46,113,131,60,225,202,147,60,185,22,165,60,1,84,183,60,245,129,202,60,198,159,222,60,155,172,243,60,199,211,4,61,213,71,16,61,250,49,28,61,174,145,40,61,101,102,53,61,141,175,66,61,140,108,80,61,193,156,94,61,133,63,109,61,41,84,124,61,252,236,133,61,26,232,141,61,13,27,150,61,110,133,158,61,212,38,167,61,210,254,175,61,245,12,185,61,200,80,194,61,209,201,203,61,146,119,213,61,139,89,223,61,51,111,233,61,2,184,243,61,105,51,254,61,106,112,4,62,214,223,9,62,171,103,15,62,153,7,21,62,77,191,26,62,116,142,32,62,181,116,38,62,184,113,44,62,34,133,50,62,149,174,56,62,178,237,62,62,21,66,69,62,92,171,75,62,30,41,82,62,243,186,88,62,112,96,95,62,40,25,102,62,170,228,108,62,132,194,115,62,68,178,122,62,185,217,128,62,203,98,132,62,26,244,135,62,105,141,139,62,120,46,143,62,6,215,146,62,211,134,150,62,156,61,154,62,29,251,157,62,19,191,161,62,57,137,165,62,71,89,169,62,249,46,173,62,5,10,177,62,36,234,180,62,13,207,184,62,117,184,188,62,18,166,192,62,153,151,196,62,190,140,200,62,52,133,204,62,175,128,208,62,225,126,212,62,125,127,216,62,52,130,220,62,184,134,224,62,185,140,228,62,233,147,232,62,248,155,236,62,150,164,240,62,117,173,244,62,67,182,248,62,178,190,252,62,57,99,0,63,153,102,2,63,82,105,4,63,60,107,6,63,48,108,8,63,6,108,10,63,151,106,12,63,188,103,14,63,78,99,16,63,39,93,18,63,33,85,20,63,21,75,22,63,222,62,24,63,87,48,26,63,92,31,28,63,199,11,30,63,117,245,31,63,66,220,33,63,12,192,35,63,176,160,37,63,12,126,39,63,254,87,41,63,104,46,43,63,39,1,45,63,29,208,46,63,43,155,48,63,51,98,50,63,23,37,52,63,188,227,53,63,4,158,55,63,214,83,57,63,23,5,59,63,173,177,60,63,128,89,62,63,120,252,63,63,126,154,65,63,124,51,67,63,93,199,68,63,12,86,70,63,119,223,71,63,138,99,73,63,54,226,74,63,104,91,76,63,17,207,77,63,35,61,79,63,145,165,80,63,76,8,82,63,75,101,83,63,130,188,84,63,231,13,86,63,114,89,87,63,26,159,88,63,218,222,89,63,172,24,91,63,138,76,92,63,113,122,93,63,93,162,94,63,78,196,95,63,67,224,96,63,58,246,97,63,54,6,99,63,56,16,100,63,67,20,101,63,92,18,102,63,133,10,103,63,198,252,103,63,37,233,104,63,168,207,105,63,89,176,106,63,64,139,107,63,102,96,108,63,216,47,109,63,159,249,109,63,201,189,110,63,97,124,111,63,118,53,112,63,23,233,112,63,81,151,113,63,53,64,114,63,212,227,114,63,61,130,115,63,131,27,116,63,184,175,116,63,238,62,117,63,56,201,117,63,171,78,118,63,90,207,118,63,90,75,119,63,192,194,119,63,162,53,120,63,21,164,120,63,48,14,121,63,8,116,121,63,182,213,121,63,79,51,122,63,235,140,122,63,162,226,122,63,139,52,123,63,191,130,123,63,85,205,123,63,102,20,124,63,9,88,124,63,88,152,124,63,106,213,124,63,88,15,125,63,58,70,125,63,41,122,125,63,62,171,125,63,143,217,125,63,54,5,126,63,75,46,126,63,228,84,126,63,27,121,126,63,7,155,126,63,190,186,126,63,88,216,126,63,236,243,126,63,144,13,127,63,91,37,127,63,99,59,127,63,188,79,127,63,125,98,127,63,185,115,127,63,135,131,127,63,249,145,127,63,36,159,127,63,26,171,127,63,238,181,127,63,179,191,127,63,122,200,127,63,85,208,127,63,84,215,127,63,136,221,127,63,0,227,127,63,204,231,127,63,249,235,127,63,150,239,127,63,177,242,127,63,85,245,127,63,144,247,127,63,109,249,127,63,246,250,127,63,54,252,127,63,55,253,127,63,1,254,127,63,156,254,127,63,18,255,127,63,103,255,127,63,163,255,127,63,204,255,127,63,229,255,127,63,244,255,127,63,252,255,127,63,255,255,127,63,0,0,128,63,0,0,128,63,204,8,120,52,171,134,11,54,79,202,193,54,190,233,61,55,238,247,156,55,192,123,234,55,43,192,35,56,161,2,90,56,189,2,140,56,76,228,174,56,227,165,213,56,199,35,0,57,168,100,23,57,134,149,48,57,104,182,75,57,64,199,104,57,7,228,131,57,105,92,148,57,191,204,165,57,6,53,184,57,65,149,203,57,105,237,223,57,120,61,245,57,184,194,5,58,166,98,17,58,134,126,29,58,81,22,42,58,9,42,55,58,172,185,68,58,54,197,82,58,165,76,97,58,250,79,112,58,47,207,127,58,34,229,135,58,154,32,144,58,255,153,152,58,80,81,161,58,139,70,170,58,174,121,179,58,186,234,188,58,171,153,198,58,129,134,208,58,58,177,218,58,212,25,229,58,79,192,239,58,167,164,250,58,109,227,2,59,117,147,8,59,105,98,14,59,73,80,20,59,19,93,26,59,199,136,32,59,100,211,38,59,232,60,45,59,83,197,51,59,164,108,58,59,218,50,65,59,243,23,72,59,239,27,79,59,204,62,86,59,138,128,93,59,38,225,100,59,161,96,108,59,249,254,115,59,45,188,123,59,29,204,129,59,145,201,133,59,113,214,137,59,188,242,141,59,113,30,146,59,145,89,150,59,26,164,154,59,12,254,158,59,102,103,163,59,40,224,167,59,80,104,172,59,222,255,176,59,209,166,181,59,40,93,186,59,228,34,191,59,2,248,195,59,131,220,200,59,101,208,205,59,168,211,210,59,74,230,215,59,76,8,221,59,172,57,226,59,105,122,231,59,131,202,236,59,249,41,242,59,202,152,247,59,245,22,253,59,60,82,1,60,170,32,4,60,196,246,6,60,137,212,9,60,249,185,12,60,19,167,15,60,216,155,18,60,69,152,21,60,92,156,24,60,26,168,27,60,129,187,30,60,143,214,33,60,69,249,36,60,160,35,40,60,162,85,43,60,73,143,46,60,149,208,49,60,133,25,53,60,26,106,56,60,81,194,59,60,44,34,63,60,168,137,66,60,199,248,69,60,134,111,73,60,230,237,76,60,231,115,80,60,134,1,84,60,197,150,87,60,162,51,91,60,28,216,94,60,52,132,98,60,232,55,102,60,56,243,105,60,35,182,109,60,170,128,113,60,202,82,117,60,131,44,121,60,214,13,125,60,96,123,128,60,161,115,130,60,174,111,132,60,134,111,134,60,40,115,136,60,149,122,138,60,205,133,140,60,206,148,142,60,152,167,144,60,44,190,146,60,136,216,148,60,173,246,150,60,154,24,153,60,78,62,155,60,202,103,157,60,13,149,159,60,23,198,161,60,231,250,163,60,125,51,166,60,217,111,168,60,249,175,170,60,223,243,172,60,137,59,175,60,247,134,177,60,40,214,179,60,29,41,182,60,213,127,184,60,80,218,186,60,140,56,189,60,138,154,191,60,74,0,194,60,202,105,196,60,11,215,198,60,12,72,201,60,205,188,203,60,77,53,206,60,140,177,208,60,137,49,211,60,69,181,213,60,189,60,216,60,243,199,218,60,230,86,221,60,149,233,223,60,0,128,226,60,39,26,229,60,8,184,231,60,164,89,234,60,250,254,236,60,9,168,239,60,210,84,242,60,83,5,245,60,141,185,247,60,126,113,250,60,39,45,253,60,134,236,255,60,206,87,1,61,52,187,2,61,117,32,4,61,144,135,5,61,133,240,6,61,84,91,8,61,253,199,9,61,128,54,11,61,219,166,12,61,16,25,14,61,29,141,15,61,3,3,17,61,193,122,18,61,87,244,19,61,197,111,21,61,10,237,22,61,39,108,24,61,26,237,25,61,228,111,27,61,132,244,28,61,251,122,30,61,71,3,32,61,105,141,33,61,96,25,35,61,45,167,36,61,206,54,38,61,67,200,39,61,141,91,41,61,171,240,42,61,156,135,44,61,96,32,46,61,248,186,47,61,99,87,49,61,160,245,50,61,175,149,52,61,144,55,54,61,67,219,55,61,199,128,57,61,28,40,59,61,65,209,60,61,56,124,62,61,254,40,64,61,148,215,65,61,250,135,67,61,47,58,69,61,51,238,70,61,5,164,72,61,166,91,74,61,20,21,76,61,80,208,77,61,90,141,79,61,49,76,81,61,212,12,83,61,68,207,84,61,128,147,86,61,135,89,88,61,90,33,90,61,248,234,91,61,97,182,93,61,148,131,95,61,145,82,97,61,88,35,99,61,232,245,100,61,65,202,102,61,100,160,104,61,78,120,106,61,1,82,108,61,123,45,110,61,188,10,112,61,197,233,113,61,148,202,115,61,41,173,117,61,133,145,119,61,166,119,121,61,140,95,123,61,55,73,125,61,166,52,127,61,237,144,128,61,105,136,129,61,198,128,130,61,5,122,131,61,37,116,132,61,39,111,133,61,9,107,134,61,204,103,135,61,112,101,136,61,244,99,137,61,88,99,138,61,157,99,139,61,193,100,140,61,196,102,141,61,167,105,142,61,106,109,143,61,11,114,144,61,139,119,145,61,234,125,146,61,40,133,147,61,67,141,148,61,61,150,149,61,20,160,150,61,201,170,151,61,92,182,152,61,203,194,153,61,24,208,154,61,66,222,155,61,72,237,156,61,42,253,157,61,233,13,159,61,132,31,160,61,250,49,161,61,76,69,162,61,122,89,163,61,130,110,164,61,101,132,165,61,35,155,166,61,188,178,167,61,47,203,168,61,124,228,169,61,162,254,170,61,163,25,172,61,124,53,173,61,47,82,174,61,187,111,175,61,31,142,176,61,92,173,177,61,113,205,178,61,94,238,179,61,35,16,181,61,192,50,182,61,52,86,183,61,127,122,184,61,160,159,185,61,153,197,186,61,104,236,187,61,13,20,189,61,136,60,190,61,217,101,191,61,255,143,192,61,250,186,193,61,202,230,194,61,111,19,196,61,233,64,197,61,55,111,198,61,89,158,199,61,78,206,200,61,23,255,201,61,179,48,203,61,35,99,204,61,101,150,205,61,121,202,206,61,96,255,207,61,25,53,209,61,164,107,210,61,0,163,211,61,45,219,212,61,44,20,214,61,251,77,215,61,154,136,216,61,10,196,217,61,74,0,219,61,89,61,220,61,56,123,221,61,230,185,222,61,99,249,223,61,174,57,225,61,200,122,226,61,176,188,227,61,102,255,228,61,233,66,230,61,58,135,231,61,88,204,232,61,66,18,234,61,249,88,235,61,124,160,236,61,203,232,237,61,230,49,239,61,204,123,240,61,125,198,241,61,249,17,243,61,63,94,244,61,79,171,245,61,42,249,246,61,206,71,248,61,60,151,249,61,114,231,250,61,114,56,252,61,58,138,253,61,202,220,254,61,17,24,0,62,33,194,0,62,149,108,1,62,108,23,2,62,166,194,2,62,68,110,3,62,69,26,4,62,168,198,4,62,111,115,5,62,152,32,6,62,35,206,6,62,17,124,7,62,98,42,8,62,20,217,8,62,40,136,9,62,157,55,10,62,117,231,10,62,173,151,11,62,71,72,12,62,66,249,12,62,158,170,13,62,91,92,14,62,120,14,15,62,246,192,15,62,213,115,16,62,19,39,17,62,177,218,17,62,175,142,18,62,13,67,19,62,202,247,19,62,231,172,20,62,99,98,21,62,62,24,22,62,120,206,22,62,16,133,23,62,7,60,24,62,92,243,24,62,16,171,25,62,33,99,26,62,145,27,27,62,94,212,27,62,137,141,28,62,17,71,29,62,246,0,30,62,56,187,30,62,215,117,31,62,211,48,32,62,43,236,32,62,224,167,33,62,241,99,34,62,93,32,35,62,38,221,35,62,74,154,36,62,202,87,37,62,165,21,38,62,219,211,38,62,108,146,39,62,88,81,40,62,159,16,41,62,64,208,41,62,59,144,42,62,144,80,43,62,63,17,44,62,72,210,44,62,170,147,45,62,102,85,46,62,122,23,47,62,232,217,47,62,175,156,48,62,206,95,49,62,69,35,50,62,21,231,50,62,61,171,51,62,189,111,52,62,148,52,53,62,195,249,53,62,73,191,54,62,38,133,55,62,91,75,56,62,230,17,57,62,199,216,57,62,255,159,58,62,141,103,59,62,113,47,60,62,171,247,60,62,59,192,61,62,31,137,62,62,89,82,63,62,232,27,64,62,204,229,64,62,5,176,65,62,146,122,66,62,115,69,67,62,168,16,68,62,49,220,68,62,14,168,69,62,62,116,70,62,194,64,71,62,152,13,72,62,193,218,72,62,61,168,73,62,12,118,74,62,44,68,75,62,159,18,76,62,100,225,76,62,122,176,77,62,225,127,78,62,154,79,79,62,164,31,80,62,255,239,80,62,170,192,81,62,166,145,82,62,242,98,83,62,141,52,84,62,121,6,85,62,180,216,85,62,63,171,86,62,25,126,87,62,65,81,88,62,185,36,89,62,126,248,89,62,147,204,90,62,245,160,91,62,165,117,92,62,163,74,93,62,238,31,94,62,135,245,94,62,109,203,95,62,159,161,96,62,30,120,97,62,233,78,98,62,1,38,99,62,100,253,99,62,19,213,100,62,14,173,101,62,84,133,102,62,229,93,103,62,193,54,104,62,231,15,105,62,88,233,105,62,19,195,106,62,24,157,107,62,103,119,108,62,255,81,109,62,224,44,110,62,11,8,111,62,126,227,111,62,58,191,112,62,62,155,113,62,139,119,114,62,31,84,115,62,251,48,116,62,31,14,117,62,138,235,117,62,59,201,118,62,52,167,119,62,115,133,120,62,248,99,121,62,196,66,122,62,213,33,123,62,44,1,124,62,200,224,124,62,170,192,125,62,208,160,126,62,59,129,127,62,245,48,128,62,111,161,128,62,11,18,129,62,201,130,129,62,168,243,129,62,169,100,130,62,204,213,130,62,15,71,131,62,117,184,131,62,251,41,132,62,162,155,132,62,107,13,133,62,84,127,133,62,93,241,133,62,136,99,134,62,210,213,134,62,61,72,135,62,200,186,135,62,116,45,136,62,63,160,136,62,42,19,137,62,52,134,137,62,94,249,137,62,168,108,138,62,17,224,138,62,153,83,139,62,64,199,139,62,6,59,140,62,235,174,140,62,239,34,141,62,17,151,141,62,82,11,142,62,177,127,142,62,46,244,142,62,201,104,143,62,130,221,143,62,89,82,144,62,78,199,144,62,96,60,145,62,143,177,145,62,220,38,146,62,70,156,146,62,205,17,147,62,113,135,147,62,50,253,147,62,16,115,148,62,9,233,148,62,32,95,149,62,82,213,149,62,161,75,150,62,12,194,150,62,146,56,151,62,53,175,151,62,243,37,152,62,204,156,152,62,193,19,153,62,209,138,153,62,252,1,154,62,66,121,154,62,163,240,154,62,31,104,155,62,181,223,155,62,101,87,156,62,48,207,156,62,21,71,157,62,20,191,157,62,45,55,158,62,96,175,158,62,172,39,159,62,18,160,159,62,145,24,160,62,41,145,160,62,218,9,161,62,165,130,161,62,136,251,161,62,132,116,162,62,152,237,162,62,197,102,163,62,10,224,163,62,103,89,164,62,220,210,164,62,105,76,165,62,14,198,165,62,202,63,166,62,158,185,166,62,137,51,167,62,139,173,167,62,164,39,168,62,213,161,168,62,27,28,169,62,121,150,169,62,237,16,170,62,119,139,170,62,24,6,171,62,206,128,171,62,155,251,171,62,125,118,172,62,117,241,172,62,130,108,173,62,165,231,173,62,221,98,174,62,42,222,174,62,140,89,175,62,2,213,175,62,142,80,176,62,46,204,176,62,226,71,177,62,170,195,177,62,135,63,178,62,119,187,178,62,124,55,179,62,148,179,179,62,191,47,180,62,254,171,180,62,80,40,181,62,181,164,181,62,45,33,182,62,184,157,182,62,85,26,183,62,5,151,183,62,199,19,184,62,156,144,184,62,130,13,185,62,123,138,185,62,133,7,186,62,161,132,186,62,206,1,187,62,13,127,187,62,93,252,187,62,190,121,188,62,48,247,188,62,178,116,189,62,70,242,189,62,233,111,190,62,157,237,190,62,98,107,191,62,54,233,191,62,26,103,192,62,14,229,192,62,17,99,193,62,36,225,193,62,70,95,194,62,119,221,194,62,184,91,195,62,7,218,195,62,100,88,196,62,209,214,196,62,75,85,197,62,212,211,197,62,107,82,198,62,16,209,198,62,195,79,199,62,132,206,199,62,82,77,200,62,45,204,200,62,21,75,201,62,11,202,201,62,13,73,202,62,29,200,202,62,56,71,203,62,97,198,203,62,149,69,204,62,214,196,204,62,34,68,205,62,123,195,205,62,223,66,206,62,79,194,206,62,202,65,207,62,81,193,207,62,226,64,208,62,127,192,208,62,38,64,209,62,216,191,209,62,148,63,210,62,91,191,210,62,44,63,211,62,7,191,211,62,235,62,212,62,218,190,212,62,210,62,213,62,211,190,213,62,222,62,214,62,242,190,214,62,15,63,215,62,53,191,215,62,99,63,216,62,154,191,216,62,217,63,217,62,32,192,217,62,112,64,218,62,199,192,218,62,38,65,219,62,140,193,219,62,250,65,220,62,112,194,220,62,236,66,221,62,112,195,221,62,250,67,222,62])
.concat([139,196,222,62,34,69,223,62,192,197,223,62,100,70,224,62,14,199,224,62,189,71,225,62,115,200,225,62,46,73,226,62,239,201,226,62,181,74,227,62,127,203,227,62,79,76,228,62,36,205,228,62,253,77,229,62,219,206,229,62,190,79,230,62,164,208,230,62,142,81,231,62,125,210,231,62,111,83,232,62,100,212,232,62,93,85,233,62,89,214,233,62,89,87,234,62,91,216,234,62,96,89,235,62,104,218,235,62,114,91,236,62,126,220,236,62,141,93,237,62,158,222,237,62,176,95,238,62,196,224,238,62,218,97,239,62,241,226,239,62,10,100,240,62,35,229,240,62,62,102,241,62,89,231,241,62,116,104,242,62,145,233,242,62,173,106,243,62,202,235,243,62,230,108,244,62,3,238,244,62,31,111,245,62,59,240,245,62,86,113,246,62,112,242,246,62,137,115,247,62,161,244,247,62,184,117,248,62,206,246,248,62,226,119,249,62,244,248,249,62,4,122,250,62,18,251,250,62,30,124,251,62,40,253,251,62,47,126,252,62,52,255,252,62,54,128,253,62,52,1,254,62,48,130,254,62,40,3,255,62,29,132,255,62,135,2,0,63,254,66,0,63,115,131,0,63,230,195,0,63,86,4,1,63,197,68,1,63,49,133,1,63,155,197,1,63,3,6,2,63,103,70,2,63,202,134,2,63,42,199,2,63,135,7,3,63,225,71,3,63,56,136,3,63,141,200,3,63,222,8,4,63,44,73,4,63,119,137,4,63,191,201,4,63,3,10,5,63,68,74,5,63,130,138,5,63,188,202,5,63,242,10,6,63,36,75,6,63,83,139,6,63,126,203,6,63,165,11,7,63,199,75,7,63,230,139,7,63,1,204,7,63,23,12,8,63,41,76,8,63,54,140,8,63,63,204,8,63,67,12,9,63,67,76,9,63,62,140,9,63,52,204,9,63,37,12,10,63,18,76,10,63,249,139,10,63,219,203,10,63,184,11,11,63,144,75,11,63,98,139,11,63,47,203,11,63,246,10,12,63,184,74,12,63,116,138,12,63,43,202,12,63,219,9,13,63,134,73,13,63,43,137,13,63,202,200,13,63,98,8,14,63,245,71,14,63,129,135,14,63,7,199,14,63,135,6,15,63,0,70,15,63,114,133,15,63,222,196,15,63,67,4,16,63,161,67,16,63,249,130,16,63,73,194,16,63,147,1,17,63,213,64,17,63,17,128,17,63,69,191,17,63,114,254,17,63,151,61,18,63,181,124,18,63,203,187,18,63,218,250,18,63,225,57,19,63,225,120,19,63,216,183,19,63,200,246,19,63,176,53,20,63,143,116,20,63,103,179,20,63,54,242,20,63,253,48,21,63,188,111,21,63,114,174,21,63,32,237,21,63,197,43,22,63,98,106,22,63,246,168,22,63,129,231,22,63,3,38,23,63,125,100,23,63,237,162,23,63,84,225,23,63,178,31,24,63,7,94,24,63,83,156,24,63,149,218,24,63,206,24,25,63,253,86,25,63,35,149,25,63,63,211,25,63,82,17,26,63,90,79,26,63,89,141,26,63,78,203,26,63,57,9,27,63,25,71,27,63,240,132,27,63,188,194,27,63,126,0,28,63,54,62,28,63,227,123,28,63,134,185,28,63,30,247,28,63,172,52,29,63,47,114,29,63,167,175,29,63,20,237,29,63,118,42,30,63,206,103,30,63,26,165,30,63,91,226,30,63,145,31,31,63,188,92,31,63,219,153,31,63,239,214,31,63,247,19,32,63,244,80,32,63,230,141,32,63,203,202,32,63,165,7,33,63,115,68,33,63,53,129,33,63,235,189,33,63,150,250,33,63,52,55,34,63,198,115,34,63,75,176,34,63,197,236,34,63,50,41,35,63,146,101,35,63,230,161,35,63,46,222,35,63,105,26,36,63,151,86,36,63,185,146,36,63,205,206,36,63,213,10,37,63,208,70,37,63,190,130,37,63,158,190,37,63,114,250,37,63,56,54,38,63,241,113,38,63,157,173,38,63,59,233,38,63,204,36,39,63,79,96,39,63,197,155,39,63,45,215,39,63,135,18,40,63,211,77,40,63,18,137,40,63,66,196,40,63,101,255,40,63,121,58,41,63,128,117,41,63,120,176,41,63,98,235,41,63,62,38,42,63,11,97,42,63,202,155,42,63,122,214,42,63,28,17,43,63,175,75,43,63,52,134,43,63,170,192,43,63,16,251,43,63,105,53,44,63,178,111,44,63,236,169,44,63,23,228,44,63,51,30,45,63,64,88,45,63,61,146,45,63,43,204,45,63,10,6,46,63,218,63,46,63,154,121,46,63,74,179,46,63,235,236,46,63,124,38,47,63,254,95,47,63,112,153,47,63,210,210,47,63,36,12,48,63,102,69,48,63,152,126,48,63,186,183,48,63,204,240,48,63,205,41,49,63,191,98,49,63,160,155,49,63,113,212,49,63,49,13,50,63,225,69,50,63,128,126,50,63,15,183,50,63,141,239,50,63,251,39,51,63,87,96,51,63,163,152,51,63,222,208,51,63,8,9,52,63,34,65,52,63,42,121,52,63,33,177,52,63,7,233,52,63,219,32,53,63,159,88,53,63,81,144,53,63,242,199,53,63,129,255,53,63,255,54,54,63,108,110,54,63,198,165,54,63,16,221,54,63,71,20,55,63,109,75,55,63,129,130,55,63,131,185,55,63,116,240,55,63,82,39,56,63,30,94,56,63,217,148,56,63,129,203,56,63,23,2,57,63,155,56,57,63,13,111,57,63,108,165,57,63,185,219,57,63,244,17,58,63,28,72,58,63,50,126,58,63,53,180,58,63,38,234,58,63,4,32,59,63,207,85,59,63,135,139,59,63,45,193,59,63,192,246,59,63,64,44,60,63,173,97,60,63,7,151,60,63,78,204,60,63,130,1,61,63,163,54,61,63,177,107,61,63,171,160,61,63,146,213,61,63,102,10,62,63,39,63,62,63,212,115,62,63,110,168,62,63,244,220,62,63,103,17,63,63,198,69,63,63,17,122,63,63,73,174,63,63,109,226,63,63,126,22,64,63,122,74,64,63,99,126,64,63,56,178,64,63,248,229,64,63,165,25,65,63,62,77,65,63,195,128,65,63,52,180,65,63,144,231,65,63,216,26,66,63,13,78,66,63,44,129,66,63,56,180,66,63,47,231,66,63,18,26,67,63,224,76,67,63,154,127,67,63,64,178,67,63,208,228,67,63,77,23,68,63,180,73,68,63,7,124,68,63,69,174,68,63,111,224,68,63,131,18,69,63,131,68,69,63,110,118,69,63,68,168,69,63,5,218,69,63,177,11,70,63,72,61,70,63,202,110,70,63,55,160,70,63,143,209,70,63,210,2,71,63,255,51,71,63,23,101,71,63,26,150,71,63,8,199,71,63,224,247,71,63,163,40,72,63,81,89,72,63,233,137,72,63,107,186,72,63,216,234,72,63,48,27,73,63,114,75,73,63,158,123,73,63,181,171,73,63,181,219,73,63,161,11,74,63,118,59,74,63,54,107,74,63,224,154,74,63,116,202,74,63,242,249,74,63,90,41,75,63,173,88,75,63,233,135,75,63,15,183,75,63,32,230,75,63,26,21,76,63,254,67,76,63,204,114,76,63,132,161,76,63,38,208,76,63,177,254,76,63,38,45,77,63,133,91,77,63,206,137,77,63,0,184,77,63,28,230,77,63,34,20,78,63,17,66,78,63,234,111,78,63,172,157,78,63,88,203,78,63,238,248,78,63,108,38,79,63,213,83,79,63,38,129,79,63,97,174,79,63,134,219,79,63,147,8,80,63,138,53,80,63,107,98,80,63,52,143,80,63,231,187,80,63,131,232,80,63,8,21,81,63,119,65,81,63,206,109,81,63,15,154,81,63,57,198,81,63,76,242,81,63,71,30,82,63,44,74,82,63,250,117,82,63,177,161,82,63,81,205,82,63,218,248,82,63,76,36,83,63,166,79,83,63,234,122,83,63,22,166,83,63,44,209,83,63,42,252,83,63,17,39,84,63,224,81,84,63,153,124,84,63,58,167,84,63,196,209,84,63,54,252,84,63,146,38,85,63,214,80,85,63,2,123,85,63,24,165,85,63,22,207,85,63,252,248,85,63,204,34,86,63,131,76,86,63,36,118,86,63,172,159,86,63,30,201,86,63,120,242,86,63,186,27,87,63,229,68,87,63,248,109,87,63,244,150,87,63,216,191,87,63,165,232,87,63,90,17,88,63,248,57,88,63,126,98,88,63,236,138,88,63,67,179,88,63,130,219,88,63,169,3,89,63,185,43,89,63,177,83,89,63,145,123,89,63,90,163,89,63,11,203,89,63,164,242,89,63,37,26,90,63,143,65,90,63,225,104,90,63,27,144,90,63,62,183,90,63,72,222,90,63,59,5,91,63,22,44,91,63,217,82,91,63,133,121,91,63,24,160,91,63,148,198,91,63,248,236,91,63,68,19,92,63,120,57,92,63,149,95,92,63,153,133,92,63,134,171,92,63,91,209,92,63,24,247,92,63,189,28,93,63,74,66,93,63,191,103,93,63,28,141,93,63,98,178,93,63,143,215,93,63,165,252,93,63,162,33,94,63,136,70,94,63,86,107,94,63,11,144,94,63,169,180,94,63,47,217,94,63,157,253,94,63,243,33,95,63,49,70,95,63,88,106,95,63,102,142,95,63,92,178,95,63,59,214,95,63,1,250,95,63,175,29,96,63,70,65,96,63,196,100,96,63,43,136,96,63,122,171,96,63,176,206,96,63,207,241,96,63,214,20,97,63,197,55,97,63,155,90,97,63,90,125,97,63,1,160,97,63,144,194,97,63,8,229,97,63,103,7,98,63,174,41,98,63,221,75,98,63,245,109,98,63,244,143,98,63,220,177,98,63,171,211,98,63,99,245,98,63,3,23,99,63,139,56,99,63,251,89,99,63,83,123,99,63,147,156,99,63,188,189,99,63,204,222,99,63,197,255,99,63,166,32,100,63,110,65,100,63,32,98,100,63,185,130,100,63,58,163,100,63,164,195,100,63,245,227,100,63,47,4,101,63,82,36,101,63,92,68,101,63,78,100,101,63,41,132,101,63,236,163,101,63,151,195,101,63,43,227,101,63,167,2,102,63,11,34,102,63,87,65,102,63,139,96,102,63,168,127,102,63,174,158,102,63,155,189,102,63,113,220,102,63,47,251,102,63,214,25,103,63,101,56,103,63,220,86,103,63,59,117,103,63,132,147,103,63,180,177,103,63,205,207,103,63,206,237,103,63,184,11,104,63,138,41,104,63,69,71,104,63,233,100,104,63,116,130,104,63,233,159,104,63,69,189,104,63,139,218,104,63,185,247,104,63,207,20,105,63,207,49,105,63,182,78,105,63,135,107,105,63,64,136,105,63,225,164,105,63,108,193,105,63,223,221,105,63,59,250,105,63,127,22,106,63,172,50,106,63,195,78,106,63,193,106,106,63,169,134,106,63,121,162,106,63,51,190,106,63,213,217,106,63,96,245,106,63,212,16,107,63,48,44,107,63,118,71,107,63,165,98,107,63,188,125,107,63,189,152,107,63,167,179,107,63,121,206,107,63,53,233,107,63,218,3,108,63,104,30,108,63,223,56,108,63,63,83,108,63,136,109,108,63,187,135,108,63,214,161,108,63,219,187,108,63,201,213,108,63,161,239,108,63,97,9,109,63,11,35,109,63,159,60,109,63,27,86,109,63,129,111,109,63,209,136,109,63,9,162,109,63,44,187,109,63,56,212,109,63,45,237,109,63,12,6,110,63,212,30,110,63,134,55,110,63,33,80,110,63,166,104,110,63,21,129,110,63,110,153,110,63,176,177,110,63,220,201,110,63,241,225,110,63,241,249,110,63,218,17,111,63,173,41,111,63,106,65,111,63,16,89,111,63,161,112,111,63,28,136,111,63,128,159,111,63,207,182,111,63,7,206,111,63,42,229,111,63,54,252,111,63,45,19,112,63,14,42,112,63,217,64,112,63,142,87,112,63,46,110,112,63,184,132,112,63,43,155,112,63,138,177,112,63,210,199,112,63,5,222,112,63,35,244,112,63,42,10,113,63,29,32,113,63,249,53,113,63,193,75,113,63,114,97,113,63,15,119,113,63,150,140,113,63,7,162,113,63,99,183,113,63,170,204,113,63,220,225,113,63,249,246,113,63,0,12,114,63,242,32,114,63,207,53,114,63,151,74,114,63,73,95,114,63,231,115,114,63,112,136,114,63,227,156,114,63,66,177,114,63,140,197,114,63,193,217,114,63,225,237,114,63,236,1,115,63,227,21,115,63,197,41,115,63,146,61,115,63,74,81,115,63,238,100,115,63,125,120,115,63,248,139,115,63,94,159,115,63,175,178,115,63,236,197,115,63,21,217,115,63,41,236,115,63,41,255,115,63,21,18,116,63,236,36,116,63,175,55,116,63,94,74,116,63,248,92,116,63,127,111,116,63,241,129,116,63,80,148,116,63,154,166,116,63,208,184,116,63,242,202,116,63,1,221,116,63,251,238,116,63,226,0,117,63,181,18,117,63,116,36,117,63,31,54,117,63,183,71,117,63,59,89,117,63,171,106,117,63,8,124,117,63,81,141,117,63,135,158,117,63,169,175,117,63,184,192,117,63,179,209,117,63,155,226,117,63,112,243,117,63,50,4,118,63,224,20,118,63,123,37,118,63,3,54,118,63,120,70,118,63,217,86,118,63,40,103,118,63,100,119,118,63,140,135,118,63,162,151,118,63,165,167,118,63,149,183,118,63,114,199,118,63,61,215,118,63,245,230,118,63,154,246,118,63,44,6,119,63,172,21,119,63,26,37,119,63,117,52,119,63,189,67,119,63,243,82,119,63,22,98,119,63,40,113,119,63,39,128,119,63,19,143,119,63,238,157,119,63,182,172,119,63,108,187,119,63,16,202,119,63,162,216,119,63,34,231,119,63,144,245,119,63,236,3,120,63,55,18,120,63,111,32,120,63,150,46,120,63,170,60,120,63,174,74,120,63,159,88,120,63,127,102,120,63,77,116,120,63,10,130,120,63,181,143,120,63,79,157,120,63,215,170,120,63,78,184,120,63,180,197,120,63,8,211,120,63,76,224,120,63,126,237,120,63,158,250,120,63,174,7,121,63,173,20,121,63,155,33,121,63,119,46,121,63,67,59,121,63,254,71,121,63,168,84,121,63,66,97,121,63,202,109,121,63,66,122,121,63,169,134,121,63,0,147,121,63,70,159,121,63,124,171,121,63,161,183,121,63,181,195,121,63,186,207,121,63,173,219,121,63,145,231,121,63,100,243,121,63,40,255,121,63,219,10,122,63,126,22,122,63,16,34,122,63,147,45,122,63,6,57,122,63,105,68,122,63,188,79,122,63,255,90,122,63,51,102,122,63,86,113,122,63,106,124,122,63,111,135,122,63,99,146,122,63,72,157,122,63,30,168,122,63,228,178,122,63,155,189,122,63,66,200,122,63,218,210,122,63,99,221,122,63,221,231,122,63,71,242,122,63,162,252,122,63,238,6,123,63,43,17,123,63,89,27,123,63,120,37,123,63,137,47,123,63,138,57,123,63,124,67,123,63,96,77,123,63,53,87,123,63,252,96,123,63,179,106,123,63,92,116,123,63,247,125,123,63,131,135,123,63,1,145,123,63,112,154,123,63,209,163,123,63,36,173,123,63,104,182,123,63,158,191,123,63,198,200,123,63,224,209,123,63,236,218,123,63,234,227,123,63,218,236,123,63,188,245,123,63,144,254,123,63,86,7,124,63,14,16,124,63,185,24,124,63,86,33,124,63,230,41,124,63,104,50,124,63,220,58,124,63,67,67,124,63,156,75,124,63,232,83,124,63,39,92,124,63,88,100,124,63,124,108,124,63,147,116,124,63,157,124,124,63,153,132,124,63,137,140,124,63,107,148,124,63,65,156,124,63,9,164,124,63,197,171,124,63,116,179,124,63,22,187,124,63,172,194,124,63,52,202,124,63,176,209,124,63,32,217,124,63,131,224,124,63,217,231,124,63,35,239,124,63,97,246,124,63,146,253,124,63,183,4,125,63,208,11,125,63,221,18,125,63,221,25,125,63,209,32,125,63,185,39,125,63,150,46,125,63,102,53,125,63,42,60,125,63,227,66,125,63,143,73,125,63,48,80,125,63,197,86,125,63,78,93,125,63,204,99,125,63,62,106,125,63,165,112,125,63,0,119,125,63,80,125,125,63,148,131,125,63,205,137,125,63,251,143,125,63,29,150,125,63,52,156,125,63,64,162,125,63,65,168,125,63,55,174,125,63,34,180,125,63,2,186,125,63,215,191,125,63,161,197,125,63,96,203,125,63,21,209,125,63,190,214,125,63,93,220,125,63,242,225,125,63,124,231,125,63,251,236,125,63,112,242,125,63,218,247,125,63,58,253,125,63,143,2,126,63,219,7,126,63,28,13,126,63,82,18,126,63,127,23,126,63,161,28,126,63,186,33,126,63,200,38,126,63,204,43,126,63,199,48,126,63,183,53,126,63,158,58,126,63,123,63,126,63,78,68,126,63,23,73,126,63,215,77,126,63,141,82,126,63,58,87,126,63,221,91,126,63,118,96,126,63,6,101,126,63,141,105,126,63,10,110,126,63,126,114,126,63,233,118,126,63,75,123,126,63,164,127,126,63,243,131,126,63,57,136,126,63,119,140,126,63,171,144,126,63,214,148,126,63,249,152,126,63,18,157,126,63,35,161,126,63,44,165,126,63,43,169,126,63,34,173,126,63,16,177,126,63,246,180,126,63,211,184,126,63,167,188,126,63,115,192,126,63,55,196,126,63,243,199,126,63,166,203,126,63,81,207,126,63,243,210,126,63,142,214,126,63,32,218,126,63,171,221,126,63,45,225,126,63,167,228,126,63,26,232,126,63,132,235,126,63,231,238,126,63,66,242,126,63,149,245,126,63,224,248,126,63,36,252,126,63,96,255,126,63,148,2,127,63,193,5,127,63,230,8,127,63,4,12,127,63,27,15,127,63,42,18,127,63,50,21,127,63,50,24,127,63,43,27,127,63,29,30,127,63,8,33,127,63,236,35,127,63,201,38,127,63,158,41,127,63,109,44,127,63,53,47,127,63,246,49,127,63,175,52,127,63,99,55,127,63,15,58,127,63,181,60,127,63,83,63,127,63,236,65,127,63,125,68,127,63,8,71,127,63,141,73,127,63,11,76,127,63,131,78,127,63,244,80,127,63,95,83,127,63,195,85,127,63,33,88,127,63,121,90,127,63,203,92,127,63,23,95,127,63,92,97,127,63,155,99,127,63,213,101,127,63,8,104,127,63,54,106,127,63,93,108,127,63,127,110,127,63,155,112,127,63,177,114,127,63,193,116,127,63,203,118,127,63,208,120,127,63,207,122,127,63,201,124,127,63,189,126,127,63,171,128,127,63,148,130,127,63,120,132,127,63,86,134,127,63,47,136,127,63,2,138,127,63,209,139,127,63,153,141,127,63,93,143,127,63,28,145,127,63,213,146,127,63,137,148,127,63,57,150,127,63,227,151,127,63,136,153,127,63,40,155,127,63,196,156,127,63,90,158,127,63,236,159,127,63,121,161,127,63,1,163,127,63,132,164,127,63,3,166,127,63,125,167,127,63,242,168,127,63,99,170,127,63,207,171,127,63,55,173,127,63,154,174,127,63,249,175,127,63,84,177,127,63,170,178,127,63,251,179,127,63,73,181,127,63,146,182,127,63,215,183,127,63,24,185,127,63,85,186,127,63,141,187,127,63,193,188,127,63,242,189,127,63,30,191,127,63,71,192,127,63,107,193,127,63,140,194,127,63,168,195,127,63,193,196,127,63,214,197,127,63,231,198,127,63,245,199,127,63,255,200,127,63,5,202,127,63,7,203,127,63,6,204,127,63,1,205,127,63,249,205,127,63,237,206,127,63,222,207,127,63,203,208,127,63,181,209,127,63,156,210,127,63,127,211,127,63,95,212,127,63,59,213,127,63,20,214,127,63,234,214,127,63,189,215,127,63,141,216,127,63,90,217,127,63,35,218,127,63,233,218,127,63,173,219,127,63,109,220,127,63,43,221,127,63,229,221,127,63,156,222,127,63,81,223,127,63,3,224,127,63,178,224,127,63,94,225,127,63,7,226,127,63,174,226,127,63,82,227,127,63,243,227,127,63,146,228,127,63,46,229,127,63,199,229,127,63,94,230,127,63,242,230,127,63,132,231,127,63,19,232,127,63,160,232,127,63,42,233,127,63,178,233,127,63,56,234,127,63,187,234,127,63,60,235,127,63,187,235,127,63,55,236,127,63,177,236,127,63,41,237,127,63,159,237,127,63,18,238,127,63,132,238,127,63,243,238,127,63,96,239,127,63,204,239,127,63,53,240,127,63,156,240,127,63,1,241,127,63,101,241,127,63,198,241,127,63,37,242,127,63,131,242,127,63,222,242,127,63,56,243,127,63,144,243,127,63,231,243,127,63,59,244,127,63,142,244,127,63,223,244,127,63,46,245,127,63,124,245,127,63,200,245,127,63,19,246,127,63,91,246,127,63,163,246,127,63,233,246,127,63,45,247,127,63,111,247,127,63,177,247,127,63,240,247,127,63,47,248,127,63,108,248,127,63,167,248,127,63,225,248,127,63,26,249,127,63,82,249,127,63,136,249,127,63,188,249,127,63,240,249,127,63,34,250,127,63,83,250,127,63,131,250,127,63,178,250,127,63,224,250,127,63,12,251,127,63,55,251,127,63,97,251,127,63,138,251,127,63,178,251,127,63,217,251,127,63,255,251,127,63,36,252,127,63,72,252,127,63,107,252,127,63,141,252,127,63,173,252,127,63,205,252,127,63,237,252,127,63,11,253,127,63,40,253,127,63,69,253,127,63,96,253,127,63,123,253,127,63,149,253,127,63,174,253,127,63,199,253,127,63,222,253,127,63,245,253,127,63,12,254,127,63,33,254,127,63,54,254,127,63,74,254,127,63,93,254,127,63,112,254,127,63,130,254,127,63,148,254,127,63,165,254,127,63,181,254,127,63,197,254,127,63,212,254,127,63,227,254,127,63,241,254,127,63,254,254,127,63,11,255,127,63,24,255,127,63,36,255,127,63,47,255,127,63,59,255,127,63,69,255,127,63,79,255,127,63,89,255,127,63,99,255,127,63,108,255,127,63,116,255,127,63,124,255,127,63,132,255,127,63,140,255,127,63,147,255,127,63,154,255,127,63,160,255,127,63,166,255,127,63,172,255,127,63,178,255,127,63,183,255,127,63,188,255,127,63,193,255,127,63,197,255,127,63,202,255,127,63,206,255,127,63,209,255,127,63,213,255,127,63,216,255,127,63,220,255,127,63,223,255,127,63,225,255,127,63,228,255,127,63,230,255,127,63,233,255,127,63,235,255,127,63,237,255,127,63,239,255,127,63,240,255,127,63,242,255,127,63,243,255,127,63,245,255,127,63,246,255,127,63,247,255,127,63,248,255,127,63,249,255,127,63,250,255,127,63,251,255,127,63,251,255,127,63,252,255,127,63,252,255,127,63,253,255,127,63,253,255,127,63,254,255,127,63,254,255,127,63,254,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,5,12,120,56,50,131,11,58,118,186,193,58,226,203,61,59,38,207,156,59,139,32,234,59,245,102,35,60,63,100,89,60,184,127,139,60,59,23,174,60,239,114,212,60,96,140,254,60,45,46,22,61,114,237,46,61,155,127,73,61,220,223,101,61,123,4,130,61,159,250,145,61,71,207,162,61,38,127,180,61,173,6,199,61,16,98,218,61,63,141,238,61,244,193,1,62,185,160,12,62,128,224,23,62,182,126,35,62,166,120,47,62,116,203,59,62,34,116,72,62,141,111,85,62,107,186,98,62,83,81,112,62,180,48,126,62,110,42,134,62,252,92,141,62,9,174,148,62,138,27,156,62,100,163,163,62,112,67,171,62,119,249,178,62,54,195,186,62,93,158,194,62,147,136,202,62,118,127,210,62,154,128,218,62,142,137,226,62,217,151,234,62,2,169,242,62,139,186,250,62,251,100,1,63,99,106,5,63,65,108,9,63,89,105,13,63,116,96,17,63,94,80,21,63,231,55,25,63,231,21,29,63,58,233,32,63,197,176,36,63,116,107,40,63,62,24,44,63,35,182,47,63,43,68,51,63,109,193,54,63,10,45,58,63,48,134,61,63,26,204,64,63,17,254,67,63,107,27,71,63,142,35,74,63,238,21,77,63,15,242,79,63,132,183,82,63,239,101,85,63,3,253,87,63,129,124,90,63,60,228,92,63,21,52,95,63,254,107,97,63,246,139,99,63,14,148,101,63,98,132,103,63,33,93,105,63,133,30,107,63,213,200,108,63,103,92,110,63,155,217,111,63,224,64,113,63,172,146,114,63,131,207,115,63,241,247,116,63,139,12,118,63,239,13,119,63,193,252,119,63,172,217,120,63,99,165,121,63,155,96,122,63,15,12,123,63,124,168,123,63,163,54,124,63,71,183,124,63,41,43,125,63,13,147,125,63,183,239,125,63,229,65,126,63,89,138,126,63,205,201,126,63,251,0,127,63,150,48,127,63,78,89,127,63,205,123,127,63,182,152,127,63,167,176,127,63,53,196,127,63,239,211,127,63,91,224,127,63,245,233,127,63,51,241,127,63,127,246,127,63,59,250,127,63,190,252,127,63,84,254,127,63,64,255,127,63,186,255,127,63,238,255,127,63,254,255,127,63,0,0,128,63,171,15,120,53,24,135,11,55,225,201,193,55,107,233,61,56,128,247,156,56,187,122,234,56,24,191,35,57,213,0,90,57,56,1,140,57,229,225,174,57,88,162,213,57,60,33,0,58,24,97,23,58,175,144,48,58,243,175,75,58,212,190,104,58,159,222,131,58,143,85,148,58,48,196,165,58,119,42,184,58,90,136,203,58,204,221,223,58,191,42,245,58,148,183,5,59,124,85,17,59,16,111,29,59,73,4,42,59,31,21,55,59,138,161,68,59,129,169,82,59,252,44,97,59,241,43,112,59,88,166,127,59,19,206,135,59,169,6,144,59,233,124,152,59,204,48,161,59,79,34,170,59,106,81,179,59,26,190,188,59,86,104,198,59,26,80,208,59,95,117,218,59,31,216,228,59,83,120,239,59,244,85,250,59,126,184,2,60,177,100,8,60,145,47,14,60,25,25,20,60,70,33,26,60,19,72,32,60,126,141,38,60,129,241,44,60,25,116,51,60,65,21,58,60,246,212,64,60,50,179,71,60,243,175,78,60,50,203,85,60,235,4,93,60,26,93,100,60,186,211,107,60,198,104,115,60,58,28,123,60,7,119,129,60,33,111,133,60,102,118,137,60,212,140,141,60,105,178,145,60,33,231,149,60,251,42,154,60,243,125,158,60,6,224,162,60,50,81,167,60,115,209,171,60,199,96,176,60,43,255,180,60,154,172,185,60,19,105,190,60,146,52,195,60,20,15,200,60,149,248,204,60,19,241,209,60,137,248,214,60,245,14,220,60,83,52,225,60,160,104,230,60,215,171,235,60,246,253,240,60,249,94,246,60,220,206,251,60,205,166,0,61,153,109,3,61,207,59,6,61,109,17,9,61,114,238,11,61,220,210,14,61,167,190,17,61,211,177,20,61,94,172,23,61,68,174,26,61,133,183,29,61,30,200,32,61,12,224,35,61,78,255,38,61,225,37,42,61,196,83,45,61,243,136,48,61,109,197,51,61,47,9,55,61,55,84,58,61,130,166,61,61,15,0,65,61,218,96,68,61,226,200,71,61,35,56,75,61,156,174,78,61,73,44,82,61,40,177,85,61,55,61,89,61,115,208,92,61,217,106,96,61,103,12,100,61,25,181,103,61,238,100,107,61,227,27,111,61,244,217,114,61,30,159,118,61,96,107,122,61,182,62,126,61,143,12,129,61,73,253,130,61,138,241,132,61,79,233,134,61,150,228,136,61,94,227,138,61,167,229,140,61,109,235,142,61,175,244,144,61,109,1,147,61,164,17,149,61,83,37,151,61,120,60,153,61,17,87,155,61,30,117,157,61,155,150,159,61,136,187,161,61,226,227,163,61,169,15,166,61,218,62,168,61,116,113,170,61,116,167,172,61,218,224,174,61,162,29,177,61,205,93,179,61,87,161,181,61,62,232,183,61,130,50,186,61,32,128,188,61,22,209,190,61,98,37,193,61,2,125,195,61,245,215,197,61,57,54,200,61,203,151,202,61,169,252,204,61,211,100,207,61,68,208,209,61,252,62,212,61,249,176,214,61,56,38,217,61,184,158,219,61,117,26,222,61,111,153,224,61,163,27,227,61,14,161,229,61,175,41,232,61,132,181,234,61,138,68,237,61,191,214,239,61,33,108,242,61,174,4,245,61,99,160,247,61,62,63,250,61,61,225,252,61,93,134,255,61,78,23,1,62,252,108,2,62,56,196,3,62,255,28,5,62,81,119,6,62,45,211,7,62,145,48,9,62,125,143,10,62,238,239,11,62,228,81,13,62,94,181,14,62,89,26,16,62,214,128,17,62,210,232,18,62,77,82,20,62,69,189,21,62,184,41,23,62,166,151,24,62,13,7,26,62,236,119,27,62,65,234,28,62,11,94,30,62,73,211,31,62,250,73,33,62,28,194,34,62,173,59,36,62,172,182,37,62,24,51,39,62,240,176,40,62,50,48,42,62,220,176,43,62,238,50,45,62,101,182,46,62,64,59,48,62,126,193,49,62,30,73,51,62,29,210,52,62,123,92,54,62,54,232,55,62,76,117,57,62,187,3,59,62,131,147,60,62,162,36,62,62,22,183,63,62,222,74,65,62,248,223,66,62,98,118,68,62,28,14,70,62,35,167,71,62,117,65,73,62,18,221,74,62,247,121,76,62,35,24,78,62,149,183,79,62,74,88,81,62,66,250,82,62,121,157,84,62,240,65,86,62,163,231,87,62,146,142,89,62,186,54,91,62,26,224,92,62,177,138,94,62,124,54,96,62,122,227,97,62,169,145,99,62,7,65,101,62,147,241,102,62,75,163,104,62,44,86,106,62,54,10,108,62,102,191,109,62,187,117,111,62,51,45,113,62,204,229,114,62,132,159,116,62,90,90,118,62,75,22,120,62,85,211,121,62,120,145,123,62,176,80,125,62,253,16,127,62,46,105,128,62,101,74,129,62,36,44,130,62,105,14,131,62,52,241,131,62,130,212,132,62,84,184,133,62,169,156,134,62,127,129,135,62,213,102,136,62,171,76,137,62,255,50,138,62,209,25,139,62,32,1,140,62,233,232,140,62,46,209,141,62,236,185,142,62,34,163,143,62,208,140,144,62,244,118,145,62,142,97,146,62,156,76,147,62,29,56,148,62,17,36,149,62,118,16,150,62,76,253,150,62,144,234,151,62,67,216,152,62,99,198,153,62,239,180,154,62,230,163,155,62,71,147,156,62,17,131,157,62,67,115,158,62,219,99,159,62,218,84,160,62,60,70,161,62,3,56,162,62,43,42,163,62,181,28,164,62,160,15,165,62,233,2,166,62,145,246,166,62,149,234,167,62,245,222,168,62,176,211,169,62,197,200,170,62,50,190,171,62,246,179,172,62,17,170,173,62,129,160,174,62,69,151,175,62,91,142,176,62,196,133,177,62,125,125,178,62,133,117,179,62,220,109,180,62,128,102,181,62,112,95,182,62,171,88,183,62,47,82,184,62,252,75,185,62,17,70,186,62,108,64,187,62,11,59,188,62,239,53,189,62,22,49,190,62,126,44,191,62,38,40,192,62,13,36,193,62,51,32,194,62,150,28,195,62,52,25,196,62,12,22,197,62,30,19,198,62,104,16,199,62,233,13,200,62,159,11,201,62,138,9,202,62,169,7,203,62,249,5,204,62,123,4,205,62,44,3,206,62,11,2,207,62,24,1,208,62,81,0,209,62,181,255,209,62,66,255,210,62,248,254,211,62,213,254,212,62,216,254,213,62,255,254,214,62,75,255,215,62,184,255,216,62,71,0,218,62,245,0,219,62,195,1,220,62,173,2,221,62,180,3,222,62,214,4,223,62,17,6,224,62,101,7,225,62,208,8,226,62,81,10,227,62,231,11,228,62,144,13,229,62,76,15,230,62,25,17,231,62,245,18,232,62,224,20,233,62,217,22,234,62,221,24,235,62,236,26,236,62,5,29,237,62,39,31,238,62,79,33,239,62,125,35,240,62,176,37,241,62,230,39,242,62,31,42,243,62,88,44,244,62,145,46,245,62,200,48,246,62,253,50,247,62,45,53,248,62,88,55,249,62,124,57,250,62,153,59,251,62,172,61,252,62,181,63,253,62,179,65,254,62,163,67,255,62,195,34,0,63,173,163,0,63,142,36,1,63,102,165,1,63,53,38,2,63,250,166,2,63,180,39,3,63,99,168,3,63,5,41,4,63,155,169,4,63,36,42,5,63,159,170,5,63,12,43,6,63,105,171,6,63,183,43,7,63,244,171,7,63,32,44,8,63,59,172,8,63,68,44,9,63,58,172,9,63,28,44,10,63,235,171,10,63,164,43,11,63,73,171,11,63,216,42,12,63,80,170,12,63,177,41,13,63,251,168,13,63,44,40,14,63,69,167,14,63,68,38,15,63,41,165,15,63,243,35,16,63,162,162,16,63,53,33,17,63,172,159,17,63,5,30,18,63,65,156,18,63,95,26,19,63,94,152,19,63,61,22,20,63,252,147,20,63,155,17,21,63,24,143,21,63,116,12,22,63,173,137,22,63,195,6,23,63,182,131,23,63,133,0,24,63,46,125,24,63,179,249,24,63,18,118,25,63,74,242,25,63,91,110,26,63,69,234,26,63,6,102,27,63,159,225,27,63,14,93,28,63,84,216,28,63,111,83,29,63,95,206,29,63,36,73,30,63,188,195,30,63,40,62,31,63,102,184,31,63,119,50,32,63,90,172,32,63,14,38,33,63,146,159,33,63,230,24,34,63,10,146,34,63,253,10,35,63,190,131,35,63,77,252,35,63,169,116,36,63,211,236,36,63,200,100,37,63,138,220,37,63,22,84,38,63,110,203,38,63,143,66,39,63,122,185,39,63,47,48,40,63,172,166,40,63,241,28,41,63,254,146,41,63,210,8,42,63,108,126,42,63,205,243,42,63,243,104,43,63,223,221,43,63,143,82,44,63,3,199,44,63,59,59,45,63,54,175,45,63,244,34,46,63,116,150,46,63,182,9,47,63,185,124,47,63,125,239,47,63,1,98,48,63,69,212,48,63,72,70,49,63,10,184,49,63,139,41,50,63,202,154,50,63,198,11,51,63,127,124,51,63,246,236,51,63,40,93,52,63,22,205,52,63,191,60,53,63,36,172,53,63,66,27,54,63,27,138,54,63,174,248,54,63,249,102,55,63,254,212,55,63,187,66,56,63,47,176,56,63,91,29,57,63,63,138,57,63,217,246,57,63,41,99,58,63,48,207,58,63,236,58,59,63,93,166,59,63,130,17,60,63,93,124,60,63,235,230,60,63,44,81,61,63,33,187,61,63,201,36,62,63,35,142,62,63,48,247,62,63,238,95,63,63,94,200,63,63,126,48,64,63,80,152,64,63,209,255,64,63,3,103,65,63,228,205,65,63,117,52,66,63,181,154,66,63,163,0,67,63,64,102,67,63,139,203,67,63,131,48,68,63,41,149,68,63,124,249,68,63,123,93,69,63,39,193,69,63,127,36,70,63,132,135,70,63,51,234,70,63,142,76,71,63,148,174,71,63,68,16,72,63,159,113,72,63,164,210,72,63,83,51,73,63,172,147,73,63,174,243,73,63,89,83,74,63,173,178,74,63,169,17,75,63,77,112,75,63,154,206,75,63,143,44,76,63,43,138,76,63,110,231,76,63,89,68,77,63,234,160,77,63,34,253,77,63,0,89,78,63,133,180,78,63,176,15,79,63,128,106,79,63,246,196,79,63,18,31,80,63,210,120,80,63,56,210,80,63,66,43,81,63,242,131,81,63,69,220,81,63,61,52,82,63,217,139,82,63,24,227,82,63,252,57,83,63,131,144,83,63,174,230,83,63,123,60,84,63,236,145,84,63,0,231,84,63,183,59,85,63,16,144,85,63,12,228,85,63,170,55,86,63,235,138,86,63,206,221,86,63,83,48,87,63,121,130,87,63,66,212,87,63,172,37,88,63,184,118,88,63,101,199,88,63,180,23,89,63,164,103,89,63,53,183,89,63,104,6,90,63,59,85,90,63,175,163,90,63,197,241,90,63,123,63,91,63,210,140,91,63,201,217,91,63,97,38,92,63,154,114,92,63,115,190,92,63,237,9,93,63,7,85,93,63,194,159,93,63,29,234,93,63,24,52,94,63,179,125,94,63,239,198,94,63,203,15,95,63,72,88,95,63,100,160,95,63,33,232,95,63,126,47,96,63,123,118,96,63,24,189,96,63,85,3,97,63,51,73,97,63,177,142,97,63,207,211,97,63,141,24,98,63,236,92,98,63,235,160,98,63,138,228,98,63,202,39,99,63,170,106,99,63,42,173,99,63,75,239,99,63,13,49,100,63,111,114,100,63,114,179,100,63,21,244,100,63,90,52,101,63,63,116,101,63,197,179,101,63,236,242,101,63,180,49,102,63,29,112,102,63,39,174,102,63,211,235,102,63,32,41,103,63,15,102,103,63,159,162,103,63,209,222,103,63,164,26,104,63,26,86,104,63,49,145,104,63,235,203,104,63,71,6,105,63,69,64,105,63,230,121,105,63,42,179,105,63,16,236,105,63,153,36,106,63,197,92,106,63,148,148,106,63,7,204,106,63,29,3,107,63,214,57,107,63,52,112,107,63,53,166,107,63,218,219,107,63,36,17,108,63,18,70,108,63,164,122,108,63,220,174,108,63,184,226,108,63,57,22,109,63,96,73,109,63,44,124,109,63,157,174,109,63,181,224,109,63,115,18,110,63,214,67,110,63,225,116,110,63,146,165,110,63,233,213,110,63,232,5,111,63,142,53,111,63,219,100,111,63,209,147,111,63,110,194,111,63,179,240,111,63,160,30,112,63,54,76,112,63,117,121,112,63,93,166,112,63,239,210,112,63,41,255,112,63,14,43,113,63,156,86,113,63,213,129,113,63,184,172,113,63,70,215,113,63,127,1,114,63,99,43,114,63,243,84,114,63,46,126,114,63,21,167,114,63,169,207,114,63,233,247,114,63,214,31,115,63,113,71,115,63,184,110,115,63,173,149,115,63,80,188,115,63,162,226,115,63,161,8,116,63,80,46,116,63,174,83,116,63,187,120,116,63,119,157,116,63,228,193,116,63,1,230,116,63,206,9,117,63,76,45,117,63,123,80,117,63,92,115,117,63,238,149,117,63,51,184,117,63,42,218,117,63,211,251,117,63,48,29,118,63,64,62,118,63,3,95,118,63,122,127,118,63,166,159,118,63,134,191,118,63,27,223,118,63,101,254,118,63,101,29,119,63,27,60,119,63,135,90,119,63,169,120,119,63,131,150,119,63,19,180,119,63,91,209,119,63,91,238,119,63,20,11,120,63,132,39,120,63,174,67,120,63,145,95,120,63,46,123,120,63,132,150,120,63,149,177,120,63,96,204,120,63,231,230,120,63,41,1,121,63,38,27,121,63,223,52,121,63,85,78,121,63,136,103,121,63,120,128,121,63,37,153,121,63,144,177,121,63,185,201,121,63,161,225,121,63,72,249,121,63,174,16,122,63,212,39,122,63,185,62,122,63,96,85,122,63,198,107,122,63,238,129,122,63,216,151,122,63,131,173,122,63,241,194,122,63,33,216,122,63,20,237,122,63,202,1,123,63,68,22,123,63,130,42,123,63,133,62,123,63,77,82,123,63,217,101,123,63,43,121,123,63,68,140,123,63,34,159,123,63,200,177,123,63,52,196,123,63,104,214,123,63,99,232,123,63,39,250,123,63,180,11,124,63,9,29,124,63,40,46,124,63,17,63,124,63,196,79,124,63,65,96,124,63,137,112,124,63,156,128,124,63,124,144,124,63,39,160,124,63,158,175,124,63,226,190,124,63,244,205,124,63,211,220,124,63,128,235,124,63,251,249,124,63,69,8,125,63,94,22,125,63,71,36,125,63,255,49,125,63,136,63,125,63,225,76,125,63,11,90,125,63,7,103,125,63,212,115,125,63,115,128,125,63,229,140,125,63,42,153,125,63,66,165,125,63,46,177,125,63,238,188,125,63,130,200,125,63,235,211,125,63,41,223,125,63,61,234,125,63,38,245,125,63,230,255,125,63,124,10,126,63,234,20,126,63,47,31,126,63,75,41,126,63,64,51,126,63,13,61,126,63,180,70,126,63,51,80,126,63,140,89,126,63,191,98,126,63,205,107,126,63,181,116,126,63,120,125,126,63,23,134,126,63,146,142,126,63,233,150,126,63,28,159,126,63,44,167,126,63,26,175,126,63,229,182,126,63,142,190,126,63,22,198,126,63,124,205,126,63,194,212,126,63,231,219,126,63,235,226,126,63,208,233,126,63,149,240,126,63,59,247,126,63,195,253,126,63,44,4,127,63,118,10,127,63,163,16,127,63,179,22,127,63,165,28,127,63,123,34,127,63,52,40,127,63,210,45,127,63,83,51,127,63,186,56,127,63,5,62,127,63,53,67,127,63,75,72,127,63,72,77,127,63,42,82,127,63,243,86,127,63,163,91,127,63,58,96,127,63,185,100,127,63,32,105,127,63,111,109,127,63,166,113,127,63,199,117,127,63,208,121,127,63,196,125,127,63,161,129,127,63,104,133,127,63,25,137,127,63,182,140,127,63,61,144,127,63,176,147,127,63,14,151,127,63,89,154,127,63,143,157,127,63,179,160,127,63,195,163,127,63,192,166,127,63,171,169,127,63,132,172,127,63,74,175,127,63,255,177,127,63,163,180,127,63,53,183,127,63,183,185,127,63,40,188,127,63,137,190,127,63,217,192,127,63,26,195,127,63,76,197,127,63,111,199,127,63,130,201,127,63,135,203,127,63,126,205,127,63,102,207,127,63,65,209,127,63,14,211,127,63,205,212,127,63,128,214,127,63,38,216,127,63,191,217,127,63,76,219,127,63,204,220,127,63,65,222,127,63,170,223,127,63,8,225,127,63,91,226,127,63,163,227,127,63,224,228,127,63,19,230,127,63,59,231,127,63,90,232,127,63,110,233,127,63,122,234,127,63,124,235,127,63,116,236,127,63,100,237,127,63,75,238,127,63,42,239,127,63,1,240,127,63,207,240,127,63,149,241,127,63,84,242,127,63,12,243,127,63,188,243,127,63,101,244,127,63,7,245,127,63,162,245,127,63,55,246,127,63,198,246,127,63,78,247,127,63,209,247,127,63,77,248,127,63,196,248,127,63,54,249,127,63,162,249,127,63,9,250,127,63,108,250,127,63,201,250,127,63,34,251,127,63,118,251,127,63,198,251,127,63,18,252,127,63,89,252,127,63,157,252,127,63,221,252,127,63,26,253,127,63,83,253,127,63,136,253,127,63,187,253,127,63,234,253,127,63,22,254,127,63,64,254,127,63,103,254,127,63,139,254,127,63,173,254,127,63,204,254,127,63,234,254,127,63,5,255,127,63,30,255,127,63,53,255,127,63,74,255,127,63,94,255,127,63,112,255,127,63,128,255,127,63,143,255,127,63,157,255,127,63,169,255,127,63,180,255,127,63,191,255,127,63,200,255,127,63,208,255,127,63,215,255,127,63,221,255,127,63,227,255,127,63,232,255,127,63,236,255,127,63,239,255,127,63,243,255,127,63,245,255,127,63,248,255,127,63,249,255,127,63,251,255,127,63,252,255,127,63,253,255,127,63,254,255,127,63,255,255,127,63,255,255,127,63,255,255,127,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,168,9,120,57,17,119,11,59,135,139,193,59,74,113,61,60,148,82,156,60,94,8,233,60,42,83,34,61,74,118,87,61,138,227,137,61,7,140,171,61,34,154,208,61,108,239,248,61,164,52,18,62,100,112,41,62,65,21,66,62,67,11,92,62,47,56,119,62,197,191,137,62,92,97,152,62,135,112,167,62,4,220,182,62,188,145,198,62,231,126,214,62,48,144,230,62,227,177,246,62,13,104,3,63,121,107,11,63,98,89,19,63,42,40,27,63,137,206,34,63,166,67,42,63,49,127,49,63,126,121,56,63,153,43,63,63,92,143,69,63,127,159,75,63,165,87,81,63,104,180,86,63,89,179,91,63,8,83,96,63,252,146,100,63,177,115,104,63,138,246,107,63,198,29,111,63,109,236,113,63,62,102,116,63,154,143,118,63,104,109,120,63,3,5,122,63,26,92,123,63,153,120,124,63,143,96,125,63,17,26,126,63,39,171,126,63,176,25,127,63,74,107,127,63,68,165,127,63,132,204,127,63,123,229,127,63,17,244,127,63,158,251,127,63,219,254,127,63,218,255,127,63,0,0,128,63,60,12,120,54,253,134,11,56,19,201,193,56,248,231,61,57,148,245,156,57,115,118,234,57,238,186,35,58,113,249,89,58,32,251,139,58,96,216,174,58,34,148,213,58,3,23,0,59,209,82,23,59,65,125,48,59,21,150,75,59,8,157,104,59,233,200,131,59,20,58,148,59,218,161,165,59,16,0,184,59,136,84,203,59,16,159,223,59,118,223,244,59,194,138,5,60,128,32,17,60,217,48,29,60,172,187,41,60,219,192,54,60,67,64,68,60,194,57,82,60,52,173,96,60,115,154,111,60])
.concat([88,1,127,60,222,112,135,60,186,157,143,60,42,7,152,60,25,173,160,60,112,143,169,60,23,174,178,60,246,8,188,60,243,159,197,60,245,114,207,60,225,129,217,60,156,204,227,60,10,83,238,60,14,21,249,60,70,9,2,61,177,165,7,61,187,95,13,61,81,55,19,61,102,44,25,61,230,62,31,61,195,110,37,61,233,187,43,61,71,38,50,61,202,173,56,61,97,82,63,61,247,19,70,61,121,242,76,61,210,237,83,61,240,5,91,61,187,58,98,61,32,140,105,61,8,250,112,61,93,132,120,61,132,21,128,61,249,246,131,61,130,230,135,61,19,228,139,61,159,239,143,61,26,9,148,61,119,48,152,61,169,101,156,61,163,168,160,61,88,249,164,61,186,87,169,61,186,195,173,61,76,61,178,61,95,196,182,61,230,88,187,61,209,250,191,61,18,170,196,61,152,102,201,61,85,48,206,61,56,7,211,61,48,235,215,61,47,220,220,61,34,218,225,61,248,228,230,61,161,252,235,61,11,33,241,61,35,82,246,61,217,143,251,61,13,109,0,62,105,24,3,62,247,201,5,62,174,129,8,62,133,63,11,62,113,3,14,62,104,205,16,62,96,157,19,62,79,115,22,62,42,79,25,62,232,48,28,62,124,24,31,62,221,5,34,62,255,248,36,62,215,241,39,62,90,240,42,62,125,244,45,62,51,254,48,62,114,13,52,62,45,34,55,62,88,60,58,62,232,91,61,62,208,128,64,62,3,171,67,62,118,218,70,62,26,15,74,62,229,72,77,62,199,135,80,62,181,203,83,62,162,20,87,62,127,98,90,62,63,181,93,62,213,12,97,62,50,105,100,62,73,202,103,62,12,48,107,62,108,154,110,62,92,9,114,62,203,124,117,62,173,244,120,62,241,112,124,62,138,241,127,62,52,187,129,62,190,127,131,62,91,70,133,62,4,15,135,62,176,217,136,62,89,166,138,62,245,116,140,62,126,69,142,62,234,23,144,62,50,236,145,62,78,194,147,62,54,154,149,62,224,115,151,62,70,79,153,62,93,44,155,62,31,11,157,62,130,235,158,62,127,205,160,62,11,177,162,62,31,150,164,62,177,124,166,62,186,100,168,62,47,78,170,62,9,57,172,62,62,37,174,62,198,18,176,62,150,1,178,62,167,241,179,62,238,226,181,62,100,213,183,62,254,200,185,62,179,189,187,62,122,179,189,62,74,170,191,62,25,162,193,62,221,154,195,62,142,148,197,62,34,143,199,62,142,138,201,62,203,134,203,62,205,131,205,62,140,129,207,62,253,127,209,62,24,127,211,62,210,126,213,62,33,127,215,62,252,127,217,62,88,129,219,62,45,131,221,62,112,133,223,62,23,136,225,62,25,139,227,62,108,142,229,62,5,146,231,62,219,149,233,62,228,153,235,62,21,158,237,62,102,162,239,62,203,166,241,62,59,171,243,62,173,175,245,62,21,180,247,62,107,184,249,62,164,188,251,62,181,192,253,62,150,196,255,62,30,228,0,63,207,229,1,63,88,231,2,63,182,232,3,63,226,233,4,63,215,234,5,63,146,235,6,63,12,236,7,63,66,236,8,63,45,236,9,63,202,235,10,63,19,235,11,63,4,234,12,63,151,232,13,63,200,230,14,63,145,228,15,63,239,225,16,63,220,222,17,63,84,219,18,63,81,215,19,63,208,210,20,63,202,205,21,63,61,200,22,63,34,194,23,63,117,187,24,63,50,180,25,63,85,172,26,63,215,163,27,63,182,154,28,63,236,144,29,63,117,134,30,63,77,123,31,63,110,111,32,63,214,98,33,63,126,85,34,63,100,71,35,63,130,56,36,63,212,40,37,63,87,24,38,63,5,7,39,63,219,244,39,63,213,225,40,63,239,205,41,63,36,185,42,63,113,163,43,63,209,140,44,63,64,117,45,63,188,92,46,63,63,67,47,63,199,40,48,63,78,13,49,63,211,240,49,63,80,211,50,63,195,180,51,63,39,149,52,63,122,116,53,63,184,82,54,63,220,47,55,63,229,11,56,63,206,230,56,63,149,192,57,63,54,153,58,63,174,112,59,63,249,70,60,63,21,28,61,63,255,239,61,63,179,194,62,63,48,148,63,63,113,100,64,63,116,51,65,63,55,1,66,63,182,205,66,63,239,152,67,63,224,98,68,63,134,43,69,63,222,242,69,63,230,184,70,63,156,125,71,63,253,64,72,63,7,3,73,63,184,195,73,63,14,131,74,63,6,65,75,63,159,253,75,63,215,184,76,63,172,114,77,63,28,43,78,63,38,226,78,63,199,151,79,63,253,75,80,63,201,254,80,63,39,176,81,63,22,96,82,63,150,14,83,63,164,187,83,63,63,103,84,63,103,17,85,63,26,186,85,63,86,97,86,63,28,7,87,63,105,171,87,63,62,78,88,63,152,239,88,63,120,143,89,63,221,45,90,63,198,202,90,63,50,102,91,63,33,0,92,63,147,152,92,63,134,47,93,63,251,196,93,63,242,88,94,63,105,235,94,63,98,124,95,63,219,11,96,63,213,153,96,63,80,38,97,63,76,177,97,63,201,58,98,63,199,194,98,63,70,73,99,63,71,206,99,63,202,81,100,63,208,211,100,63,88,84,101,63,100,211,101,63,244,80,102,63,9,205,102,63,163,71,103,63,195,192,103,63,107,56,104,63,154,174,104,63,82,35,105,63,147,150,105,63,96,8,106,63,184,120,106,63,157,231,106,63,16,85,107,63,19,193,107,63,166,43,108,63,203,148,108,63,132,252,108,63,209,98,109,63,180,199,109,63,48,43,110,63,68,141,110,63,244,237,110,63,64,77,111,63,42,171,111,63,181,7,112,63,225,98,112,63,177,188,112,63,38,21,113,63,67,108,113,63,10,194,113,63,123,22,114,63,155,105,114,63,106,187,114,63,234,11,115,63,31,91,115,63,9,169,115,63,172,245,115,63,9,65,116,63,35,139,116,63,252,211,116,63,151,27,117,63,245,97,117,63,26,167,117,63,8,235,117,63,193,45,118,63,72,111,118,63,159,175,118,63,202,238,118,63,201,44,119,63,161,105,119,63,84,165,119,63,228,223,119,63,85,25,120,63,168,81,120,63,226,136,120,63,3,191,120,63,16,244,120,63,11,40,121,63,247,90,121,63,215,140,121,63,173,189,121,63,125,237,121,63,73,28,122,63,20,74,122,63,226,118,122,63,181,162,122,63,144,205,122,63,118,247,122,63,107,32,123,63,112,72,123,63,138,111,123,63,186,149,123,63,5,187,123,63,109,223,123,63,245,2,124,63,160,37,124,63,113,71,124,63,108,104,124,63,147,136,124,63,233,167,124,63,114,198,124,63,48,228,124,63,38,1,125,63,89,29,125,63,201,56,125,63,124,83,125,63,115,109,125,63,178,134,125,63,60,159,125,63,19,183,125,63,60,206,125,63,184,228,125,63,139,250,125,63,184,15,126,63,66,36,126,63,44,56,126,63,120,75,126,63,43,94,126,63,70,112,126,63,204,129,126,63,194,146,126,63,41,163,126,63,4,179,126,63,86,194,126,63,35,209,126,63,109,223,126,63,55,237,126,63,131,250,126,63,85,7,127,63,175,19,127,63,148,31,127,63,7,43,127,63,10,54,127,63,160,64,127,63,205,74,127,63,146,84,127,63,242,93,127,63,239,102,127,63,141,111,127,63,206,119,127,63,181,127,127,63,67,135,127,63,124,142,127,63,98,149,127,63,247,155,127,63,61,162,127,63,56,168,127,63,233,173,127,63,83,179,127,63,120,184,127,63,90,189,127,63,252,193,127,63,95,198,127,63,134,202,127,63,116,206,127,63,41,210,127,63,168,213,127,63,244,216,127,63,13,220,127,63,247,222,127,63,179,225,127,63,67,228,127,63,168,230,127,63,229,232,127,63,252,234,127,63,237,236,127,63,188,238,127,63,105,240,127,63,246,241,127,63,101,243,127,63,183,244,127,63,238,245,127,63,11,247,127,63,16,248,127,63,254,248,127,63,214,249,127,63,155,250,127,63,76,251,127,63,236,251,127,63,124,252,127,63,252,252,127,63,110,253,127,63,211,253,127,63,44,254,127,63,121,254,127,63,189,254,127,63,247,254,127,63,42,255,127,63,84,255,127,63,120,255,127,63,150,255,127,63,175,255,127,63,195,255,127,63,211,255,127,63,224,255,127,63,234,255,127,63,241,255,127,63,246,255,127,63,250,255,127,63,253,255,127,63,254,255,127,63,255,255,127,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,8,64,0,0,136,118,0,0,136,100,0,0,136,64,0,0,136,119,0,0,136,102,0,0,136,68,0,0,8,0,0,0,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,112,194,0,0,120,194,0,0,120,194,0,0,130,194,0,0,146,194,0,0,138,194,0,0,136,194,0,0,136,194,0,0,134,194,0,0,140,194,0,0,140,194,0,0,144,194,0,0,148,194,0,0,150,194,0,0,158,194,0,0,158,194,0,0,160,194,0,0,166,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,84,194,0,0,116,194,0,0,132,194,0,0,132,194,0,0,136,194,0,0,134,194,0,0,140,194,0,0,152,194,0,0,152,194,0,0,144,194,0,0,146,194,0,0,150,194,0,0,152,194,0,0,156,194,0,0,158,194,0,0,166,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,20,194,0,0,20,194,0,0,20,194,0,0,20,194,0,0,20,194,0,0,20,194,0,0,20,194,0,0,20,194,0,0,24,194,0,0,32,194,0,0,40,194,0,0,56,194,0,0,64,194,0,0,84,194,0,0,92,194,0,0,120,194,0,0,130,194,0,0,104,194,0,0,96,194,0,0,96,194,0,0,116,194,0,0,112,194,0,0,130,194,0,0,134,194,0,0,138,194,0,0,142,194,0,0,154,194,0,0,154,194,0,0,156,194,0,0,160,194,0,0,164,194,0,0,168,194,0,0,176,194,0,0,186,194,0,0,196,194,0,0,212,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,200,193,0,0,200,193,0,0,200,193,0,0,200,193,0,0,200,193,0,0,200,193,0,0,200,193,0,0,200,193,0,0,200,193,0,0,208,193,0,0,216,193,0,0,232,193,0,0,0,194,0,0,24,194,0,0,64,194,0,0,80,194,0,0,80,194,0,0,72,194,0,0,64,194,0,0,64,194,0,0,76,194,0,0,80,194,0,0,88,194,0,0,112,194,0,0,134,194,0,0,134,194,0,0,132,194,0,0,136,194,0,0,138,194,0,0,146,194,0,0,146,194,0,0,152,194,0,0,160,194,0,0,162,194,0,0,162,194,0,0,170,194,0,0,170,194,0,0,172,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,128,193,0,0,128,193,0,0,128,193,0,0,128,193,0,0,128,193,0,0,128,193,0,0,128,193,0,0,128,193,0,0,136,193,0,0,152,193,0,0,160,193,0,0,176,193,0,0,208,193,0,0,224,193,0,0,248,193,0,0,32,194,0,0,60,194,0,0,28,194,0,0,28,194,0,0,32,194,0,0,40,194,0,0,44,194,0,0,60,194,0,0,76,194,0,0,100,194,0,0,80,194,0,0,92,194,0,0,92,194,0,0,112,194,0,0,104,194,0,0,120,194,0,0,124,194,0,0,140,194,0,0,134,194,0,0,138,194,0,0,144,194,0,0,146,194,0,0,154,194,0,0,160,194,0,0,164,194,0,0,166,194,0,0,174,194,0,0,180,194,0,0,188,194,0,0,196,194,0,0,208,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,0,193,0,0,32,193,0,0,48,193,0,0,112,193,0,0,152,193,0,0,200,193,0,0,240,193,0,0,8,194,0,0,248,193,0,0,240,193,0,0,248,193,0,0,232,193,0,0,0,194,0,0,12,194,0,0,40,194,0,0,64,194,0,0,40,194,0,0,48,194,0,0,56,194,0,0,72,194,0,0,72,194,0,0,76,194,0,0,80,194,0,0,108,194,0,0,88,194,0,0,92,194,0,0,92,194,0,0,104,194,0,0,120,194,0,0,124,194,0,0,132,194,0,0,144,194,0,0,146,194,0,0,152,194,0,0,150,194,0,0,156,194,0,0,160,194,0,0,160,194,0,0,162,194,0,0,168,194,0,0,176,194,0,0,180,194,0,0,188,194,0,0,196,194,0,0,202,194,0,0,212,194,0,0,220,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,134,194,0,0,134,194,0,0,134,194,0,0,152,194,0,0,144,194,0,0,142,194,0,0,148,194,0,0,152,194,0,0,152,194,0,0,150,194,0,0,156,194,0,0,158,194,0,0,158,194,0,0,162,194,0,0,166,194,0,0,172,194,0,0,178,194,0,0,186,194,0,0,194,194,0,0,200,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,64,194,0,0,76,194,0,0,92,194,0,0,108,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,134,194,0,0,132,194,0,0,136,194,0,0,138,194,0,0,140,194,0,0,148,194,0,0,158,194,0,0,154,194,0,0,154,194,0,0,156,194,0,0,160,194,0,0,162,194,0,0,164,194,0,0,168,194,0,0,172,194,0,0,176,194,0,0,182,194,0,0,190,194,0,0,200,194,0,0,216,194,0,0,232,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,20,194,0,0,20,194,0,0,36,194,0,0,48,194,0,0,64,194,0,0,76,194,0,0,104,194,0,0,120,194,0,0,112,194,0,0,100,194,0,0,108,194,0,0,108,194,0,0,112,194,0,0,124,194,0,0,130,194,0,0,144,194,0,0,142,194,0,0,140,194,0,0,144,194,0,0,148,194,0,0,154,194,0,0,152,194,0,0,156,194,0,0,162,194,0,0,162,194,0,0,160,194,0,0,166,194,0,0,172,194,0,0,182,194,0,0,192,194,0,0,200,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,224,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,240,193,0,0,0,194,0,0,0,194,0,0,4,194,0,0,12,194,0,0,36,194,0,0,68,194,0,0,72,194,0,0,68,194,0,0,60,194,0,0,64,194,0,0,64,194,0,0,80,194,0,0,76,194,0,0,100,194,0,0,130,194,0,0,116,194,0,0,108,194,0,0,116,194,0,0,128,194,0,0,138,194,0,0,140,194,0,0,148,194,0,0,154,194,0,0,154,194,0,0,156,194,0,0,162,194,0,0,168,194,0,0,170,194,0,0,174,194,0,0,180,194,0,0,184,194,0,0,192,194,0,0,200,194,0,0,214,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,152,193,0,0,152,193,0,0,152,193,0,0,152,193,0,0,152,193,0,0,152,193,0,0,152,193,0,0,152,193,0,0,160,193,0,0,168,193,0,0,184,193,0,0,216,193,0,0,240,193,0,0,12,194,0,0,16,194,0,0,36,194,0,0,56,194,0,0,48,194,0,0,40,194,0,0,32,194,0,0,36,194,0,0,36,194,0,0,44,194,0,0,64,194,0,0,92,194,0,0,84,194,0,0,80,194,0,0,84,194,0,0,96,194,0,0,108,194,0,0,104,194,0,0,112,194,0,0,134,194,0,0,132,194,0,0,138,194,0,0,142,194,0,0,144,194,0,0,150,194,0,0,158,194,0,0,162,194,0,0,168,194,0,0,174,194,0,0,180,194,0,0,186,194,0,0,194,194,0,0,202,194,0,0,214,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,16,193,0,0,16,193,0,0,16,193,0,0,16,193,0,0,16,193,0,0,16,193,0,0,16,193,0,0,16,193,0,0,48,193,0,0,64,193,0,0,64,193,0,0,112,193,0,0,128,193,0,0,160,193,0,0,184,193,0,0,240,193,0,0,20,194,0,0,8,194,0,0,4,194,0,0,8,194,0,0,248,193,0,0,0,194,0,0,0,194,0,0,24,194,0,0,60,194,0,0,48,194,0,0,36,194,0,0,32,194,0,0,60,194,0,0,68,194,0,0,56,194,0,0,56,194,0,0,104,194,0,0,72,194,0,0,72,194,0,0,88,194,0,0,104,194,0,0,120,194,0,0,128,194,0,0,134,194,0,0,134,194,0,0,140,194,0,0,144,194,0,0,152,194,0,0,158,194,0,0,166,194,0,0,174,194,0,0,182,194,0,0,192,194,0,0,200,194,0,0,208,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,124,194,0,0,128,194,0,0,132,194,0,0,134,194,0,0,132,194,0,0,136,194,0,0,150,194,0,0,144,194,0,0,152,194,0,0,150,194,0,0,152,194,0,0,156,194,0,0,158,194,0,0,164,194,0,0,168,194,0,0,170,194,0,0,180,194,0,0,188,194,0,0,202,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,108,194,0,0,112,194,0,0,112,194,0,0,116,194,0,0,124,194,0,0,132,194,0,0,142,194,0,0,136,194,0,0,140,194,0,0,140,194,0,0,142,194,0,0,144,194,0,0,144,194,0,0,150,194,0,0,162,194,0,0,156,194,0,0,158,194,0,0,164,194,0,0,166,194,0,0,172,194,0,0,180,194,0,0,194,194,0,0,206,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,84,194,0,0,84,194,0,0,84,194,0,0,84,194,0,0,84,194,0,0,84,194,0,0,84,194,0,0,84,194,0,0,84,194,0,0,88,194,0,0,92,194,0,0,100,194,0,0,96,194,0,0,100,194,0,0,92,194,0,0,116,194,0,0,130,194,0,0,112,194,0,0,112,194,0,0,120,194,0,0,124,194,0,0,124,194,0,0,132,194,0,0,136,194,0,0,148,194,0,0,146,194,0,0,150,194,0,0,150,194,0,0,156,194,0,0,160,194,0,0,160,194,0,0,164,194,0,0,170,194,0,0,180,194,0,0,192,194,0,0,202,194,0,0,216,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,56,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,60,194,0,0,64,194,0,0,76,194,0,0,100,194,0,0,76,194,0,0,68,194,0,0,72,194,0,0,76,194,0,0,84,194,0,0,88,194,0,0,108,194,0,0,132,194,0,0,112,194,0,0,120,194,0,0,134,194,0,0,134,194,0,0,140,194,0,0,144,194,0,0,150,194,0,0,152,194,0,0,156,194,0,0,162,194,0,0,170,194,0,0,176,194,0,0,188,194,0,0,194,194,0,0,208,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,16,194,0,0,28,194,0,0,36,194,0,0,40,194,0,0,40,194,0,0,28,194,0,0,24,194,0,0,36,194,0,0,44,194,0,0,80,194,0,0,48,194,0,0,32,194,0,0,28,194,0,0,20,194,0,0,20,194,0,0,32,194,0,0,60,194,0,0,88,194,0,0,72,194,0,0,64,194,0,0,72,194,0,0,92,194,0,0,116,194,0,0,108,194,0,0,120,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,138,194,0,0,138,194,0,0,146,194,0,0,148,194,0,0,148,194,0,0,150,194,0,0,154,194,0,0,158,194,0,0,164,194,0,0,174,194,0,0,182,194,0,0,190,194,0,0,200,194,0,0,216,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,224,193,0,0,208,193,0,0,192,193,0,0,176,193,0,0,160,193,0,0,160,193,0,0,184,193,0,0,232,193,0,0,240,193,0,0,248,193,0,0,224,193,0,0,216,193,0,0,224,193,0,0,224,193,0,0,224,193,0,0,12,194,0,0,32,194,0,0,4,194,0,0,0,194,0,0,232,193,0,0,240,193,0,0,240,193,0,0,240,193,0,0,20,194,0,0,52,194,0,0,36,194,0,0,20,194,0,0,24,194,0,0,52,194,0,0,60,194,0,0,60,194,0,0,64,194,0,0,84,194,0,0,68,194,0,0,64,194,0,0,72,194,0,0,68,194,0,0,68,194,0,0,76,194,0,0,80,194,0,0,104,194,0,0,96,194,0,0,100,194,0,0,96,194,0,0,112,194,0,0,116,194,0,0,120,194,0,0,140,194,0,0,144,194,0,0,148,194,0,0,156,194,0,0,166,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,212,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,210,194,0,0,200,194,0,0,190,194,0,0,182,194,0,0,174,194,0,0,166,194,0,0,160,194,0,0,156,194,0,0,152,194,0,0,156,194,0,0,156,194,0,0,162,194,0,0,166,194,0,0,170,194,0,0,172,194,0,0,170,194,0,0,172,194,0,0,174,194,0,0,180,194,0,0,194,194,0,0,214,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,170,194,0,0,162,194,0,0,154,194,0,0,146,194,0,0,140,194,0,0,134,194,0,0,134,194,0,0,136,194,0,0,150,194,0,0,146,194,0,0,140,194,0,0,138,194,0,0,140,194,0,0,144,194,0,0,150,194,0,0,158,194,0,0,168,194,0,0,166,194,0,0,168,194,0,0,172,194,0,0,176,194,0,0,178,194,0,0,178,194,0,0,186,194,0,0,196,194,0,0,210,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,170,194,0,0,160,194,0,0,152,194,0,0,142,194,0,0,136,194,0,0,136,194,0,0,130,194,0,0,124,194,0,0,124,194,0,0,120,194,0,0,120,194,0,0,128,194,0,0,130,194,0,0,128,194,0,0,116,194,0,0,120,194,0,0,124,194,0,0,128,194,0,0,132,194,0,0,136,194,0,0,146,194,0,0,146,194,0,0,148,194,0,0,150,194,0,0,152,194,0,0,162,194,0,0,166,194,0,0,170,194,0,0,176,194,0,0,178,194,0,0,184,194,0,0,190,194,0,0,200,194,0,0,216,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,160,194,0,0,150,194,0,0,142,194,0,0,136,194,0,0,130,194,0,0,124,194,0,0,120,194,0,0,116,194,0,0,116,194,0,0,116,194,0,0,116,194,0,0,108,194,0,0,96,194,0,0,100,194,0,0,84,194,0,0,72,194,0,0,104,194,0,0,80,194,0,0,72,194,0,0,72,194,0,0,80,194,0,0,84,194,0,0,88,194,0,0,104,194,0,0,134,194,0,0,124,194,0,0,134,194,0,0,136,194,0,0,144,194,0,0,150,194,0,0,156,194,0,0,160,194,0,0,162,194,0,0,162,194,0,0,164,194,0,0,170,194,0,0,178,194,0,0,180,194,0,0,186,194,0,0,194,194,0,0,202,194,0,0,214,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,130,194,0,0,116,194,0,0,108,194,0,0,100,194,0,0,96,194,0,0,92,194,0,0,92,194,0,0,96,194,0,0,96,194,0,0,100,194,0,0,92,194,0,0,84,194,0,0,80,194,0,0,60,194,0,0,48,194,0,0,48,194,0,0,72,194,0,0,48,194,0,0,36,194,0,0,28,194,0,0,28,194,0,0,40,194,0,0,32,194,0,0,56,194,0,0,76,194,0,0,68,194,0,0,72,194,0,0,84,194,0,0,88,194,0,0,124,194,0,0,112,194,0,0,116,194,0,0,120,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,140,194,0,0,146,194,0,0,148,194,0,0,150,194,0,0,152,194,0,0,150,194,0,0,158,194,0,0,170,194,0,0,178,194,0,0,182,194,0,0,192,194,0,0,204,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,80,194,0,0,72,194,0,0,68,194,0,0,68,194,0,0,64,194,0,0,64,194,0,0,64,194,0,0,68,194,0,0,72,194,0,0,72,194,0,0,68,194,0,0,56,194,0,0,44,194,0,0,28,194,0,0,12,194,0,0,4,194,0,0,24,194,0,0,16,194,0,0,0,194,0,0,232,193,0,0,0,194,0,0,0,194,0,0,0,194,0,0,12,194,0,0,48,194,0,0,28,194,0,0,24,194,0,0,24,194,0,0,56,194,0,0,72,194,0,0,52,194,0,0,56,194,0,0,84,194,0,0,72,194,0,0,72,194,0,0,72,194,0,0,88,194,0,0,88,194,0,0,84,194,0,0,84,194,0,0,96,194,0,0,100,194,0,0,108,194,0,0,132,194,0,0,140,194,0,0,144,194,0,0,148,194,0,0,158,194,0,0,166,194,0,0,170,194,0,0,180,194,0,0,194,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,172,194,0,0,160,194,0,0,150,194,0,0,150,194,0,0,158,194,0,0,160,194,0,0,158,194,0,0,160,194,0,0,162,194,0,0,164,194,0,0,176,194,0,0,190,194,0,0,206,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,186,194,0,0,176,194,0,0,166,194,0,0,158,194,0,0,156,194,0,0,150,194,0,0,142,194,0,0,134,194,0,0,136,194,0,0,146,194,0,0,146,194,0,0,144,194,0,0,146,194,0,0,150,194,0,0,154,194,0,0,160,194,0,0,164,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,214,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,210,194,0,0,202,194,0,0,192,194,0,0,180,194,0,0,172,194,0,0,162,194,0,0,154,194,0,0,146,194,0,0,138,194,0,0,132,194,0,0,116,194,0,0,120,194,0,0,132,194,0,0,128,194,0,0,120,194,0,0,130,194,0,0,132,194,0,0,140,194,0,0,144,194,0,0,152,194,0,0,162,194,0,0,160,194,0,0,168,194,0,0,180,194,0,0,190,194,0,0,204,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,206,194,0,0,194,194,0,0,184,194,0,0,176,194,0,0,166,194,0,0,158,194,0,0,148,194,0,0,140,194,0,0,132,194,0,0,108,194,0,0,84,194,0,0,104,194,0,0,120,194,0,0,92,194,0,0,88,194,0,0,88,194,0,0,88,194,0,0,104,194,0,0,116,194,0,0,120,194,0,0,144,194,0,0,140,194,0,0,144,194,0,0,150,194,0,0,156,194,0,0,160,194,0,0,162,194,0,0,160,194,0,0,166,194,0,0,166,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,214,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,170,194,0,0,160,194,0,0,150,194,0,0,140,194,0,0,132,194,0,0,120,194,0,0,96,194,0,0,64,194,0,0,48,194,0,0,64,194,0,0,56,194,0,0,56,194,0,0,44,194,0,0,56,194,0,0,64,194,0,0,64,194,0,0,76,194,0,0,104,194,0,0,104,194,0,0,108,194,0,0,112,194,0,0,120,194,0,0,120,194,0,0,116,194,0,0,116,194,0,0,130,194,0,0,128,194,0,0,130,194,0,0,136,194,0,0,140,194,0,0,148,194,0,0,150,194,0,0,156,194,0,0,162,194,0,0,172,194,0,0,190,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,170,194,0,0,160,194,0,0,150,194,0,0,140,194,0,0,130,194,0,0,116,194,0,0,92,194,0,0,68,194,0,0,28,194,0,0,4,194,0,0,32,194,0,0,12,194,0,0,0,194,0,0,24,194,0,0,32,194,0,0,4,194,0,0,12,194,0,0,20,194,0,0,56,194,0,0,36,194,0,0,52,194,0,0,48,194,0,0,56,194,0,0,40,194,0,0,52,194,0,0,56,194,0,0,80,194,0,0,72,194,0,0,72,194,0,0,72,194,0,0,88,194,0,0,88,194,0,0,92,194,0,0,100,194,0,0,120,194,0,0,128,194,0,0,132,194,0,0,136,194,0,0,140,194,0,0,152,194,0,0,162,194,0,0,180,194,0,0,200,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,196,194,0,0,180,194,0,0,170,194,0,0,164,194,0,0,166,194,0,0,160,194,0,0,156,194,0,0,168,194,0,0,158,194,0,0,160,194,0,0,166,194,0,0,174,194,0,0,178,194,0,0,182,194,0,0,186,194,0,0,198,194,0,0,212,194,0,0,234,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,196,194,0,0,180,194,0,0,170,194,0,0,160,194,0,0,150,194,0,0,140,194,0,0,136,194,0,0,148,194,0,0,144,194,0,0,148,194,0,0,154,194,0,0,160,194,0,0,164,194,0,0,170,194,0,0,174,194,0,0,184,194,0,0,178,194,0,0,182,194,0,0,190,194,0,0,200,194,0,0,212,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,196,194,0,0,180,194,0,0,166,194,0,0,150,194,0,0,142,194,0,0,124,194,0,0,128,194,0,0,134,194,0,0,120,194,0,0,128,194,0,0,134,194,0,0,140,194,0,0,146,194,0,0,154,194,0,0,162,194,0,0,168,194,0,0,166,194,0,0,170,194,0,0,178,194,0,0,180,194,0,0,186,194,0,0,196,194,0,0,208,194,0,0,218,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,206,194,0,0,192,194,0,0,176,194,0,0,162,194,0,0,150,194,0,0,136,194,0,0,104,194,0,0,88,194,0,0,96,194,0,0,88,194,0,0,96,194,0,0,96,194,0,0,104,194,0,0,112,194,0,0,124,194,0,0,132,194,0,0,148,194,0,0,138,194,0,0,144,194,0,0,144,194,0,0,150,194,0,0,148,194,0,0,154,194,0,0,162,194,0,0,162,194,0,0,164,194,0,0,168,194,0,0,174,194,0,0,186,194,0,0,192,194,0,0,198,194,0,0,208,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,204,194,0,0,192,194,0,0,182,194,0,0,170,194,0,0,160,194,0,0,148,194,0,0,136,194,0,0,112,194,0,0,76,194,0,0,56,194,0,0,64,194,0,0,56,194,0,0,44,194,0,0,52,194,0,0,60,194,0,0,60,194,0,0,68,194,0,0,64,194,0,0,96,194,0,0,84,194,0,0,92,194,0,0,104,194,0,0,100,194,0,0,124,194,0,0,104,194,0,0,112,194,0,0,132,194,0,0,128,194,0,0,134,194,0,0,140,194,0,0,140,194,0,0,148,194,0,0,154,194,0,0,168,194,0,0,172,194,0,0,178,194,0,0,182,194,0,0,186,194,0,0,188,194,0,0,202,194,0,0,218,194,0,0,236,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,186,194,0,0,176,194,0,0,166,194,0,0,156,194,0,0,146,194,0,0,136,194,0,0,112,194,0,0,84,194,0,0,48,194,0,0,12,194,0,0,24,194,0,0,24,194,0,0,8,194,0,0,8,194,0,0,16,194,0,0,32,194,0,0,36,194,0,0,48,194,0,0,76,194,0,0,52,194,0,0,56,194,0,0,60,194,0,0,56,194,0,0,88,194,0,0,72,194,0,0,68,194,0,0,72,194,0,0,72,194,0,0,72,194,0,0,76,194,0,0,88,194,0,0,100,194,0,0,104,194,0,0,112,194,0,0,132,194,0,0,132,194,0,0,132,194,0,0,128,194,0,0,130,194,0,0,136,194,0,0,154,194,0,0,164,194,0,0,174,194,0,0,190,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,204,194,0,0,194,194,0,0,184,194,0,0,174,194,0,0,166,194,0,0,156,194,0,0,150,194,0,0,164,194,0,0,158,194,0,0,166,194,0,0,170,194,0,0,178,194,0,0,184,194,0,0,190,194,0,0,196,194,0,0,202,194,0,0,210,194,0,0,218,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196])
.concat([0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,212,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,172,194,0,0,162,194,0,0,156,194,0,0,148,194,0,0,138,194,0,0,148,194,0,0,148,194,0,0,152,194,0,0,158,194,0,0,166,194,0,0,168,194,0,0,172,194,0,0,178,194,0,0,184,194,0,0,194,194,0,0,186,194,0,0,200,194,0,0,206,194,0,0,214,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,212,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,174,194,0,0,166,194,0,0,160,194,0,0,150,194,0,0,138,194,0,0,112,194,0,0,132,194,0,0,132,194,0,0,136,194,0,0,140,194,0,0,148,194,0,0,156,194,0,0,158,194,0,0,162,194,0,0,162,194,0,0,166,194,0,0,168,194,0,0,174,194,0,0,186,194,0,0,192,194,0,0,198,194,0,0,206,194,0,0,214,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,186,194,0,0,178,194,0,0,170,194,0,0,164,194,0,0,156,194,0,0,142,194,0,0,120,194,0,0,92,194,0,0,104,194,0,0,104,194,0,0,88,194,0,0,88,194,0,0,92,194,0,0,108,194,0,0,116,194,0,0,120,194,0,0,140,194,0,0,132,194,0,0,132,194,0,0,134,194,0,0,140,194,0,0,144,194,0,0,150,194,0,0,156,194,0,0,168,194,0,0,168,194,0,0,168,194,0,0,176,194,0,0,182,194,0,0,180,194,0,0,190,194,0,0,196,194,0,0,204,194,0,0,206,194,0,0,212,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,188,194,0,0,180,194,0,0,174,194,0,0,164,194,0,0,158,194,0,0,146,194,0,0,134,194,0,0,104,194,0,0,60,194,0,0,72,194,0,0,52,194,0,0,36,194,0,0,52,194,0,0,64,194,0,0,48,194,0,0,48,194,0,0,68,194,0,0,88,194,0,0,76,194,0,0,64,194,0,0,60,194,0,0,68,194,0,0,72,194,0,0,76,194,0,0,100,194,0,0,104,194,0,0,112,194,0,0,124,194,0,0,138,194,0,0,140,194,0,0,138,194,0,0,142,194,0,0,148,194,0,0,156,194,0,0,164,194,0,0,180,194,0,0,190,194,0,0,202,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,202,194,0,0,194,194,0,0,186,194,0,0,180,194,0,0,170,194,0,0,160,194,0,0,154,194,0,0,144,194,0,0,130,194,0,0,96,194,0,0,64,194,0,0,20,194,0,0,32,194,0,0,16,194,0,0,8,194,0,0,32,194,0,0,72,194,0,0,60,194,0,0,24,194,0,0,36,194,0,0,60,194,0,0,24,194,0,0,12,194,0,0,28,194,0,0,24,194,0,0,44,194,0,0,32,194,0,0,52,194,0,0,72,194,0,0,52,194,0,0,48,194,0,0,60,194,0,0,72,194,0,0,92,194,0,0,64,194,0,0,64,194,0,0,80,194,0,0,132,194,0,0,140,194,0,0,152,194,0,0,164,194,0,0,180,194,0,0,194,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,186,194,0,0,172,194,0,0,158,194,0,0,152,194,0,0,166,194,0,0,162,194,0,0,170,194,0,0,174,194,0,0,178,194,0,0,186,194,0,0,196,194,0,0,204,194,0,0,214,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,186,194,0,0,172,194,0,0,158,194,0,0,142,194,0,0,154,194,0,0,148,194,0,0,154,194,0,0,158,194,0,0,162,194,0,0,168,194,0,0,170,194,0,0,180,194,0,0,184,194,0,0,186,194,0,0,184,194,0,0,196,194,0,0,202,194,0,0,216,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,206,194,0,0,196,194,0,0,186,194,0,0,174,194,0,0,156,194,0,0,136,194,0,0,130,194,0,0,132,194,0,0,120,194,0,0,130,194,0,0,134,194,0,0,140,194,0,0,146,194,0,0,150,194,0,0,156,194,0,0,164,194,0,0,164,194,0,0,166,194,0,0,168,194,0,0,182,194,0,0,186,194,0,0,196,194,0,0,204,194,0,0,212,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,164,194,0,0,148,194,0,0,120,194,0,0,100,194,0,0,104,194,0,0,96,194,0,0,76,194,0,0,80,194,0,0,80,194,0,0,88,194,0,0,88,194,0,0,104,194,0,0,132,194,0,0,108,194,0,0,112,194,0,0,124,194,0,0,132,194,0,0,138,194,0,0,146,194,0,0,158,194,0,0,166,194,0,0,168,194,0,0,160,194,0,0,162,194,0,0,162,194,0,0,164,194,0,0,176,194,0,0,184,194,0,0,196,194,0,0,210,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,204,194,0,0,194,194,0,0,184,194,0,0,168,194,0,0,158,194,0,0,138,194,0,0,100,194,0,0,60,194,0,0,80,194,0,0,60,194,0,0,48,194,0,0,52,194,0,0,72,194,0,0,80,194,0,0,40,194,0,0,40,194,0,0,84,194,0,0,44,194,0,0,44,194,0,0,64,194,0,0,76,194,0,0,96,194,0,0,92,194,0,0,80,194,0,0,100,194,0,0,108,194,0,0,116,194,0,0,120,194,0,0,134,194,0,0,142,194,0,0,156,194,0,0,166,194,0,0,172,194,0,0,188,194,0,0,196,194,0,0,206,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,190,194,0,0,180,194,0,0,168,194,0,0,156,194,0,0,140,194,0,0,116,194,0,0,76,194,0,0,36,194,0,0,32,194,0,0,24,194,0,0,32,194,0,0,56,194,0,0,80,194,0,0,76,194,0,0,36,194,0,0,32,194,0,0,56,194,0,0,32,194,0,0,24,194,0,0,24,194,0,0,36,194,0,0,56,194,0,0,36,194,0,0,56,194,0,0,60,194,0,0,44,194,0,0,44,194,0,0,52,194,0,0,36,194,0,0,52,194,0,0,96,194,0,0,134,194,0,0,136,194,0,0,166,194,0,0,174,194,0,0,180,194,0,0,190,194,0,0,204,194,0,0,214,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,218,194,0,0,210,194,0,0,202,194,0,0,192,194,0,0,182,194,0,0,168,194,0,0,154,194,0,0,164,194,0,0,164,194,0,0,170,194,0,0,178,194,0,0,188,194,0,0,200,194,0,0,212,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,212,194,0,0,206,194,0,0,196,194,0,0,184,194,0,0,170,194,0,0,160,194,0,0,142,194,0,0,150,194,0,0,144,194,0,0,152,194,0,0,160,194,0,0,168,194,0,0,172,194,0,0,178,194,0,0,186,194,0,0,200,194,0,0,214,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,208,194,0,0,202,194,0,0,194,194,0,0,184,194,0,0,176,194,0,0,168,194,0,0,160,194,0,0,128,194,0,0,132,194,0,0,124,194,0,0,128,194,0,0,132,194,0,0,138,194,0,0,146,194,0,0,154,194,0,0,166,194,0,0,166,194,0,0,172,194,0,0,182,194,0,0,196,194,0,0,208,194,0,0,222,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,208,194,0,0,202,194,0,0,194,194,0,0,184,194,0,0,180,194,0,0,168,194,0,0,148,194,0,0,100,194,0,0,104,194,0,0,80,194,0,0,92,194,0,0,88,194,0,0,72,194,0,0,80,194,0,0,72,194,0,0,80,194,0,0,124,194,0,0,120,194,0,0,138,194,0,0,152,194,0,0,154,194,0,0,156,194,0,0,156,194,0,0,158,194,0,0,164,194,0,0,176,194,0,0,188,194,0,0,200,194,0,0,212,194,0,0,222,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,212,194,0,0,204,194,0,0,196,194,0,0,190,194,0,0,180,194,0,0,170,194,0,0,166,194,0,0,156,194,0,0,140,194,0,0,72,194,0,0,72,194,0,0,36,194,0,0,48,194,0,0,68,194,0,0,60,194,0,0,72,194,0,0,72,194,0,0,48,194,0,0,92,194,0,0,56,194,0,0,60,194,0,0,64,194,0,0,64,194,0,0,88,194,0,0,68,194,0,0,68,194,0,0,104,194,0,0,120,194,0,0,142,194,0,0,162,194,0,0,174,194,0,0,184,194,0,0,194,194,0,0,204,194,0,0,216,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,212,194,0,0,204,194,0,0,196,194,0,0,190,194,0,0,180,194,0,0,170,194,0,0,166,194,0,0,156,194,0,0,140,194,0,0,52,194,0,0,44,194,0,0,36,194,0,0,60,194,0,0,72,194,0,0,76,194,0,0,72,194,0,0,68,194,0,0,52,194,0,0,60,194,0,0,36,194,0,0,48,194,0,0,36,194,0,0,28,194,0,0,44,194,0,0,24,194,0,0,20,194,0,0,32,194,0,0,36,194,0,0,48,194,0,0,72,194,0,0,104,194,0,0,130,194,0,0,146,194,0,0,158,194,0,0,170,194,0,0,184,194,0,0,194,194,0,0,202,194,0,0,210,194,0,0,218,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,200,194,0,0,190,194,0,0,174,194,0,0,162,194,0,0,170,194,0,0,166,194,0,0,176,194,0,0,186,194,0,0,200,194,0,0,214,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,202,194,0,0,190,194,0,0,176,194,0,0,166,194,0,0,152,194,0,0,146,194,0,0,144,194,0,0,158,194,0,0,168,194,0,0,180,194,0,0,190,194,0,0,200,194,0,0,210,194,0,0,220,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,208,194,0,0,196,194,0,0,184,194,0,0,174,194,0,0,162,194,0,0,140,194,0,0,130,194,0,0,120,194,0,0,134,194,0,0,142,194,0,0,148,194,0,0,160,194,0,0,170,194,0,0,182,194,0,0,190,194,0,0,198,194,0,0,206,194,0,0,216,194,0,0,222,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,206,194,0,0,194,194,0,0,180,194,0,0,170,194,0,0,152,194,0,0,112,194,0,0,96,194,0,0,88,194,0,0,112,194,0,0,120,194,0,0,116,194,0,0,96,194,0,0,124,194,0,0,130,194,0,0,146,194,0,0,148,194,0,0,154,194,0,0,150,194,0,0,156,194,0,0,162,194,0,0,172,194,0,0,174,194,0,0,176,194,0,0,182,194,0,0,188,194,0,0,196,194,0,0,206,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,194,194,0,0,184,194,0,0,172,194,0,0,162,194,0,0,158,194,0,0,140,194,0,0,100,194,0,0,76,194,0,0,60,194,0,0,76,194,0,0,104,194,0,0,112,194,0,0,96,194,0,0,84,194,0,0,72,194,0,0,104,194,0,0,80,194,0,0,72,194,0,0,72,194,0,0,84,194,0,0,92,194,0,0,128,194,0,0,138,194,0,0,142,194,0,0,170,194,0,0,164,194,0,0,156,194,0,0,162,194,0,0,170,194,0,0,190,194,0,0,204,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,200,194,0,0,194,194,0,0,184,194,0,0,170,194,0,0,166,194,0,0,158,194,0,0,144,194,0,0,68,194,0,0,32,194,0,0,44,194,0,0,44,194,0,0,88,194,0,0,96,194,0,0,76,194,0,0,72,194,0,0,32,194,0,0,44,194,0,0,24,194,0,0,16,194,0,0,12,194,0,0,20,194,0,0,24,194,0,0,20,194,0,0,48,194,0,0,88,194,0,0,112,194,0,0,100,194,0,0,112,194,0,0,140,194,0,0,150,194,0,0,168,194,0,0,184,194,0,0,206,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,204,194,0,0,190,194,0,0,178,194,0,0,164,194,0,0,166,194,0,0,168,194,0,0,180,194,0,0,184,194,0,0,198,194,0,0,214,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,202,194,0,0,190,194,0,0,178,194,0,0,166,194,0,0,144,194,0,0,148,194,0,0,156,194,0,0,170,194,0,0,176,194,0,0,176,194,0,0,180,194,0,0,184,194,0,0,196,194,0,0,210,194,0,0,222,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,218,194,0,0,206,194,0,0,194,194,0,0,186,194,0,0,174,194,0,0,162,194,0,0,140,194,0,0,140,194,0,0,134,194,0,0,150,194,0,0,146,194,0,0,152,194,0,0,158,194,0,0,162,194,0,0,166,194,0,0,176,194,0,0,178,194,0,0,194,194,0,0,206,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,214,194,0,0,200,194,0,0,188,194,0,0,176,194,0,0,166,194,0,0,150,194,0,0,124,194,0,0,108,194,0,0,108,194,0,0,124,194,0,0,132,194,0,0,112,194,0,0,120,194,0,0,134,194,0,0,134,194,0,0,154,194,0,0,152,194,0,0,162,194,0,0,176,194,0,0,172,194,0,0,184,194,0,0,192,194,0,0,204,194,0,0,218,194,0,0,232,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,196,194,0,0,184,194,0,0,172,194,0,0,162,194,0,0,146,194,0,0,96,194,0,0,80,194,0,0,60,194,0,0,92,194,0,0,112,194,0,0,104,194,0,0,80,194,0,0,76,194,0,0,52,194,0,0,68,194,0,0,72,194,0,0,84,194,0,0,88,194,0,0,116,194,0,0,142,194,0,0,140,194,0,0,138,194,0,0,156,194,0,0,158,194,0,0,174,194,0,0,180,194,0,0,192,194,0,0,208,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,206,194,0,0,192,194,0,0,180,194,0,0,172,194,0,0,156,194,0,0,140,194,0,0,76,194,0,0,40,194,0,0,60,194,0,0,64,194,0,0,92,194,0,0,88,194,0,0,88,194,0,0,84,194,0,0,40,194,0,0,12,194,0,0,224,193,0,0,4,194,0,0,24,194,0,0,20,194,0,0,48,194,0,0,60,194,0,0,68,194,0,0,88,194,0,0,124,194,0,0,136,194,0,0,156,194,0,0,164,194,0,0,178,194,0,0,188,194,0,0,198,194,0,0,208,194,0,0,218,194,0,0,228,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,180,194,0,0,158,194,0,0,170,194,0,0,162,194,0,0,164,194,0,0,164,194,0,0,178,194,0,0,188,194,0,0,198,194,0,0,206,194,0,0,218,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,194,194,0,0,170,194,0,0,144,194,0,0,148,194,0,0,140,194,0,0,140,194,0,0,140,194,0,0,152,194,0,0,170,194,0,0,182,194,0,0,186,194,0,0,194,194,0,0,206,194,0,0,218,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,224,194,0,0,186,194,0,0,162,194,0,0,136,194,0,0,120,194,0,0,112,194,0,0,112,194,0,0,100,194,0,0,124,194,0,0,140,194,0,0,154,194,0,0,164,194,0,0,180,194,0,0,186,194,0,0,196,194,0,0,208,194,0,0,218,194,0,0,226,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,226,194,0,0,200,194,0,0,186,194,0,0,168,194,0,0,124,194,0,0,104,194,0,0,64,194,0,0,84,194,0,0,88,194,0,0,80,194,0,0,80,194,0,0,100,194,0,0,128,194,0,0,132,194,0,0,152,194,0,0,166,194,0,0,162,194,0,0,170,194,0,0,170,194,0,0,180,194,0,0,190,194,0,0,196,194,0,0,202,194,0,0,206,194,0,0,212,194,0,0,216,194,0,0,222,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,210,194,0,0,190,194,0,0,172,194,0,0,148,194,0,0,84,194,0,0,72,194,0,0,24,194,0,0,44,194,0,0,68,194,0,0,44,194,0,0,40,194,0,0,28,194,0,0,28,194,0,0,56,194,0,0,80,194,0,0,100,194,0,0,96,194,0,0,144,194,0,0,138,194,0,0,148,194,0,0,162,194,0,0,174,194,0,0,184,194,0,0,188,194,0,0,194,194,0,0,198,194,0,0,204,194,0,0,210,194,0,0,216,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,216,194,0,0,198,194,0,0,180,194,0,0,152,194,0,0,132,194,0,0,52,194,0,0,44,194,0,0,36,194,0,0,48,194,0,0,60,194,0,0,44,194,0,0,60,194,0,0,32,194,0,0,240,193,0,0,248,193,0,0,248,193,0,0,28,194,0,0,4,194,0,0,32,194,0,0,36,194,0,0,44,194,0,0,84,194,0,0,108,194,0,0,140,194,0,0,146,194,0,0,154,194,0,0,158,194,0,0,164,194,0,0,168,194,0,0,174,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,182,194,0,0,152,194,0,0,150,194,0,0,170,194,0,0,186,194,0,0,196,194,0,0,208,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,182,194,0,0,140,194,0,0,140,194,0,0,150,194,0,0,172,194,0,0,178,194,0,0,188,194,0,0,196,194,0,0,202,194,0,0,212,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,190,194,0,0,160,194,0,0,112,194,0,0,130,194,0,0,128,194,0,0,148,194,0,0,166,194,0,0,176,194,0,0,182,194,0,0,190,194,0,0,198,194,0,0,206,194,0,0,214,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,190,194,0,0,160,194,0,0,104,194,0,0,92,194,0,0,68,194,0,0,132,194,0,0,136,194,0,0,142,194,0,0,156,194,0,0,156,194,0,0,160,194,0,0,176,194,0,0,170,194,0,0,178,194,0,0,194,194,0,0,200,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,190,194,0,0,160,194,0,0,84,194,0,0,80,194,0,0,36,194,0,0,108,194,0,0,108,194,0,0,68,194,0,0,104,194,0,0,96,194,0,0,124,194,0,0,172,194,0,0,158,194,0,0,180,194,0,0,186,194,0,0,196,194,0,0,206,194,0,0,214,194,0,0,224,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,194,194,0,0,182,194,0,0,146,194,0,0,52,194,0,0,32,194,0,0,4,194,0,0,84,194,0,0,116,194,0,0,68,194,0,0,88,194,0,0,72,194,0,0,72,194,0,0,112,194,0,0,80,194,0,0,134,194,0,0,148,194,0,0,162,194,0,0,184,194,0,0,192,194,0,0,200,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,226,194,0,0,212,194,0,0,198,194,0,0,184,194,0,0,154,194,0,0,160,194,0,0,176,194,0,0,194,194,0,0,212,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,232,194,0,0,218,194,0,0,204,194,0,0,190,194,0,0,178,194,0,0,148,194,0,0,144,194,0,0,176,194,0,0,174,194,0,0,190,194,0,0,204,194,0,0,218,194,0,0,232,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,232,194,0,0,218,194,0,0,204,194,0,0,190,194,0,0,178,194,0,0,150,194,0,0,132,194,0,0,148,194,0,0,154,194,0,0,156,194,0,0,172,194,0,0,174,194,0,0,180,194,0,0,192,194,0,0,210,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,230,194,0,0,216,194,0,0,202,194,0,0,188,194,0,0,176,194,0,0,132,194,0,0,96,194,0,0,116,194,0,0,140,194,0,0,130,194,0,0,156,194,0,0,144,194,0,0,166,194,0,0,168,194,0,0,186,194,0,0,196,194,0,0,210,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,210,194,0,0,190,194,0,0,178,194,0,0,164,194,0,0,100,194,0,0,80,194,0,0,80,194,0,0,108,194,0,0,96,194,0,0,108,194,0,0,104,194,0,0,138,194,0,0,134,194,0,0,176,194,0,0,164,194,0,0,164,194,0,0,178,194,0,0,188,194,0,0,200,194,0,0,216,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196])
.concat([0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,202,194,0,0,192,194,0,0,180,194,0,0,166,194,0,0,154,194,0,0,88,194,0,0,44,194,0,0,24,194,0,0,72,194,0,0,64,194,0,0,80,194,0,0,64,194,0,0,40,194,0,0,40,194,0,0,76,194,0,0,80,194,0,0,84,194,0,0,108,194,0,0,130,194,0,0,142,194,0,0,156,194,0,0,170,194,0,0,190,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,240,194,0,0,210,194,0,0,172,194,0,0,136,194,0,0,156,194,0,0,158,194,0,0,180,194,0,0,200,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,240,194,0,0,210,194,0,0,172,194,0,0,132,194,0,0,146,194,0,0,154,194,0,0,176,194,0,0,192,194,0,0,210,194,0,0,230,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,240,194,0,0,210,194,0,0,184,194,0,0,160,194,0,0,116,194,0,0,128,194,0,0,136,194,0,0,160,194,0,0,174,194,0,0,184,194,0,0,200,194,0,0,220,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,240,194,0,0,208,194,0,0,182,194,0,0,158,194,0,0,80,194,0,0,112,194,0,0,88,194,0,0,128,194,0,0,138,194,0,0,154,194,0,0,160,194,0,0,164,194,0,0,168,194,0,0,170,194,0,0,174,194,0,0,176,194,0,0,180,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,236,194,0,0,200,194,0,0,174,194,0,0,154,194,0,0,68,194,0,0,72,194,0,0,48,194,0,0,104,194,0,0,116,194,0,0,116,194,0,0,134,194,0,0,130,194,0,0,120,194,0,0,120,194,0,0,120,194,0,0,130,194,0,0,136,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,230,194,0,0,196,194,0,0,168,194,0,0,120,194,0,0,68,194,0,0,48,194,0,0,24,194,0,0,56,194,0,0,68,194,0,0,68,194,0,0,56,194,0,0,28,194,0,0,20,194,0,0,28,194,0,0,32,194,0,0,40,194,0,0,44,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,176,194,0,0,148,194,0,0,154,194,0,0,164,194,0,0,164,194,0,0,170,194,0,0,180,194,0,0,188,194,0,0,198,194,0,0,208,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,176,194,0,0,132,194,0,0,140,194,0,0,162,194,0,0,160,194,0,0,162,194,0,0,168,194,0,0,176,194,0,0,182,194,0,0,186,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,176,194,0,0,116,194,0,0,124,194,0,0,140,194,0,0,142,194,0,0,148,194,0,0,154,194,0,0,160,194,0,0,166,194,0,0,170,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,172,194,0,0,120,194,0,0,124,194,0,0,120,194,0,0,120,194,0,0,104,194,0,0,80,194,0,0,72,194,0,0,72,194,0,0,80,194,0,0,88,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,236,194,0,0,216,194,0,0,168,194,0,0,84,194,0,0,72,194,0,0,72,194,0,0,72,194,0,0,92,194,0,0,60,194,0,0,52,194,0,0,32,194,0,0,32,194,0,0,32,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,236,194,0,0,200,194,0,0,146,194,0,0,44,194,0,0,20,194,0,0,40,194,0,0,44,194,0,0,84,194,0,0,24,194,0,0,20,194,0,0,12,194,0,0,12,194,0,0,24,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,182,194,0,0,168,194,0,0,148,194,0,0,160,194,0,0,160,194,0,0,160,194,0,0,160,194,0,0,160,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,182,194,0,0,168,194,0,0,148,194,0,0,136,194,0,0,136,194,0,0,136,194,0,0,136,194,0,0,136,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,172,194,0,0,156,194,0,0,140,194,0,0,112,194,0,0,52,194,0,0,240,193,0,0,168,193,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,174,194,0,0,156,194,0,0,134,194,0,0,64,194,0,0,24,194,0,0,232,193,0,0,168,193,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,172,194,0,0,138,194,0,0,96,194,0,0,52,194,0,0,12,194,0,0,4,194,0,0,232,193,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,220,194,0,0,200,194,0,0,166,194,0,0,142,194,0,0,64,194,0,0,216,193,0,0,24,194,0,0,20,194,0,0,8,194,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,192,121,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,63,0,0,0,0,0,0,240,63,0,0,0,0,0,0,248,63,0,0,0,0,0,0,0,64,0,0,0,0,0,0,4,64,0,0,0,0,0,0,18,64,0,0,0,0,0,0,33,64,0,0,0,4,107,244,52,66,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,63,0,0,0,0,0,0,240,63,0,0,0,0,0,0,248,63,0,0,0,0,0,0,4,64,0,0,0,0,0,0,18,64,0,0,0,0,0,0,33,64,0,0,0,0,0,128,48,64,0,0,0,4,107,244,52,66,4,0,0,0,12,0,0,0,16,0,0,0,2,0,0,0,12,0,0,0,2,0,0,0,2,0,0,0,6,0,0,0,4,0,0,0,12,0,0,0,16,0,0,0,2,0,0,0,12,0,0,0,8,0,0,0,4,0,0,0,10,0,0,0,0,0,0,0,12,0,0,0,16,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,3,0,0,0,7,0,0,0,15,0,0,0,31,0,0,0,63,0,0,0,127,0,0,0,255,0,0,0,255,1,0,0,255,3,0,0,255,7,0,0,255,15,0,0,255,31,0,0,255,63,0,0,255,127,0,0,255,255,0,0,255,255,1,0,255,255,3,0,255,255,7,0,255,255,15,0,255,255,31,0,255,255,63,0,255,255,127,0,255,255,255,0,255,255,255,1,255,255,255,3,255,255,255,7,255,255,255,15,255,255,255,31,255,255,255,63,255,255,255,127,255,255,255,255,0,0,0,0,2,0,0,0,18,0,0,0,8,0,0,0,2,0,0,0,6,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,24,0,0,0,4,0,0,0,6,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,22,0,0,0,10,0,0,0,14,0,0,0,26,0,0,0,8,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,118,111,114,98,105,115,0,0,184,217,0,0,152,217,0,0,120,217,0,0,0,0,0,0,120,218,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,218,0,0,144,218,0,0,62,180,228,51,9,145,243,51,139,178,1,52,60,32,10,52,35,26,19,52,96,169,28,52,167,215,38,52,75,175,49,52,80,59,61,52,112,135,73,52,35,160,86,52,184,146,100,52,85,109,115,52,136,159,129,52,252,11,138,52,147,4,147,52,105,146,156,52,50,191,166,52,63,149,177,52,147,31,189,52,228,105,201,52,173,128,214,52,54,113,228,52,166,73,243,52,136,140,1,53,192,247,9,53,6,239,18,53,118,123,28,53,192,166,38,53,55,123,49,53,218,3,61,53,94,76,73,53,59,97,86,53,185,79,100,53,252,37,115,53,138,121,129,53,134,227,137,53,124,217,146,53,133,100,156,53,82,142,166,53,51,97,177,53,37,232,188,53,220,46,201,53,206,65,214,53,65,46,228,53,87,2,243,53,143,102,1,54,79,207,9,54,245,195,18,54,152,77,28,54,232,117,38,54,50,71,49,54,116,204,60,54,94,17,73,54,101,34,86,54,206,12,100,54,184,222,114,54,151,83,129,54,28,187,137,54,114,174,146,54,175,54,156,54,129,93,166,54,53,45,177,54,199,176,188,54,228,243,200,54,1,3,214,54,96,235,227,54,30,187,242,54,162,64,1,55,235,166,9,55,241,152,18,55,201,31,28,55,30,69,38,55,61,19,49,55,30,149,60,55,111,214,72,55,162,227,85,55,247,201,99,55,137,151,114,55,175,45,129,55,190,146,137,55,116,131,146,55,230,8,156,55,190,44,166,55,71,249,176,55,121,121,188,55,254,184,200,55,71,196,213,55,146,168,227,55,248,115,242,55,192,26,1,56,147,126,9,56,249,109,18,56,6,242,27,56,98,20,38,56,86,223,48,56,216,93,60,56,146,155,72,56,242,164,85,56,51,135,99,56,110,80,114,56,211,7,129,56,107,106,137,56,130,88,146,56,42,219,155,56,9,252,165,56,104,197,176,56,59,66,188,56,41,126,200,56,160,133,213,56,217,101,227,56,232,44,242,56,233,244,0,57,70,86,9,57,14,67,18,57,81,196,27,57,181,227,37,57,127,171,48,57,162,38,60,57,197,96,72,57,83,102,85,57,131,68,99,57,104,9,114,57,1,226,128,57,36,66,137,57,157,45,146,57,123,173,155,57,99,203,165,57,153,145,176,57,13,11,188,57,102,67,200,57,11,71,213,57,50,35,227,57,237,229,241,57,29,207,0,58,5,46,9,58,48,24,18,58,169,150,27,58,21,179,37,58,183,119,48,58,124,239,59,58,10,38,72,58,199,39,85,58,230,1,99,58,120,194,113,58,59,188,128,58,233,25,137,58,198,2,146,58,219,127,155,58,203,154,165,58,216,93,176,58,239,211,187,58,179,8,200,58,136,8,213,58,159,224,226,58,7,159,241,58,92,169,0,59,208,5,9,59,94,237,17,59,15,105,27,59,132,130,37,59,253,67,48,59,103,184,59,59,97,235,71,59,77,233,84,59,93,191,98,59,156,123,113,59,127,150,128,59,186,241,136,59,249,215,145,59,71,82,155,59,65,106,165,59,39,42,176,59,226,156,187,59,18,206,199,59,23,202,212,59,32,158,226,59,53,88,241,59,166,131,0,60,167,221,8,60,152,194,17,60,130,59,27,60,1,82,37,60,84,16,48,60,97,129,59,60,200,176,71,60,229,170,84,60,232,124,98,60,212,52,113,60,207,112,128,60,150,201,136,60,58,173,145,60,192,36,155,60,197,57,165,60,133,246,175,60,229,101,187,60,130,147,199,60,185,139,212,60,180,91,226,60,121,17,241,60,251,93,0,61,137,181,8,61,223,151,17,61,2,14,27,61,141,33,37,61,185,220,47,61,109,74,59,61,64,118,71,61,145,108,84,61,133,58,98,61,34,238,112,61,42,75,128,61,127,161,136,61,136,130,145,61,72,247,154,61,88,9,165,61,242,194,175,61,248,46,187,61,3,89,199,61,109,77,212,61,92,25,226,61,209,202,240,61,91,56,0,62,119,141,8,62,51,109,17,62,144,224,26,62,39,241,36,62,46,169,47,62,135,19,59,62,202,59,71,62,77,46,84,62,55,248,97,62,132,167,112,62,143,37,128,62,115,121,136,62,226,87,145,62,220,201,154,62,249,216,164,62,109,143,175,62,27,248,186,62,149,30,199,62,51,15,212,62,23,215,225,62,61,132,240,62,198,18,0,63,114,101,8,63,147,66,17,63,43,179,26,63,206,192,36,63,177,117,47,63,178,220,58,63,101,1,71,63,29,240,83,63,251,181,97,63,251,96,112,63,0,0,128,63,0,0,76,194,0,0,80,194,0,0,84,194,0,0,88,194,0,0,92,194,0,0,96,194,0,0,100,194,0,0,104,194,0,0,108,194,0,0,112,194,0,0,116,194,0,0,120,194,0,0,124,194,0,0,128,194,0,0,130,194,0,0,132,194,0,0,134,194,0,0,136,194,0,0,138,194,0,0,140,194,0,0,142,194,0,0,144,194,0,0,146,194,0,0,148,194,0,0,150,194,0,0,152,194,0,0,154,194,0,0,156,194,0,0,160,194,0,0,162,194,0,0,164,194,0,0,166,194,0,0,168,194,0,0,170,194,0,0,172,194,0,0,174,194,0,0,176,194,0,0,176,194,0,0,178,194,0,0,178,194,0,0,180,194,0,0,182,194,0,0,182,194,0,0,184,194,0,0,186,194,0,0,188,194,0,0,190,194,0,0,192,194,0,0,192,194,0,0,194,194,0,0,196,194,0,0,196,194,0,0,198,194,0,0,198,194,0,0,200,194,0,0,200,194,0,0,202,194,0,0,204,194,0,0,206,194,0,0,208,194,0,0,212,194,0,0,214,194,0,0,214,194,0,0,214,194,0,0,214,194,0,0,210,194,0,0,206,194,0,0,204,194,0,0,202,194,0,0,198,194,0,0,196,194,0,0,192,194,0,0,190,194,0,0,190,194,0,0,192,194,0,0,194,194,0,0,192,194,0,0,190,194,0,0,186,194,0,0,180,194,0,0,160,194,0,0,140,194,0,0,72,194,0,0,32,194,0,0,240,193,0,0,240,193,0,0,240,193,0,0,240,193])
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
  function _AVCallback(callbackId, packet, bytes) {
          callbacks[callbackId](packet, bytes);
  	}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var _sin=Math.sin;
  Module["_memcmp"] = _memcmp;
  function _rint(x) {
      return (x > 0) ? -Math.round(-x) : Math.round(x);
    }
  var _log=Math.log;
  var _cos=Math.cos;
  var _exp=Math.exp;
  var _atan=Math.atan;
  var _sqrt=Math.sqrt;
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var comparator = function(x, y) {
        return Runtime.dynCall('iii', cmp, [x, y]);
      }
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return comparator(base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  var _floor=Math.floor;
  var _ceil=Math.ceil;
  function _ldexp(x, exp_) {
      return x * Math.pow(2, exp_);
    }
  var _llvm_pow_f64=Math.pow;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }
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
  var _rintf=_rint;
  var _fabsf=Math.abs;
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
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
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
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
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
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
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
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
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.copyTempDouble;var af=env.copyTempFloat;var ag=env.min;var ah=env.invoke_ii;var ai=env.invoke_vi;var aj=env.invoke_vii;var ak=env.invoke_iiiiii;var al=env.invoke_viii;var am=env.invoke_v;var an=env.invoke_iiiiiiiii;var ao=env.invoke_iiiii;var ap=env.invoke_iii;var aq=env._llvm_lifetime_end;var ar=env._fabsf;var as=env._sysconf;var at=env._rint;var au=env._ldexp;var av=env._abort;var aw=env._AVCallback;var ax=env._log;var ay=env._floor;var az=env.___setErrNo;var aA=env._qsort;var aB=env._sqrt;var aC=env._exit;var aD=env._sin;var aE=env._atan;var aF=env._ceil;var aG=env._cos;var aH=env._llvm_pow_f64;var aI=env._sbrk;var aJ=env.___errno_location;var aK=env._llvm_lifetime_start;var aL=env._exp;var aM=env._time;var aN=env.__exit;
// EMSCRIPTEN_START_FUNCS
function aX(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function aY(){return i|0}function aZ(a){a=a|0;i=a}function a_(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function a$(a){a=a|0;D=a}function a0(a){a=a|0;E=a}function a1(a){a=a|0;F=a}function a2(a){a=a|0;G=a}function a3(a){a=a|0;H=a}function a4(a){a=a|0;I=a}function a5(a){a=a|0;J=a}function a6(a){a=a|0;K=a}function a7(a){a=a|0;L=a}function a8(a){a=a|0;M=a}function a9(a){a=a|0;return c[a+4>>2]|0}function ba(a){a=a|0;return c[a+8>>2]|0}function bb(a){a=a|0;return c[a+40>>2]|0}function bc(a,b){a=a|0;b=b|0;var d=0;if((c[a+40>>2]|0)<=(b|0)){d=0;return d|0}d=c[(c[a+32>>2]|0)+(b<<2)>>2]|0;return d|0}function bd(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+32|0;e=d|0;c[e>>2]=a;c[e+4>>2]=b;b=bp(e)|0;i=d;return b|0}function be(a,b){a=a|0;b=b|0;var d=0;d=cB(1,320)|0;cG(d|0,0,32);c[d+28>>2]=cB(1,3664)|0;cG(d+32|0,0,16);c[d+280>>2]=1;c[d+308>>2]=a;c[d+312>>2]=b;return d|0}function bf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a+272|0;c[e>>2]=b;c[a+276>>2]=d;d=bq(a|0,a+32|0,e)|0;e=a+280|0;if((c[e>>2]|0)==0){return d|0}c[e>>2]=0;return d|0}function bg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;h=b+272|0;c[h>>2]=d;c[b+276>>2]=e;e=b+304|0;L16:do{if((c[e>>2]|0)<3){d=b|0;i=bq(d,b+32|0,h)|0;j=(c[e>>2]|0)+1|0;c[e>>2]=j;if(!((i|0)==0&(j|0)==3)){k=i;break}i=b+312|0;c[i>>2]=(c[i>>2]|0)/(c[b+4>>2]|0)&-1;i=b+48|0;if((bj(i,d,0)|0)!=0){bk(i);k=1;break}d=c[b+52>>2]|0;j=c[b+152>>2]|0;do{if(!((j|0)==0|(d|0)==0)){l=c[d+28>>2]|0;if((l|0)==0){break}m=c[l+3656>>2]|0;n=c[l+4>>2]>>m+1;c[b+96>>2]=n;c[b+68>>2]=n>>m;c[b+72>>2]=-1;cG(b+104|0,-1|0,16);c[b+80>>2]=0;m=j+128|0;c[m>>2]=-1;c[m+4>>2]=-1}}while(0);cG(b+160|0,0,112);c[b+224>>2]=i;c[b+236>>2]=0;c[b+228>>2]=0;if((c[i>>2]|0)==0){k=0;break}j=cB(1,72)|0;c[b+264>>2]=j;g[j+4>>2]=-9999.0;d=b+164|0;m=j+12|0;n=j+40|0;j=0;while(1){if((j|0)==7){c[n>>2]=d;o=d}else{l=cB(1,20)|0;c[m+(j<<2)>>2]=l;o=l}cG(o|0,0,20);l=cz(256)|0;c[o+8>>2]=l;c[o+12>>2]=l;a[l]=0;c[o+16>>2]=256;l=j+1|0;if((l|0)<15){j=l}else{k=0;break L16}}}else{j=b+160|0;m=b3(j,h)|0;if((m|0)==0){p=bl(b+48|0,j)|0}else{p=m}m=b+68|0;j=b+52|0;d=b+72|0;n=c[d>>2]|0;if((n|0)<=-1){k=p;break}i=b+56|0;l=b+60|0;q=b+4|0;r=b+312|0;s=b+308|0;t=p;u=n;while(1){n=c[m>>2]|0;if((u|0)>=(n|0)){k=t;break L16}v=(c[j>>2]|0)+4|0;if((c[v>>2]|0)>0){c[c[l>>2]>>2]=(c[c[i>>2]>>2]|0)+(u<<2)|0;L43:do{if((c[v>>2]|0)>1){w=1;while(1){c[(c[l>>2]|0)+(w<<2)>>2]=(c[(c[i>>2]|0)+(w<<2)>>2]|0)+(c[d>>2]<<2)|0;x=w+1|0;if((x|0)<(c[v>>2]|0)){w=x}else{break L43}}}}while(0);y=c[m>>2]|0;z=c[d>>2]|0}else{y=n;z=u}v=c[l>>2]|0;w=y-z|0;if((w|0)<=0){k=t;break L16}x=c[q>>2]|0;A=c[r>>2]|0;B=(w|0)<(A|0)?w:A;if((x|0)>0){A=(B|0)>0;w=0;while(1){L53:do{if(A){C=v+(w<<2)|0;D=(c[s>>2]|0)+(w<<2)|0;E=0;while(1){g[D>>2]=+g[(c[C>>2]|0)+(E<<2)>>2];F=E+1|0;if((F|0)<(B|0)){D=D+(x<<2)|0;E=F}else{break L53}}}}while(0);E=w+1|0;if((E|0)<(x|0)){w=E}else{break}}G=c[d>>2]|0}else{G=z}w=G+B|0;do{if((B|0)==0){H=48}else{if((w|0)>(c[m>>2]|0)){I=-131;break}else{H=48;break}}}while(0);if((H|0)==48){H=0;c[d>>2]=w;I=0}aw(f|0,$(B,x)|0);v=c[d>>2]|0;if((v|0)>-1){t=I;u=v}else{k=I;break L16}}}}while(0);I=b+280|0;if((c[I>>2]|0)==0){return k|0}c[I>>2]=0;return k|0}function bh(a){a=a|0;bk(a+48|0);bi(a+160|0);bo(a|0);bn(a+32|0);cA(a);return}function bi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;b=c[a+104>>2]|0;d=a+84|0;e=c[d>>2]|0;L72:do{if((e|0)!=0){f=e;while(1){g=c[f+4>>2]|0;cA(c[f>>2]|0);h=f;c[h>>2]=0;c[h+4>>2]=0;cA(f);if((g|0)==0){break L72}else{f=g}}}}while(0);e=a+80|0;f=c[e>>2]|0;g=a+68|0;h=c[g>>2]|0;if((f|0)==0){i=h}else{j=a+76|0;k=cC(h,(c[j>>2]|0)+f|0)|0;c[g>>2]=k;c[j>>2]=(c[j>>2]|0)+(c[e>>2]|0)|0;c[e>>2]=0;i=k}c[a+72>>2]=0;c[d>>2]=0;if((i|0)!=0){cA(i)}if((b|0)==0){l=a;cG(l|0,0,112);return 0}i=b+12|0;d=0;while(1){k=i+(d<<2)|0;e=c[k>>2]|0;j=c[e+8>>2]|0;if((j|0)!=0){cA(j)}cG(e|0,0,20);if((d|0)==7){d=d+1|0;continue}else{cA(c[k>>2]|0);k=d+1|0;if((k|0)<15){d=k;continue}else{break}}}cA(b);l=a;cG(l|0,0,112);return 0}function bj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=c[b+28>>2]|0;if((e|0)==0){f=1;return f|0}g=c[e+3656>>2]|0;cG(a|0,0,112);h=cB(1,136)|0;c[a+104>>2]=h;c[a+4>>2]=b;i=c[e+8>>2]|0;j=(i|0)==0?0:i-1|0;L99:do{if((j|0)==0){k=0}else{i=j;l=0;while(1){m=l+1|0;n=i>>>1;if((n|0)==0){k=m;break L99}else{i=n;l=m}}}}while(0);c[h+44>>2]=k;k=h+12|0;c[k>>2]=cB(1,4)|0;j=h+16|0;c[j>>2]=cB(1,4)|0;l=cB(1,20)|0;c[c[k>>2]>>2]=l;l=cB(1,20)|0;c[c[j>>2]>>2]=l;l=e;i=e;br(c[c[k>>2]>>2]|0,c[i>>2]>>g);k=e+4|0;br(c[c[j>>2]>>2]|0,c[k>>2]>>g);g=c[i>>2]|0;j=(g|0)==0?0:g-1|0;if((j|0)==0){o=-6}else{g=j;j=0;while(1){m=g>>>1;if((m|0)==0){break}else{g=m;j=j+1|0}}o=j-5|0}c[h+4>>2]=o;o=c[k>>2]|0;j=(o|0)==0?0:o-1|0;if((j|0)==0){p=-6}else{o=j;j=0;while(1){g=o>>>1;if((g|0)==0){break}else{o=g;j=j+1|0}}p=j-5|0}c[h+8>>2]=p;L113:do{if((d|0)==0){p=e+2848|0;if((c[p>>2]|0)!=0){break}j=e+24|0;c[p>>2]=cB(c[j>>2]|0,56)|0;o=c[j>>2]|0;if((o|0)<=0){break}g=e+1824|0;m=0;n=o;while(1){o=g+(m<<2)|0;q=c[o>>2]|0;if((q|0)==0){r=n;break}if((bZ((c[p>>2]|0)+(m*56&-1)|0,q)|0)!=0){s=99;break}q=c[o>>2]|0;if((c[q+36>>2]|0)!=0){t=c[q+32>>2]|0;if((t|0)!=0){cA(t)}t=c[q+8>>2]|0;if((t|0)!=0){cA(t)}t=q;cG(t|0,0,40);cA(t)}c[o>>2]=0;o=m+1|0;t=c[j>>2]|0;if((o|0)<(t|0)){m=o;n=t}else{break L113}}if((s|0)==99){r=c[j>>2]|0}L147:do{if((r|0)>0){n=0;m=r;while(1){p=g+(n<<2)|0;t=c[p>>2]|0;if((t|0)==0){u=m}else{if((c[t+36>>2]|0)!=0){o=c[t+32>>2]|0;if((o|0)!=0){cA(o)}o=c[t+8>>2]|0;if((o|0)!=0){cA(o)}o=t;cG(o|0,0,40);cA(o)}c[p>>2]=0;u=c[j>>2]|0}p=n+1|0;if((p|0)<(u|0)){n=p;m=u}else{break L147}}}}while(0);bk(a);f=-1;return f|0}else{b1(h+20|0,c[i>>2]|0);b1(h+32|0,c[k>>2]|0);j=e+2848|0;L115:do{if((c[j>>2]|0)==0){g=e+24|0;m=cB(c[g>>2]|0,56)|0;c[j>>2]=m;if((c[g>>2]|0)<=0){break}n=e+1824|0;p=0;o=m;while(1){bY(o+(p*56&-1)|0,c[n+(p<<2)>>2]|0);m=p+1|0;if((m|0)>=(c[g>>2]|0)){break L115}p=m;o=c[j>>2]|0}}}while(0);j=e+28|0;o=cB(c[j>>2]|0,52)|0;p=h+56|0;c[p>>2]=o;L122:do{if((c[j>>2]|0)>0){g=e+2852|0;n=e+2868|0;m=b+8|0;t=0;q=o;while(1){v=c[g+(t<<2)>>2]|0;bw(q+(t*52&-1)|0,v,n,(c[l+(c[v>>2]<<2)>>2]|0)/2&-1,c[m>>2]|0);v=t+1|0;if((v|0)>=(c[j>>2]|0)){break L122}t=v;q=c[p>>2]|0}}}while(0);c[a>>2]=1}}while(0);l=a+16|0;c[l>>2]=c[k>>2]|0;i=b+4|0;b=a+8|0;c[b>>2]=cz(c[i>>2]<<2)|0;c[a+12>>2]=cz(c[i>>2]<<2)|0;L165:do{if((c[i>>2]|0)>0){u=0;while(1){r=cB(c[l>>2]|0,4)|0;c[(c[b>>2]|0)+(u<<2)>>2]=r;r=u+1|0;if((r|0)<(c[i>>2]|0)){u=r}else{break L165}}}}while(0);c[a+36>>2]=0;c[a+40>>2]=0;i=(c[k>>2]|0)/2&-1;c[a+48>>2]=i;c[a+20>>2]=i;i=e+16|0;k=h+48|0;c[k>>2]=cB(c[i>>2]|0,4)|0;b=e+20|0;l=h+52|0;c[l>>2]=cB(c[b>>2]|0,4)|0;L169:do{if((c[i>>2]|0)>0){h=e+800|0;u=e+1056|0;r=0;while(1){s=aW[c[(c[56536+(c[h+(r<<2)>>2]<<2)>>2]|0)+8>>2]&31](a,c[u+(r<<2)>>2]|0)|0;c[(c[k>>2]|0)+(r<<2)>>2]=s;s=r+1|0;if((s|0)<(c[i>>2]|0)){r=s}else{break L169}}}}while(0);if((c[b>>2]|0)<=0){f=0;return f|0}i=e+1312|0;k=e+1568|0;e=0;while(1){r=aW[c[(c[56040+(c[i+(e<<2)>>2]<<2)>>2]|0)+8>>2]&31](a,c[k+(e<<2)>>2]|0)|0;c[(c[l>>2]|0)+(e<<2)>>2]=r;r=e+1|0;if((r|0)<(c[b>>2]|0)){e=r}else{f=0;break}}return f|0}function bk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;if((a|0)==0){return}b=c[a+4>>2]|0;d=(b|0)!=0;if(d){e=c[b+28>>2]|0}else{e=0}f=c[a+104>>2]|0;g=(f|0)!=0;do{if(g){h=f;i=c[h>>2]|0;if((i|0)!=0){bm(i);cA(c[h>>2]|0)}h=f+12|0;i=c[h>>2]|0;if((i|0)!=0){j=c[i>>2]|0;if((j|0)==0){k=0}else{i=c[j+8>>2]|0;if((i|0)!=0){cA(i)}i=c[j+12>>2]|0;if((i|0)!=0){cA(i)}cG(j|0,0,20);k=c[c[h>>2]>>2]|0}cA(k);cA(c[h>>2]|0)}h=f+16|0;j=c[h>>2]|0;if((j|0)!=0){i=c[j>>2]|0;if((i|0)==0){l=0}else{j=c[i+8>>2]|0;if((j|0)!=0){cA(j)}j=c[i+12>>2]|0;if((j|0)!=0){cA(j)}cG(i|0,0,20);l=c[c[h>>2]>>2]|0}cA(l);cA(c[h>>2]|0)}h=f+48|0;i=c[h>>2]|0;if((i|0)!=0){L218:do{if((e|0)==0){m=i}else{j=e+16|0;if((c[j>>2]|0)>0){n=0;o=i}else{m=i;break}while(1){aP[c[(c[56536+(c[e+800+(n<<2)>>2]<<2)>>2]|0)+16>>2]&15](c[o+(n<<2)>>2]|0);p=n+1|0;q=c[h>>2]|0;if((p|0)<(c[j>>2]|0)){n=p;o=q}else{m=q;break L218}}}}while(0);cA(m)}h=f+52|0;i=c[h>>2]|0;if((i|0)!=0){L226:do{if((e|0)==0){r=i}else{j=e+20|0;if((c[j>>2]|0)>0){s=0;t=i}else{r=i;break}while(1){aP[c[(c[56040+(c[e+1312+(s<<2)>>2]<<2)>>2]|0)+16>>2]&15](c[t+(s<<2)>>2]|0);q=s+1|0;p=c[h>>2]|0;if((q|0)<(c[j>>2]|0)){s=q;t=p}else{r=p;break L226}}}}while(0);cA(r)}h=f+56|0;i=c[h>>2]|0;if((i|0)!=0){L234:do{if((e|0)==0){u=i}else{j=e+28|0;if((c[j>>2]|0)>0){v=0;w=i}else{u=i;break}while(1){by(w+(v*52&-1)|0);p=v+1|0;q=c[h>>2]|0;if((p|0)<(c[j>>2]|0)){v=p;w=q}else{u=q;break L234}}}}while(0);cA(u)}h=c[f+60>>2]|0;if((h|0)!=0){i=h;cG(i|0,0,36);cA(i)}cG(f+80|0,0,48);i=f+20|0;if((i|0)!=0){h=c[f+24>>2]|0;if((h|0)!=0){cA(h)}h=c[f+28>>2]|0;if((h|0)!=0){cA(h)}cG(i|0,0,12)}i=f+32|0;if((i|0)==0){break}h=c[f+36>>2]|0;if((h|0)!=0){cA(h)}h=c[f+40>>2]|0;if((h|0)!=0){cA(h)}cG(i|0,0,12)}}while(0);u=a+8|0;w=c[u>>2]|0;do{if((w|0)!=0){L262:do{if(d){v=b+4|0;e=c[v>>2]|0;if((e|0)>0){x=0;y=e;z=w}else{A=w;break}while(1){e=c[z+(x<<2)>>2]|0;if((e|0)==0){B=y}else{cA(e);B=c[v>>2]|0}e=x+1|0;r=c[u>>2]|0;if((e|0)<(B|0)){x=e;y=B;z=r}else{A=r;break L262}}}else{A=w}}while(0);cA(A);v=c[a+12>>2]|0;if((v|0)==0){break}cA(v)}}while(0);if(g){g=c[f+64>>2]|0;if((g|0)!=0){cA(g)}g=c[f+68>>2]|0;if((g|0)!=0){cA(g)}g=c[f+72>>2]|0;if((g|0)!=0){cA(g)}cA(f)}cG(a|0,0,112);return}function bl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;d=c[a+4>>2]|0;e=c[d+28>>2]|0;f=c[a+104>>2]|0;h=c[e+3656>>2]|0;if((b|0)==0){i=-131;return i|0}j=a+20|0;k=a+24|0;l=c[k>>2]|0;if(!((c[j>>2]|0)<=(l|0)|(l|0)==-1)){i=-131;return i|0}l=a+40|0;m=a+36|0;c[m>>2]=c[l>>2]|0;c[l>>2]=c[b+28>>2]|0;c[a+44>>2]=-1;n=a+64|0;o=c[n>>2]|0;p=c[n+4>>2]|0;do{if((o|0)==(-1|0)&(p|0)==(-1|0)){q=b+56|0;r=206;break}else{s=cK(o,p,1,0)|0;t=D;u=b+56|0;if((s|0)==(c[u>>2]|0)&(t|0)==(c[u+4>>2]|0)){v=t;w=s;break}else{q=u;r=206;break}}}while(0);if((r|0)==206){r=a+56|0;c[r>>2]=-1;c[r+4>>2]=-1;r=f+128|0;c[r>>2]=-1;c[r+4>>2]=-1;v=c[q+4>>2]|0;w=c[q>>2]|0}c[n>>2]=w;c[n+4>>2]=v;v=b|0;do{if((c[v>>2]|0)!=0){n=c[l>>2]|0;w=e;q=h+1|0;r=c[w+(n<<2)>>2]>>q;p=c[e>>2]>>q;o=c[e+4>>2]>>q;q=c[b+88>>2]|0;u=a+72|0;s=cK(c[u>>2]|0,c[u+4>>2]|0,q,(q|0)<0?-1:0)|0;c[u>>2]=s;c[u+4>>2]=D;u=c[b+92>>2]|0;s=a+80|0;q=cK(c[s>>2]|0,c[s+4>>2]|0,u,(u|0)<0?-1:0)|0;c[s>>2]=q;c[s+4>>2]=D;s=c[b+96>>2]|0;q=a+88|0;u=cK(c[q>>2]|0,c[q+4>>2]|0,s,(s|0)<0?-1:0)|0;c[q>>2]=u;c[q+4>>2]=D;q=c[b+100>>2]|0;u=a+96|0;s=cK(c[u>>2]|0,c[u+4>>2]|0,q,(q|0)<0?-1:0)|0;c[u>>2]=s;c[u+4>>2]=D;u=a+48|0;s=c[u>>2]|0;q=(s|0)==0;t=q?o:0;x=q?0:o;q=d+4|0;if((c[q>>2]|0)>0){y=f+4|0;z=a+8|0;A=(o|0)/2&-1;B=(p|0)/2&-1;C=A-B|0;E=(p|0)>0;F=B+A|0;B=p-1|0;G=(r|0)>0;H=f+8|0;I=(o|0)>0;J=o-1|0;K=(A+t|0)+((p|0)/-2&-1)|0;A=0;L=n;while(1){n=(L|0)!=0;L304:do{if((c[m>>2]|0)==0){M=c[32648+((c[y>>2]|0)-h<<2)>>2]|0;N=c[(c[z>>2]|0)+(A<<2)>>2]|0;O=c[(c[v>>2]|0)+(A<<2)>>2]|0;if(!n){if(E){P=0}else{break}while(1){Q=N+(P+t<<2)|0;g[Q>>2]=+g[Q>>2]*+g[M+(B-P<<2)>>2]+ +g[O+(P<<2)>>2]*+g[M+(P<<2)>>2];Q=P+1|0;if((Q|0)<(p|0)){P=Q}else{break L304}}}L319:do{if(E){Q=0;while(1){R=N+(Q+t<<2)|0;g[R>>2]=+g[R>>2]*+g[M+(B-Q<<2)>>2]+ +g[O+(Q+C<<2)>>2]*+g[M+(Q<<2)>>2];R=Q+1|0;if((R|0)<(p|0)){Q=R}else{S=p;break L319}}}else{S=0}}while(0);if((S|0)<(F|0)){T=S}else{break}while(1){g[N+(T+t<<2)>>2]=+g[O+(T+C<<2)>>2];M=T+1|0;if((M|0)<(F|0)){T=M}else{break L304}}}else{if(n){O=c[32648+((c[H>>2]|0)-h<<2)>>2]|0;N=c[(c[z>>2]|0)+(A<<2)>>2]|0;M=c[(c[v>>2]|0)+(A<<2)>>2]|0;if(I){U=0}else{break}while(1){Q=N+(U+t<<2)|0;g[Q>>2]=+g[Q>>2]*+g[O+(J-U<<2)>>2]+ +g[M+(U<<2)>>2]*+g[O+(U<<2)>>2];Q=U+1|0;if((Q|0)<(o|0)){U=Q}else{break L304}}}else{O=c[32648+((c[y>>2]|0)-h<<2)>>2]|0;M=c[(c[z>>2]|0)+(A<<2)>>2]|0;N=c[(c[v>>2]|0)+(A<<2)>>2]|0;if(E){V=0}else{break}while(1){Q=M+(K+V<<2)|0;g[Q>>2]=+g[Q>>2]*+g[O+(B-V<<2)>>2]+ +g[N+(V<<2)>>2]*+g[O+(V<<2)>>2];Q=V+1|0;if((Q|0)<(p|0)){V=Q}else{break L304}}}}}while(0);n=c[(c[z>>2]|0)+(A<<2)>>2]|0;O=c[(c[v>>2]|0)+(A<<2)>>2]|0;L326:do{if(G){N=0;while(1){g[n+(N+x<<2)>>2]=+g[O+(N+r<<2)>>2];M=N+1|0;if((M|0)<(r|0)){N=M}else{break L326}}}}while(0);O=A+1|0;if((O|0)>=(c[q>>2]|0)){break}A=O;L=c[l>>2]|0}W=c[u>>2]|0}else{W=s}c[u>>2]=(W|0)==0?o:0;if((c[k>>2]|0)==-1){c[k>>2]=x;c[j>>2]=x;break}else{c[k>>2]=t;c[j>>2]=(((c[w+(c[l>>2]<<2)>>2]|0)/4&-1)+((c[w+(c[m>>2]<<2)>>2]|0)/4&-1)>>h)+t|0;break}}}while(0);W=f+128|0;f=c[W>>2]|0;v=c[W+4>>2]|0;if((f|0)==(-1|0)&(v|0)==(-1|0)){X=0;Y=0}else{V=e;U=((c[V+(c[l>>2]<<2)>>2]|0)/4&-1)+((c[V+(c[m>>2]<<2)>>2]|0)/4&-1)|0;V=cK(U,(U|0)<0?-1:0,f,v)|0;X=D;Y=V}c[W>>2]=Y;c[W+4>>2]=X;X=a+56|0;Y=c[X>>2]|0;V=c[X+4>>2]|0;do{if((Y|0)==(-1|0)&(V|0)==(-1|0)){v=b+48|0;f=c[v>>2]|0;U=c[v+4>>2]|0;if((f|0)==(-1|0)&(U|0)==(-1|0)){break}c[X>>2]=f;c[X+4>>2]=U;T=c[W>>2]|0;S=c[W+4>>2]|0;if(!((S|0)>(U|0)|(S|0)==(U|0)&T>>>0>f>>>0)){break}f=cL(T,S,c[v>>2]|0,c[v+4>>2]|0)|0;v=f;f=(v|0)<0?0:v;if((c[b+44>>2]|0)!=0){v=c[j>>2]|0;S=v-(c[k>>2]|0)<<h;c[j>>2]=v-(((f|0)>(S|0)?S:f)>>h)|0;break}S=(c[k>>2]|0)+(f>>h)|0;c[k>>2]=S;f=c[j>>2]|0;if((S|0)<=(f|0)){break}c[k>>2]=f}else{f=e;S=((c[f+(c[l>>2]<<2)>>2]|0)/4&-1)+((c[f+(c[m>>2]<<2)>>2]|0)/4&-1)|0;f=cK(S,(S|0)<0?-1:0,Y,V)|0;S=D;c[X>>2]=f;c[X+4>>2]=S;v=b+48|0;T=c[v>>2]|0;U=c[v+4>>2]|0;if((T|0)==(-1|0)&(U|0)==(-1|0)|(f|0)==(T|0)&(S|0)==(U|0)){break}do{if((S|0)>(U|0)|(S|0)==(U|0)&f>>>0>T>>>0){P=cL(f,S,T,U)|0;d=P;if((d|0)==0){Z=U;_=T;break}if((c[b+44>>2]|0)==0){Z=U;_=T;break}P=c[j>>2]|0;L=P-(c[k>>2]|0)<<h;A=(d|0)>(L|0)?L:d;c[j>>2]=P-(((A|0)<0?0:A)>>h)|0;Z=c[v+4>>2]|0;_=c[v>>2]|0}else{Z=U;_=T}}while(0);c[X>>2]=_;c[X+4>>2]=Z}}while(0);if((c[b+44>>2]|0)==0){i=0;return i|0}c[a+32>>2]=1;i=0;return i|0}function bm(a){a=a|0;var b=0,d=0;b=a+16|0;if((b|0)!=0){d=c[a+24>>2]|0;if((d|0)!=0){cA(d)}d=c[a+28>>2]|0;if((d|0)!=0){cA(d)}cG(b|0,0,20)}cA(c[a+48>>2]|0);cA(c[a+64>>2]|0);cA(c[a+80>>2]|0);cA(c[a+96>>2]|0);cA(c[a+112>>2]|0);cA(c[a+128>>2]|0);cA(c[a+144>>2]|0);cA(c[a+36>>2]|0);cA(c[a+152>>2]|0);cA(c[a+160>>2]|0);cG(a|0,0,180);return}function bn(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((a|0)==0){return}b=a|0;d=c[b>>2]|0;if((d|0)!=0){e=a+8|0;f=c[e>>2]|0;L376:do{if((f|0)>0){g=0;h=d;i=f;while(1){j=c[h+(g<<2)>>2]|0;if((j|0)==0){k=i;l=h}else{cA(j);k=c[e>>2]|0;l=c[b>>2]|0}j=g+1|0;if((j|0)<(k|0)){g=j;h=l;i=k}else{m=l;break L376}}}else{m=d}}while(0);cA(m)}m=c[a+4>>2]|0;if((m|0)!=0){cA(m)}m=c[a+12>>2]|0;if((m|0)!=0){cA(m)}cG(a|0,0,16);return}function bo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=c[a+28>>2]|0;if((b|0)==0){d=a;cG(d|0,0,32);return}e=b+8|0;f=c[e>>2]|0;L395:do{if((f|0)>0){g=b+32|0;h=0;i=f;while(1){j=c[g+(h<<2)>>2]|0;if((j|0)==0){k=i}else{cA(j);k=c[e>>2]|0}j=h+1|0;if((j|0)<(k|0)){h=j;i=k}else{break L395}}}}while(0);k=b+12|0;e=c[k>>2]|0;L403:do{if((e|0)>0){f=b+544|0;i=b+288|0;h=0;g=e;while(1){j=c[f+(h<<2)>>2]|0;if((j|0)==0){l=g}else{aP[c[(c[56056+(c[i+(h<<2)>>2]<<2)>>2]|0)+8>>2]&15](j);l=c[k>>2]|0}j=h+1|0;if((j|0)<(l|0)){h=j;g=l}else{break L403}}}}while(0);l=b+16|0;k=c[l>>2]|0;L411:do{if((k|0)>0){e=b+1056|0;g=b+800|0;h=0;i=k;while(1){f=c[e+(h<<2)>>2]|0;if((f|0)==0){m=i}else{aP[c[(c[56536+(c[g+(h<<2)>>2]<<2)>>2]|0)+12>>2]&15](f);m=c[l>>2]|0}f=h+1|0;if((f|0)<(m|0)){h=f;i=m}else{break L411}}}}while(0);m=b+20|0;l=c[m>>2]|0;L419:do{if((l|0)>0){k=b+1568|0;i=b+1312|0;h=0;g=l;while(1){e=c[k+(h<<2)>>2]|0;if((e|0)==0){n=g}else{aP[c[(c[56040+(c[i+(h<<2)>>2]<<2)>>2]|0)+12>>2]&15](e);n=c[m>>2]|0}e=h+1|0;if((e|0)<(n|0)){h=e;g=n}else{break L419}}}}while(0);n=b+24|0;L427:do{if((c[n>>2]|0)>0){m=b+1824|0;l=b+2848|0;g=0;while(1){h=c[m+(g<<2)>>2]|0;do{if((h|0)!=0){if((c[h+36>>2]|0)==0){break}i=c[h+32>>2]|0;if((i|0)!=0){cA(i)}i=c[h+8>>2]|0;if((i|0)!=0){cA(i)}i=h;cG(i|0,0,40);cA(i)}}while(0);h=c[l>>2]|0;if((h|0)!=0){bX(h+(g*56&-1)|0)}h=g+1|0;if((h|0)<(c[n>>2]|0)){g=h}else{o=l;break L427}}}else{o=b+2848|0}}while(0);n=c[o>>2]|0;if((n|0)!=0){cA(n)}n=b+28|0;o=c[n>>2]|0;L449:do{if((o|0)>0){l=b+2852|0;g=0;m=o;while(1){h=c[l+(g<<2)>>2]|0;if((h|0)==0){p=m}else{i=h;cG(i|0,0,520);cA(i);p=c[n>>2]|0}i=g+1|0;if((i|0)<(p|0)){g=i;m=p}else{break L449}}}}while(0);cA(b);d=a;cG(d|0,0,32);return}function bp(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+32|0;e=d|0;f=d+24|0;if((b|0)==0){g=0;i=d;return g|0}h=c[b>>2]|0;j=c[b+4>>2]|0;k=e;c[k>>2]=0;c[k+4>>2]=0;c[e+12>>2]=h;c[e+8>>2]=h;c[e+16>>2]=j;if((c[b+8>>2]|0)==0){g=0;i=d;return g|0}if((cw(e,8)|0)!=1){g=0;i=d;return g|0}b=f|0;cG(b|0,0,5);a[b]=cw(e,8)&255;a[f+1|0]=cw(e,8)&255;a[f+2|0]=cw(e,8)&255;a[f+3|0]=cw(e,8)&255;a[f+4|0]=cw(e,8)&255;a[f+5|0]=cw(e,8)&255;g=(cI(b|0,56032,6)|0)==0&1;i=d;return g|0}function bq(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+32|0;g=f|0;h=f+24|0;if((e|0)==0){j=-133;i=f;return j|0}k=c[e>>2]|0;l=c[e+4>>2]|0;m=g;c[m>>2]=0;c[m+4>>2]=0;c[g+12>>2]=k;c[g+8>>2]=k;k=g+16|0;c[k>>2]=l;l=cw(g,8)|0;m=h|0;cG(m|0,0,5);a[m]=cw(g,8)&255;a[h+1|0]=cw(g,8)&255;a[h+2|0]=cw(g,8)&255;a[h+3|0]=cw(g,8)&255;a[h+4|0]=cw(g,8)&255;a[h+5|0]=cw(g,8)&255;if((cI(m|0,56032,6)|0)!=0){j=-132;i=f;return j|0}if((l|0)==3){if((c[b+8>>2]|0)==0){j=-133;i=f;return j|0}m=cw(g,32)|0;L481:do{if((m|0)>=0){if((m|0)>((c[k>>2]|0)-8|0)){break}h=cB(m+1|0,1)|0;c[d+12>>2]=h;L484:do{if((m|0)!=0){n=h;o=m;while(1){p=o-1|0;a[n]=cw(g,8)&255;if((p|0)==0){break L484}else{n=n+1|0;o=p}}}}while(0);h=cw(g,32)|0;if((h|0)<0){break}o=g|0;n=g+4|0;if((h|0)>(((c[k>>2]|0)-(c[o>>2]|0)|0)+(((c[n>>2]|0)+7|0)/-8&-1)>>2|0)){break}p=d+8|0;c[p>>2]=h;q=d|0;c[q>>2]=cB(h+1|0,4)|0;h=d+4|0;c[h>>2]=cB((c[p>>2]|0)+1|0,4)|0;L490:do{if((c[p>>2]|0)>0){r=0;while(1){s=cw(g,32)|0;if((s|0)<0){break L481}if((s|0)>(((c[k>>2]|0)-(c[o>>2]|0)|0)+(((c[n>>2]|0)+7|0)/-8&-1)|0)){break L481}c[(c[h>>2]|0)+(r<<2)>>2]=s;t=cB(s+1|0,1)|0;c[(c[q>>2]|0)+(r<<2)>>2]=t;L495:do{if((s|0)!=0){t=c[(c[q>>2]|0)+(r<<2)>>2]|0;u=s;while(1){v=u-1|0;a[t]=cw(g,8)&255;if((v|0)==0){break L495}else{t=t+1|0;u=v}}}}while(0);s=r+1|0;if((s|0)<(c[p>>2]|0)){r=s}else{break L490}}}}while(0);if((cw(g,1)|0)==1){j=0}else{break}i=f;return j|0}}while(0);bn(d);j=-133;i=f;return j|0}else if((l|0)==5){if((c[b+8>>2]|0)==0){j=-133;i=f;return j|0}if((c[d+12>>2]|0)==0){j=-133;i=f;return j|0}d=c[b+28>>2]|0;if((d|0)==0){j=-129;i=f;return j|0}k=cw(g,8)|0;m=k+1|0;p=d+24|0;c[p>>2]=m;L514:do{if((k|0)>=0){q=d+1824|0;L516:do{if((m|0)>0){h=0;while(1){n=b5(g)|0;c[q+(h<<2)>>2]=n;if((n|0)==0){break L514}n=h+1|0;if((n|0)<(c[p>>2]|0)){h=n}else{break L516}}}}while(0);q=cw(g,6)|0;h=q+1|0;if((q|0)<0){break}else{w=0}while(1){if((w|0)>=(h|0)){break}if((cw(g,16)|0)==0){w=w+1|0}else{break L514}}h=cw(g,6)|0;q=h+1|0;n=d+16|0;c[n>>2]=q;if((h|0)<0){break}h=d+800|0;o=d+1056|0;L526:do{if((q|0)>0){r=0;while(1){s=cw(g,16)|0;c[h+(r<<2)>>2]=s;if(s>>>0>1){break L514}u=aW[c[(c[56536+(s<<2)>>2]|0)+4>>2]&31](b,g)|0;c[o+(r<<2)>>2]=u;if((u|0)==0){break L514}u=r+1|0;if((u|0)<(c[n>>2]|0)){r=u}else{break L526}}}}while(0);n=cw(g,6)|0;o=n+1|0;h=d+20|0;c[h>>2]=o;if((n|0)<0){break}n=d+1312|0;q=d+1568|0;L533:do{if((o|0)>0){r=0;while(1){u=cw(g,16)|0;c[n+(r<<2)>>2]=u;if(u>>>0>2){break L514}s=aW[c[(c[56040+(u<<2)>>2]|0)+4>>2]&31](b,g)|0;c[q+(r<<2)>>2]=s;if((s|0)==0){break L514}s=r+1|0;if((s|0)<(c[h>>2]|0)){r=s}else{break L533}}}}while(0);h=cw(g,6)|0;q=h+1|0;n=d+12|0;c[n>>2]=q;if((h|0)<0){break}h=d+288|0;o=d+544|0;L540:do{if((q|0)>0){r=0;while(1){s=cw(g,16)|0;c[h+(r<<2)>>2]=s;if((s|0)!=0){break L514}s=ct(b,g)|0;c[o+(r<<2)>>2]=s;if((s|0)==0){break L514}s=r+1|0;if((s|0)<(c[n>>2]|0)){r=s}else{break L540}}}}while(0);o=cw(g,6)|0;h=o+1|0;q=d+8|0;c[q>>2]=h;if((o|0)<0){break}o=d+32|0;L547:do{if((h|0)>0){r=0;while(1){s=o+(r<<2)|0;c[s>>2]=cB(1,16)|0;u=cw(g,1)|0;c[c[s>>2]>>2]=u;u=cw(g,16)|0;c[(c[s>>2]|0)+4>>2]=u;u=cw(g,16)|0;c[(c[s>>2]|0)+8>>2]=u;u=cw(g,8)|0;c[(c[s>>2]|0)+12>>2]=u;u=c[s>>2]|0;if((c[u+4>>2]|0)>0){break L514}if((c[u+8>>2]|0)>0){break L514}s=c[u+12>>2]|0;if((s|0)>=(c[n>>2]|0)|(s|0)<0){break L514}s=r+1|0;if((s|0)<(c[q>>2]|0)){r=s}else{break L547}}}}while(0);if((cw(g,1)|0)==1){j=0}else{break}i=f;return j|0}}while(0);bo(b);j=-133;i=f;return j|0}else if((l|0)==1){if((c[e+8>>2]|0)==0){j=-133;i=f;return j|0}e=b+8|0;if((c[e>>2]|0)!=0){j=-133;i=f;return j|0}l=c[b+28>>2]|0;if((l|0)==0){j=-129;i=f;return j|0}d=cw(g,32)|0;c[b>>2]=d;if((d|0)!=0){j=-134;i=f;return j|0}d=b+4|0;c[d>>2]=cw(g,8)|0;c[e>>2]=cw(g,32)|0;c[b+12>>2]=cw(g,32)|0;c[b+16>>2]=cw(g,32)|0;c[b+20>>2]=cw(g,32)|0;w=l;c[w>>2]=1<<cw(g,4);p=1<<cw(g,4);c[l+4>>2]=p;do{if((c[e>>2]|0)>=1){if((c[d>>2]|0)<1){break}l=c[w>>2]|0;if((l|0)<64|(p|0)<(l|0)|(p|0)>8192){break}if((cw(g,1)|0)==1){j=0}else{break}i=f;return j|0}}while(0);bo(b);j=-133;i=f;return j|0}else{j=-133;i=f;return j|0}return 0}function br(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0.0,j=0,k=0.0,l=0,m=0.0,n=0.0,o=0,p=0.0,q=0,r=0,s=0,t=0;d=(b|0)/4&-1;e=cz(d<<2)|0;f=cz(d+b<<2)|0;h=b>>1;i=+(b|0);j=~~+at(+(+Z(+i)/.6931471805599453));c[a+4>>2]=j;c[a>>2]=b;c[a+8>>2]=f;c[a+12>>2]=e;if((b|0)<=3){k=4.0/i;l=a+16|0;g[l>>2]=k;return}m=3.141592653589793/+(b|0);n=3.141592653589793/+(b<<1|0);o=0;while(1){p=+(o<<2|0)*m;q=o<<1;g[f+(q<<2)>>2]=+R(+p);r=q|1;g[f+(r<<2)>>2]=-0.0- +S(+p);p=+(r|0)*n;r=q+h|0;g[f+(r<<2)>>2]=+R(+p);g[f+(r+1<<2)>>2]=+S(+p);r=o+1|0;if((r|0)<(d|0)){o=r}else{break}}o=(b|0)/8&-1;d=(b|0)>7;if(!d){k=4.0/i;l=a+16|0;g[l>>2]=k;return}n=3.141592653589793/+(b|0);h=0;while(1){m=+(h<<2|2|0)*n;r=(h<<1)+b|0;g[f+(r<<2)>>2]=+R(+m)*.5;g[f+(r+1<<2)>>2]=+S(+m)*-.5;r=h+1|0;if((r|0)<(o|0)){h=r}else{break}}h=(1<<j-1)-1|0;f=1<<j-2;if(d){s=0}else{k=4.0/i;l=a+16|0;g[l>>2]=k;return}while(1){d=0;j=0;b=f;while(1){if((b&s|0)==0){t=j}else{t=j|1<<d}r=d+1|0;q=f>>r;if((q|0)==0){break}else{d=r;j=t;b=q}}b=s<<1;c[e+(b<<2)>>2]=(h&(t^-1))-1|0;c[e+((b|1)<<2)>>2]=t;b=s+1|0;if((b|0)<(o|0)){s=b}else{break}}k=4.0/i;l=a+16|0;g[l>>2]=k;return}function bs(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,h=0,i=0,j=0.0,k=0,l=0.0,m=0.0,n=0,o=0.0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0,ae=0,af=0,ag=0.0,ah=0,ai=0.0,aj=0.0,ak=0.0,al=0,am=0,an=0.0,ao=0,ap=0.0,aq=0.0,ar=0.0;L603:do{if((a-6|0)>0){e=b;f=c+(d-8<<2)|0;h=c+((d>>1)-8<<2)|0;while(1){i=f+24|0;j=+g[i>>2];k=h+24|0;l=+g[k>>2];m=j-l;n=f+28|0;o=+g[n>>2];p=h+28|0;q=o- +g[p>>2];g[i>>2]=j+l;g[n>>2]=o+ +g[p>>2];n=e+4|0;g[k>>2]=q*+g[n>>2]+m*+g[e>>2];g[p>>2]=q*+g[e>>2]-m*+g[n>>2];n=f+16|0;m=+g[n>>2];p=h+16|0;q=+g[p>>2];o=m-q;k=f+20|0;l=+g[k>>2];i=h+20|0;j=l- +g[i>>2];g[n>>2]=m+q;g[k>>2]=l+ +g[i>>2];k=e+20|0;n=e+16|0;g[p>>2]=j*+g[k>>2]+o*+g[n>>2];g[i>>2]=j*+g[n>>2]-o*+g[k>>2];k=f+8|0;o=+g[k>>2];n=h+8|0;j=+g[n>>2];l=o-j;i=f+12|0;q=+g[i>>2];p=h+12|0;m=q- +g[p>>2];g[k>>2]=o+j;g[i>>2]=q+ +g[p>>2];i=e+36|0;k=e+32|0;g[n>>2]=m*+g[i>>2]+l*+g[k>>2];g[p>>2]=m*+g[k>>2]-l*+g[i>>2];l=+g[f>>2];m=+g[h>>2];q=l-m;i=f+4|0;j=+g[i>>2];k=h+4|0;o=j- +g[k>>2];g[f>>2]=l+m;g[i>>2]=j+ +g[k>>2];i=e+52|0;p=e+48|0;g[h>>2]=o*+g[i>>2]+q*+g[p>>2];g[k>>2]=o*+g[p>>2]-q*+g[i>>2];i=h-32|0;if(i>>>0<c>>>0){break L603}else{e=e+64|0;f=f-32|0;h=i}}}}while(0);h=a-7|0;L608:do{if((h|0)>0){a=1;f=h;while(1){e=1<<a;L611:do{if((e|0)>0){i=d>>a;p=4<<a;k=i-8|0;n=(i>>1)-8|0;r=p+1|0;s=p<<1;t=s|1;u=s+p|0;v=u+1|0;w=u+p|0;x=0;while(1){y=$(x,i);z=c+(y<<2)|0;A=b;B=c+(k+y<<2)|0;C=c+(n+y<<2)|0;while(1){y=B+24|0;q=+g[y>>2];D=C+24|0;o=+g[D>>2];j=q-o;E=B+28|0;m=+g[E>>2];F=C+28|0;l=m- +g[F>>2];g[y>>2]=q+o;g[E>>2]=m+ +g[F>>2];E=A+4|0;g[D>>2]=l*+g[E>>2]+j*+g[A>>2];g[F>>2]=l*+g[A>>2]-j*+g[E>>2];E=A+(p<<2)|0;F=B+16|0;j=+g[F>>2];D=C+16|0;l=+g[D>>2];m=j-l;y=B+20|0;o=+g[y>>2];G=C+20|0;q=o- +g[G>>2];g[F>>2]=j+l;g[y>>2]=o+ +g[G>>2];y=A+(r<<2)|0;g[D>>2]=q*+g[y>>2]+m*+g[E>>2];g[G>>2]=q*+g[E>>2]-m*+g[y>>2];y=A+(s<<2)|0;E=B+8|0;m=+g[E>>2];G=C+8|0;q=+g[G>>2];o=m-q;D=B+12|0;l=+g[D>>2];F=C+12|0;j=l- +g[F>>2];g[E>>2]=m+q;g[D>>2]=l+ +g[F>>2];D=A+(t<<2)|0;g[G>>2]=j*+g[D>>2]+o*+g[y>>2];g[F>>2]=j*+g[y>>2]-o*+g[D>>2];D=A+(u<<2)|0;o=+g[B>>2];j=+g[C>>2];l=o-j;y=B+4|0;q=+g[y>>2];F=C+4|0;m=q- +g[F>>2];g[B>>2]=o+j;g[y>>2]=q+ +g[F>>2];y=A+(v<<2)|0;g[C>>2]=m*+g[y>>2]+l*+g[D>>2];g[F>>2]=m*+g[D>>2]-l*+g[y>>2];y=C-32|0;if(y>>>0<z>>>0){break}else{A=A+(w<<2)|0;B=B-32|0;C=y}}C=x+1|0;if((C|0)<(e|0)){x=C}else{break L611}}}}while(0);e=f-1|0;if((e|0)>0){a=a+1|0;f=e}else{break L608}}}}while(0);if((d|0)>0){H=0}else{return}while(1){b=c+(H<<2)|0;h=c+((H|30)<<2)|0;l=+g[h>>2];f=c+((H|14)<<2)|0;m=+g[f>>2];q=l-m;a=c+((H|31)<<2)|0;j=+g[a>>2];e=c+((H|15)<<2)|0;o=+g[e>>2];I=j-o;J=l+m;m=j+o;x=c+((H|28)<<2)|0;o=+g[x>>2];w=c+((H|12)<<2)|0;j=+g[w>>2];l=o-j;v=c+((H|29)<<2)|0;K=+g[v>>2];u=c+((H|13)<<2)|0;L=+g[u>>2];M=K-L;N=o+j;j=K+L;L=l*.9238795042037964-M*.3826834261417389;K=l*.3826834261417389+M*.9238795042037964;t=c+((H|26)<<2)|0;M=+g[t>>2];s=c+((H|10)<<2)|0;l=+g[s>>2];o=M-l;r=c+((H|27)<<2)|0;O=+g[r>>2];p=c+((H|11)<<2)|0;P=+g[p>>2];Q=O-P;R=M+l;l=O+P;P=(o-Q)*.7071067690849304;O=(o+Q)*.7071067690849304;n=c+((H|24)<<2)|0;Q=+g[n>>2];k=c+((H|8)<<2)|0;o=+g[k>>2];M=Q-o;i=c+((H|25)<<2)|0;S=+g[i>>2];C=c+((H|9)<<2)|0;T=+g[C>>2];U=S-T;V=Q+o;o=S+T;T=M*.3826834261417389-U*.9238795042037964;S=M*.9238795042037964+U*.3826834261417389;B=c+((H|22)<<2)|0;U=+g[B>>2];A=c+((H|6)<<2)|0;M=+g[A>>2];Q=U-M;z=c+((H|7)<<2)|0;W=+g[z>>2];y=c+((H|23)<<2)|0;X=+g[y>>2];Y=W-X;Z=U+M;M=W+X;D=c+((H|4)<<2)|0;X=+g[D>>2];F=c+((H|20)<<2)|0;W=+g[F>>2];U=X-W;G=c+((H|5)<<2)|0;_=+g[G>>2];E=c+((H|21)<<2)|0;aa=+g[E>>2];ab=_-aa;ac=X+W;W=_+aa;aa=U*.3826834261417389+ab*.9238795042037964;_=ab*.3826834261417389-U*.9238795042037964;ad=c+((H|2)<<2)|0;U=+g[ad>>2];ae=c+((H|18)<<2)|0;ab=+g[ae>>2];X=U-ab;af=c+((H|3)<<2)|0;ag=+g[af>>2];ah=c+((H|19)<<2)|0;ai=+g[ah>>2];aj=ag-ai;ak=U+ab;ab=ag+ai;ai=(X+aj)*.7071067690849304;ag=(aj-X)*.7071067690849304;X=+g[b>>2];al=c+((H|16)<<2)|0;aj=+g[al>>2];U=X-aj;am=c+((H|1)<<2)|0;an=+g[am>>2];ao=c+((H|17)<<2)|0;ap=+g[ao>>2];aq=an-ap;ar=X+aj;aj=an+ap;ap=U*.9238795042037964+aq*.3826834261417389;an=aq*.9238795042037964-U*.3826834261417389;U=an-S;aq=ap-T;X=T+ap;ap=S+an;an=(U+aq)*.7071067690849304;S=(U-aq)*.7071067690849304;aq=ag-O;U=P-ai;T=P+ai;ai=O+ag;ag=L-aa;O=K-_;P=L+aa;aa=K+_;_=(ag-O)*.7071067690849304;K=(ag+O)*.7071067690849304;O=q-Y;ag=I-Q;L=q+Y;Y=I+Q;Q=O+aq;I=O-aq;aq=_+an;O=_-an;g[A>>2]=Q+aq;g[D>>2]=Q-aq;aq=K-S;Q=ag-U;g[b>>2]=I+aq;g[ad>>2]=I-aq;aq=K+S;S=ag+U;g[af>>2]=Q+O;g[am>>2]=Q-O;g[z>>2]=S+aq;g[G>>2]=S-aq;aq=L+T;S=L-T;T=P+X;L=P-X;g[f>>2]=aq+T;g[w>>2]=aq-T;T=aa-ap;aq=Y-ai;g[k>>2]=S+T;g[s>>2]=S-T;T=aa+ap;ap=Y+ai;g[p>>2]=aq+L;g[C>>2]=aq-L;g[e>>2]=ap+T;g[u>>2]=ap-T;T=aj-o;ap=ar-V;L=V+ar;ar=o+aj;aj=(ap+T)*.7071067690849304;o=(T-ap)*.7071067690849304;ap=ab-l;T=R-ak;V=R+ak;ak=l+ab;ab=N-ac;l=j-W;R=N+ac;ac=j+W;W=(ab-l)*.7071067690849304;j=(ab+l)*.7071067690849304;l=J-Z;ab=m-M;N=J+Z;Z=m+M;M=l+ap;m=l-ap;ap=W+aj;l=W-aj;g[B>>2]=M+ap;g[F>>2]=M-ap;ap=j-o;M=ab-T;g[al>>2]=m+ap;g[ae>>2]=m-ap;ap=j+o;o=ab+T;g[ah>>2]=M+l;g[ao>>2]=M-l;g[y>>2]=o+ap;g[E>>2]=o-ap;ap=N+V;o=N-V;V=R+L;N=R-L;g[h>>2]=ap+V;g[x>>2]=ap-V;V=ac-ar;ap=Z-ak;g[n>>2]=o+V;g[t>>2]=o-V;V=ac+ar;ar=Z+ak;g[r>>2]=ap+N;g[i>>2]=ap-N;g[a>>2]=ar+V;g[v>>2]=ar-V;v=H+32|0;if((v|0)<(d|0)){H=v}else{break}}return}function bt(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0,v=0;e=a|0;f=c[e>>2]|0;h=f>>1;i=f>>2;f=d+(h+i<<2)|0;j=a+8|0;k=(c[j>>2]|0)+(i<<2)|0;l=f;m=b+(h-7<<2)|0;while(1){n=l-16|0;o=m+8|0;p=k+12|0;q=k+8|0;g[n>>2]=+g[p>>2]*(-0.0- +g[o>>2])- +g[m>>2]*+g[q>>2];g[l-12>>2]=+g[m>>2]*+g[p>>2]- +g[o>>2]*+g[q>>2];q=m+24|0;o=k+4|0;p=m+16|0;g[l-8>>2]=+g[o>>2]*(-0.0- +g[q>>2])- +g[p>>2]*+g[k>>2];g[l-4>>2]=+g[p>>2]*+g[o>>2]- +g[q>>2]*+g[k>>2];q=m-32|0;if(q>>>0<b>>>0){break}else{k=k+16|0;l=n;m=q}}m=d+(h<<2)|0;l=(c[j>>2]|0)+(i<<2)|0;k=f;q=b+(h-8<<2)|0;while(1){n=l-16|0;o=q+16|0;p=l-4|0;r=q+24|0;s=l-8|0;g[k>>2]=+g[o>>2]*+g[p>>2]+ +g[r>>2]*+g[s>>2];g[k+4>>2]=+g[o>>2]*+g[s>>2]- +g[r>>2]*+g[p>>2];p=l-12|0;r=q+8|0;g[k+8>>2]=+g[q>>2]*+g[p>>2]+ +g[r>>2]*+g[n>>2];g[k+12>>2]=+g[q>>2]*+g[n>>2]- +g[r>>2]*+g[p>>2];p=q-32|0;if(p>>>0<b>>>0){break}else{l=n;k=k+16|0;q=p}}bs(c[a+4>>2]|0,c[j>>2]|0,m,h);bu(c[e>>2]|0,c[j>>2]|0,c[a+12>>2]|0,d);a=d;e=f;q=f;k=(c[j>>2]|0)+(h<<2)|0;while(1){h=q-16|0;j=k+4|0;l=a+4|0;g[q-4>>2]=+g[a>>2]*+g[j>>2]- +g[l>>2]*+g[k>>2];g[e>>2]=-0.0-(+g[a>>2]*+g[k>>2]+ +g[l>>2]*+g[j>>2]);j=a+8|0;l=k+12|0;b=a+12|0;p=k+8|0;g[q-8>>2]=+g[j>>2]*+g[l>>2]- +g[b>>2]*+g[p>>2];g[e+4>>2]=-0.0-(+g[j>>2]*+g[p>>2]+ +g[b>>2]*+g[l>>2]);l=a+16|0;b=k+20|0;p=a+20|0;j=k+16|0;g[q-12>>2]=+g[l>>2]*+g[b>>2]- +g[p>>2]*+g[j>>2];g[e+8>>2]=-0.0-(+g[l>>2]*+g[j>>2]+ +g[p>>2]*+g[b>>2]);b=a+24|0;p=k+28|0;j=a+28|0;l=k+24|0;g[h>>2]=+g[b>>2]*+g[p>>2]- +g[j>>2]*+g[l>>2];g[e+12>>2]=-0.0-(+g[b>>2]*+g[l>>2]+ +g[j>>2]*+g[p>>2]);p=a+32|0;if(p>>>0<h>>>0){a=p;e=e+16|0;q=h;k=k+32|0}else{break}}k=d+(i<<2)|0;i=f;d=k;q=k;while(1){k=q-16|0;e=i-16|0;t=+g[i-4>>2];g[q-4>>2]=t;g[d>>2]=-0.0-t;t=+g[i-8>>2];g[q-8>>2]=t;g[d+4>>2]=-0.0-t;t=+g[i-12>>2];g[q-12>>2]=t;g[d+8>>2]=-0.0-t;t=+g[e>>2];g[k>>2]=t;g[d+12>>2]=-0.0-t;a=d+16|0;if(a>>>0<e>>>0){i=e;d=a;q=k}else{u=f;v=f;break}}while(1){f=v-16|0;g[f>>2]=+g[u+12>>2];g[v-12>>2]=+g[u+8>>2];g[v-8>>2]=+g[u+4>>2];g[v-4>>2]=+g[u>>2];if(f>>>0>m>>>0){u=u+16|0;v=f}else{break}}return}function bu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0;f=a>>1;h=d;d=e;i=e+(f<<2)|0;j=b+(a<<2)|0;while(1){a=(c[h>>2]|0)+f|0;b=(c[h+4>>2]|0)+f|0;k=+g[e+(a+1<<2)>>2];l=+g[e+(b+1<<2)>>2];m=k-l;n=+g[e+(a<<2)>>2];o=+g[e+(b<<2)>>2];p=n+o;q=+g[j>>2];r=+g[j+4>>2];s=p*q+m*r;t=p*r-m*q;b=i-16|0;q=(k+l)*.5;l=(n-o)*.5;g[d>>2]=q+s;g[i-8>>2]=q-s;g[d+4>>2]=l+t;g[i-4>>2]=t-l;a=(c[h+8>>2]|0)+f|0;u=(c[h+12>>2]|0)+f|0;l=+g[e+(a+1<<2)>>2];t=+g[e+(u+1<<2)>>2];s=l-t;q=+g[e+(a<<2)>>2];o=+g[e+(u<<2)>>2];n=q+o;k=+g[j+8>>2];m=+g[j+12>>2];r=n*k+s*m;p=n*m-s*k;k=(l+t)*.5;t=(q-o)*.5;g[d+8>>2]=k+r;g[b>>2]=k-r;g[d+12>>2]=t+p;g[i-12>>2]=p-t;u=d+16|0;if(u>>>0<b>>>0){h=h+16|0;d=u;i=b;j=j+16|0}else{break}}return}function bv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;e=i;f=a|0;h=c[f>>2]|0;j=h>>1;k=h>>2;l=h>>3;m=i;i=i+(h<<2)|0;i=i+7>>3<<3;n=m;m=n+(j<<2)|0;o=j+k|0;p=b+(o<<2)|0;q=a+8|0;r=c[q>>2]|0;s=r+(j<<2)|0;if((l|0)>0){t=(l-1|0)>>>1;u=t<<1;v=(j-2|0)-u|0;w=(o-4|0)-(t<<2)|0;t=p;x=b+(o+1<<2)|0;o=s;y=0;while(1){z=t-16|0;A=o-8|0;B=+g[t-8>>2]+ +g[x>>2];C=+g[z>>2]+ +g[x+8>>2];D=o-4|0;g[n+(y+j<<2)>>2]=C*+g[D>>2]+B*+g[A>>2];g[n+((y|1)+j<<2)>>2]=C*+g[A>>2]-B*+g[D>>2];D=y+2|0;if((D|0)<(l|0)){t=z;x=x+16|0;o=A;y=D}else{break}}E=b+(w<<2)|0;F=r+(v<<2)|0;G=u+2|0}else{E=p;F=s;G=0}s=b+4|0;p=j-l|0;L651:do{if((G|0)<(p|0)){l=E;u=s;v=F;w=G;while(1){y=v-8|0;o=l-16|0;B=+g[l-8>>2]- +g[u>>2];C=+g[o>>2]- +g[u+8>>2];x=v-4|0;g[n+(w+j<<2)>>2]=C*+g[x>>2]+B*+g[y>>2];g[n+((w|1)+j<<2)>>2]=C*+g[y>>2]-B*+g[x>>2];x=u+16|0;t=w+2|0;if((t|0)<(p|0)){l=o;u=x;v=y;w=t}else{H=x;I=y;J=t;break L651}}}else{H=s;I=F;J=G}}while(0);L655:do{if((J|0)<(j|0)){G=b+(h<<2)|0;F=H;s=I;p=J;while(1){E=s-8|0;w=G-16|0;B=-0.0- +g[G-8>>2]- +g[F>>2];C=-0.0- +g[w>>2]- +g[F+8>>2];v=s-4|0;g[n+(p+j<<2)>>2]=C*+g[v>>2]+B*+g[E>>2];g[n+((p|1)+j<<2)>>2]=C*+g[E>>2]-B*+g[v>>2];v=p+2|0;if((v|0)<(j|0)){G=w;F=F+16|0;s=E;p=v}else{break L655}}}}while(0);bs(c[a+4>>2]|0,r,m,j);bu(c[f>>2]|0,c[q>>2]|0,c[a+12>>2]|0,n);if((k|0)<=0){i=e;return}f=a+16|0;a=n;n=d+(j<<2)|0;m=(c[q>>2]|0)+(j<<2)|0;j=0;while(1){q=n-4|0;r=a+4|0;J=m+4|0;g[d+(j<<2)>>2]=+g[f>>2]*(+g[a>>2]*+g[m>>2]+ +g[r>>2]*+g[J>>2]);g[q>>2]=+g[f>>2]*(+g[a>>2]*+g[J>>2]- +g[r>>2]*+g[m>>2]);r=j+1|0;if((r|0)<(k|0)){a=a+8|0;n=q;m=m+8|0;j=r}else{break}}i=e;return}function bw(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0,E=0,F=0;cG(a|0,0,52);h=d|0;c[a+36>>2]=c[h>>2]|0;d=~~(+at(+(+Z(+(+(c[h>>2]|0)*8.0))/.6931471805599453))+-1.0);i=a+32|0;c[i>>2]=d;j=+(f|0);k=+(e|0);l=+(1<<d+1|0);m=(+Z(+(j*.25*.5/k))*1.4426950216293335-5.965784072875977)*l;d=~~(m- +(c[h>>2]|0));c[a+28>>2]=d;c[a+40>>2]=(1-d|0)+~~((+Z(+((+(e|0)+.25)*j*.5/k))*1.4426950216293335-5.965784072875977)*l+.5)|0;d=e<<2;h=a+16|0;c[h>>2]=cz(d)|0;n=a+20|0;c[n>>2]=cz(d)|0;o=a+24|0;c[o>>2]=cz(d)|0;p=a+4|0;c[p>>2]=b;c[a>>2]=e;c[a+44>>2]=f;q=a+48|0;g[q>>2]=1.0;do{if((f|0)<26e3){g[q>>2]=0.0}else{if((f|0)<38e3){g[q>>2]=.9399999976158142;break}if((f|0)<=46e3){break}g[q>>2]=1.274999976158142}}while(0);l=+(f|0);q=0;r=0;L675:while(1){s=q;while(1){if((s|0)>=87){break L675}t=s+1|0;u=~~+at(+(k*+Y(+((+(t|0)*.125+-2.0+5.965784072875977)*.6931470036506653))*2.0/l));v=+g[57568+(s<<2)>>2];if((r|0)<(u|0)){break}else{s=t}}j=(+g[57568+(t<<2)>>2]-v)/+(u-r|0);if((r|0)>=(e|0)){q=t;r=r;continue}s=r-u|0;w=r-e|0;x=s>>>0>w>>>0?s:w;m=v;w=r;while(1){g[(c[h>>2]|0)+(w<<2)>>2]=m+100.0;s=w+1|0;if((s|0)<(u|0)&(s|0)<(e|0)){m=j+m;w=s}else{break}}q=t;r=r-x|0}L686:do{if((r|0)<(e|0)){t=r;while(1){q=c[h>>2]|0;g[q+(t<<2)>>2]=+g[q+(t-1<<2)>>2];q=t+1|0;if((q|0)<(e|0)){t=q}else{break L686}}}}while(0);h=(e|0)>0;L690:do{if(h){r=(f|0)/(e<<1|0)&-1;t=b+120|0;x=b+112|0;q=b+124|0;u=b+116|0;w=1;s=-99;y=0;while(1){z=$(r,y);v=+(z|0);m=+W(+(v*.0007399999885819852))*13.100000381469727;j=m+ +W(+(+($(z,z)|0)*1.8499999754340024e-8))*2.240000009536743+v*9999999747378752.0e-20;z=c[t>>2]|0;A=s;while(1){if((z+A|0)>=(y|0)){break}B=$(A,r);v=+(B|0);m=+W(+(v*.0007399999885819852))*13.100000381469727;C=v*9999999747378752.0e-20+(m+ +W(+(+($(B,B)|0)*1.8499999754340024e-8))*2.240000009536743);if(C<j- +g[x>>2]){A=A+1|0}else{break}}L698:do{if((w|0)>(e|0)){D=w}else{z=(c[q>>2]|0)+y|0;B=w;while(1){if((B|0)>=(z|0)){E=$(B,r);C=+(E|0);m=+W(+(C*.0007399999885819852))*13.100000381469727;v=C*9999999747378752.0e-20+(m+ +W(+(+($(E,E)|0)*1.8499999754340024e-8))*2.240000009536743);if(v>=j+ +g[u>>2]){D=B;break L698}}E=B+1|0;if((E|0)>(e|0)){D=E;break L698}else{B=E}}}}while(0);c[(c[o>>2]|0)+(y<<2)>>2]=((A<<16)-65537|0)+D|0;B=y+1|0;if((B|0)<(e|0)){w=D;s=A;y=B}else{break}}if(h){F=0}else{break}while(1){j=+Z(+(l*(+(F|0)+.25)*.5/k))*1.4426950216293335-5.965784072875977;c[(c[n>>2]|0)+(F<<2)>>2]=~~(j*+(1<<(c[i>>2]|0)+1|0)+.5);y=F+1|0;if((y|0)<(e|0)){F=y}else{break L690}}}}while(0);c[a+8>>2]=bx(b+36|0,l*.5/k,e,+g[b+24>>2],+g[b+28>>2])|0;b=a+12|0;c[b>>2]=cz(12)|0;a=cz(d)|0;c[c[b>>2]>>2]=a;a=cz(d)|0;c[(c[b>>2]|0)+4>>2]=a;a=cz(d)|0;c[(c[b>>2]|0)+8>>2]=a;if(!h){return}j=k*2.0;h=0;while(1){k=(+Z(+(l*(+(h|0)+.5)/j))*1.4426950216293335-5.965784072875977)*2.0;v=k<0.0?0.0:k;k=v<16.0?v:16.0;a=~~k;v=k- +(a|0);k=1.0-v;d=a+1|0;F=c[p>>2]|0;g[(c[c[b>>2]>>2]|0)+(h<<2)>>2]=k*+g[F+132+(a<<2)>>2]+v*+g[F+132+(d<<2)>>2];F=c[p>>2]|0;g[(c[(c[b>>2]|0)+4>>2]|0)+(h<<2)>>2]=k*+g[F+200+(a<<2)>>2]+v*+g[F+200+(d<<2)>>2];F=c[p>>2]|0;g[(c[(c[b>>2]|0)+8>>2]|0)+(h<<2)>>2]=k*+g[F+268+(a<<2)>>2]+v*+g[F+268+(d<<2)>>2];d=h+1|0;if((d|0)<(e|0)){h=d}else{break}}return}function bx(a,b,d,e,f){a=a|0;b=+b;d=d|0;e=+e;f=+f;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,O=0,P=0,Q=0,R=0;h=i;i=i+32480|0;j=h|0;k=h+224|0;l=h+30688|0;m=i;i=i+(d<<2)|0;i=i+7>>3<<3;n=cz(68)|0;cG(k|0,0,30464);o=e>0.0;p=e<0.0;q=j;r=0;while(1){s=r<<2;t=0;while(1){u=t+s|0;if((u|0)<88){v=+g[57568+(u<<2)>>2]}else{v=-30.0}w=u+1|0;do{if((w|0)<88){x=+g[57568+(w<<2)>>2];if(v<=x){y=v;break}y=x}else{if(v<=-30.0){y=v;break}y=-30.0}}while(0);w=u+2|0;do{if((w|0)<88){x=+g[57568+(w<<2)>>2];if(y<=x){z=y;break}z=x}else{if(y<=-30.0){z=y;break}z=-30.0}}while(0);w=u+3|0;do{if((w|0)<88){x=+g[57568+(w<<2)>>2];if(z<=x){A=z;break}A=x}else{if(z<=-30.0){A=z;break}A=-30.0}}while(0);g[j+(t<<2)>>2]=A;w=t+1|0;if((w|0)<56){t=w}else{break}}t=32680+(r*1344&-1)|0;cH(k+(r*1792&-1)+448|0,t|0,224);cH(k+(r*1792&-1)+672|0,32904+(r*1344&-1)|0,224);cH(k+(r*1792&-1)+896|0,33128+(r*1344&-1)|0,224);cH(k+(r*1792&-1)+1120|0,33352+(r*1344&-1)|0,224);cH(k+(r*1792&-1)+1344|0,33576+(r*1344&-1)|0,224);cH(k+(r*1792&-1)+1568|0,33800+(r*1344&-1)|0,224);cH(k+(r*1792&-1)|0,t|0,224);cH(k+(r*1792&-1)+224|0,t|0,224);t=0;while(1){L745:do{if(o){if(p){s=0;while(1){w=16-s|0;x=+(((w|0)>-1?w:-w|0)|0)*f+e;B=x<0.0?0.0:x;w=k+(r*1792&-1)+(t*224&-1)+(s<<2)|0;g[w>>2]=(B>0.0?0.0:B)+ +g[w>>2];w=s+1|0;if((w|0)<56){s=w}else{break L745}}}else{s=0;while(1){w=16-s|0;B=+(((w|0)>-1?w:-w|0)|0)*f+e;w=k+(r*1792&-1)+(t*224&-1)+(s<<2)|0;g[w>>2]=(B<0.0?0.0:B)+ +g[w>>2];w=s+1|0;if((w|0)<56){s=w}else{break L745}}}}else{if(p){s=0;while(1){w=16-s|0;B=+(((w|0)>-1?w:-w|0)|0)*f+e;w=k+(r*1792&-1)+(t*224&-1)+(s<<2)|0;g[w>>2]=(B>0.0?0.0:B)+ +g[w>>2];w=s+1|0;if((w|0)<56){s=w}else{break L745}}}else{s=0;while(1){w=16-s|0;u=k+(r*1792&-1)+(t*224&-1)+(s<<2)|0;g[u>>2]=+(((w|0)>-1?w:-w|0)|0)*f+e+ +g[u>>2];u=s+1|0;if((u|0)<56){s=u}else{break L745}}}}}while(0);s=t+1|0;if((s|0)<8){t=s}else{break}}B=+g[a+(r<<2)>>2]+100.0;t=0;while(1){x=B-((t|0)<2?20.0:+(t|0)*10.0)+-30.0;s=0;while(1){u=k+(r*1792&-1)+(t*224&-1)+(s<<2)|0;g[u>>2]=x+ +g[u>>2];u=s+1|0;if((u|0)<56){s=u}else{break}}cH(l+(t*224&-1)|0,q|0,224);x=100.0- +(t|0)*10.0+-30.0;s=0;while(1){u=l+(t*224&-1)+(s<<2)|0;g[u>>2]=x+ +g[u>>2];u=s+1|0;if((u|0)<56){s=u}else{C=0;break}}while(1){x=+g[k+(r*1792&-1)+(t*224&-1)+(C<<2)>>2];s=l+(t*224&-1)+(C<<2)|0;if(x>+g[s>>2]){g[s>>2]=x}s=C+1|0;if((s|0)<56){C=s}else{break}}s=t+1|0;if((s|0)<8){t=s}else{D=1;break}}while(1){t=D-1|0;s=0;while(1){B=+g[l+(t*224&-1)+(s<<2)>>2];u=l+(D*224&-1)+(s<<2)|0;if(B<+g[u>>2]){g[u>>2]=B}u=s+1|0;if((u|0)<56){s=u}else{E=0;break}}while(1){B=+g[l+(D*224&-1)+(E<<2)>>2];s=k+(r*1792&-1)+(D*224&-1)+(E<<2)|0;if(B<+g[s>>2]){g[s>>2]=B}s=E+1|0;if((s|0)<56){E=s}else{break}}s=D+1|0;if((s|0)<8){D=s}else{break}}s=r+1|0;if((s|0)<17){r=s}else{break}}r=m;m=n;e=b;n=(d|0)>0;D=d^-1;E=0;while(1){l=m+(E<<2)|0;c[l>>2]=cz(32)|0;f=+(E|0)*.5;C=~~+N(+(+Y(+((f+5.965784072875977)*.6931470036506653))/e));q=~~+_(+((+Z(+(+(C|0)*b+1.0))*1.4426950216293335-5.965784072875977)*2.0));a=~~+N(+((+Z(+(+(C+1|0)*b))*1.4426950216293335-5.965784072875977)*2.0));C=(q|0)>(E|0)?E:q;q=(C|0)<0?0:C;C=(a|0)>16?16:a;a=(q|0)>(C|0);p=E+1|0;o=(p|0)<17;j=0;while(1){s=cz(232)|0;c[(c[l>>2]|0)+(j<<2)>>2]=s;L792:do{if(n){s=0;while(1){g[r+(s<<2)>>2]=999.0;t=s+1|0;if((t|0)<(d|0)){s=t}else{break L792}}}}while(0);L796:do{if(!a){s=q;while(1){A=+(s|0)*.5;t=0;u=0;while(1){z=A+ +(t|0)*.125;w=~~(+Y(+((z-2.0625+5.965784072875977)*.6931470036506653))/e);F=~~(+Y(+((z-1.9375+5.965784072875977)*.6931470036506653))/e+1.0);G=(w|0)<0?0:w;H=(G|0)>(d|0)?d:G;G=(H|0)<(u|0)?H:u;H=(F|0)<0?0:F;I=(H|0)>(d|0)?d:H;if((G|0)<(I|0)&(G|0)<(d|0)){z=+g[k+(s*1792&-1)+(j*224&-1)+(t<<2)>>2];H=u^-1;J=(H|0)>(D|0)?H:D;H=(w|0)>0?w^-1:-1;w=(J|0)>(H|0)?J:H;H=(F|0)>0?F^-1:-1;F=((H|0)<(D|0)?D:H)-w|0;H=w+d^-1;J=F>>>0>H>>>0?F:H;H=G;while(1){F=r+(H<<2)|0;if(+g[F>>2]>z){g[F>>2]=z}F=H+1|0;if((F|0)<(I|0)&(F|0)<(d|0)){H=F}else{break}}K=(w^-1)-J|0}else{K=G}H=t+1|0;if((H|0)<56){t=H;u=K}else{break}}L811:do{if((K|0)<(d|0)){A=+g[k+(s*1792&-1)+(j*224&-1)+220>>2];u=K;while(1){t=r+(u<<2)|0;if(+g[t>>2]>A){g[t>>2]=A}t=u+1|0;if((t|0)<(d|0)){u=t}else{break L811}}}}while(0);u=s+1|0;if((u|0)>(C|0)){break L796}else{s=u}}}}while(0);L820:do{if(o){s=0;u=0;while(1){A=f+ +(s|0)*.125;G=~~(+Y(+((A-2.0625+5.965784072875977)*.6931470036506653))/e);J=~~(+Y(+((A-1.9375+5.965784072875977)*.6931470036506653))/e+1.0);w=(G|0)<0?0:G;t=(w|0)>(d|0)?d:w;w=(t|0)<(u|0)?t:u;t=(J|0)<0?0:J;H=(t|0)>(d|0)?d:t;if((w|0)<(H|0)&(w|0)<(d|0)){A=+g[k+(p*1792&-1)+(j*224&-1)+(s<<2)>>2];t=u^-1;I=(t|0)>(D|0)?t:D;t=(G|0)>0?G^-1:-1;G=(I|0)>(t|0)?I:t;t=(J|0)>0?J^-1:-1;J=((t|0)<(D|0)?D:t)-G|0;t=G+d^-1;I=J>>>0>t>>>0?J:t;t=w;while(1){J=r+(t<<2)|0;if(+g[J>>2]>A){g[J>>2]=A}J=t+1|0;if((J|0)<(H|0)&(J|0)<(d|0)){t=J}else{break}}L=(G^-1)-I|0}else{L=w}t=s+1|0;if((t|0)<56){s=t;u=L}else{break}}if((L|0)>=(d|0)){M=0;break}A=+g[k+(p*1792&-1)+(j*224&-1)+220>>2];u=L;while(1){s=r+(u<<2)|0;if(+g[s>>2]>A){g[s>>2]=A}s=u+1|0;if((s|0)<(d|0)){u=s}else{M=0;break L820}}}else{M=0}}while(0);while(1){u=~~(+Y(+((f+ +(M|0)*.125+-2.0+5.965784072875977)*.6931470036506653))/e);do{if((u|0)<0){g[(c[(c[l>>2]|0)+(j<<2)>>2]|0)+(M+2<<2)>>2]=-999.0}else{if((u|0)<(d|0)){g[(c[(c[l>>2]|0)+(j<<2)>>2]|0)+(M+2<<2)>>2]=+g[r+(u<<2)>>2];break}else{g[(c[(c[l>>2]|0)+(j<<2)>>2]|0)+(M+2<<2)>>2]=-999.0;break}}}while(0);u=M+1|0;if((u|0)<56){M=u}else{O=0;break}}while(1){if((O|0)>=16){P=574;break}u=c[(c[l>>2]|0)+(j<<2)>>2]|0;if(+g[u+(O+2<<2)>>2]>-200.0){Q=u;break}else{O=O+1|0}}if((P|0)==574){P=0;Q=c[(c[l>>2]|0)+(j<<2)>>2]|0}g[Q>>2]=+(O|0);u=55;while(1){if((u|0)<=17){P=578;break}s=c[(c[l>>2]|0)+(j<<2)>>2]|0;if(+g[s+(u+2<<2)>>2]>-200.0){R=s;break}else{u=u-1|0}}if((P|0)==578){P=0;R=c[(c[l>>2]|0)+(j<<2)>>2]|0}g[R+4>>2]=+(u|0);s=j+1|0;if((s|0)<8){j=s}else{break}}if(o){E=p}else{break}}i=h;return m|0}function by(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;if((a|0)==0){return}b=c[a+16>>2]|0;if((b|0)!=0){cA(b)}b=c[a+20>>2]|0;if((b|0)!=0){cA(b)}b=c[a+24>>2]|0;if((b|0)!=0){cA(b)}b=a+8|0;d=c[b>>2]|0;if((d|0)!=0){e=0;f=d;while(1){cA(c[c[f+(e<<2)>>2]>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+4>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+8>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+12>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+16>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+20>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+24>>2]|0);cA(c[(c[(c[b>>2]|0)+(e<<2)>>2]|0)+28>>2]|0);cA(c[(c[b>>2]|0)+(e<<2)>>2]|0);d=e+1|0;g=c[b>>2]|0;if((d|0)<17){e=d;f=g}else{break}}cA(g)}g=a+12|0;f=c[g>>2]|0;if((f|0)!=0){cA(c[f>>2]|0);cA(c[(c[g>>2]|0)+4>>2]|0);cA(c[(c[g>>2]|0)+8>>2]|0);cA(c[g>>2]|0)}cG(a|0,0,52);return}function bz(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=+f;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0,G=0,H=0.0,I=0.0,J=0.0,K=0.0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0.0,U=0.0,V=0.0,W=0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0,an=0.0;j=i;k=a<<2;l=i;i=i+k|0;i=i+7>>3<<3;m=l;l=i;i=i+k|0;i=i+7>>3<<3;n=l;l=i;i=i+k|0;i=i+7>>3<<3;o=l;l=i;i=i+k|0;i=i+7>>3<<3;p=l;l=i;i=i+k|0;i=i+7>>3<<3;k=l;q=+g[d>>2]+f;r=q<1.0?1.0:q;q=r*r*.5;s=q+0.0;t=r*q+0.0;g[m>>2]=s;g[n>>2]=s;g[o>>2]=0.0;g[p>>2]=t;g[k>>2]=0.0;L885:do{if((a|0)>1){q=s;r=s;u=0.0;v=t;w=0.0;l=1;x=1.0;while(1){y=+g[d+(l<<2)>>2]+f;z=y<1.0?1.0:y;y=z*z;A=q+y;B=x*y;C=r+B;D=u+x*B;E=v+z*y;y=w+z*B;g[m+(l<<2)>>2]=A;g[n+(l<<2)>>2]=C;g[o+(l<<2)>>2]=D;g[p+(l<<2)>>2]=E;g[k+(l<<2)>>2]=y;F=l+1|0;if((F|0)<(a|0)){q=A;r=C;u=D;v=E;w=y;l=F;x=x+1.0}else{break L885}}}}while(0);d=c[b>>2]|0;l=d>>16;L889:do{if((l|0)>-1){G=0;H=0.0;I=0.0;J=1.0;K=0.0;L=d}else{F=0;t=0.0;M=d;N=l;while(1){O=M&65535;P=-N|0;s=+g[m+(O<<2)>>2]+ +g[m+(P<<2)>>2];x=+g[n+(O<<2)>>2]- +g[n+(P<<2)>>2];w=+g[o+(O<<2)>>2]+ +g[o+(P<<2)>>2];v=+g[p+(O<<2)>>2]+ +g[p+(P<<2)>>2];u=+g[k+(O<<2)>>2]- +g[k+(P<<2)>>2];r=w*v-x*u;q=s*u-x*v;v=s*w-x*x;x=(r+t*q)/v;g[e+(F<<2)>>2]=(x<0.0?0.0:x)-f;P=F+1|0;x=t+1.0;O=c[b+(P<<2)>>2]|0;Q=O>>16;if((Q|0)>-1){G=P;H=r;I=q;J=v;K=x;L=O;break L889}else{F=P;t=x;M=O;N=Q}}}}while(0);l=L&65535;L893:do{if((l|0)<(a|0)){d=G;t=K;N=L;M=l;while(1){F=N>>16;x=+g[m+(M<<2)>>2]- +g[m+(F<<2)>>2];v=+g[n+(M<<2)>>2]- +g[n+(F<<2)>>2];q=+g[o+(M<<2)>>2]- +g[o+(F<<2)>>2];r=+g[p+(M<<2)>>2]- +g[p+(F<<2)>>2];w=+g[k+(M<<2)>>2]- +g[k+(F<<2)>>2];s=q*r-v*w;u=x*w-v*r;r=x*q-v*v;v=(s+t*u)/r;g[e+(d<<2)>>2]=(v<0.0?0.0:v)-f;F=d+1|0;v=t+1.0;Q=c[b+(F<<2)>>2]|0;O=Q&65535;if((O|0)<(a|0)){d=F;t=v;N=Q;M=O}else{R=F;S=s;T=u;U=r;V=v;break L893}}}else{R=G;S=H;T=I;U=J;V=K}}while(0);L897:do{if((R|0)<(a|0)){G=R;K=V;while(1){J=(S+T*K)/U;g[e+(G<<2)>>2]=(J<0.0?0.0:J)-f;b=G+1|0;if((b|0)<(a|0)){G=b;K=K+1.0}else{break L897}}}}while(0);if((h|0)<1){i=j;return}R=(h|0)/2&-1;G=R-h|0;if((G|0)>-1){W=0;X=S;Y=T;Z=U;_=0.0}else{b=0;U=0.0;l=R;L=G;while(1){G=-L|0;T=+g[m+(l<<2)>>2]+ +g[m+(G<<2)>>2];S=+g[n+(l<<2)>>2]- +g[n+(G<<2)>>2];V=+g[o+(l<<2)>>2]+ +g[o+(G<<2)>>2];K=+g[p+(l<<2)>>2]+ +g[p+(G<<2)>>2];J=+g[k+(l<<2)>>2]- +g[k+(G<<2)>>2];$=V*K-S*J;aa=T*J-S*K;ab=T*V-S*S;S=($+U*aa)/ab-f;G=e+(b<<2)|0;if(S<+g[G>>2]){g[G>>2]=S}G=b+1|0;ac=U+1.0;M=R+G|0;N=M-h|0;if((N|0)>-1){break}else{b=G;U=ac;l=M;L=N}}W=h-R|0;X=$;Y=aa;Z=ab;_=ac}L=W+R|0;if((L|0)<(a|0)){l=W;ac=_;b=L;while(1){L=b-h|0;ab=+g[m+(b<<2)>>2]- +g[m+(L<<2)>>2];aa=+g[n+(b<<2)>>2]- +g[n+(L<<2)>>2];$=+g[o+(b<<2)>>2]- +g[o+(L<<2)>>2];U=+g[p+(b<<2)>>2]- +g[p+(L<<2)>>2];S=+g[k+(b<<2)>>2]- +g[k+(L<<2)>>2];ad=$*U-aa*S;ae=ab*S-aa*U;af=ab*$-aa*aa;aa=(ad+ac*ae)/af-f;L=e+(l<<2)|0;if(aa<+g[L>>2]){g[L>>2]=aa}L=l+1|0;ag=ac+1.0;N=L+R|0;if((N|0)<(a|0)){l=L;ac=ag;b=N}else{break}}ah=a-R|0;ai=ad;aj=ae;ak=af;al=ag}else{ah=W;ai=X;aj=Y;ak=Z;al=_}if((ah|0)<(a|0)){am=ah;an=al}else{i=j;return}while(1){al=(ai+aj*an)/ak-f;ah=e+(am<<2)|0;if(al<+g[ah>>2]){g[ah>>2]=al}ah=am+1|0;if((ah|0)<(a|0)){am=ah;an=an+1.0}else{break}}i=j;return}function bA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=c[a>>2]|0;h=i;i=i+(f<<2)|0;i=i+7>>3<<3;j=h;h=a+24|0;bz(f,c[h>>2]|0,b,d,140.0,-1);k=(f|0)>0;L929:do{if(k){l=0;while(1){g[j+(l<<2)>>2]=+g[b+(l<<2)>>2]- +g[d+(l<<2)>>2];m=l+1|0;if((m|0)<(f|0)){l=m}else{break L929}}}}while(0);l=a+4|0;bz(f,c[h>>2]|0,j,d,0.0,c[(c[l>>2]|0)+128>>2]|0);if(k){n=0}else{i=e;return}while(1){h=j+(n<<2)|0;g[h>>2]=+g[b+(n<<2)>>2]- +g[h>>2];h=n+1|0;if((h|0)<(f|0)){n=h}else{break}}if(k){o=0}else{i=e;return}while(1){k=d+(o<<2)|0;n=~~(+g[k>>2]+.5);b=(n|0)>39?39:n;g[k>>2]=+g[j+(o<<2)>>2]+ +g[(c[l>>2]|0)+336+(((b|0)<0?0:b)<<2)>>2];b=o+1|0;if((b|0)<(f|0)){o=b}else{break}}i=e;return}function bB(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=+e;f=+f;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0.0,Q=0.0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;h=i;j=a|0;k=c[j>>2]|0;l=a+40|0;m=c[l>>2]|0;n=i;i=i+(m<<2)|0;i=i+7>>3<<3;o=n;n=a+4|0;p=c[n>>2]|0;q=+g[p+4>>2]+f;L944:do{if((m|0)>0){r=0;while(1){g[o+(r<<2)>>2]=-9999.0;s=r+1|0;if((s|0)<(m|0)){r=s}else{break L944}}}}while(0);f=+g[p+8>>2];t=q<f?f:q;L948:do{if((k|0)>0){p=a+16|0;m=0;while(1){g[d+(m<<2)>>2]=t+ +g[(c[p>>2]|0)+(m<<2)>>2];r=m+1|0;if((r|0)<(k|0)){m=r}else{break}}m=c[j>>2]|0;p=c[a+8>>2]|0;q=+g[(c[n>>2]|0)+496>>2]-e;if((m|0)<=0){u=657;break}r=a+20|0;s=a+32|0;v=a+28|0;w=a+36|0;x=c[r>>2]|0;y=0;while(1){z=c[x+(y<<2)>>2]|0;f=+g[b+(y<<2)>>2];A=y;L956:while(1){B=A;while(1){C=B+1|0;if((C|0)>=(m|0)){D=0;break L956}if((c[x+(C<<2)>>2]|0)!=(z|0)){D=1;break L956}E=+g[b+(C<<2)>>2];if(E>f){f=E;A=C;continue L956}else{B=C}}}L963:do{if(f+6.0>+g[d+(B<<2)>>2]){A=z>>c[s>>2];F=(A|0)>16?16:A;A=c[l>>2]|0;G=c[w>>2]|0;H=~~((q+f+-30.0)*.10000000149011612);I=(H|0)<0?0:H;H=c[(c[p+(((F|0)<0?0:F)<<2)>>2]|0)+(((I|0)>7?7:I)<<2)>>2]|0;I=~~+g[H+4>>2];E=+g[H>>2];F=~~E;J=~~(+((c[x+(B<<2)>>2]|0)-(c[v>>2]|0)|0)+ +(G|0)*(E+-16.0)- +(G>>1|0));while(1){if((F|0)>=(I|0)){break L963}do{if((J|0)>0){E=f+ +g[H+(F+2<<2)>>2];K=o+(J<<2)|0;if(+g[K>>2]>=E){break}g[K>>2]=E}}while(0);K=J+G|0;if((K|0)<(A|0)){F=F+1|0;J=K}else{break L963}}}}while(0);if(D){y=C}else{L=w;M=r;N=v;break L948}}}else{u=657}}while(0);if((u|0)==657){L=a+36|0;M=a+20|0;N=a+28|0}a=c[L>>2]|0;bD(o,a,c[l>>2]|0);L=c[j>>2]|0;L976:do{if((L|0)>1){u=c[M>>2]|0;C=c[u>>2]|0;D=c[N>>2]|0;B=(C-(a>>1)|0)-D|0;b=0;k=1;v=L;r=u;u=C;C=D;while(1){e=+g[o+(B<<2)>>2];D=((c[r+(k<<2)>>2]|0)+u>>1)-C|0;t=+g[(c[n>>2]|0)+32>>2];q=e>t?t:e;w=B+1|0;L980:do{if((w|0)>(D|0)){O=B;P=q}else{e=q;y=w;while(1){x=e==-9999.0;p=y;while(1){Q=+g[o+(p<<2)>>2];if(Q>-9999.0){if(Q<e|x){break}}else{if(x){break}}s=p+1|0;if((s|0)>(D|0)){O=p;P=e;break L980}else{p=s}}x=p+1|0;if((x|0)>(D|0)){O=p;P=Q;break L980}else{e=Q;y=x}}}}while(0);D=O+C|0;L991:do{if((b|0)>=(v|0)|(u|0)>(D|0)){R=b;S=v}else{w=v;y=b;while(1){x=d+(y<<2)|0;if(+g[x>>2]<P){g[x>>2]=P;T=c[j>>2]|0}else{T=w}x=y+1|0;if((x|0)>=(T|0)){R=x;S=T;break L991}if((c[(c[M>>2]|0)+(x<<2)>>2]|0)>(D|0)){R=x;S=T;break L991}else{w=T;y=x}}}}while(0);D=R+1|0;if((D|0)>=(S|0)){U=R;V=S;break L976}y=c[M>>2]|0;B=O;b=R;k=D;v=S;r=y;u=c[y+(R<<2)>>2]|0;C=c[N>>2]|0}}else{U=0;V=L}}while(0);P=+g[o+((c[l>>2]|0)-1<<2)>>2];if((U|0)<(V|0)){W=U;X=V}else{i=h;return}while(1){V=d+(W<<2)|0;if(+g[V>>2]<P){g[V>>2]=P;Y=c[j>>2]|0}else{Y=X}V=W+1|0;if((V|0)<(Y|0)){W=V;X=Y}else{break}}i=h;return}function bC(a,b){a=a|0;b=b|0;var d=0.0,e=0.0;d=+g[c[a>>2]>>2];e=+g[c[b>>2]>>2];return(d<e&1)-(d>e&1)|0}function bD(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=i;f=d<<2;h=i;i=i+f|0;i=i+7>>3<<3;j=h;h=i;i=i+f|0;i=i+7>>3<<3;f=h;if((d|0)>0){k=0;l=0}else{i=e;return}while(1){do{if((k|0)<2){c[j+(k<<2)>>2]=l;g[f+(k<<2)>>2]=+g[a+(l<<2)>>2];m=k}else{n=+g[a+(l<<2)>>2];h=k;while(1){o=h-1|0;p=+g[f+(o<<2)>>2];if(n<p){q=703;break}if(!((l|0)<((c[j+(o<<2)>>2]|0)+b|0)&(h|0)>1)){q=707;break}r=h-2|0;if(p>+g[f+(r<<2)>>2]){q=707;break}if((l|0)<((c[j+(r<<2)>>2]|0)+b|0)){h=o}else{q=707;break}}if((q|0)==703){q=0;c[j+(h<<2)>>2]=l;g[f+(h<<2)>>2]=n;m=h;break}else if((q|0)==707){q=0;c[j+(h<<2)>>2]=l;g[f+(h<<2)>>2]=n;m=h;break}}}while(0);s=m+1|0;o=l+1|0;if((o|0)<(d|0)){k=s;l=o}else{break}}if((s|0)<=0){i=e;return}l=b+1|0;b=d^-1;k=0;o=0;while(1){do{if((o|0)<(m|0)){r=o+1|0;if(+g[f+(r<<2)>>2]<=+g[f+(o<<2)>>2]){q=712;break}t=c[j+(r<<2)>>2]|0;break}else{q=712}}while(0);if((q|0)==712){q=0;t=l+(c[j+(o<<2)>>2]|0)|0}r=(t|0)>(d|0)?d:t;if((k|0)<(r|0)){p=+g[f+(o<<2)>>2];u=t^-1;v=(u|0)>(b|0)?u:b;u=k;while(1){g[a+(u<<2)>>2]=p;w=u+1|0;if((w|0)<(r|0)){u=w}else{break}}x=v^-1}else{x=k}u=o+1|0;if((u|0)<(s|0)){k=x;o=u}else{break}}i=e;return}function bE(a,b,d,e,f,j,k,l,m){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0.0,V=0.0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0.0,am=0.0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0;n=i;o=c[d>>2]|0;p=d+4|0;d=c[p>>2]|0;if((c[d+500>>2]|0)==0){q=16}else{q=c[d+508>>2]|0}r=c[b+132+((c[d>>2]|0)*60&-1)+(a<<2)>>2]|0;s=+h[55600+(c[b+252+(a<<2)>>2]<<3)>>3];d=m<<2;t=i;i=i+d|0;i=i+7>>3<<3;u=t;t=i;i=i+d|0;i=i+7>>3<<3;v=t;t=i;i=i+d|0;i=i+7>>3<<3;w=t;t=i;i=i+d|0;i=i+7>>3<<3;x=t;t=i;i=i+d|0;i=i+7>>3<<3;y=t;z=e+1156|0;A=+h[((o|0)>1e3?55528:55600)+(c[b+312+(a<<2)>>2]<<3)>>3];a=$(d,q);b=i;i=i+a|0;i=i+7>>3<<3;B=b;c[u>>2]=B;b=i;i=i+a|0;i=i+7>>3<<3;C=b;c[v>>2]=C;b=i;i=i+a|0;i=i+7>>3<<3;D=b;c[w>>2]=D;b=i;i=i+a|0;i=i+7>>3<<3;E=b;c[x>>2]=E;L1050:do{if((m|0)>1){b=1;F=B;G=C;H=D;I=E;while(1){J=$(b,q);c[u+(b<<2)>>2]=F+(J<<2)|0;c[v+(b<<2)>>2]=G+(J<<2)|0;c[w+(b<<2)>>2]=H+(J<<2)|0;c[x+(b<<2)>>2]=I+(J<<2)|0;J=b+1|0;if((J|0)>=(m|0)){break L1050}b=J;F=c[u>>2]|0;G=c[v>>2]|0;H=c[w>>2]|0;I=c[x>>2]|0}}}while(0);E=c[z>>2]|0;L1055:do{if((o|0)>0){D=k;C=c[x>>2]|0;B=(m|0)>0;I=0;while(1){H=o-I|0;G=(q|0)>(H|0)?H:q;cH(t|0,D|0,d);cG(C|0,0,a|0);L1059:do{if(B){H=(G|0)>0;F=r-I|0;b=0;while(1){J=c[j+(b<<2)>>2]|0;K=J+(I<<2)|0;L1063:do{if((c[y+(b<<2)>>2]|0)==0){if(!H){break}L=c[w+(b<<2)>>2]|0;M=c[u+(b<<2)>>2]|0;N=c[v+(b<<2)>>2]|0;P=c[x+(b<<2)>>2]|0;Q=0;while(1){g[L+(Q<<2)>>2]=1.000000013351432e-10;g[M+(Q<<2)>>2]=0.0;g[N+(Q<<2)>>2]=0.0;c[P+(Q<<2)>>2]=0;c[J+(Q+I<<2)>>2]=0;R=Q+1|0;if((R|0)<(G|0)){Q=R}else{break L1063}}}else{Q=c[w+(b<<2)>>2]|0;L1065:do{if(H){P=0;while(1){g[Q+(P<<2)>>2]=+g[56544+(c[J+(P+I<<2)>>2]<<2)>>2];N=P+1|0;if((N|0)<(G|0)){P=N}else{break}}P=f+(b<<2)|0;N=c[P>>2]|0;M=c[x+(b<<2)>>2]|0;if(H){S=0}else{T=740;break}while(1){U=+O(+(+g[N+(S+I<<2)>>2]));c[M+(S<<2)>>2]=U/+g[Q+(S<<2)>>2]>=((S|0)>=(F|0)?A:s)&1;L=S+1|0;if((L|0)<(G|0)){S=L}else{break}}if(!H){T=740;break}M=c[u+(b<<2)>>2]|0;N=c[v+(b<<2)>>2]|0;L=0;while(1){R=L+I|0;U=+g[(c[P>>2]|0)+(R<<2)>>2];V=U*U;W=M+(L<<2)|0;g[W>>2]=V;g[N+(L<<2)>>2]=V;if(+g[(c[P>>2]|0)+(R<<2)>>2]<0.0){g[W>>2]=+g[W>>2]*-1.0}W=Q+(L<<2)|0;V=+g[W>>2];g[W>>2]=V*V;W=L+1|0;if((W|0)<(G|0)){L=W}else{X=M;Y=N;break L1065}}}else{T=740}}while(0);if((T|0)==740){T=0;X=c[u+(b<<2)>>2]|0;Y=c[v+(b<<2)>>2]|0}bF(c[p>>2]|0,r,X,Y,Q,0,I,G,K)}}while(0);K=b+1|0;if((K|0)<(m|0)){b=K}else{break L1059}}}}while(0);b=c[z>>2]|0;L1087:do{if((b|0)>0){H=(G|0)>0;F=l-I|0;K=r-I|0;J=0;N=b;while(1){M=c[e+1160+(J<<2)>>2]|0;L=c[e+2184+(J<<2)>>2]|0;P=c[j+(M<<2)>>2]|0;W=P+(I<<2)|0;R=c[j+(L<<2)>>2]|0;Z=c[u+(M<<2)>>2]|0;_=c[u+(L<<2)>>2]|0;aa=c[v+(M<<2)>>2]|0;ab=c[v+(L<<2)>>2]|0;ac=c[w+(M<<2)>>2]|0;ad=c[w+(L<<2)>>2]|0;ae=c[x+(M<<2)>>2]|0;af=c[x+(L<<2)>>2]|0;ag=y+(M<<2)|0;M=y+(L<<2)|0;do{if((c[ag>>2]|0)==0){if((c[M>>2]|0)==0){ah=N;break}else{T=752;break}}else{T=752}}while(0);if((T|0)==752){T=0;c[M>>2]=1;c[ag>>2]=1;L1095:do{if(H){L=0;while(1){L1098:do{if((L|0)<(F|0)){ai=ae+(L<<2)|0;aj=af+(L<<2)|0;do{if((c[ai>>2]|0)==0){if((c[aj>>2]|0)!=0){break}do{if((L|0)<(K|0)){ak=Z+(L<<2)|0;V=+g[_+(L<<2)>>2]+ +g[ak>>2];g[ak>>2]=V;g[aa+(L<<2)>>2]=+O(+V)}else{ak=Z+(L<<2)|0;V=+g[ak>>2];U=+g[_+(L<<2)>>2];al=+O(+V);am=al+ +O(+U);g[aa+(L<<2)>>2]=am;if(V+U<0.0){g[ak>>2]=-0.0-am;break}else{g[ak>>2]=am;break}}}while(0);g[ab+(L<<2)>>2]=0.0;g[_+(L<<2)>>2]=0.0;c[aj>>2]=1;c[R+(L+I<<2)>>2]=0;break L1098}}while(0);ak=Z+(L<<2)|0;am=+O(+(+g[ak>>2]));g[ak>>2]=am+ +O(+(+g[_+(L<<2)>>2]));ak=aa+(L<<2)|0;g[ak>>2]=+g[ak>>2]+ +g[ab+(L<<2)>>2];c[aj>>2]=1;c[ai>>2]=1;ak=L+I|0;an=P+(ak<<2)|0;ao=c[an>>2]|0;ap=R+(ak<<2)|0;ak=c[ap>>2]|0;if((((ao|0)>-1?ao:-ao|0)|0)>(((ak|0)>-1?ak:-ak|0)|0)){aq=(ao|0)>0?ao-ak|0:ak-ao|0;c[ap>>2]=aq;ar=aq;as=c[an>>2]|0}else{c[ap>>2]=(ak|0)>0?ao-ak|0:ak-ao|0;c[an>>2]=ak;ar=c[ap>>2]|0;as=ak}if((ar|0)<(((as|0)>-1?as:-as|0)<<1|0)){break}c[ap>>2]=-ar|0;c[an>>2]=-(c[an>>2]|0)|0}}while(0);an=ac+(L<<2)|0;ap=ad+(L<<2)|0;am=+g[an>>2]+ +g[ap>>2];g[ap>>2]=am;g[an>>2]=am;an=L+1|0;if((an|0)<(G|0)){L=an}else{break L1095}}}}while(0);ad=c[p>>2]|0;bF(ad,r,Z,aa,ac,ae,I,G,W);ah=c[z>>2]|0}ad=J+1|0;if((ad|0)<(ah|0)){J=ad;N=ah}else{at=ah;break L1087}}}else{at=b}}while(0);b=I+q|0;if((b|0)<(o|0)){I=b}else{au=at;break L1055}}}else{au=E}}while(0);if((au|0)>0){av=0;aw=au}else{i=n;return}while(1){au=k+(c[e+1160+(av<<2)>>2]<<2)|0;E=e+2184+(av<<2)|0;do{if((c[au>>2]|0)==0){if((c[k+(c[E>>2]<<2)>>2]|0)==0){ax=aw;break}else{T=773;break}}else{T=773}}while(0);if((T|0)==773){T=0;c[au>>2]=1;c[k+(c[E>>2]<<2)>>2]=1;ax=c[z>>2]|0}at=av+1|0;if((at|0)<(ax|0)){av=at;aw=ax}else{break}}i=n;return}function bF(a,b,d,e,f,j,l,m,n){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;j=j|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0.0,A=0.0,B=0,C=0.0,D=0.0,E=0,F=0.0;o=i;p=i;i=i+(m<<2)|0;i=i+7>>3<<3;q=p;if((c[a+500>>2]|0)==0){r=m}else{r=(c[a+504>>2]|0)-l|0}s=(r|0)>(m|0)?m:r;if((s|0)>0){t=(j|0)==0;u=r^-1;r=m^-1;v=(u|0)>(r|0)?u:r;r=0;while(1){do{if(t){w=787}else{if((c[j+(r<<2)>>2]|0)==0){w=787;break}else{break}}}while(0);do{if((w|0)==787){w=0;u=+g[d+(r<<2)>>2]<0.0;x=+at(+(+P(+(+g[e+(r<<2)>>2]/+g[f+(r<<2)>>2]))));if(u){c[n+(r<<2)>>2]=~~(-0.0-x);break}else{c[n+(r<<2)>>2]=~~x;break}}}while(0);u=r+1|0;if((u|0)<(s|0)){r=u}else{break}}y=v^-1}else{y=0}if((y|0)>=(m|0)){z=0.0;i=o;return+z}v=(j|0)!=0;r=b-l|0;l=0;b=y;x=0.0;while(1){do{if(v){if((c[j+(b<<2)>>2]|0)==0){w=793;break}else{A=x;B=l;break}}else{w=793}}while(0);L1156:do{if((w|0)==793){w=0;y=e+(b<<2)|0;s=f+(b<<2)|0;C=+g[y>>2]/+g[s>>2];do{if(C<.25){if(v&(b|0)<(r|0)){break}c[q+(l<<2)>>2]=y;A=x+C;B=l+1|0;break L1156}}while(0);t=+g[d+(b<<2)>>2]<0.0;D=+at(+(+P(+C)));if(t){t=~~(-0.0-D);c[n+(b<<2)>>2]=t;E=t}else{t=~~D;c[n+(b<<2)>>2]=t;E=t}D=+($(E,E)|0);g[y>>2]=+g[s>>2]*D;A=x;B=l}}while(0);t=b+1|0;if((t|0)<(m|0)){l=B;b=t;x=A}else{break}}if((B|0)==0){z=A;i=o;return+z}aA(p|0,B|0,4,8);if((B|0)<=0){z=A;i=o;return+z}p=e;b=a+512|0;a=0;x=A;while(1){l=(c[q+(a<<2)>>2]|0)-p>>2;if(x<+h[b>>3]){c[n+(l<<2)>>2]=0;g[e+(l<<2)>>2]=0.0;F=x}else{c[n+(l<<2)>>2]=~~(c[k>>2]=(g[k>>2]=+g[d+(l<<2)>>2],c[k>>2]|0)&-2147483648|1065353216,+g[k>>2]);g[e+(l<<2)>>2]=+g[f+(l<<2)>>2];F=x+-1.0}l=a+1|0;if((l|0)<(B|0)){a=l;x=F}else{z=F;break}}i=o;return+z}function bG(a){a=a|0;if((a|0)==0){return}cG(a|0,0,2840);cA(a);return}function bH(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((a|0)==0){return}b=a+4|0;d=c[b>>2]|0;e=a+20|0;f=c[e>>2]|0;L1190:do{if((d|0)>0){g=0;h=f;i=d;while(1){j=c[h+(g<<2)>>2]|0;if((j|0)==0){k=i;l=h}else{cA(j);k=c[b>>2]|0;l=c[e>>2]|0}j=g+1|0;if((j|0)<(k|0)){g=j;h=l;i=k}else{m=l;break L1190}}}else{m=f}}while(0);cA(m);m=a+24|0;f=a+28|0;l=c[f>>2]|0;L1197:do{if((c[m>>2]|0)>0){k=0;e=l;while(1){cA(c[e+(k<<2)>>2]|0);b=k+1|0;d=c[f>>2]|0;if((b|0)<(c[m>>2]|0)){k=b;e=d}else{n=d;break L1197}}}else{n=l}}while(0);cA(n);cG(a|0,0,44);cA(a);return}function bI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;cy(b,c[a>>2]|0,24);cy(b,c[a+4>>2]|0,24);cy(b,(c[a+8>>2]|0)-1|0,24);d=a+12|0;cy(b,(c[d>>2]|0)-1|0,6);cy(b,c[a+20>>2]|0,8);if((c[d>>2]|0)<=0){return}e=a+24|0;f=0;g=0;while(1){h=e+(f<<2)|0;i=c[h>>2]|0;do{if((i|0)==0){j=0;k=837}else{l=i;m=0;while(1){n=m+1|0;o=l>>>1;if((o|0)==0){break}else{l=o;m=n}}if((n|0)<=3){j=i;k=837;break}cy(b,i,3);cy(b,1,1);cy(b,c[h>>2]>>3,5);break}}while(0);if((k|0)==837){k=0;cy(b,j,4)}i=c[h>>2]|0;L1216:do{if((i|0)==0){p=0}else{m=i;l=0;while(1){o=(m&1)+l|0;q=m>>>1;if((q|0)==0){p=o;break L1216}else{m=q;l=o}}}}while(0);r=p+g|0;i=f+1|0;if((i|0)<(c[d>>2]|0)){f=i;g=r}else{break}}if((r|0)<=0){return}g=a+280|0;a=0;while(1){cy(b,c[g+(a<<2)>>2]|0,8);f=a+1|0;if((f|0)<(r|0)){a=f}else{break}}return}function bJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=cB(1,2840)|0;e=c[a+28>>2]|0;c[d>>2]=cw(b,24)|0;c[d+4>>2]=cw(b,24)|0;c[d+8>>2]=(cw(b,24)|0)+1|0;a=d+12|0;c[a>>2]=(cw(b,6)|0)+1|0;f=cw(b,8)|0;g=d+20|0;c[g>>2]=f;L1228:do{if((f|0)<0){h=869}else{L1230:do{if((c[a>>2]|0)>0){i=d+24|0;j=0;k=0;while(1){l=cw(b,3)|0;m=cw(b,1)|0;if((m|0)<0){h=869;break L1228}if((m|0)==0){n=l}else{m=cw(b,5)|0;if((m|0)<0){h=869;break L1228}n=m<<3|l}c[i+(k<<2)>>2]=n;L1239:do{if((n|0)==0){o=0}else{l=n;m=0;while(1){p=(l&1)+m|0;q=l>>>1;if((q|0)==0){o=p;break L1239}else{l=q;m=p}}}}while(0);r=o+j|0;m=k+1|0;if((m|0)<(c[a>>2]|0)){j=r;k=m}else{break}}if((r|0)<=0){s=r;break}k=d+280|0;j=0;while(1){i=cw(b,8)|0;if((i|0)<0){h=869;break L1228}c[k+(j<<2)>>2]=i;i=j+1|0;if((i|0)<(r|0)){j=i}else{s=r;break L1230}}}else{s=0}}while(0);j=c[g>>2]|0;k=c[e+24>>2]|0;if((j|0)>=(k|0)){break}i=d+280|0;m=e+1824|0;l=0;while(1){if((l|0)>=(s|0)){break}p=c[i+(l<<2)>>2]|0;if((p|0)>=(k|0)){h=869;break L1228}if((c[(c[m+(p<<2)>>2]|0)+12>>2]|0)==0){h=869;break L1228}else{l=l+1|0}}l=c[m+(j<<2)>>2]|0;k=c[l+4>>2]|0;i=c[l>>2]|0;if((i|0)<1){break}else{t=1;u=i}while(1){if((u|0)<=0){break}i=$(c[a>>2]|0,t);if((i|0)>(k|0)){h=869;break L1228}else{t=i;u=u-1|0}}c[d+16>>2]=t;v=d;return v|0}}while(0);do{if((h|0)==869){if((d|0)==0){v=0}else{break}return v|0}}while(0);cG(d|0,0,2840);cA(d);v=0;return v|0}function bK(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;d=cB(1,44)|0;e=c[(c[a+4>>2]|0)+28>>2]|0;c[d>>2]=b;a=c[b+12>>2]|0;f=d+4|0;c[f>>2]=a;g=e+2848|0;c[d+12>>2]=c[g>>2]|0;e=(c[g>>2]|0)+((c[b+20>>2]|0)*56&-1)|0;c[d+16>>2]=e;h=c[e>>2]|0;e=d+20|0;c[e>>2]=cB(a,4)|0;a=c[f>>2]|0;L1266:do{if((a|0)>0){i=b+24|0;j=b+280|0;k=0;l=0;m=0;n=a;while(1){o=i+(m<<2)|0;p=c[o>>2]|0;do{if((p|0)==0){q=l;r=k;s=n}else{t=p;u=0;while(1){v=u+1|0;w=t>>>1;if((w|0)==0){break}else{t=w;u=v}}if((v|0)==0){q=l;r=k;s=n;break}u=(v|0)>(l|0)?v:l;t=cB(v,4)|0;c[(c[e>>2]|0)+(m<<2)>>2]=t;L1275:do{if((v|0)>0){t=k;w=0;while(1){if((c[o>>2]&1<<w|0)==0){x=t}else{c[(c[(c[e>>2]|0)+(m<<2)>>2]|0)+(w<<2)>>2]=(c[g>>2]|0)+((c[j+(t<<2)>>2]|0)*56&-1)|0;x=t+1|0}y=w+1|0;if((y|0)<(v|0)){t=x;w=y}else{z=x;break L1275}}}else{z=k}}while(0);q=u;r=z;s=c[f>>2]|0}}while(0);o=m+1|0;if((o|0)<(s|0)){k=r;l=q;m=o;n=s}else{A=q;B=s;break L1266}}}else{A=0;B=a}}while(0);a=d+24|0;c[a>>2]=1;s=(h|0)>0;if(s){q=0;r=1;while(1){C=$(r,B);z=q+1|0;if((z|0)<(h|0)){q=z;r=C}else{break}}c[a>>2]=C;D=C<<2}else{D=4}c[d+8>>2]=A;A=d+28|0;c[A>>2]=cz(D)|0;D=c[a>>2]|0;if((D|0)<=0){return d|0}C=h<<2;r=0;q=D;while(1){D=c[f>>2]|0;B=cz(C)|0;c[(c[A>>2]|0)+(r<<2)>>2]=B;L1294:do{if(s){B=0;z=r;x=(q|0)/(D|0)&-1;while(1){v=(z|0)/(x|0)&-1;g=z-$(v,x)|0;e=(x|0)/(c[f>>2]|0)&-1;c[(c[(c[A>>2]|0)+(r<<2)>>2]|0)+(B<<2)>>2]=v;v=B+1|0;if((v|0)<(h|0)){B=v;z=g;x=e}else{break L1294}}}}while(0);D=r+1|0;x=c[a>>2]|0;if((D|0)<(x|0)){r=D;q=x}else{break}}return d|0}function bL(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((f|0)>0){g=0;h=0}else{return 0}while(1){if((c[e+(g<<2)>>2]|0)==0){i=h}else{c[d+(h<<2)>>2]=c[d+(g<<2)>>2]|0;i=h+1|0}j=g+1|0;if((j|0)<(f|0)){g=j;h=i}else{break}}if((i|0)==0){return 0}bM(a,b,d,i,6);return 0}function bM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;g=i;h=c[b>>2]|0;j=c[h+8>>2]|0;k=b+16|0;l=c[c[k>>2]>>2]|0;m=c[a+36>>2]>>1;n=c[h+4>>2]|0;o=h|0;p=((n|0)<(m|0)?n:m)-(c[o>>2]|0)|0;if((p|0)<=0){i=g;return}m=(p|0)/(j|0)&-1;p=i;i=i+(e<<2)|0;i=i+7>>3<<3;n=p;p=(e|0)>0;L1317:do{if(p){q=((((l-1|0)+m|0)/(l|0)&-1)<<2)+7&-8;r=a+72|0;s=a+76|0;t=a+68|0;u=a+80|0;v=a+84|0;w=0;x=c[r>>2]|0;y=c[t>>2]|0;while(1){if((x+q|0)>(c[s>>2]|0)){if((y|0)!=0){z=cz(8)|0;c[u>>2]=(c[u>>2]|0)+(c[r>>2]|0)|0;c[z+4>>2]=c[v>>2]|0;c[z>>2]=c[t>>2]|0;c[v>>2]=z}c[s>>2]=q;z=cz(q)|0;c[t>>2]=z;c[r>>2]=0;A=0;B=z}else{A=x;B=y}z=A+q|0;c[r>>2]=z;c[n+(w<<2)>>2]=B+A|0;C=w+1|0;if((C|0)<(e|0)){w=C;x=z;y=B}else{break L1317}}}}while(0);B=b+8|0;A=c[B>>2]|0;if((A|0)<=0){i=g;return}y=(m|0)>0;x=a+4|0;a=h+16|0;w=b+28|0;r=(l|0)>0;q=b+20|0;b=0;t=A;L1331:while(1){if(y){A=(b|0)==0;s=1<<b;v=0;u=0;while(1){L1337:do{if(A){z=0;while(1){if((z|0)>=(e|0)){break L1337}C=c[k>>2]|0;if((c[C+8>>2]|0)<=0){D=939;break L1331}E=b6(C,x)|0;if((E|0)<=-1){D=942;break L1331}F=c[(c[C+24>>2]|0)+(E<<2)>>2]|0;if((F|0)==-1){D=944;break L1331}if((F|0)>=(c[a>>2]|0)){D=943;break L1331}E=c[(c[w>>2]|0)+(F<<2)>>2]|0;c[(c[n+(z<<2)>>2]|0)+(v<<2)>>2]=E;if((E|0)==0){D=945;break L1331}else{z=z+1|0}}}}while(0);L1346:do{if(r&(u|0)<(m|0)){z=0;E=u;while(1){L1349:do{if(p){F=$(E,j);C=0;while(1){G=(c[o>>2]|0)+F|0;H=c[(c[(c[n+(C<<2)>>2]|0)+(v<<2)>>2]|0)+(z<<2)>>2]|0;do{if((c[h+24+(H<<2)>>2]&s|0)!=0){I=c[(c[(c[q>>2]|0)+(H<<2)>>2]|0)+(b<<2)>>2]|0;if((I|0)==0){break}if((aV[f&15](I,(c[d+(C<<2)>>2]|0)+(G<<2)|0,x,j)|0)==-1){D=941;break L1331}}}while(0);G=C+1|0;if((G|0)<(e|0)){C=G}else{break L1349}}}}while(0);C=z+1|0;F=E+1|0;if((C|0)<(l|0)&(F|0)<(m|0)){z=C;E=F}else{J=F;break L1346}}}else{J=u}}while(0);if((J|0)<(m|0)){v=v+1|0;u=J}else{break}}K=c[B>>2]|0}else{K=t}u=b+1|0;if((u|0)<(K|0)){b=u;t=K}else{D=947;break}}if((D|0)==942){i=g;return}else if((D|0)==943){i=g;return}else if((D|0)==944){i=g;return}else if((D|0)==945){i=g;return}else if((D|0)==939){i=g;return}else if((D|0)==941){i=g;return}else if((D|0)==947){i=g;return}}function bN(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0;if((g|0)>0){j=0;k=0}else{return 0}while(1){if((c[f+(j<<2)>>2]|0)==0){l=k}else{c[e+(k<<2)>>2]=c[e+(j<<2)>>2]|0;l=k+1|0}i=j+1|0;if((i|0)<(g|0)){j=i;k=l}else{break}}if((l|0)==0){return 0}bO(a,d,e,l,h);return 0}function bO(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0;g=i;i=i+1088|0;h=g|0;j=g+32|0;k=g+64|0;l=g+576|0;m=c[b>>2]|0;n=c[m+8>>2]|0;o=c[m+12>>2]|0;p=b+16|0;q=c[c[p>>2]>>2]|0;r=m|0;s=((c[m+4>>2]|0)-(c[r>>2]|0)|0)/(n|0)&-1;cG(k|0,0,512);cG(l|0,0,512);t=b+8|0;u=c[t>>2]|0;if((u|0)<=0){i=g;return}v=(s|0)>0;w=(e|0)>0;x=(q|0)>1;y=b+36|0;z=(q|0)>0;A=b+20|0;B=h;C=j;D=j|0;E=b+32|0;b=-q|0;F=0;G=u;while(1){if(v){u=(F|0)==0;H=1<<F;I=0;while(1){L1392:do{if(u&w){J=0;while(1){K=c[f+(J<<2)>>2]|0;L=c[K+(I<<2)>>2]|0;L1395:do{if(x){M=L;N=1;while(1){O=$(M,o);P=N+I|0;if((P|0)<(s|0)){Q=(c[K+(P<<2)>>2]|0)+O|0}else{Q=O}O=N+1|0;if((O|0)<(q|0)){M=Q;N=O}else{R=Q;break L1395}}}else{R=L}}while(0);L=c[p>>2]|0;if((R|0)<(c[L+4>>2]|0)){do{if((R|0)<0){S=0}else{K=L+12|0;N=c[K>>2]|0;if((c[N+4>>2]|0)<=(R|0)){S=0;break}cy(a,c[(c[L+20>>2]|0)+(R<<2)>>2]|0,c[(c[N+8>>2]|0)+(R<<2)>>2]|0);S=c[(c[(c[K>>2]|0)+8>>2]|0)+(R<<2)>>2]|0}}while(0);c[y>>2]=(c[y>>2]|0)+S|0}L=J+1|0;if((L|0)<(e|0)){J=L}else{break L1392}}}}while(0);if(z&(I|0)<(s|0)){J=I-s|0;L=J>>>0<b>>>0?b:J;J=1;K=I;while(1){N=$(K,n);M=(c[r>>2]|0)+N|0;L1414:do{if(w){N=0;while(1){O=c[(c[f+(N<<2)>>2]|0)+(K<<2)>>2]|0;if(u){P=l+(O<<2)|0;c[P>>2]=(c[P>>2]|0)+n|0}P=f+(N<<2)|0;do{if((c[m+24+(O<<2)>>2]&H|0)!=0){T=c[(c[(c[A>>2]|0)+(O<<2)>>2]|0)+(F<<2)>>2]|0;if((T|0)==0){break}U=c[d+(N<<2)>>2]|0;V=T|0;W=c[V>>2]|0;X=(n|0)/(W|0)&-1;L1423:do{if((X|0)>0){Y=T+48|0;Z=T+52|0;_=T+44|0;aa=T+12|0;ab=T+4|0;ac=T+20|0;ad=0;ae=0;af=W;while(1){ag=$(ae,W)+M|0;ah=U+(ag<<2)|0;ai=c[Y>>2]|0;aj=c[Z>>2]|0;ak=c[_>>2]|0;al=ak>>1;cG(B|0,0,32);am=(af|0)>0;L1427:do{if((aj|0)==1){if(!am){an=0;break}ao=ak-1|0;ap=0;aq=af;ar=0;while(1){as=aq-1|0;at=c[U+(ag+as<<2)>>2]|0;au=at-ai|0;if((au|0)<(al|0)){av=(al-au<<1)-1|0}else{av=au-al<<1}au=$(ap,ak);if((av|0)<0){aw=0}else{aw=(av|0)<(ak|0)?av:ao}ax=aw+au|0;c[h+(as<<2)>>2]=at;at=ar+1|0;if((at|0)<(af|0)){ap=ax;aq=as;ar=at}else{an=ax;break L1427}}}else{if(!am){an=0;break}ar=(aj>>1)-ai|0;aq=ak-1|0;ap=0;ao=af;ax=0;while(1){at=ao-1|0;as=(ar+(c[U+(ag+at<<2)>>2]|0)|0)/(aj|0)&-1;if((as|0)<(al|0)){ay=(al-as<<1)-1|0}else{ay=as-al<<1}au=$(ap,ak);if((ay|0)<0){az=0}else{az=(ay|0)<(ak|0)?ay:aq}aA=az+au|0;c[h+(at<<2)>>2]=$(as,aj)+ai|0;as=ax+1|0;if((as|0)<(af|0)){ap=aA;ao=at;ax=as}else{an=aA;break L1427}}}}while(0);al=c[(c[aa>>2]|0)+8>>2]|0;L1451:do{if((c[al+(an<<2)>>2]|0)<1){cG(C|0,0,32);ax=$(ak-1|0,aj)+ai|0;if((c[ab>>2]|0)>0){aB=an;aC=-1;aD=0}else{aE=an;break}while(1){do{if((c[al+(aD<<2)>>2]|0)>0){L1457:do{if(am){ao=0;ap=0;while(1){aq=(c[j+(ao<<2)>>2]|0)-(c[U+(ag+ao<<2)>>2]|0)|0;ar=$(aq,aq)+ap|0;aq=ao+1|0;if((aq|0)<(af|0)){ao=aq;ap=ar}else{aF=ar;break L1457}}}else{aF=0}}while(0);if(!((aC|0)==-1|(aF|0)<(aC|0))){aG=aC;aH=aB;break}cH(B|0,C|0,32);aG=aF;aH=aD}else{aG=aC;aH=aB}}while(0);ap=c[D>>2]|0;L1463:do{if((ap|0)<(ax|0)){aI=D;aJ=ap}else{ao=0;ar=D;while(1){aq=ao+1|0;c[ar>>2]=0;aA=j+(aq<<2)|0;as=c[aA>>2]|0;if((as|0)<(ax|0)){aI=aA;aJ=as;break L1463}else{ao=aq;ar=aA}}}}while(0);if((aJ|0)>-1){ap=(c[Z>>2]|0)+aJ|0;c[aI>>2]=ap;aK=ap}else{aK=aJ}c[aI>>2]=-aK|0;ap=aD+1|0;if((ap|0)<(c[ab>>2]|0)){aB=aH;aC=aG;aD=ap}else{aE=aH;break L1451}}}else{aE=an}}while(0);L1471:do{if((aE|0)>-1&am){ag=0;al=ah;while(1){c[al>>2]=(c[al>>2]|0)-(c[h+(ag<<2)>>2]|0)|0;ai=ag+1|0;if((ai|0)<(af|0)){ag=ai;al=al+4|0}else{break L1471}}}}while(0);do{if((aE|0)<0){aL=0}else{ah=c[aa>>2]|0;if((c[ah+4>>2]|0)<=(aE|0)){aL=0;break}cy(a,c[(c[ac>>2]|0)+(aE<<2)>>2]|0,c[(c[ah+8>>2]|0)+(aE<<2)>>2]|0);aL=c[(c[(c[aa>>2]|0)+8>>2]|0)+(aE<<2)>>2]|0}}while(0);ah=aL+ad|0;am=ae+1|0;if((am|0)>=(X|0)){aM=ah;break L1423}ad=ah;ae=am;af=c[V>>2]|0}}else{aM=0}}while(0);c[E>>2]=(c[E>>2]|0)+aM|0;V=k+(c[(c[P>>2]|0)+(K<<2)>>2]<<2)|0;c[V>>2]=(c[V>>2]|0)+aM|0}}while(0);P=N+1|0;if((P|0)<(e|0)){N=P}else{break L1414}}}}while(0);M=K+1|0;if(!((J|0)<(q|0)&(M|0)<(s|0))){break}J=J+1|0;K=M}aN=I-L|0}else{aN=I}if((aN|0)<(s|0)){I=aN}else{break}}aO=c[t>>2]|0}else{aO=G}I=F+1|0;if((I|0)<(aO|0)){F=I;G=aO}else{break}}i=g;return}function bP(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0;if((f|0)>0){g=0;h=0}else{i=0;return i|0}while(1){if((c[e+(g<<2)>>2]|0)==0){j=h}else{c[d+(h<<2)>>2]=c[d+(g<<2)>>2]|0;j=h+1|0}k=g+1|0;if((k|0)<(f|0)){g=k;h=j}else{break}}if((j|0)==0){i=0;return i|0}h=c[b>>2]|0;g=c[h+8>>2]|0;f=c[h+12>>2]|0;e=h|0;k=((c[h+4>>2]|0)-(c[e>>2]|0)|0)/(g|0)&-1;l=(j<<2)+7&-8;m=a+72|0;n=c[m>>2]|0;o=a+76|0;p=a+68|0;q=c[p>>2]|0;if((n+l|0)>(c[o>>2]|0)){if((q|0)!=0){r=cz(8)|0;s=a+80|0;c[s>>2]=(c[s>>2]|0)+(c[m>>2]|0)|0;s=a+84|0;c[r+4>>2]=c[s>>2]|0;c[r>>2]=c[p>>2]|0;c[s>>2]=r}c[o>>2]=l;r=cz(l)|0;c[p>>2]=r;c[m>>2]=0;t=0;u=r}else{t=n;u=q}q=t+l|0;c[m>>2]=q;l=u+t|0;v=100.0/+(g|0);t=(j|0)>0;L1507:do{if(t){n=k<<2;r=n+7&-8;s=a+80|0;w=a+84|0;x=0;y=q;z=u;while(1){if((y+r|0)>(c[o>>2]|0)){if((z|0)!=0){A=cz(8)|0;c[s>>2]=(c[s>>2]|0)+(c[m>>2]|0)|0;c[A+4>>2]=c[w>>2]|0;c[A>>2]=c[p>>2]|0;c[w>>2]=A}c[o>>2]=r;A=cz(r)|0;c[p>>2]=A;c[m>>2]=0;B=0;C=A}else{B=y;C=z}A=C+B|0;c[m>>2]=B+r|0;c[l+(x<<2)>>2]=A;cG(A|0,0,n|0);A=x+1|0;if((A|0)>=(j|0)){break L1507}x=A;y=c[m>>2]|0;z=c[p>>2]|0}}}while(0);L1519:do{if((k|0)>0){p=(g|0)>0;m=f-1|0;B=(m|0)>0;C=0;while(1){o=$(C,g);u=(c[e>>2]|0)+o|0;L1523:do{if(t){o=0;while(1){if(p){q=c[d+(o<<2)>>2]|0;a=0;z=0;y=0;while(1){x=c[q+(u+a<<2)>>2]|0;n=(x|0)>-1?x:-x|0;D=(n|0)>(z|0)?n:z;E=n+y|0;n=a+1|0;if((n|0)<(g|0)){a=n;z=D;y=E}else{break}}F=D;G=+(E|0)}else{F=0;G=0.0}y=~~(v*G);L1532:do{if(B){z=0;while(1){if((F|0)<=(c[h+2328+(z<<2)>>2]|0)){a=c[h+2584+(z<<2)>>2]|0;if((a|0)<0|(y|0)<(a|0)){H=z;break L1532}}a=z+1|0;if((a|0)<(m|0)){z=a}else{H=a;break L1532}}}else{H=0}}while(0);c[(c[l+(o<<2)>>2]|0)+(C<<2)>>2]=H;y=o+1|0;if((y|0)<(j|0)){o=y}else{break L1523}}}}while(0);u=C+1|0;if((u|0)<(k|0)){C=u}else{break L1519}}}}while(0);k=b+40|0;c[k>>2]=(c[k>>2]|0)+1|0;i=l;return i|0}function bQ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((f|0)>0){g=0;h=0}else{return 0}while(1){if((c[e+(g<<2)>>2]|0)==0){i=h}else{c[d+(h<<2)>>2]=c[d+(g<<2)>>2]|0;i=h+1|0}j=g+1|0;if((j|0)<(f|0)){g=j;h=i}else{break}}if((i|0)==0){return 0}bM(a,b,d,i,4);return 0}function bR(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;if((f|0)>0){g=0;h=0}else{i=0;return i|0}while(1){j=((c[e+(g<<2)>>2]|0)!=0&1)+h|0;k=g+1|0;if((k|0)<(f|0)){g=k;h=j}else{break}}if((j|0)==0){i=0;return i|0}j=c[b>>2]|0;h=c[j+8>>2]|0;g=c[j+12>>2]|0;e=j|0;k=((c[j+4>>2]|0)-(c[e>>2]|0)|0)/(h|0)&-1;l=a+72|0;m=c[l>>2]|0;n=a+76|0;o=c[n>>2]|0;p=a+68|0;q=c[p>>2]|0;if((m+8|0)>(o|0)){if((q|0)!=0){r=cz(8)|0;s=a+80|0;c[s>>2]=(c[s>>2]|0)+(c[l>>2]|0)|0;s=a+84|0;c[r+4>>2]=c[s>>2]|0;c[r>>2]=c[p>>2]|0;c[s>>2]=r}c[n>>2]=8;r=cz(8)|0;c[p>>2]=r;c[l>>2]=0;t=0;u=r;v=c[n>>2]|0}else{t=m;u=q;v=o}o=t+8|0;c[l>>2]=o;q=u+t|0;t=k<<2;m=t+7&-8;if((o+m|0)>(v|0)){if((u|0)!=0){v=cz(8)|0;r=a+80|0;c[r>>2]=(c[r>>2]|0)+(c[l>>2]|0)|0;r=a+84|0;c[v+4>>2]=c[r>>2]|0;c[v>>2]=c[p>>2]|0;c[r>>2]=v}c[n>>2]=m;n=cz(m)|0;c[p>>2]=n;c[l>>2]=0;w=0;x=n}else{w=o;x=u}u=x+w|0;c[l>>2]=w+m|0;c[q>>2]=u;cG(u|0,0,t|0);L1576:do{if((k|0)>0){t=(h|0)>0;u=g-1|0;m=(u|0)>0;w=(f|0)>1;l=(c[e>>2]|0)/(f|0)&-1;x=0;while(1){L1580:do{if(t){o=c[d>>2]|0;n=l;p=0;v=0;r=0;while(1){a=c[o+(n<<2)>>2]|0;s=(a|0)>-1?a:-a|0;a=(s|0)>(v|0)?s:v;L1584:do{if(w){s=1;y=r;while(1){z=c[(c[d+(s<<2)>>2]|0)+(n<<2)>>2]|0;A=(z|0)>-1?z:-z|0;z=(A|0)>(y|0)?A:y;A=s+1|0;if((A|0)<(f|0)){s=A;y=z}else{B=z;break L1584}}}else{B=r}}while(0);y=n+1|0;s=p+f|0;if((s|0)<(h|0)){n=y;p=s;v=a;r=B}else{C=y;D=a;E=B;break L1580}}}else{C=l;D=0;E=0}}while(0);L1589:do{if(m){r=0;while(1){if((D|0)<=(c[j+2328+(r<<2)>>2]|0)){if((E|0)<=(c[j+2584+(r<<2)>>2]|0)){F=r;break L1589}}v=r+1|0;if((v|0)<(u|0)){r=v}else{F=v;break L1589}}}else{F=0}}while(0);c[(c[q>>2]|0)+(x<<2)>>2]=F;r=x+1|0;if((r|0)<(k|0)){l=C;x=r}else{break L1576}}}}while(0);C=b+40|0;c[C>>2]=(c[C>>2]|0)+1|0;i=q;return i|0}function bS(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=i;i=i+8|0;k=j|0;l=c[b+36>>2]|0;m=(l|0)/2&-1;n=$(g<<2,m)+7&-8;o=b+72|0;p=c[o>>2]|0;q=b+76|0;r=b+68|0;s=c[r>>2]|0;if((n+p|0)>(c[q>>2]|0)){if((s|0)!=0){t=cz(8)|0;u=b+80|0;c[u>>2]=(c[u>>2]|0)+(c[o>>2]|0)|0;u=b+84|0;c[t+4>>2]=c[u>>2]|0;c[t>>2]=c[r>>2]|0;c[u>>2]=t}c[q>>2]=n;q=cz(n)|0;c[r>>2]=q;c[o>>2]=0;v=0;w=q}else{v=p;w=s}c[o>>2]=v+n|0;n=w+v|0;c[k>>2]=n;if((g|0)<=0){i=j;return 0}v=(l|0)>1;l=0;w=0;while(1){o=c[e+(l<<2)>>2]|0;x=((c[f+(l<<2)>>2]|0)!=0&1)+w|0;L1610:do{if(v){s=0;p=l;while(1){c[n+(p<<2)>>2]=c[o+(s<<2)>>2]|0;q=s+1|0;if((q|0)<(m|0)){s=q;p=p+g|0}else{break L1610}}}}while(0);o=l+1|0;if((o|0)<(g|0)){l=o;w=x}else{break}}if((x|0)==0){i=j;return 0}bO(a,d,k,1,h);i=j;return 0}function bT(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;h=c[b>>2]|0;i=c[h+8>>2]|0;j=b+16|0;k=c[c[j>>2]>>2]|0;l=$(c[a+36>>2]|0,f)>>1;m=c[h+4>>2]|0;n=h|0;o=((m|0)<(l|0)?m:l)-(c[n>>2]|0)|0;if((o|0)<=0){return 0}l=(o|0)/(i|0)&-1;o=((((k-1|0)+l|0)/(k|0)&-1)<<2)+7&-8;m=a+72|0;p=c[m>>2]|0;q=a+76|0;r=a+68|0;s=c[r>>2]|0;if((o+p|0)>(c[q>>2]|0)){if((s|0)!=0){t=cz(8)|0;u=a+80|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0)|0;u=a+84|0;c[t+4>>2]=c[u>>2]|0;c[t>>2]=c[r>>2]|0;c[u>>2]=t}c[q>>2]=o;q=cz(o)|0;c[r>>2]=q;c[m>>2]=0;v=0;w=q}else{v=p;w=s}c[m>>2]=v+o|0;o=w+v|0;v=0;while(1){if((v|0)>=(f|0)){break}if((c[e+(v<<2)>>2]|0)==0){v=v+1|0}else{break}}if((v|0)==(f|0)){return 0}v=b+8|0;e=c[v>>2]|0;if((e|0)<=0){return 0}w=(l|0)>0;m=a+4|0;a=h+16|0;s=b+28|0;p=(k|0)>0;q=b+20|0;b=0;r=e;L1639:while(1){if(w){e=(b|0)==0;t=1<<b;u=0;x=0;while(1){if(e){y=c[j>>2]|0;if((c[y+8>>2]|0)<=0){z=1152;break L1639}A=b6(y,m)|0;if((A|0)<=-1){z=1155;break L1639}B=c[(c[y+24>>2]|0)+(A<<2)>>2]|0;if((B|0)==-1){z=1158;break L1639}if((B|0)>=(c[a>>2]|0)){z=1157;break L1639}A=c[(c[s>>2]|0)+(B<<2)>>2]|0;c[o+(u<<2)>>2]=A;if((A|0)==0){z=1160;break L1639}}L1652:do{if(p&(x|0)<(l|0)){A=o+(u<<2)|0;B=0;y=x;while(1){C=c[(c[A>>2]|0)+(B<<2)>>2]|0;L1656:do{if((c[h+24+(C<<2)>>2]&t|0)!=0){D=c[(c[(c[q>>2]|0)+(C<<2)>>2]|0)+(b<<2)>>2]|0;if((D|0)==0){break}E=$(y,i);F=(c[n>>2]|0)+E|0;if((c[D+8>>2]|0)<=0){break}E=(F|0)/(f|0)&-1;G=(F+i|0)/(f|0)&-1;if((E|0)>=(G|0)){break}F=D+16|0;H=D|0;I=E;E=0;while(1){J=b6(D,m)|0;if((J|0)==-1){z=1154;break L1639}K=c[F>>2]|0;L=c[H>>2]|0;M=$(L,J);L1664:do{if((L|0)>0){J=0;N=I;O=E;while(1){P=O+1|0;Q=(c[d+(O<<2)>>2]|0)+(N<<2)|0;g[Q>>2]=+g[K+(J+M<<2)>>2]+ +g[Q>>2];Q=(P|0)==(f|0);R=(Q&1)+N|0;S=Q?0:P;P=J+1|0;if((P|0)<(c[H>>2]|0)){J=P;N=R;O=S}else{T=R;U=S;break L1664}}}else{T=I;U=E}}while(0);if((T|0)<(G|0)){I=T;E=U}else{break L1656}}}}while(0);C=B+1|0;E=y+1|0;if((C|0)<(k|0)&(E|0)<(l|0)){B=C;y=E}else{V=E;break L1652}}}else{V=x}}while(0);if((V|0)<(l|0)){u=u+1|0;x=V}else{break}}W=c[v>>2]|0}else{W=r}x=b+1|0;if((x|0)<(W|0)){b=x;r=W}else{z=1156;break}}if((z|0)==1152){return 0}else if((z|0)==1154){return 0}else if((z|0)==1155){return 0}else if((z|0)==1156){return 0}else if((z|0)==1157){return 0}else if((z|0)==1158){return 0}else if((z|0)==1160){return 0}return 0}function bU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+136|0;f=e|0;g=(d|0)!=0;h=cz((g?d:b)<<2)|0;j=h;cG(f|0,0,132);k=(b|0)>0;L1681:do{if(k){l=f+4|0;m=(d|0)==0&1;n=0;o=0;L1683:while(1){p=c[a+(o<<2)>>2]|0;L1685:do{if((p|0)>0){q=c[f+(p<<2)>>2]|0;if((p|0)<32){if((q>>>(p>>>0)|0)!=0){break L1683}}c[j+(n<<2)>>2]=q;r=p;s=q;while(1){t=f+(r<<2)|0;if((s&1|0)!=0){u=1170;break}c[t>>2]=s+1|0;v=r-1|0;if((v|0)<=0){break}r=v;s=c[f+(v<<2)>>2]|0}do{if((u|0)==1170){u=0;if((r|0)==1){c[l>>2]=(c[l>>2]|0)+1|0;break}else{c[t>>2]=c[f+(r-1<<2)>>2]<<1;break}}}while(0);r=p+1|0;if((r|0)<33){w=p;x=q;y=r}else{z=1;break}while(1){r=f+(y<<2)|0;s=c[r>>2]|0;if((s>>>1|0)!=(x|0)){z=1;break L1685}c[r>>2]=c[f+(w<<2)>>2]<<1;r=y+1|0;if((r|0)<33){w=y;x=s;y=r}else{z=1;break L1685}}}else{z=m}}while(0);p=o+1|0;if((p|0)<(b|0)){n=n+z|0;o=p}else{break L1681}}cA(h);A=0;i=e;return A|0}}while(0);L1707:do{if((d|0)!=1){z=1;while(1){if((z|0)>=33){break L1707}if((c[f+(z<<2)>>2]&-1>>>((32-z|0)>>>0)|0)==0){z=z+1|0}else{break}}cA(h);A=0;i=e;return A|0}}while(0);if(k){B=0;C=0}else{A=j;i=e;return A|0}while(1){k=c[a+(C<<2)>>2]|0;L1718:do{if((k|0)>0){h=c[j+(B<<2)>>2]|0;f=0;d=0;while(1){z=h>>>(f>>>0)&1|d<<1;y=f+1|0;if((y|0)<(k|0)){f=y;d=z}else{D=z;break L1718}}}else{D=0}}while(0);do{if(g){if((k|0)==0){E=B;break}c[j+(B<<2)>>2]=D;E=B+1|0}else{c[j+(B<<2)>>2]=D;E=B+1|0}}while(0);k=C+1|0;if((k|0)<(b|0)){B=E;C=k}else{A=j;break}}i=e;return A|0}function bV(a,b){a=a|0;b=b|0;var d=0;d=c[c[a>>2]>>2]|0;a=c[c[b>>2]>>2]|0;return(d>>>0>a>>>0&1)-(d>>>0<a>>>0&1)|0}function bW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0.0,j=0.0,k=0.0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0,D=0.0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,P=0,R=0;e=a+12|0;if(((c[e>>2]|0)-1|0)>>>0>=2){f=0;return f|0}h=c[a+16>>2]|0;i=+(h&2097151|0);if((h|0)<0){j=-0.0-i}else{j=i}i=+au(+j,(h>>>21&1023)-788|0);h=c[a+20>>2]|0;j=+(h&2097151|0);if((h|0)<0){k=-0.0-j}else{k=j}j=+au(+k,(h>>>21&1023)-788|0);h=a|0;l=cB($(c[h>>2]|0,b),4)|0;b=c[e>>2]|0;if((b|0)==2){e=a+4|0;m=c[e>>2]|0;if((m|0)<=0){f=l;return f|0}n=(d|0)!=0;o=a+8|0;p=n^1;q=a+32|0;k=j;r=i;s=a+28|0;t=0;u=0;v=m;while(1){do{if(n){if((c[(c[o>>2]|0)+(u<<2)>>2]|0)!=0|p){w=1228;break}else{x=t;y=v;break}}else{w=1228}}while(0);if((w|0)==1228){w=0;m=c[h>>2]|0;if((m|0)>0){z=d+(t<<2)|0;A=0;B=0.0;C=m;while(1){m=$(C,u)+A|0;D=B+(r+k*+O(+(+(c[(c[q>>2]|0)+(m<<2)>>2]|0))));E=(c[s>>2]|0)==0?B:D;if(n){g[l+($(c[z>>2]|0,C)+A<<2)>>2]=D}else{g[l+($(C,t)+A<<2)>>2]=D}m=A+1|0;F=c[h>>2]|0;if((m|0)<(F|0)){A=m;B=E;C=F}else{break}}G=c[e>>2]|0}else{G=v}x=t+1|0;y=G}C=u+1|0;if((C|0)<(y|0)){t=x;u=C;v=y}else{f=l;break}}return f|0}else if((b|0)==1){b=a+4|0;y=c[b>>2]|0;v=c[h>>2]|0;if((v|0)<=0){while(1){}}u=~~+N(+(+Q(+(+(y|0)),+(1.0/+(v|0)))));while(1){x=u+1|0;t=1;G=1;e=0;while(1){H=$(t,u);I=$(G,x);n=e+1|0;if((n|0)<(v|0)){t=H;G=I;e=n}else{break}}if((H|0)<=(y|0)&(I|0)>(y|0)){break}u=(H|0)>(y|0)?u-1|0:x}if((y|0)<=0){f=l;return f|0}H=(d|0)!=0;I=a+8|0;e=H^1;G=a+32|0;k=j;j=i;t=a+28|0;a=0;n=0;s=y;y=v;while(1){do{if(H){if((c[(c[I>>2]|0)+(n<<2)>>2]|0)!=0|e){w=1217;break}else{J=a;K=s;L=y;break}}else{w=1217}}while(0);if((w|0)==1217){w=0;if((y|0)>0){x=d+(a<<2)|0;v=0;i=0.0;q=1;p=y;while(1){r=i+(j+k*+O(+(+(c[(c[G>>2]|0)+(((n|0)/(q|0)&-1|0)%(u|0)<<2)>>2]|0))));B=(c[t>>2]|0)==0?i:r;if(H){g[l+($(c[x>>2]|0,p)+v<<2)>>2]=r}else{g[l+($(p,a)+v<<2)>>2]=r}o=$(q,u);C=v+1|0;M=c[h>>2]|0;if((C|0)<(M|0)){v=C;i=B;q=o;p=M}else{break}}P=M;R=c[b>>2]|0}else{P=y;R=s}J=a+1|0;K=R;L=P}p=n+1|0;if((p|0)<(K|0)){a=J;n=p;s=K;y=L}else{f=l;break}}return f|0}else{f=l;return f|0}return 0}function bX(a){a=a|0;var b=0,d=0;b=c[a+16>>2]|0;if((b|0)!=0){cA(b)}b=c[a+20>>2]|0;if((b|0)!=0){cA(b)}b=c[a+24>>2]|0;if((b|0)!=0){cA(b)}b=c[a+28>>2]|0;if((b|0)!=0){cA(b)}b=c[a+32>>2]|0;if((b|0)==0){d=a;cG(d|0,0,56);return}cA(b);d=a;cG(d|0,0,56);return}function bY(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0.0,t=0.0,u=0,v=0;cG(a|0,0,56);c[a+12>>2]=b;d=b+4|0;c[a+4>>2]=c[d>>2]|0;c[a+8>>2]=c[d>>2]|0;e=b|0;c[a>>2]=c[e>>2]|0;c[a+20>>2]=bU(c[b+8>>2]|0,c[d>>2]|0,0)|0;f=c[d>>2]|0;d=c[e>>2]|0;if((d|0)<=0){while(1){}}e=~~+N(+(+Q(+(+(f|0)),+(1.0/+(d|0)))));while(1){g=e+1|0;h=1;i=1;j=0;while(1){k=$(h,e);l=$(i,g);m=j+1|0;if((m|0)<(d|0)){h=k;i=l;j=m}else{break}}if((k|0)<=(f|0)&(l|0)>(f|0)){break}e=(k|0)>(f|0)?e-1|0:g}c[a+44>>2]=e;e=c[b+16>>2]|0;n=+(e&2097151|0);if((e|0)<0){o=-0.0-n}else{o=n}c[a+48>>2]=~~+at(+(+au(+o,(e>>>21&1023)-788|0)));e=c[b+20>>2]|0;o=+(e&2097151|0);b=e>>>21&1023;if((e|0)>=0){p=o;q=b-788|0;r=+au(+p,q|0);s=r;t=+at(+s);u=~~t;v=a+52|0;c[v>>2]=u;return 0}p=-0.0-o;q=b-788|0;r=+au(+p,q|0);s=r;t=+at(+s);u=~~t;v=a+52|0;c[v>>2]=u;return 0}function bZ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;e=i;cG(b|0,0,56);f=d+4|0;g=c[f>>2]|0;L1834:do{if((g|0)>0){h=c[d+8>>2]|0;j=0;k=0;while(1){l=((c[h+(k<<2)>>2]|0)>0&1)+j|0;m=k+1|0;if((m|0)<(g|0)){j=l;k=m}else{n=l;break L1834}}}else{n=0}}while(0);c[b+4>>2]=g;g=b+8|0;c[g>>2]=n;c[b>>2]=c[d>>2]|0;if((n|0)<=0){o=0;i=e;return o|0}k=d+8|0;j=bU(c[k>>2]|0,c[f>>2]|0,n)|0;h=n<<2;l=i;i=i+h|0;i=i+7>>3<<3;m=l;if((j|0)==0){bX(b);o=-1;i=e;return o|0}else{p=0}while(1){q=j+(p<<2)|0;r=c[q>>2]|0;s=r>>>16|r<<16;r=s>>>8&16711935|s<<8&-16711936;s=r>>>4&252645135|r<<4&-252645136;r=s>>>2&858993459|s<<2&-858993460;c[q>>2]=r>>>1&1431655765|r<<1&-1431655766;c[m+(p<<2)>>2]=q;q=p+1|0;if((q|0)<(n|0)){p=q}else{break}}aA(l|0,n|0,4,14);l=i;i=i+h|0;i=i+7>>3<<3;p=l;l=cz(h)|0;q=b+20|0;c[q>>2]=l;r=j;s=0;while(1){c[p+((c[m+(s<<2)>>2]|0)-r>>2<<2)>>2]=s;t=s+1|0;if((t|0)<(n|0)){s=t}else{u=0;v=l;break}}while(1){c[v+(c[p+(u<<2)>>2]<<2)>>2]=c[j+(u<<2)>>2]|0;l=u+1|0;if((l|0)>=(n|0)){break}u=l;v=c[q>>2]|0}cA(j);c[b+16>>2]=bW(d,n,p)|0;n=b+24|0;c[n>>2]=cz(h)|0;h=c[f>>2]|0;L1854:do{if((h|0)>0){d=0;j=0;v=h;while(1){if((c[(c[k>>2]|0)+(j<<2)>>2]|0)>0){c[(c[n>>2]|0)+(c[p+(d<<2)>>2]<<2)>>2]=j;w=d+1|0;x=c[f>>2]|0}else{w=d;x=v}u=j+1|0;if((u|0)<(x|0)){d=w;j=u;v=x}else{y=w;break L1854}}}else{y=0}}while(0);w=b+28|0;c[w>>2]=cz(y)|0;y=c[f>>2]|0;L1861:do{if((y|0)>0){x=0;n=0;h=y;while(1){v=c[(c[k>>2]|0)+(n<<2)>>2]|0;if((v|0)>0){a[(c[w>>2]|0)+(c[p+(x<<2)>>2]|0)|0]=v&255;z=x+1|0;A=c[f>>2]|0}else{z=x;A=h}v=n+1|0;if((v|0)<(A|0)){x=z;n=v;h=A}else{B=z;break L1861}}}else{B=0}}while(0);z=c[g>>2]|0;if((z|0)==0){C=-4}else{g=z;z=0;while(1){A=g>>>1;if((A|0)==0){break}else{g=A;z=z+1|0}}C=z-3|0}z=b+36|0;g=(C|0)<5?5:C;C=(g|0)>8?8:g;c[z>>2]=C;g=1<<C;C=b+32|0;c[C>>2]=cB(g,4)|0;A=b+40|0;c[A>>2]=0;L1873:do{if((B|0)>0){b=0;f=c[w>>2]|0;p=0;while(1){k=f+b|0;y=a[k]|0;h=y<<24>>24;if((p|0)<(h|0)){c[A>>2]=h;D=a[k]|0}else{D=y}y=D<<24>>24;k=c[z>>2]|0;L1881:do{if((y|0)>(k|0)){E=f;F=k}else{h=c[(c[q>>2]|0)+(b<<2)>>2]|0;n=h>>>16|h<<16;h=n>>>8&16711935|n<<8&-16711936;n=h>>>4&252645135|h<<4&-252645136;h=n>>>2&858993459|n<<2&-858993460;n=h>>>1&1431655765|h<<1&-1431655766;if((1<<k-y|0)<=0){E=f;F=k;break}h=b+1|0;x=0;v=y;while(1){c[(c[C>>2]|0)+((n|x<<v)<<2)>>2]=h;j=x+1|0;d=c[z>>2]|0;u=c[w>>2]|0;l=a[u+b|0]|0;if((j|0)<(1<<d-l|0)){x=j;v=l}else{E=u;F=d;break L1881}}}}while(0);y=b+1|0;if((y|0)>=(B|0)){G=F;break L1873}b=y;f=E;p=c[A>>2]|0}}else{G=c[z>>2]|0}}while(0);A=-2<<31-G;if((g|0)>0){H=0;I=0;J=0;K=G}else{o=0;i=e;return o|0}while(1){G=H<<32-K;E=G>>>16|G<<16;F=E>>>8&16711935|E<<8&-16711936;E=F>>>4&252645135|F<<4&-252645136;F=E>>>2&858993459|E<<2&-858993460;E=(c[C>>2]|0)+((F>>>1&1431655765|F<<1&-1431655766)<<2)|0;if((c[E>>2]|0)==0){F=I;while(1){w=F+1|0;if((w|0)>=(B|0)){L=J;break}if((c[(c[q>>2]|0)+(w<<2)>>2]|0)>>>0>G>>>0){L=J;break}else{F=w}}while(1){if((L|0)>=(B|0)){break}if(G>>>0<(c[(c[q>>2]|0)+(L<<2)>>2]&A)>>>0){break}else{L=L+1|0}}G=B-L|0;c[E>>2]=(F>>>0>32767?-1073774592:F<<15|-2147483648)|(G>>>0>32767?32767:G);M=L;N=F}else{M=J;N=I}G=H+1|0;if((G|0)>=(g|0)){o=0;break}H=G;I=N;J=M;K=c[z>>2]|0}i=e;return o|0}function b_(a,b,c,d,e,f,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0,C=0.0,D=0.0,E=0.0,F=0.0,G=0,H=0.0,I=0.0,J=0.0,K=0.0;i=$(b,a);j=i<<1;k=(b|0)>0;L1905:do{if(k){l=(a<<2)-1|0;m=a<<1;n=j;o=0;p=j+i|0;q=i;r=0;while(1){s=c+(q<<2)|0;t=c+(p<<2)|0;u=+g[s>>2]+ +g[t>>2];v=c+(o<<2)|0;w=c+(n<<2)|0;x=+g[v>>2]+ +g[w>>2];y=o<<2;g[d+(y<<2)>>2]=u+x;g[d+(l+y<<2)>>2]=x-u;z=y+m|0;g[d+(z-1<<2)>>2]=+g[v>>2]- +g[w>>2];g[d+(z<<2)>>2]=+g[t>>2]- +g[s>>2];s=r+1|0;if((s|0)<(b|0)){n=n+a|0;o=o+a|0;p=p+a|0;q=q+a|0;r=s}else{break L1905}}}}while(0);if((a|0)<2){return}do{if((a|0)!=2){L1915:do{if(k){r=a<<1;q=(a|0)>2;p=0;o=0;while(1){n=p<<2;L1919:do{if(q){m=n+r|0;l=n;s=p;t=2;while(1){z=s+2|0;w=l+2|0;v=m-2|0;y=z+i|0;A=t-2|0;u=+g[e+(A<<2)>>2];x=+g[c+(y-1<<2)>>2];B=t-1|0;C=+g[e+(B<<2)>>2];D=+g[c+(y<<2)>>2];E=u*x+C*D;F=u*D-x*C;G=y+i|0;C=+g[f+(A<<2)>>2];x=+g[c+(G-1<<2)>>2];D=+g[f+(B<<2)>>2];u=+g[c+(G<<2)>>2];H=C*x+D*u;I=C*u-x*D;y=G+i|0;D=+g[h+(A<<2)>>2];x=+g[c+(y-1<<2)>>2];u=+g[h+(B<<2)>>2];C=+g[c+(y<<2)>>2];J=D*x+u*C;K=D*C-x*u;u=E+J;x=J-E;E=F+K;J=F-K;K=+g[c+(z<<2)>>2];F=I+K;C=K-I;I=+g[c+(s+1<<2)>>2];K=H+I;D=I-H;g[d+((l|1)<<2)>>2]=u+K;g[d+(w<<2)>>2]=F+E;g[d+(m-3<<2)>>2]=D-J;g[d+(v<<2)>>2]=x-C;y=w+r|0;g[d+(y-1<<2)>>2]=J+D;g[d+(y<<2)>>2]=C+x;y=v+r|0;g[d+(y-1<<2)>>2]=K-u;g[d+(y<<2)>>2]=E-F;y=t+2|0;if((y|0)<(a|0)){m=v;l=w;s=z;t=y}else{break L1919}}}}while(0);n=o+1|0;if((n|0)<(b|0)){p=p+a|0;o=n}else{break L1915}}}}while(0);if((a&1|0)==0){break}return}}while(0);h=(a-1|0)+i|0;f=a<<2;e=a<<1;if(!k){return}k=a;o=a;p=h+j|0;j=h;h=0;while(1){F=+g[c+(j<<2)>>2];E=+g[c+(p<<2)>>2];u=(F+E)*-.7071067690849304;K=(F-E)*.7071067690849304;r=c+(k-1<<2)|0;g[d+(o-1<<2)>>2]=+g[r>>2]+K;q=o+e|0;g[d+(q-1<<2)>>2]=+g[r>>2]-K;r=c+(j+i<<2)|0;g[d+(o<<2)>>2]=u- +g[r>>2];g[d+(q<<2)>>2]=u+ +g[r>>2];r=h+1|0;if((r|0)<(b|0)){k=k+a|0;o=o+f|0;p=p+a|0;j=j+a|0;h=r}else{break}}return}function b$(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0;f=$(b,a);h=a<<1;i=(b|0)>0;L1934:do{if(i){j=h-1|0;k=0;l=0;m=f;while(1){n=c+(l<<2)|0;o=c+(m<<2)|0;p=l<<1;g[d+(p<<2)>>2]=+g[n>>2]+ +g[o>>2];g[d+(j+p<<2)>>2]=+g[n>>2]- +g[o>>2];o=k+1|0;if((o|0)<(b|0)){k=o;l=l+a|0;m=m+a|0}else{break L1934}}}}while(0);if((a|0)<2){return}do{if((a|0)!=2){L1944:do{if(i){m=(a|0)>2;l=0;k=0;j=f;while(1){L1948:do{if(m){o=k<<1;n=2;p=j;q=o+h|0;r=k;s=o;while(1){o=p+2|0;t=q-2|0;u=r+2|0;v=s+2|0;w=+g[e+(n-2<<2)>>2];x=+g[c+(p+1<<2)>>2];y=+g[e+(n-1<<2)>>2];z=+g[c+(o<<2)>>2];A=w*x+y*z;B=w*z-x*y;C=c+(u<<2)|0;g[d+(v<<2)>>2]=+g[C>>2]+B;g[d+(t<<2)>>2]=B- +g[C>>2];C=c+(r+1<<2)|0;g[d+((s|1)<<2)>>2]=A+ +g[C>>2];g[d+(q-3<<2)>>2]=+g[C>>2]-A;C=n+2|0;if((C|0)<(a|0)){n=C;p=o;q=t;r=u;s=v}else{break L1948}}}}while(0);s=l+1|0;if((s|0)<(b|0)){l=s;k=k+a|0;j=j+a|0}else{break L1944}}}}while(0);if(((a|0)%2|0)!=1){break}return}}while(0);e=a-1|0;if(!i){return}i=0;j=a;k=f+e|0;f=e;while(1){g[d+(j<<2)>>2]=-0.0- +g[c+(k<<2)>>2];g[d+(j-1<<2)>>2]=+g[c+(f<<2)>>2];e=i+1|0;if((e|0)<(b|0)){i=e;j=j+h|0;k=k+a|0;f=f+a|0}else{break}}return}function b0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=c[a>>2]|0;if((d|0)==1){return}e=c[a+4>>2]|0;f=c[a+8>>2]|0;a=c[f+4>>2]|0;if((a|0)<=0){return}h=a+1|0;i=d-1|0;j=d;k=1;l=d;m=0;while(1){n=c[f+(h-m<<2)>>2]|0;o=(l|0)/(n|0)&-1;p=(d|0)/(l|0)&-1;q=$(p,o);r=j-$(p,n-1|0)|0;s=1-k|0;do{if((n|0)==4){t=r+p|0;u=e+(i+r<<2)|0;v=e+(i+t<<2)|0;w=e+((i+p|0)+t<<2)|0;if((k|0)==1){b_(p,o,b,e,u,v,w);x=s;break}else{b_(p,o,e,b,u,v,w);x=s;break}}else if((n|0)==2){w=e+(i+r<<2)|0;if((k|0)==1){b$(p,o,b,e,w);x=s;break}else{b$(p,o,e,b,w);x=s;break}}else{w=e+(i+r<<2)|0;if((((p|0)==1?k:s)|0)==0){b2(p,n,o,q,b,b,b,e,e,w);x=1;break}else{b2(p,n,o,q,e,e,e,b,b,w);x=0;break}}}while(0);q=m+1|0;if((q|0)<(a|0)){j=r;k=x;l=o;m=q}else{break}}if((x|0)!=1&(d|0)>0){y=0}else{return}while(1){g[b+(y<<2)>>2]=+g[e+(y<<2)>>2];x=y+1|0;if((x|0)<(d|0)){y=x}else{break}}return}function b1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0;c[a>>2]=b;d=a+4|0;c[d>>2]=cB(b*3&-1,4)|0;e=cB(32,4)|0;f=e;c[a+8>>2]=f;a=c[d>>2]|0;if((b|0)==1){return}d=e+8|0;h=0;i=b;j=0;k=0;L1995:while(1){if((k|0)<4){l=c[56016+(k<<2)>>2]|0}else{l=j+2|0}L2001:do{if((l|0)==2){m=h;n=i;while(1){o=(n|0)/2&-1;if((n|0)!=(o<<1|0)){p=n;q=m;break L2001}r=m+1|0;c[f+(m+2<<2)>>2]=2;s=(m|0)==0;if(!s){L2010:do{if((m|0)>0){t=1;while(1){u=r-t|0;c[f+(u+2<<2)>>2]=c[f+(u+1<<2)>>2]|0;u=t+1|0;if((u|0)<(r|0)){t=u}else{break L2010}}}}while(0);c[d>>2]=2}if((n-2|0)>>>0<2){v=m;w=r;x=s;break L1995}else{m=r;n=o}}}else{y=h;n=i;while(1){m=(n|0)/(l|0)&-1;if((n|0)!=($(m,l)|0)){p=n;q=y;break L2001}z=y+1|0;c[f+(y+2<<2)>>2]=l;if((m|0)==1){A=1394;break L1995}else{y=z;n=m}}}}while(0);h=q;i=p;j=l;k=k+1|0}if((A|0)==1394){v=y;w=z;x=(y|0)==0}c[f>>2]=b;c[e+4>>2]=w;B=6.2831854820251465/+(b|0);if(!((v|0)>0&(x^1))){return}x=b+1|0;w=1;e=0;y=0;while(1){z=c[f+(y+2<<2)>>2]|0;A=$(z,w);k=(b|0)/(A|0)&-1;l=z-1|0;if((l|0)>0){L2026:do{if((k|0)>2){z=0;j=e;p=0;while(1){i=z+w|0;C=B*+(i|0);q=2;h=j;D=0.0;while(1){E=D+1.0;F=C*E;g[a+(h+b<<2)>>2]=+R(+F);g[a+(x+h<<2)>>2]=+S(+F);d=q+2|0;if((d|0)<(k|0)){q=d;h=h+2|0;D=E}else{break}}h=p+1|0;if((h|0)<(l|0)){z=i;j=j+k|0;p=h}else{break L2026}}}}while(0);G=$(k,l)+e|0}else{G=e}p=y+1|0;if((p|0)<(v|0)){w=A;e=G;y=p}else{break}}return}function b2(a,b,c,d,e,f,h,i,j,k){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0.0,m=0.0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,T=0,U=0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,aa=0.0,ab=0,ac=0;l=6.2831854820251465/+(b|0);m=+R(+l);n=+S(+l);o=b+1>>1;p=a-1>>1;q=$(c,a);r=$(b,a);s=(a|0)==1;L2036:do{if(!s){L2038:do{if((d|0)>0){t=0;while(1){g[j+(t<<2)>>2]=+g[h+(t<<2)>>2];u=t+1|0;if((u|0)<(d|0)){t=u}else{break L2038}}}}while(0);t=(b|0)>1;L2042:do{if(t){u=(c|0)>0;v=0;w=1;while(1){x=v+q|0;L2046:do{if(u){y=x;z=0;while(1){g[i+(y<<2)>>2]=+g[f+(y<<2)>>2];A=z+1|0;if((A|0)<(c|0)){y=y+a|0;z=A}else{break L2046}}}}while(0);z=w+1|0;if((z|0)<(b|0)){v=x;w=z}else{break L2042}}}}while(0);w=-a|0;L2051:do{if((p|0)>(c|0)){if(!t){break}v=(c|0)>0;u=(a|0)>2;z=0;y=w;A=1;while(1){B=z+q|0;C=y+a|0;L2070:do{if(v){D=C-1|0;E=B-a|0;F=0;while(1){G=E+a|0;L2074:do{if(u){H=G;I=2;J=D;while(1){K=J+2|0;L=H+2|0;M=k+(J+1<<2)|0;N=H+1|0;O=f+(N<<2)|0;P=k+(K<<2)|0;Q=f+(L<<2)|0;g[i+(N<<2)>>2]=+g[M>>2]*+g[O>>2]+ +g[P>>2]*+g[Q>>2];g[i+(L<<2)>>2]=+g[M>>2]*+g[Q>>2]- +g[P>>2]*+g[O>>2];O=I+2|0;if((O|0)<(a|0)){H=L;I=O;J=K}else{break L2074}}}}while(0);J=F+1|0;if((J|0)<(c|0)){E=G;F=J}else{break L2070}}}}while(0);x=A+1|0;if((x|0)<(b|0)){z=B;y=C;A=x}else{break L2051}}}else{if(!t){break}A=(a|0)>2;y=(c|0)>0;z=0;u=w;v=1;while(1){x=u+a|0;F=z+q|0;L2056:do{if(A){E=F;D=2;J=x-1|0;while(1){I=J+2|0;H=E+2|0;L2060:do{if(y){K=k+(J+1<<2)|0;O=k+(I<<2)|0;L=H;P=0;while(1){Q=L-1|0;M=f+(Q<<2)|0;N=f+(L<<2)|0;g[i+(Q<<2)>>2]=+g[K>>2]*+g[M>>2]+ +g[O>>2]*+g[N>>2];g[i+(L<<2)>>2]=+g[K>>2]*+g[N>>2]- +g[O>>2]*+g[M>>2];M=P+1|0;if((M|0)<(c|0)){L=L+a|0;P=M}else{break L2060}}}}while(0);G=D+2|0;if((G|0)<(a|0)){E=H;D=G;J=I}else{break L2056}}}}while(0);C=v+1|0;if((C|0)<(b|0)){z=F;u=x;v=C}else{break L2051}}}}while(0);w=$(q,b);t=(o|0)>1;if((p|0)>=(c|0)){if(!t){break}v=(c|0)>0;u=(a|0)>2;z=w;y=0;A=1;while(1){C=y+q|0;B=z-q|0;L2085:do{if(v){J=B;D=C;E=0;while(1){L2088:do{if(u){G=D;P=J;L=2;while(1){O=G+2|0;K=P+2|0;M=G+1|0;N=i+(M<<2)|0;Q=P+1|0;T=i+(Q<<2)|0;g[f+(M<<2)>>2]=+g[N>>2]+ +g[T>>2];M=i+(O<<2)|0;U=i+(K<<2)|0;g[f+(Q<<2)>>2]=+g[M>>2]- +g[U>>2];g[f+(O<<2)>>2]=+g[M>>2]+ +g[U>>2];g[f+(K<<2)>>2]=+g[T>>2]- +g[N>>2];N=L+2|0;if((N|0)<(a|0)){G=O;P=K;L=N}else{break L2088}}}}while(0);L=E+1|0;if((L|0)<(c|0)){J=J+a|0;D=D+a|0;E=L}else{break L2085}}}}while(0);E=A+1|0;if((E|0)<(o|0)){z=B;y=C;A=E}else{break L2036}}}if(!t){break}A=(a|0)>2;y=(c|0)>0;z=w;u=0;v=1;while(1){E=u+q|0;D=z-q|0;L2097:do{if(A){J=D;x=E;F=2;while(1){L=x+2|0;P=J+2|0;L2100:do{if(y){G=L-a|0;I=P-a|0;H=0;while(1){N=G+a|0;K=I+a|0;O=N-1|0;T=i+(O<<2)|0;U=K-1|0;M=i+(U<<2)|0;g[f+(O<<2)>>2]=+g[T>>2]+ +g[M>>2];O=i+(N<<2)|0;Q=i+(K<<2)|0;g[f+(U<<2)>>2]=+g[O>>2]- +g[Q>>2];g[f+(N<<2)>>2]=+g[O>>2]+ +g[Q>>2];g[f+(K<<2)>>2]=+g[M>>2]- +g[T>>2];T=H+1|0;if((T|0)<(c|0)){G=N;I=K;H=T}else{break L2100}}}}while(0);H=F+2|0;if((H|0)<(a|0)){J=P;x=L;F=H}else{break L2097}}}}while(0);C=v+1|0;if((C|0)<(o|0)){z=D;u=E;v=C}else{break L2036}}}}while(0);k=(d|0)>0;L2107:do{if(k){v=0;while(1){g[h+(v<<2)>>2]=+g[j+(v<<2)>>2];u=v+1|0;if((u|0)<(d|0)){v=u}else{break L2107}}}}while(0);v=$(d,b);u=(o|0)>1;L2111:do{if(u){z=(c|0)>0;y=v;A=0;w=1;while(1){t=A+q|0;C=y-q|0;L2115:do{if(z){B=C-a|0;F=t-a|0;x=0;while(1){J=F+a|0;H=B+a|0;I=i+(J<<2)|0;G=i+(H<<2)|0;g[f+(J<<2)>>2]=+g[I>>2]+ +g[G>>2];g[f+(H<<2)>>2]=+g[G>>2]- +g[I>>2];I=x+1|0;if((I|0)<(c|0)){B=H;F=J;x=I}else{break L2115}}}}while(0);E=w+1|0;if((E|0)<(o|0)){y=C;A=t;w=E}else{break}}w=$(b-1|0,d);if(!u){break}A=(o|0)>2;l=0.0;V=1.0;y=v;z=0;E=1;while(1){D=z+d|0;x=y-d|0;W=m*V-n*l;X=m*l+n*V;L2124:do{if(k){F=x;B=w;I=d;J=D;H=0;while(1){g[j+(J<<2)>>2]=+g[h+(H<<2)>>2]+W*+g[h+(I<<2)>>2];g[j+(F<<2)>>2]=X*+g[h+(B<<2)>>2];G=H+1|0;if((G|0)<(d|0)){F=F+1|0;B=B+1|0;I=I+1|0;J=J+1|0;H=G}else{break L2124}}}}while(0);L2128:do{if(A){t=w;C=d;Y=X;Z=W;H=2;while(1){J=C+d|0;I=t-d|0;_=W*Z-X*Y;aa=W*Y+X*Z;L2131:do{if(k){B=D;F=x;G=J;T=I;K=0;while(1){N=j+(B<<2)|0;g[N>>2]=+g[N>>2]+_*+g[h+(G<<2)>>2];N=j+(F<<2)|0;g[N>>2]=+g[N>>2]+aa*+g[h+(T<<2)>>2];N=K+1|0;if((N|0)<(d|0)){B=B+1|0;F=F+1|0;G=G+1|0;T=T+1|0;K=N}else{break L2131}}}}while(0);L=H+1|0;if((L|0)<(o|0)){t=I;C=J;Y=aa;Z=_;H=L}else{break L2128}}}}while(0);H=E+1|0;if((H|0)<(o|0)){l=X;V=W;y=x;z=D;E=H}else{break}}if(u){ab=0;ac=1}else{break}while(1){E=ab+d|0;L2139:do{if(k){z=E;y=0;while(1){w=j+(y<<2)|0;g[w>>2]=+g[h+(z<<2)>>2]+ +g[w>>2];w=y+1|0;if((w|0)<(d|0)){z=z+1|0;y=w}else{break L2139}}}}while(0);D=ac+1|0;if((D|0)<(o|0)){ab=E;ac=D}else{break L2111}}}}while(0);L2144:do{if((a|0)<(c|0)){if((a|0)<=0){break}ac=(c|0)>0;ab=0;while(1){L2149:do{if(ac){d=ab;h=ab;j=0;while(1){g[e+(d<<2)>>2]=+g[i+(h<<2)>>2];k=j+1|0;if((k|0)<(c|0)){d=d+r|0;h=h+a|0;j=k}else{break L2149}}}}while(0);E=ab+1|0;if((E|0)<(a|0)){ab=E}else{break L2144}}}else{if((c|0)<=0){break}ab=(a|0)>0;ac=0;E=0;j=0;while(1){L2157:do{if(ab){h=ac;d=E;k=0;while(1){g[e+(h<<2)>>2]=+g[i+(d<<2)>>2];v=k+1|0;if((v|0)<(a|0)){h=h+1|0;d=d+1|0;k=v}else{break L2157}}}}while(0);k=j+1|0;if((k|0)<(c|0)){ac=ac+r|0;E=E+a|0;j=k}else{break L2144}}}}while(0);j=a<<1;E=$(q,b);L2162:do{if(u){b=(c|0)>0;ac=E;ab=0;k=0;d=1;while(1){h=k+j|0;v=ab+q|0;f=ac-q|0;L2166:do{if(b){D=h;x=v;y=f;z=0;while(1){g[e+(D-1<<2)>>2]=+g[i+(x<<2)>>2];g[e+(D<<2)>>2]=+g[i+(y<<2)>>2];w=z+1|0;if((w|0)<(c|0)){D=D+r|0;x=x+a|0;y=y+a|0;z=w}else{break L2166}}}}while(0);z=d+1|0;if((z|0)<(o|0)){ac=f;ab=v;k=h;d=z}else{break L2162}}}}while(0);if(s){return}s=-a|0;if((p|0)>=(c|0)){if(!u){return}p=(c|0)>0;d=(a|0)>2;k=E;ab=0;ac=0;b=s;z=1;while(1){y=b+j|0;x=ac+j|0;D=ab+q|0;w=k-q|0;L2181:do{if(p){A=y;H=x;C=D;t=w;L=0;while(1){L2184:do{if(d){P=2;while(1){K=P+C|0;T=i+(K-1<<2)|0;G=P+t|0;F=i+(G-1<<2)|0;B=P+H|0;g[e+(B-1<<2)>>2]=+g[T>>2]+ +g[F>>2];N=(a-P|0)+A|0;g[e+(N-1<<2)>>2]=+g[T>>2]- +g[F>>2];F=i+(K<<2)|0;K=i+(G<<2)|0;g[e+(B<<2)>>2]=+g[F>>2]+ +g[K>>2];g[e+(N<<2)>>2]=+g[K>>2]- +g[F>>2];F=P+2|0;if((F|0)<(a|0)){P=F}else{break L2184}}}}while(0);P=L+1|0;if((P|0)<(c|0)){A=A+r|0;H=H+r|0;C=C+a|0;t=t+a|0;L=P}else{break L2181}}}}while(0);L=z+1|0;if((L|0)<(o|0)){k=w;ab=D;ac=x;b=y;z=L}else{break}}return}if(!u){return}u=(a|0)>2;z=(c|0)>0;b=E;E=0;ac=0;ab=s;s=1;while(1){k=ab+j|0;d=ac+j|0;p=E+q|0;L=b-q|0;L2196:do{if(u){t=k+a|0;C=2;while(1){L2200:do{if(z){H=t-C|0;A=C+d|0;h=C+p|0;v=C+L|0;f=0;while(1){P=i+(h-1<<2)|0;J=i+(v-1<<2)|0;g[e+(A-1<<2)>>2]=+g[P>>2]+ +g[J>>2];g[e+(H-1<<2)>>2]=+g[P>>2]- +g[J>>2];J=i+(h<<2)|0;P=i+(v<<2)|0;g[e+(A<<2)>>2]=+g[J>>2]+ +g[P>>2];g[e+(H<<2)>>2]=+g[P>>2]- +g[J>>2];J=f+1|0;if((J|0)<(c|0)){H=H+r|0;A=A+r|0;h=h+a|0;v=v+a|0;f=J}else{break L2200}}}}while(0);f=C+2|0;if((f|0)<(a|0)){C=f}else{break L2196}}}}while(0);y=s+1|0;if((y|0)<(o|0)){b=L;E=p;ac=d;ab=k;s=y}else{break}}return}function b3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=(a|0)!=0;do{if(d){e=c[a+64>>2]|0;if((e|0)==0){f=0;g=0;h=1;i=0;j=1;break}k=c[e+104>>2]|0;l=c[e+4>>2]|0;if((l|0)==0){f=0;g=k;h=0;i=0;j=1;break}f=c[l+28>>2]|0;g=k;h=0;i=l;j=0}else{f=0;g=0;h=1;i=0;j=1}}while(0);l=d?a+4|0:0;if(h|(g|0)==0|j|(f|0)==0|(l|0)==0){m=-136;return m|0}j=a+84|0;h=c[j>>2]|0;L2216:do{if((h|0)!=0){d=h;while(1){k=c[d+4>>2]|0;cA(c[d>>2]|0);e=d;c[e>>2]=0;c[e+4>>2]=0;cA(d);if((k|0)==0){break L2216}else{d=k}}}}while(0);h=a+80|0;d=c[h>>2]|0;if((d|0)!=0){k=a+68|0;e=a+76|0;c[k>>2]=cC(c[k>>2]|0,(c[e>>2]|0)+d|0)|0;c[e>>2]=(c[e>>2]|0)+(c[h>>2]|0)|0;c[h>>2]=0}e=a+72|0;c[e>>2]=0;c[j>>2]=0;d=c[b>>2]|0;k=c[b+4>>2]|0;n=l;c[n>>2]=0;c[n+4>>2]=0;c[l+12>>2]=d;c[l+8>>2]=d;c[l+16>>2]=k;if((cw(l,1)|0)!=0){m=-135;return m|0}k=cw(l,c[g+44>>2]|0)|0;if((k|0)==-1){m=-136;return m|0}c[a+40>>2]=k;g=f+32+(k<<2)|0;k=c[g>>2]|0;if((k|0)==0){m=-136;return m|0}d=c[k>>2]|0;k=a+28|0;c[k>>2]=d;do{if((d|0)==0){c[a+24>>2]=0;c[a+32>>2]=0;o=0}else{c[a+24>>2]=cw(l,1)|0;n=cw(l,1)|0;c[a+32>>2]=n;if((n|0)==-1){m=-136;return m|0}else{o=c[k>>2]|0;break}}}while(0);k=b+16|0;l=c[k+4>>2]|0;d=a+48|0;c[d>>2]=c[k>>2]|0;c[d+4>>2]=l;l=b+24|0;d=c[l+4>>2]|0;k=a+56|0;c[k>>2]=c[l>>2]|0;c[k+4>>2]=d;c[a+44>>2]=c[b+12>>2]|0;b=a+36|0;c[b>>2]=c[f+(o<<2)>>2]|0;o=i+4|0;i=(c[o>>2]<<2)+7&-8;d=c[e>>2]|0;k=a+76|0;l=a+68|0;n=c[l>>2]|0;if((i+d|0)>(c[k>>2]|0)){if((n|0)!=0){p=cz(8)|0;c[h>>2]=(c[h>>2]|0)+(c[e>>2]|0)|0;c[p+4>>2]=c[j>>2]|0;c[p>>2]=c[l>>2]|0;c[j>>2]=p}c[k>>2]=i;p=cz(i)|0;c[l>>2]=p;c[e>>2]=0;q=0;r=p}else{q=d;r=n}n=q+i|0;c[e>>2]=n;i=a|0;c[i>>2]=r+q|0;L2245:do{if((c[o>>2]|0)>0){q=0;d=n;p=r;while(1){s=(c[b>>2]<<2)+7&-8;if((s+d|0)>(c[k>>2]|0)){if((p|0)!=0){t=cz(8)|0;c[h>>2]=(c[h>>2]|0)+(c[e>>2]|0)|0;c[t+4>>2]=c[j>>2]|0;c[t>>2]=c[l>>2]|0;c[j>>2]=t}c[k>>2]=s;t=cz(s)|0;c[l>>2]=t;c[e>>2]=0;u=0;v=t}else{u=d;v=p}c[e>>2]=u+s|0;c[(c[i>>2]|0)+(q<<2)>>2]=v+u|0;s=q+1|0;if((s|0)>=(c[o>>2]|0)){break L2245}q=s;d=c[e>>2]|0;p=c[l>>2]|0}}}while(0);l=c[(c[g>>2]|0)+12>>2]|0;m=aW[c[(c[56056+(c[f+288+(l<<2)>>2]<<2)>>2]|0)+16>>2]&31](a,c[f+544+(l<<2)>>2]|0)|0;return m|0}function b4(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;i=(f|0)!=0;j=i?e:0;e=i?h:0;h=c[32648+(c[b+(j<<2)>>2]<<2)>>2]|0;i=c[32648+(c[b+(e<<2)>>2]<<2)>>2]|0;b=c[d+(f<<2)>>2]|0;f=c[d+(j<<2)>>2]|0;j=c[d+(e<<2)>>2]|0;e=(b|0)/4&-1;d=e-((f|0)/4&-1)|0;k=d+((f|0)/2&-1)|0;f=(((b|0)/2&-1)+e|0)+((j|0)/-4&-1)|0;e=(j|0)/2&-1;l=f+e|0;if((d|0)>0){cG(a|0,0,d<<2|0);m=d}else{m=0}L2261:do{if((m|0)<(k|0)){d=m;n=0;while(1){o=a+(d<<2)|0;g[o>>2]=+g[h+(n<<2)>>2]*+g[o>>2];o=d+1|0;if((o|0)<(k|0)){d=o;n=n+1|0}else{break L2261}}}}while(0);if((j|0)>1){j=f+1|0;k=(l|0)>(j|0);h=f;m=e;while(1){e=m-1|0;n=a+(h<<2)|0;g[n>>2]=+g[i+(e<<2)>>2]*+g[n>>2];n=h+1|0;if((n|0)<(l|0)){h=n;m=e}else{break}}p=k?l:j}else{p=f}if((p|0)>=(b|0)){return}cG(a+(p<<2)|0,0,b-p<<2|0);return}function b5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;b=cB(1,40)|0;d=b;e=b+36|0;c[e>>2]=1;L2276:do{if((cw(a,24)|0)==5653314){f=b;c[f>>2]=cw(a,16)|0;g=cw(a,24)|0;h=b+4|0;c[h>>2]=g;if((g|0)==-1){break}i=c[f>>2]|0;L2279:do{if((i|0)==0){j=0}else{k=i;l=0;while(1){m=l+1|0;n=k>>>1;if((n|0)==0){j=m;break L2279}else{k=n;l=m}}}}while(0);L2283:do{if((g|0)==0){o=0}else{i=g;l=0;while(1){k=l+1|0;m=i>>>1;if((m|0)==0){o=k;break L2283}else{i=m;l=k}}}}while(0);if((o+j|0)>24){break}g=cw(a,1)|0;L2288:do{if((g|0)==0){l=cw(a,1)|0;i=c[h>>2]|0;k=(l|0)!=0;l=$(k?1:5,i)+7>>3;if((l|0)>(((c[a+16>>2]|0)-(c[a>>2]|0)|0)+(((c[a+4>>2]|0)+7|0)/-8&-1)|0)){break L2276}l=b+8|0;c[l>>2]=cz(i<<2)|0;i=(c[h>>2]|0)>0;if(!k){if(i){p=0}else{break}while(1){k=cw(a,5)|0;if((k|0)==-1){break L2276}c[(c[l>>2]|0)+(p<<2)>>2]=k+1|0;k=p+1|0;if((k|0)<(c[h>>2]|0)){p=k}else{break L2288}}}if(i){q=0}else{break}while(1){if((cw(a,1)|0)==0){c[(c[l>>2]|0)+(q<<2)>>2]=0}else{k=cw(a,5)|0;if((k|0)==-1){break L2276}c[(c[l>>2]|0)+(q<<2)>>2]=k+1|0}k=q+1|0;if((k|0)<(c[h>>2]|0)){q=k}else{break L2288}}}else if((g|0)==1){l=(cw(a,5)|0)+1|0;if((l|0)==0){break L2276}i=b+8|0;c[i>>2]=cz(c[h>>2]<<2)|0;k=c[h>>2]|0;if((k|0)>0){r=0;s=l;t=k}else{break}while(1){L2308:do{if((t|0)==(r|0)){u=0}else{k=t-r|0;l=0;while(1){m=l+1|0;n=k>>>1;if((n|0)==0){u=m;break L2308}else{k=n;l=m}}}}while(0);l=cw(a,u)|0;if((l|0)==-1|(s|0)>32){break L2276}k=c[h>>2]|0;if((l|0)>(k-r|0)){break L2276}if((l|0)>0){if((l-1>>s-1|0)>1){break L2276}else{v=0;w=r}while(1){c[(c[i>>2]|0)+(w<<2)>>2]=s;m=v+1|0;if((m|0)<(l|0)){v=m;w=w+1|0}else{break}}x=l+r|0;y=c[h>>2]|0}else{x=r;y=k}if((x|0)<(y|0)){r=x;s=s+1|0;t=y}else{break L2288}}}else{break L2276}}while(0);g=cw(a,4)|0;i=b+12|0;c[i>>2]=g;if((g|0)==0){z=d;return z|0}else if(!((g|0)==1|(g|0)==2)){break}c[b+16>>2]=cw(a,32)|0;c[b+20>>2]=cw(a,32)|0;g=b+24|0;c[g>>2]=(cw(a,4)|0)+1|0;m=cw(a,1)|0;c[b+28>>2]=m;if((m|0)==-1){break}m=c[i>>2]|0;L2326:do{if((m|0)==1){i=c[f>>2]|0;if((i|0)==0){A=0;break}n=c[h>>2]|0;if((i|0)<=0){while(1){}}B=~~+N(+(+Q(+(+(n|0)),+(1.0/+(i|0)))));while(1){C=B+1|0;D=1;E=1;F=0;while(1){G=$(D,B);H=$(E,C);I=F+1|0;if((I|0)<(i|0)){D=G;E=H;F=I}else{break}}if((G|0)<=(n|0)&(H|0)>(n|0)){A=B;break L2326}B=(G|0)>(n|0)?B-1|0:C}}else if((m|0)==2){A=$(c[f>>2]|0,c[h>>2]|0)}else{A=0}}while(0);h=$(c[g>>2]|0,A)+7>>3;if((h|0)>(((c[a+16>>2]|0)-(c[a>>2]|0)|0)+(((c[a+4>>2]|0)+7|0)/-8&-1)|0)){break}h=b+32|0;c[h>>2]=cz(A<<2)|0;L2342:do{if((A|0)>0){f=0;while(1){m=cw(a,c[g>>2]|0)|0;c[(c[h>>2]|0)+(f<<2)>>2]=m;m=f+1|0;if((m|0)<(A|0)){f=m}else{break L2342}}}}while(0);if((A|0)==0){z=d;return z|0}if((c[(c[h>>2]|0)+(A-1<<2)>>2]|0)==-1){break}else{z=d}return z|0}}while(0);if((c[e>>2]|0)==0){z=0;return z|0}e=c[b+32>>2]|0;if((e|0)!=0){cA(e)}e=c[b+8>>2]|0;if((e|0)!=0){cA(e)}cG(b|0,0,40);cA(b);z=0;return z|0}function b6(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;f=c[b+40>>2]|0;g=c[b+36>>2]|0;L2362:do{if(g>>>0>32){h=1635}else{i=c[55792+(g<<2)>>2]|0;j=e+4|0;k=c[j>>2]|0;l=k+g|0;m=e|0;n=c[m>>2]|0;o=c[e+16>>2]|0;do{if((n|0)<(o-4|0)){h=1623}else{if((n|0)>(o-(l+7>>3)|0)){h=1635;break L2362}if((l|0)==0){p=0;break}else{h=1623;break}}}while(0);if((h|0)==1623){q=c[e+12>>2]|0;r=(d[q]|0)>>>(k>>>0);do{if((l|0)>8){s=(d[q+1|0]|0)<<8-k|r;if((l|0)<=16){t=s;break}u=(d[q+2|0]|0)<<16-k|s;if((l|0)<=24){t=u;break}s=(d[q+3|0]|0)<<24-k|u;if((l|0)<33|(k|0)==0){t=s;break}t=(d[q+4|0]|0)<<32-k|s}else{t=r}}while(0);r=t&i;if((r|0)>-1){p=r}else{h=1635;break}}r=c[(c[b+32>>2]|0)+(p<<2)>>2]|0;if((r|0)<0){v=r>>>15&32767;w=(c[b+8>>2]|0)-(r&32767)|0;break}q=r-1|0;r=k+(a[(c[b+28>>2]|0)+q|0]|0)|0;if((n|0)>(o-(r+7>>3)|0)){c[e+12>>2]=0;c[m>>2]=o;x=1}else{l=(r|0)/8&-1;s=e+12|0;c[s>>2]=(c[s>>2]|0)+l|0;c[m>>2]=l+n|0;x=r&7}c[j>>2]=x;y=q;return y|0}}while(0);if((h|0)==1635){v=0;w=c[b+8>>2]|0}do{if(f>>>0>32){z=-1;h=1646}else{x=c[55792+(f<<2)>>2]|0;p=c[e+4>>2]|0;t=p+f|0;g=c[e>>2]|0;q=c[e+16>>2]|0;if((g|0)>=(q-4|0)){if((g|0)>(q-(t+7>>3)|0)){z=-1;h=1646;break}if((t|0)==0){A=f;B=0;break}}q=c[e+12>>2]|0;g=(d[q]|0)>>>(p>>>0);do{if((t|0)>8){r=(d[q+1|0]|0)<<8-p|g;if((t|0)<=16){C=r;break}l=(d[q+2|0]|0)<<16-p|r;if((t|0)<=24){C=l;break}r=(d[q+3|0]|0)<<24-p|l;if((t|0)<33|(p|0)==0){C=r;break}C=(d[q+4|0]|0)<<32-p|r}else{C=g}}while(0);z=C&x;h=1646;break}}while(0);L2399:do{if((h|0)==1646){C=(z|0)<0;L2401:do{if(C&(f|0)>1){g=e+4|0;p=e|0;q=e+16|0;t=e+12|0;j=f;while(1){n=j-1|0;do{if(n>>>0>32){D=-1}else{m=c[55792+(n<<2)>>2]|0;o=c[g>>2]|0;k=o+n|0;i=c[p>>2]|0;r=c[q>>2]|0;if((i|0)>=(r-4|0)){if((i|0)>(r-(k+7>>3)|0)){D=-1;break}if((k|0)==0){A=n;B=0;break L2399}}r=c[t>>2]|0;i=(d[r]|0)>>>(o>>>0);do{if((k|0)>8){l=(d[r+1|0]|0)<<8-o|i;if((k|0)<=16){E=l;break}s=(d[r+2|0]|0)<<16-o|l;if((k|0)<=24){E=s;break}l=(d[r+3|0]|0)<<24-o|s;if((k|0)<33|(o|0)==0){E=l;break}E=(d[r+4|0]|0)<<32-o|l}else{E=i}}while(0);D=E&m}}while(0);i=(D|0)<0;if(i&(n|0)>1){j=n}else{F=D;G=n;H=i;break L2401}}}else{F=z;G=f;H=C}}while(0);if(H){y=-1}else{A=G;B=F;break}return y|0}}while(0);F=B>>>16|B<<16;B=F>>>8&16711935|F<<8&-16711936;F=B>>>4&252645135|B<<4&-252645136;B=F>>>2&858993459|F<<2&-858993460;F=B>>>1&1431655765|B<<1&-1431655766;B=w-v|0;L2421:do{if((B|0)>1){G=c[b+20>>2]|0;H=w;f=v;z=B;while(1){D=z>>1;E=(c[G+(D+f<<2)>>2]|0)>>>0>F>>>0;h=((E^1)<<31>>31&D)+f|0;C=H-(D&-(E&1))|0;E=C-h|0;if((E|0)>1){H=C;f=h;z=E}else{I=h;break L2421}}}else{I=v}}while(0);v=a[(c[b+28>>2]|0)+I|0]|0;b=e+4|0;F=c[b>>2]|0;if((v|0)>(A|0)){B=F+A|0;A=e|0;w=c[A>>2]|0;z=c[e+16>>2]|0;if((w|0)>(z-(B+7>>3)|0)){c[e+12>>2]=0;c[A>>2]=z;J=1}else{z=(B|0)/8&-1;f=e+12|0;c[f>>2]=(c[f>>2]|0)+z|0;c[A>>2]=z+w|0;J=B&7}c[b>>2]=J;y=-1;return y|0}else{J=F+v|0;v=e|0;F=c[v>>2]|0;B=c[e+16>>2]|0;if((F|0)>(B-(J+7>>3)|0)){c[e+12>>2]=0;c[v>>2]=B;K=1}else{B=(J|0)/8&-1;w=e+12|0;c[w>>2]=(c[w>>2]|0)+B|0;c[v>>2]=B+F|0;K=J&7}c[b>>2]=K;y=I;return y|0}return 0}function b7(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;if((c[a+8>>2]|0)<=0){h=0;i=f;return h|0}j=a|0;k=c[j>>2]|0;l=(e|0)/(k|0)&-1;e=i;i=i+(l<<2)|0;i=i+7>>3<<3;m=e;e=(l|0)>0;L2443:do{if(e){n=a+16|0;o=0;while(1){p=b6(a,d)|0;if((p|0)==-1){h=-1;break}q=c[n>>2]|0;r=c[j>>2]|0;c[m+(o<<2)>>2]=q+($(r,p)<<2)|0;p=o+1|0;if((p|0)<(l|0)){o=p}else{s=r;break L2443}}i=f;return h|0}else{s=k}}while(0);if((s|0)>0){t=0;u=0;v=s}else{h=0;i=f;return h|0}while(1){if(e){s=0;while(1){k=b+(s+u<<2)|0;g[k>>2]=+g[(c[m+(s<<2)>>2]|0)+(t<<2)>>2]+ +g[k>>2];k=s+1|0;if((k|0)<(l|0)){s=k}else{break}}w=c[j>>2]|0}else{w=v}s=t+1|0;if((s|0)<(w|0)){t=s;u=u+l|0;v=w}else{h=0;break}}i=f;return h|0}function b8(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;if((c[a+8>>2]|0)<=0){f=0;return f|0}h=a|0;if((c[h>>2]|0)>8){if((e|0)<=0){f=0;return f|0}i=a+16|0;j=0;while(1){k=b6(a,d)|0;if((k|0)==-1){f=-1;l=1715;break}m=c[i>>2]|0;n=c[h>>2]|0;o=$(n,k);L2472:do{if((n|0)>0){k=j;p=0;while(1){q=p+1|0;r=k+1|0;s=b+(k<<2)|0;g[s>>2]=+g[m+(p+o<<2)>>2]+ +g[s>>2];if((q|0)<(c[h>>2]|0)){k=r;p=q}else{t=r;break L2472}}}else{t=j}}while(0);if((t|0)<(e|0)){j=t}else{f=0;l=1713;break}}if((l|0)==1715){return f|0}else if((l|0)==1713){return f|0}}t=a+16|0;j=0;L2480:while(1){if((j|0)>=(e|0)){f=0;l=1716;break}while(1){i=b6(a,d)|0;if((i|0)==-1){f=-1;l=1718;break L2480}u=c[t>>2]|0;o=c[h>>2]|0;v=$(o,i);if((o|0)==8){l=1701;break}else if((o|0)==4){w=0;x=j;l=1705;break}else if((o|0)==5){y=0;z=j;l=1704;break}else if((o|0)==6){A=0;B=j;l=1703;break}else if((o|0)==2){C=0;D=j;l=1707;break}else if((o|0)==3){E=0;F=j;l=1706;break}else if((o|0)==1){G=0;H=j;break}else if((o|0)==7){I=0;J=j;l=1702;break}}do{if((l|0)==1701){l=0;o=b+(j<<2)|0;g[o>>2]=+g[u+(v<<2)>>2]+ +g[o>>2];I=1;J=j+1|0;l=1702;break}}while(0);do{if((l|0)==1702){l=0;o=b+(J<<2)|0;g[o>>2]=+g[u+(I+v<<2)>>2]+ +g[o>>2];A=I+1|0;B=J+1|0;l=1703;break}}while(0);do{if((l|0)==1703){l=0;o=b+(B<<2)|0;g[o>>2]=+g[u+(A+v<<2)>>2]+ +g[o>>2];y=A+1|0;z=B+1|0;l=1704;break}}while(0);do{if((l|0)==1704){l=0;o=b+(z<<2)|0;g[o>>2]=+g[u+(y+v<<2)>>2]+ +g[o>>2];w=y+1|0;x=z+1|0;l=1705;break}}while(0);do{if((l|0)==1705){l=0;o=b+(x<<2)|0;g[o>>2]=+g[u+(w+v<<2)>>2]+ +g[o>>2];E=w+1|0;F=x+1|0;l=1706;break}}while(0);do{if((l|0)==1706){l=0;o=b+(F<<2)|0;g[o>>2]=+g[u+(E+v<<2)>>2]+ +g[o>>2];C=E+1|0;D=F+1|0;l=1707;break}}while(0);if((l|0)==1707){l=0;o=b+(D<<2)|0;g[o>>2]=+g[u+(C+v<<2)>>2]+ +g[o>>2];G=C+1|0;H=D+1|0}o=b+(H<<2)|0;g[o>>2]=+g[u+(G+v<<2)>>2]+ +g[o>>2];j=H+1|0}if((l|0)==1718){return f|0}else if((l|0)==1716){return f|0}return 0}function b9(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=c[a+28>>2]|0;a=cz(96)|0;e=a;c[e>>2]=cw(b,8)|0;f=a+4|0;c[f>>2]=cw(b,16)|0;g=a+8|0;c[g>>2]=cw(b,16)|0;c[a+12>>2]=cw(b,6)|0;c[a+16>>2]=cw(b,8)|0;h=cw(b,4)|0;i=h+1|0;j=a+20|0;c[j>>2]=i;L2504:do{if((c[e>>2]|0)>=1){if((c[f>>2]|0)<1){break}if((c[g>>2]|0)<1|(h|0)<0){break}k=a+24|0;l=d+24|0;m=d+1824|0;n=0;o=i;while(1){if((n|0)>=(o|0)){p=a;break}q=cw(b,8)|0;c[k+(n<<2)>>2]=q;if((q|0)<0){break L2504}if((q|0)>=(c[l>>2]|0)){break L2504}r=c[m+(q<<2)>>2]|0;if((c[r+12>>2]|0)==0){break L2504}if((c[r>>2]|0)<1){break L2504}n=n+1|0;o=c[j>>2]|0}return p|0}}while(0);if((a|0)==0){p=0;return p|0}cG(a|0,0,96);cA(a);p=0;return p|0}function ca(a,b){a=a|0;b=b|0;a=cB(1,32)|0;c[a+4>>2]=c[b>>2]|0;c[a>>2]=c[b+8>>2]|0;c[a+20>>2]=b;c[a+8>>2]=cB(2,4)|0;return a|0}function cb(a){a=a|0;if((a|0)==0){return}cG(a|0,0,96);cA(a);return}function cc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;if((a|0)==0){return}b=a+8|0;d=c[b>>2]|0;if((d|0)!=0){e=c[d>>2]|0;if((e|0)==0){f=d}else{cA(e);f=c[b>>2]|0}e=c[f+4>>2]|0;if((e|0)==0){g=f}else{cA(e);g=c[b>>2]|0}cA(g)}cG(a|0,0,32);cA(a);return}function cd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0.0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0;d=c[b+20>>2]|0;e=a+4|0;f=d+12|0;h=cw(e,c[f>>2]|0)|0;if((h|0)<=0){i=0;return i|0}j=+(h|0)/+((1<<c[f>>2])-1|0)*+(c[d+16>>2]|0);f=d+20|0;h=c[f>>2]|0;L2545:do{if((h|0)==0){k=0}else{l=h;m=0;while(1){n=m+1|0;o=l>>>1;if((o|0)==0){k=n;break L2545}else{l=o;m=n}}}}while(0);h=cw(e,k)|0;if((h|0)==-1){i=0;return i|0}if((h|0)>=(c[f>>2]|0)){i=0;return i|0}f=c[(c[(c[(c[a+64>>2]|0)+4>>2]|0)+28>>2]|0)+2848>>2]|0;k=c[d+24+(h<<2)>>2]|0;h=f+(k*56&-1)|0;d=b+4|0;b=h|0;m=((c[b>>2]|0)+(c[d>>2]|0)<<2)+11&-8;l=a+72|0;n=c[l>>2]|0;o=a+76|0;p=a+68|0;q=c[p>>2]|0;if((m+n|0)>(c[o>>2]|0)){if((q|0)!=0){r=cz(8)|0;s=a+80|0;c[s>>2]=(c[s>>2]|0)+(c[l>>2]|0)|0;s=a+84|0;c[r+4>>2]=c[s>>2]|0;c[r>>2]=c[p>>2]|0;c[s>>2]=r}c[o>>2]=m;o=cz(m)|0;c[p>>2]=o;c[l>>2]=0;t=0;u=o}else{t=n;u=q}q=u+t|0;c[l>>2]=t+m|0;m=q;t=c[d>>2]|0;l=(t|0)>0;L2561:do{if((c[f+(k*56&-1)+8>>2]|0)>0){if(!l){break}u=f+(k*56&-1)+16|0;n=0;while(1){o=b6(h,e)|0;if((o|0)==-1){i=0;break}p=c[u>>2]|0;r=c[b>>2]|0;s=$(r,o);L2569:do{if((n|0)<(t|0)&(r|0)>0){o=n;a=0;while(1){v=o+1|0;g[m+(o<<2)>>2]=+g[p+(a+s<<2)>>2];if((v|0)>=(t|0)){w=v;break L2569}x=a+1|0;if((x|0)<(c[b>>2]|0)){o=v;a=x}else{w=v;break L2569}}}else{w=n}}while(0);if((w|0)<(t|0)){n=w}else{break L2561}}return i|0}else{if(!l){break}cG(q|0,0,t<<2|0)}}while(0);t=c[d>>2]|0;L2576:do{if((t|0)>0){l=0;y=0.0;w=t;while(1){L2579:do{if((l|0)<(w|0)){e=0;h=l;k=w;while(1){if((e|0)>=(c[b>>2]|0)){z=h;A=k;break L2579}f=m+(h<<2)|0;g[f>>2]=y+ +g[f>>2];f=h+1|0;n=c[d>>2]|0;if((f|0)>=(n|0)){z=f;A=n;break L2579}e=e+1|0;h=f;k=n}}else{z=l;A=w}}while(0);if((z|0)<(A|0)){l=z;y=+g[m+(z-1<<2)>>2];w=A}else{B=A;break L2576}}}else{B=t}}while(0);g[m+(B<<2)>>2]=j;i=q;return i|0}function ce(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0.0,s=0.0,t=0.0,u=0,v=0;f=b;h=c[b+20>>2]|0;i=a+28|0;j=c[i>>2]|0;k=b+8|0;if((c[(c[k>>2]|0)+(j<<2)>>2]|0)==0){l=c[(c[(c[(c[a+64>>2]|0)+4>>2]|0)+28>>2]|0)+(j<<2)>>2]|0;a=(l|0)/2&-1;m=b;n=c[m>>2]|0;o=h+4|0;p=+(c[o>>2]|0)*.5;q=cz((a<<2)+4|0)|0;c[(c[k>>2]|0)+(j<<2)>>2]=q;if((l|0)>1){r=+W(+(p*p*1.8499999754340024e-8));s=+(a|0);t=+(n|0)/(p*9999999747378752.0e-20+(r*2.240000009536743+ +W(+(p*.0007399999885819852))*13.100000381469727));n=0;while(1){p=+(n|0)*(+(c[o>>2]|0)*.5/s);r=+W(+(p*.0007399999885819852))*13.100000381469727;l=~~+N(+(t*(p*9999999747378752.0e-20+(r+ +W(+(p*p*1.8499999754340024e-8))*2.240000009536743))));q=c[m>>2]|0;c[(c[(c[k>>2]|0)+(j<<2)>>2]|0)+(n<<2)>>2]=(l|0)<(q|0)?l:q-1|0;q=n+1|0;if((q|0)<(a|0)){n=q}else{break}}u=(a|0)>1?a:1}else{u=0}c[(c[(c[k>>2]|0)+(j<<2)>>2]|0)+(u<<2)>>2]=-1;c[f+12+(j<<2)>>2]=a}if((d|0)==0){cG(e|0,0,c[(b+12|0)+(c[i>>2]<<2)>>2]<<2|0);v=0;return v|0}else{a=d;d=c[b+4>>2]|0;j=c[i>>2]|0;cr(e,c[(c[k>>2]|0)+(j<<2)>>2]|0,c[(b+12|0)+(j<<2)>>2]|0,c[b>>2]|0,a,d,+g[a+(d<<2)>>2],+(c[h+16>>2]|0));v=1;return v|0}return 0}function cf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0.0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0.0,a0=0.0,a1=0.0,a2=0,a3=0,a4=0,a5=0.0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0;f=i;i=i+3584|0;h=f|0;j=h;k=i;i=i+260|0;i=i+7>>3<<3;l=i;i=i+260|0;i=i+7>>3<<3;m=i;i=i+260|0;i=i+7>>3<<3;n=m;o=i;i=i+260|0;i=i+7>>3<<3;p=i;i=i+260|0;i=i+7>>3<<3;q=p;r=i;i=i+4|0;i=i+7>>3<<3;s=i;i=i+4|0;i=i+7>>3<<3;t=i;i=i+4|0;i=i+7>>3<<3;u=i;i=i+4|0;i=i+7>>3<<3;v=i;i=i+4|0;i=i+7>>3<<3;w=i;i=i+4|0;i=i+7>>3<<3;x=c[b+1296>>2]|0;y=c[b+1288>>2]|0;z=c[b+1284>>2]|0;A=(z|0)>0;do{if(A){B=0;while(1){c[k+(B<<2)>>2]=-200;C=B+1|0;if((C|0)<(z|0)){B=C}else{break}}if(A){D=0}else{break}while(1){c[l+(D<<2)>>2]=-200;B=D+1|0;if((B|0)<(z|0)){D=B}else{break}}if(!A){break}cG(n|0,0,z<<2|0);B=0;while(1){c[o+(B<<2)>>2]=1;C=B+1|0;if((C|0)<(z|0)){B=C}else{break}}if(!A){break}cG(q|0,-1|0,z<<2|0)}}while(0);L2616:do{if((z|0)==0){cG(j|0,0,56);c[h>>2]=0;c[h+4>>2]=y;q=y-1|0;L2636:do{if((q|0)<0){E=0;F=0;G=0;H=0;I=0;J=0;K=0;L=0;M=0;N=0;O=0;P=0}else{A=x+1112|0;n=0;D=0;B=0;C=0;Q=0;R=0;S=0;T=0;U=0;V=0;W=0;X=0;Y=0;while(1){Z=+g[e+(n<<2)>>2];_=~~(Z*7.314285755157471+1023.5);do{if((_|0)>1023){aa=1023;ab=1812}else{ac=(_|0)<0?0:_;if((ac|0)==0){ad=Y;ae=X;af=W;ag=V;ah=U;ai=T;aj=S;ak=R;al=Q;am=C;an=B;ao=D;break}else{aa=ac;ab=1812;break}}}while(0);do{if((ab|0)==1812){ab=0;if(+g[d+(n<<2)>>2]+ +g[A>>2]<Z){_=$(n,n)+V|0;ac=$(aa,aa)+W|0;ad=Y+1|0;ae=$(aa,n)+X|0;af=ac;ag=_;ah=aa+U|0;ai=n+T|0;aj=S;ak=R;al=Q;am=C;an=B;ao=D;break}else{_=$(n,n)+C|0;ac=$(aa,aa)+Q|0;ad=Y;ae=X;af=W;ag=V;ah=U;ai=T;aj=S+1|0;ak=$(aa,n)+R|0;al=ac;am=_;an=aa+B|0;ao=n+D|0;break}}}while(0);_=n+1|0;if((_|0)>(q|0)){E=ao;F=an;G=am;H=al;I=ak;J=aj;K=ai;L=ah;M=ag;N=af;O=ae;P=ad;break L2636}else{n=_;D=ao;B=an;C=am;Q=al;R=ak;S=aj;T=ai;U=ah;V=ag;W=af;X=ae;Y=ad}}}}while(0);c[h+8>>2]=E;c[h+12>>2]=F;c[h+16>>2]=G;c[h+20>>2]=H;c[h+24>>2]=I;c[h+28>>2]=J;c[h+32>>2]=K;c[h+36>>2]=L;c[h+40>>2]=M;c[h+44>>2]=N;c[h+48>>2]=O;c[h+52>>2]=P;ap=J}else{q=z-1|0;if((q|0)<=0){aq=0;i=f;return aq|0}Y=y-1|0;X=x+1112|0;W=0;V=0;U=c[b>>2]|0;while(1){T=V+1|0;S=c[b+(T<<2)>>2]|0;R=h+(V*56&-1)|0;cG(R|0,0,56);c[R>>2]=U;c[h+(V*56&-1)+4>>2]=S;R=(S|0)<(y|0)?S:Y;L2623:do{if((R|0)<(U|0)){ar=0;as=0;at=0;au=0;av=0;aw=0;ax=0;ay=0;az=0;aA=0;aB=0;aD=0}else{Q=U;C=0;B=0;D=0;n=0;A=0;_=0;ac=0;aE=0;aF=0;aG=0;aH=0;aI=0;while(1){Z=+g[e+(Q<<2)>>2];aJ=~~(Z*7.314285755157471+1023.5);do{if((aJ|0)>1023){aK=1023;ab=1820}else{aL=(aJ|0)<0?0:aJ;if((aL|0)==0){aM=aI;aN=aH;aO=aG;aP=aF;aQ=aE;aR=ac;aS=_;aT=A;aU=n;aV=D;aW=B;aX=C;break}else{aK=aL;ab=1820;break}}}while(0);do{if((ab|0)==1820){ab=0;if(+g[d+(Q<<2)>>2]+ +g[X>>2]<Z){aJ=$(Q,Q)+aF|0;aL=$(aK,aK)+aG|0;aM=aI+1|0;aN=$(aK,Q)+aH|0;aO=aL;aP=aJ;aQ=aK+aE|0;aR=Q+ac|0;aS=_;aT=A;aU=n;aV=D;aW=B;aX=C;break}else{aJ=$(Q,Q)+D|0;aL=$(aK,aK)+n|0;aM=aI;aN=aH;aO=aG;aP=aF;aQ=aE;aR=ac;aS=_+1|0;aT=$(aK,Q)+A|0;aU=aL;aV=aJ;aW=aK+B|0;aX=Q+C|0;break}}}while(0);aJ=Q+1|0;if((aJ|0)>(R|0)){ar=aX;as=aW;at=aV;au=aU;av=aT;aw=aS;ax=aR;ay=aQ;az=aP;aA=aO;aB=aN;aD=aM;break L2623}else{Q=aJ;C=aX;B=aW;D=aV;n=aU;A=aT;_=aS;ac=aR;aE=aQ;aF=aP;aG=aO;aH=aN;aI=aM}}}}while(0);c[h+(V*56&-1)+8>>2]=ar;c[h+(V*56&-1)+12>>2]=as;c[h+(V*56&-1)+16>>2]=at;c[h+(V*56&-1)+20>>2]=au;c[h+(V*56&-1)+24>>2]=av;c[h+(V*56&-1)+28>>2]=aw;c[h+(V*56&-1)+32>>2]=ax;c[h+(V*56&-1)+36>>2]=ay;c[h+(V*56&-1)+40>>2]=az;c[h+(V*56&-1)+44>>2]=aA;c[h+(V*56&-1)+48>>2]=aB;c[h+(V*56&-1)+52>>2]=aD;R=aw+W|0;if((T|0)<(q|0)){W=R;V=T;U=S}else{ap=R;break L2616}}}}while(0);if((ap|0)==0){aq=0;i=f;return aq|0}c[r>>2]=-200;c[s>>2]=-200;cg(h|0,z-1|0,r,s,x);ap=c[r>>2]|0;r=k|0;c[r>>2]=ap;aw=l|0;c[aw>>2]=ap;ap=c[s>>2]|0;s=l+4|0;c[s>>2]=ap;aD=k+4|0;c[aD>>2]=ap;ap=(z|0)>2;L2653:do{if(ap){aB=x+1112|0;aA=x+1096|0;az=x+1100|0;ay=x+1104|0;ax=2;L2655:while(1){av=c[b+520+(ax<<2)>>2]|0;au=c[m+(av<<2)>>2]|0;at=c[o+(av<<2)>>2]|0;as=p+(au<<2)|0;L2657:do{if((c[as>>2]|0)!=(at|0)){ar=c[b+520+(au<<2)>>2]|0;aM=c[b+520+(at<<2)>>2]|0;c[as>>2]=at;aN=c[x+836+(au<<2)>>2]|0;aO=c[x+836+(at<<2)>>2]|0;aP=c[k+(au<<2)>>2]|0;aQ=l+(au<<2)|0;aR=c[aQ>>2]|0;do{if((aP|0)<0){aY=aR}else{if((aR|0)<0){aY=aP;break}aY=aR+aP>>1}}while(0);aP=k+(at<<2)|0;aR=c[aP>>2]|0;aS=c[l+(at<<2)>>2]|0;do{if((aR|0)<0){aZ=aS}else{if((aS|0)<0){aZ=aR;break}aZ=aS+aR>>1}}while(0);if((aY|0)==-1|(aZ|0)==-1){break L2655}aR=aZ-aY|0;aS=aO-aN|0;aT=(aR|0)/(aS|0)&-1;aU=aR>>31|1;Z=+g[e+(aN<<2)>>2];aV=~~(Z*7.314285755157471+1023.5);if((aV|0)>1023){a_=1023}else{a_=(aV|0)<0?0:aV}aV=$(aT,aS);aW=((aR|0)>-1?aR:-aR|0)-((aV|0)>-1?aV:-aV|0)|0;aV=aY-a_|0;aR=$(aV,aV);a$=+g[aB>>2];do{if(+g[d+(aN<<2)>>2]+a$<Z){ab=1842}else{a0=+(aY|0);a1=+(a_|0);if(a0+ +g[aA>>2]<a1){break}if(a0- +g[az>>2]>a1){break}else{ab=1842;break}}}while(0);L2674:do{if((ab|0)==1842){ab=0;aV=aN+1|0;L2676:do{if((aV|0)<(aO|0)){aX=aY;aK=0;y=aR;J=1;P=aV;while(1){O=aK+aW|0;N=(O|0)<(aS|0);M=O-(N?0:aS)|0;O=(aX+aT|0)+(N?0:aU)|0;Z=+g[e+(P<<2)>>2];N=~~(Z*7.314285755157471+1023.5);if((N|0)>1023){a2=1023}else{a2=(N|0)<0?0:N}N=O-a2|0;L=$(N,N)+y|0;N=J+1|0;if(!(a$+ +g[d+(P<<2)>>2]<Z|(a2|0)==0)){Z=+(O|0);a1=+(a2|0);if(Z+ +g[aA>>2]<a1){break L2674}if(Z- +g[az>>2]>a1){break L2674}}K=P+1|0;if((K|0)<(aO|0)){aX=O;aK=M;y=L;J=N;P=K}else{a3=L;a4=N;break L2676}}}else{a3=aR;a4=1}}while(0);a1=+g[aA>>2];Z=+(a4|0);a0=+g[ay>>2];do{if(a1*a1/Z<=a0){a5=+g[az>>2];if(a5*a5/Z>a0){break}if(+((a3|0)/(a4|0)&-1|0)>a0){break L2674}}}while(0);c[k+(ax<<2)>>2]=-200;c[l+(ax<<2)>>2]=-200;break L2657}}while(0);c[t>>2]=-200;c[u>>2]=-200;c[v>>2]=-200;c[w>>2]=-200;aR=cg(h+(ar*56&-1)|0,av-ar|0,t,u,x)|0;aO=cg(h+(av*56&-1)|0,aM-av|0,v,w,x)|0;aU=(aR|0)!=0;if(aU){c[t>>2]=aY;c[u>>2]=c[v>>2]|0}do{if((aO|0)!=0){c[v>>2]=c[u>>2]|0;c[w>>2]=aZ;if(!aU){break}c[k+(ax<<2)>>2]=-200;c[l+(ax<<2)>>2]=-200;break L2657}}while(0);aU=c[t>>2]|0;c[aQ>>2]=aU;if((au|0)==0){c[r>>2]=aU}aU=c[u>>2]|0;c[k+(ax<<2)>>2]=aU;aO=c[v>>2]|0;c[l+(ax<<2)>>2]=aO;aM=c[w>>2]|0;c[aP>>2]=aM;if((at|0)==1){c[s>>2]=aM}if((aU&aO|0)<=-1){break}L2706:do{if((av|0)>0){aO=av;while(1){aU=aO-1|0;aM=o+(aU<<2)|0;if((c[aM>>2]|0)!=(at|0)){break L2706}c[aM>>2]=ax;if((aU|0)>0){aO=aU}else{break L2706}}}}while(0);aP=av+1|0;if((aP|0)<(z|0)){a6=aP}else{break}while(1){aP=m+(a6<<2)|0;if((c[aP>>2]|0)!=(au|0)){break L2657}c[aP>>2]=ax;aP=a6+1|0;if((aP|0)<(z|0)){a6=aP}else{break L2657}}}}while(0);au=ax+1|0;if((au|0)<(z|0)){ax=au}else{break L2653}}aC(1);return 0}}while(0);a6=(z<<2)+7&-8;m=a+72|0;o=c[m>>2]|0;w=a+76|0;v=a+68|0;u=c[v>>2]|0;if((o+a6|0)>(c[w>>2]|0)){if((u|0)!=0){t=cz(8)|0;aZ=a+80|0;c[aZ>>2]=(c[aZ>>2]|0)+(c[m>>2]|0)|0;aZ=a+84|0;c[t+4>>2]=c[aZ>>2]|0;c[t>>2]=c[v>>2]|0;c[aZ>>2]=t}c[w>>2]=a6;w=cz(a6)|0;c[v>>2]=w;c[m>>2]=0;a7=0;a8=w}else{a7=o;a8=u}c[m>>2]=a7+a6|0;a6=a8+a7|0;m=c[r>>2]|0;r=c[aw>>2]|0;do{if((m|0)<0){a9=r}else{if((r|0)<0){a9=m;break}a9=r+m>>1}}while(0);c[a6>>2]=a9;a9=c[aD>>2]|0;aD=c[s>>2]|0;do{if((a9|0)<0){ba=aD}else{if((aD|0)<0){ba=a9;break}ba=aD+a9>>1}}while(0);c[a8+(a7+4|0)>>2]=ba;if(ap){bb=2}else{aq=a6;i=f;return aq|0}while(1){ap=bb-2|0;ba=c[b+1032+(ap<<2)>>2]|0;a7=c[b+780+(ap<<2)>>2]|0;ap=c[x+836+(ba<<2)>>2]|0;a8=c[a6+(ba<<2)>>2]&32767;ba=(c[a6+(a7<<2)>>2]&32767)-a8|0;a9=(c[x+836+(a7<<2)>>2]|0)-ap|0;a7=($((ba|0)>-1?ba:-ba|0,(c[x+836+(bb<<2)>>2]|0)-ap|0)|0)/(a9|0)&-1;a9=((ba|0)<0?-a7|0:a7)+a8|0;a8=c[k+(bb<<2)>>2]|0;a7=c[l+(bb<<2)>>2]|0;do{if((a8|0)<0){bc=a7}else{if((a7|0)<0){bc=a8;break}bc=a7+a8>>1}}while(0);if((bc|0)<0|(a9|0)==(bc|0)){c[a6+(bb<<2)>>2]=a9|32768}else{c[a6+(bb<<2)>>2]=bc}a8=bb+1|0;if((a8|0)<(z|0)){bb=a8}else{aq=a6;break}}i=f;return aq|0}function cg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0,O=0,P=0,Q=0,R=0,S=0;h=c[a>>2]|0;i=c[a+((b-1|0)*56&-1)+4>>2]|0;L2745:do{if((b|0)>0){j=+g[f+1108>>2];k=0.0;l=0;m=0.0;n=0.0;o=0.0;p=0.0;while(1){q=c[a+(l*56&-1)+52>>2]|0;r=c[a+(l*56&-1)+28>>2]|0;s=j*+(r+q|0)/+(r+1|0)+1.0;t=p+(+(c[a+(l*56&-1)+32>>2]|0)+s*+(c[a+(l*56&-1)+8>>2]|0));u=o+(+(c[a+(l*56&-1)+36>>2]|0)+s*+(c[a+(l*56&-1)+12>>2]|0));v=n+(+(c[a+(l*56&-1)+40>>2]|0)+s*+(c[a+(l*56&-1)+16>>2]|0));w=m+(+(c[a+(l*56&-1)+48>>2]|0)+s*+(c[a+(l*56&-1)+24>>2]|0));x=k+(+(q|0)+ +(r|0)*s);r=l+1|0;if((r|0)<(b|0)){k=x;l=r;m=w;n=v;o=u;p=t}else{y=x;z=w;A=v;B=u;C=t;break L2745}}}else{y=0.0;z=0.0;A=0.0;B=0.0;C=0.0}}while(0);b=c[d>>2]|0;if((b|0)>-1){p=+($(h,h)|0)+A;D=+(h|0)+C;E=B+ +(b|0);F=p;G=z+ +($(b,h)|0);H=y+1.0}else{D=C;E=B;F=A;G=z;H=y}b=c[e>>2]|0;if((b|0)>-1){y=+($(i,i)|0)+F;I=+(i|0)+D;J=E+ +(b|0);K=y;L=G+ +($(b,i)|0);M=H+1.0}else{I=D;J=E;K=F;L=G;M=H}H=M*K-I*I;if(H<=0.0){c[d>>2]=0;c[e>>2]=0;N=1;return N|0}G=(K*J-L*I)/H;K=(M*L-J*I)/H;c[d>>2]=~~+at(+(G+ +(h|0)*K));h=~~+at(+(G+ +(i|0)*K));c[e>>2]=h;i=c[d>>2]|0;if((i|0)>1023){c[d>>2]=1023;O=c[e>>2]|0;P=1023}else{O=h;P=i}if((O|0)>1023){c[e>>2]=1023;Q=c[d>>2]|0;R=1023}else{Q=P;R=O}if((Q|0)<0){c[d>>2]=0;S=c[e>>2]|0}else{S=R}if((S|0)>=0){N=0;return N|0}c[e>>2]=0;N=0;return N|0}function ch(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=c[b+1284>>2]|0;if((d|0)==0|(e|0)==0){h=0;return h|0}b=(g<<2)+7&-8;i=a+72|0;j=c[i>>2]|0;k=a+76|0;l=a+68|0;m=c[l>>2]|0;if((j+b|0)>(c[k>>2]|0)){if((m|0)!=0){n=cz(8)|0;o=a+80|0;c[o>>2]=(c[o>>2]|0)+(c[i>>2]|0)|0;o=a+84|0;c[n+4>>2]=c[o>>2]|0;c[n>>2]=c[l>>2]|0;c[o>>2]=n}c[k>>2]=b;k=cz(b)|0;c[l>>2]=k;c[i>>2]=0;p=0;q=k}else{p=j;q=m}c[i>>2]=p+b|0;b=q+p|0;if((g|0)<=0){h=b;return h|0}p=65536-f|0;q=0;while(1){i=d+(q<<2)|0;m=$(c[i>>2]&32767,p);j=e+(q<<2)|0;k=(m+32768|0)+$(c[j>>2]&32767,f)>>16;m=b+(q<<2)|0;c[m>>2]=k;do{if((c[i>>2]&32768|0)!=0){if((c[j>>2]&32768|0)==0){break}c[m>>2]=k|32768}}while(0);k=q+1|0;if((k|0)<(g|0)){q=k}else{h=b;break}}return h|0}function ci(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;g=i;i=i+328|0;h=g|0;j=g+264|0;k=g+296|0;l=c[d+1296>>2]|0;m=d+1284|0;n=c[m>>2]|0;o=c[(c[(c[b+64>>2]|0)+4>>2]|0)+28>>2]|0;p=o+1824|0;q=c[o+2848>>2]|0;if((e|0)==0){cy(a,0,1);cG(f|0,0,((c[b+36>>2]|0)/2&-1)<<2|0);r=0;i=g;return r|0}L2798:do{if((n|0)>0){s=l+832|0;t=0;while(1){u=e+(t<<2)|0;v=c[u>>2]|0;w=v&32767;x=c[s>>2]|0;if((x|0)==4){y=w>>>4}else if((x|0)==2){y=w>>>3}else if((x|0)==3){y=(w>>>0)/12>>>0}else if((x|0)==1){y=w>>>2}else{y=w}c[u>>2]=v&32768|y;v=t+1|0;if((v|0)<(n|0)){t=v}else{break L2798}}}}while(0);y=h|0;c[y>>2]=c[e>>2]|0;t=h+4|0;c[t>>2]=c[e+4>>2]|0;s=d+1292|0;L2809:do{if((n|0)>2){v=2;while(1){u=v-2|0;w=c[d+1032+(u<<2)>>2]|0;x=c[d+780+(u<<2)>>2]|0;u=c[l+836+(w<<2)>>2]|0;z=e+(w<<2)|0;w=e+(x<<2)|0;A=c[z>>2]&32767;B=(c[w>>2]&32767)-A|0;C=(c[l+836+(x<<2)>>2]|0)-u|0;x=($((B|0)>-1?B:-B|0,(c[l+836+(v<<2)>>2]|0)-u|0)|0)/(C|0)&-1;C=((B|0)<0?-x|0:x)+A|0;x=e+(v<<2)|0;B=c[x>>2]|0;if((B&32768|0)!=0|(C|0)==(B|0)){c[x>>2]=C|32768;c[h+(v<<2)>>2]=0}else{x=(c[s>>2]|0)-C|0;u=(x|0)<(C|0)?x:C;x=B-C|0;do{if((x|0)<0){if((x|0)<(-u|0)){D=u+(x^-1)|0;break}else{D=x<<1^-1;break}}else{if((x|0)<(u|0)){D=x<<1;break}else{D=u+x|0;break}}}while(0);c[h+(v<<2)>>2]=D;c[z>>2]=A;c[w>>2]=c[w>>2]&32767}x=v+1|0;if((x|0)<(n|0)){v=x}else{break L2809}}}}while(0);cy(a,1,1);n=d+1308|0;c[n>>2]=(c[n>>2]|0)+1|0;n=(c[s>>2]|0)-1|0;D=(n|0)==0;L2827:do{if(D){E=0;F=d+1304|0;G=c[y>>2]|0}else{v=n;x=0;while(1){H=x+1|0;u=v>>>1;if((u|0)==0){break}else{v=u;x=H}}x=d+1304|0;c[x>>2]=(c[x>>2]|0)+(H<<1)|0;v=c[y>>2]|0;if(D){E=0;F=x;G=v;break}else{I=n;J=0}while(1){u=J+1|0;C=I>>>1;if((C|0)==0){E=u;F=x;G=v;break L2827}else{I=C;J=u}}}}while(0);cy(a,G,E);E=c[t>>2]|0;t=(c[s>>2]|0)-1|0;L2835:do{if((t|0)==0){K=0}else{s=t;G=0;while(1){J=G+1|0;I=s>>>1;if((I|0)==0){K=J;break L2835}else{s=I;G=J}}}}while(0);cy(a,E,K);K=l|0;L2839:do{if((c[K>>2]|0)>0){E=j;t=d+1300|0;G=2;s=0;while(1){J=c[l+4+(s<<2)>>2]|0;I=c[l+128+(J<<2)>>2]|0;n=c[l+192+(J<<2)>>2]|0;D=1<<n;cG(E|0,0,32);if((n|0)!=0){L2845:do{if((D|0)>0){y=0;while(1){H=c[l+320+(J<<5)+(y<<2)>>2]|0;if((H|0)<0){c[k+(y<<2)>>2]=1}else{c[k+(y<<2)>>2]=c[(c[p+(H<<2)>>2]|0)+4>>2]|0}H=y+1|0;if((H|0)<(D|0)){y=H}else{break L2845}}}}while(0);do{if((I|0)>0){w=0;A=0;z=0;while(1){y=h+(z+G<<2)|0;H=0;while(1){if((H|0)>=(D|0)){L=1971;break}if((c[y>>2]|0)<(c[k+(H<<2)>>2]|0)){L=1970;break}else{H=H+1|0}}if((L|0)==1970){L=0;y=j+(z<<2)|0;c[y>>2]=H;M=y}else if((L|0)==1971){L=0;M=j+(z<<2)|0}N=c[M>>2]<<A|w;y=z+1|0;if((y|0)<(I|0)){w=N;A=A+n|0;z=y}else{break}}if((N|0)<0){O=0;break}else{P=N;L=1974;break}}else{P=0;L=1974;break}}while(0);do{if((L|0)==1974){L=0;n=c[l+256+(J<<2)>>2]|0;D=q+(n*56&-1)+12|0;z=c[D>>2]|0;if((c[z+4>>2]|0)<=(P|0)){O=0;break}cy(a,c[(c[q+(n*56&-1)+20>>2]|0)+(P<<2)>>2]|0,c[(c[z+8>>2]|0)+(P<<2)>>2]|0);O=c[(c[(c[D>>2]|0)+8>>2]|0)+(P<<2)>>2]|0}}while(0);c[t>>2]=(c[t>>2]|0)+O|0}L2870:do{if((I|0)>0){D=0;while(1){z=c[l+320+(J<<5)+(c[j+(D<<2)>>2]<<2)>>2]|0;do{if((z|0)>-1){n=c[h+(D+G<<2)>>2]|0;if((n|0)>=(c[q+(z*56&-1)+4>>2]|0)){break}do{if((n|0)<0){Q=0}else{A=q+(z*56&-1)+12|0;w=c[A>>2]|0;if((c[w+4>>2]|0)<=(n|0)){Q=0;break}cy(a,c[(c[q+(z*56&-1)+20>>2]|0)+(n<<2)>>2]|0,c[(c[w+8>>2]|0)+(n<<2)>>2]|0);Q=c[(c[(c[A>>2]|0)+8>>2]|0)+(n<<2)>>2]|0}}while(0);c[F>>2]=(c[F>>2]|0)+Q|0}}while(0);z=D+1|0;if((z|0)<(I|0)){D=z}else{break L2870}}}}while(0);J=s+1|0;if((J|0)<(c[K>>2]|0)){G=I+G|0;s=J}else{break L2839}}}}while(0);K=l+832|0;Q=$(c[K>>2]|0,c[e>>2]|0);F=(c[o+(c[b+28>>2]<<2)>>2]|0)/2&-1;L2883:do{if((c[m>>2]|0)>1){o=1;q=0;a=0;h=Q;while(1){j=c[d+260+(o<<2)>>2]|0;O=c[e+(j<<2)>>2]|0;L2886:do{if((O&32767|0)==(O|0)){P=$(c[K>>2]|0,O);L=c[l+836+(j<<2)>>2]|0;N=P-h|0;M=L-a|0;k=(N|0)/(M|0)&-1;p=N>>31|1;s=$(k,M);G=((N|0)>-1?N:-N|0)-((s|0)>-1?s:-s|0)|0;s=(F|0)>(L|0)?L:F;if((s|0)>(a|0)){c[f+(a<<2)>>2]=h}N=a+1|0;if((N|0)<(s|0)){R=h;S=0;T=N}else{U=P;V=L;W=L;break}while(1){N=S+G|0;t=(N|0)<(M|0);E=(R+k|0)+(t?0:p)|0;c[f+(T<<2)>>2]=E;J=T+1|0;if((J|0)<(s|0)){R=E;S=N-(t?0:M)|0;T=J}else{U=P;V=L;W=L;break L2886}}}else{U=h;V=a;W=q}}while(0);j=o+1|0;if((j|0)<(c[m>>2]|0)){o=j;q=W;a=V;h=U}else{X=W;Y=U;break L2883}}}else{X=0;Y=Q}}while(0);Q=b+36|0;if((X|0)<((c[Q>>2]|0)/2&-1|0)){Z=X}else{r=1;i=g;return r|0}while(1){c[f+(Z<<2)>>2]=Y;X=Z+1|0;if((X|0)<((c[Q>>2]|0)/2&-1|0)){Z=X}else{r=1;break}}i=g;return r|0}function cj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=a+836|0;e=c[a+840>>2]|0;f=a;cy(b,c[f>>2]|0,5);L2901:do{if((c[f>>2]|0)>0){g=a+4|0;h=0;i=-1;while(1){j=g+(h<<2)|0;cy(b,c[j>>2]|0,4);k=c[j>>2]|0;l=(i|0)<(k|0)?k:i;k=h+1|0;if((k|0)<(c[f>>2]|0)){h=k;i=l}else{break}}i=l+1|0;if((i|0)<=0){break}h=a+128|0;g=a+192|0;k=a+256|0;j=a+320|0;m=0;while(1){cy(b,(c[h+(m<<2)>>2]|0)-1|0,3);n=g+(m<<2)|0;cy(b,c[n>>2]|0,2);if((c[n>>2]|0)==0){o=0}else{cy(b,c[k+(m<<2)>>2]|0,8);o=c[n>>2]|0}L2912:do{if((1<<o|0)>0){p=0;while(1){cy(b,(c[j+(m<<5)+(p<<2)>>2]|0)+1|0,8);q=p+1|0;if((q|0)<(1<<c[n>>2]|0)){p=q}else{break L2912}}}}while(0);n=m+1|0;if((n|0)<(i|0)){m=n}else{break L2901}}}}while(0);cy(b,(c[a+832>>2]|0)-1|0,2);o=(e|0)==0?0:e-1|0;L2917:do{if((o|0)==0){cy(b,0,4);r=0}else{e=o;l=0;while(1){s=l+1|0;m=e>>>1;if((m|0)==0){break}else{e=m;l=s}}cy(b,s,4);l=o;e=0;while(1){m=e+1|0;i=l>>>1;if((i|0)==0){r=m;break L2917}else{l=i;e=m}}}}while(0);o=c[f>>2]|0;if((o|0)<=0){return}s=a+4|0;e=a+128|0;a=0;l=0;m=0;i=o;while(1){o=(c[e+(c[s+(m<<2)>>2]<<2)>>2]|0)+a|0;if((l|0)<(o|0)){j=l;while(1){cy(b,c[d+(j+2<<2)>>2]|0,r);k=j+1|0;if((k|0)<(o|0)){j=k}else{break}}t=o;u=c[f>>2]|0}else{t=l;u=i}j=m+1|0;if((j|0)<(u|0)){a=o;l=t;m=j;i=u}else{break}}return}function ck(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;d=i;i=i+264|0;e=d|0;f=c[a+28>>2]|0;a=cB(1,1120)|0;g=cw(b,5)|0;h=a;c[h>>2]=g;L2937:do{if((g|0)>0){j=a+4|0;k=-1;l=0;while(1){m=cw(b,4)|0;c[j+(l<<2)>>2]=m;if((m|0)<0){break L2937}n=(k|0)<(m|0)?m:k;m=l+1|0;if((m|0)<(c[h>>2]|0)){k=n;l=m}else{break}}l=n+1|0;if((l|0)<=0){o=2041;break}k=a+128|0;j=a+192|0;m=a+256|0;p=f+24|0;q=a+320|0;r=0;while(1){c[k+(r<<2)>>2]=(cw(b,3)|0)+1|0;s=cw(b,2)|0;t=j+(r<<2)|0;c[t>>2]=s;if((s|0)<0){break L2937}if((s|0)==0){u=c[m+(r<<2)>>2]|0}else{s=cw(b,8)|0;c[m+(r<<2)>>2]=s;u=s}if((u|0)<0){o=2055;break L2937}if((u|0)<(c[p>>2]|0)){v=0}else{o=2055;break L2937}while(1){if((v|0)>=(1<<c[t>>2]|0)){break}s=cw(b,8)|0;w=s-1|0;c[q+(r<<5)+(v<<2)>>2]=w;if((s|0)<0){break L2937}if((w|0)>=(c[p>>2]|0)){o=2055;break L2937}v=v+1|0}t=r+1|0;if((t|0)<(l|0)){r=t}else{o=2041;break L2937}}}else{o=2041}}while(0);L2958:do{if((o|0)==2041){c[a+832>>2]=(cw(b,2)|0)+1|0;v=cw(b,4)|0;if((v|0)<0){break}do{if((c[h>>2]|0)>0){u=a+4|0;f=a+128|0;n=a+836|0;g=n;r=1<<v;l=0;p=0;q=0;while(1){x=(c[f+(c[u+(q<<2)>>2]<<2)>>2]|0)+l|0;if((x|0)>63){o=2055;break L2958}else{y=p}while(1){if((y|0)>=(x|0)){break}m=cw(b,v)|0;c[g+(y+2<<2)>>2]=m;if((m|0)>-1&(m|0)<(r|0)){y=y+1|0}else{break L2958}}m=q+1|0;if((m|0)<(c[h>>2]|0)){l=x;p=y;q=m}else{break}}q=x+2|0;p=n;c[p>>2]=0;c[a+840>>2]=r;if((q|0)>0){z=q;A=p;o=2050;break}else{B=q;break}}else{q=a+836|0;c[q>>2]=0;c[a+840>>2]=1<<v;z=2;A=q;o=2050;break}}while(0);L2971:do{if((o|0)==2050){v=0;while(1){c[e+(v<<2)>>2]=A+(v<<2)|0;q=v+1|0;if((q|0)<(z|0)){v=q}else{B=z;break L2971}}}}while(0);aA(e|0,B|0,4,20);v=1;while(1){if((v|0)>=(B|0)){C=a;break}if((c[c[e+(v-1<<2)>>2]>>2]|0)==(c[c[e+(v<<2)>>2]>>2]|0)){o=2055;break L2958}else{v=v+1|0}}i=d;return C|0}}while(0);do{if((o|0)==2055){if((a|0)==0){C=0}else{break}i=d;return C|0}}while(0);cG(a|0,0,1120);cA(a);C=0;i=d;return C|0}function cl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;a=i;i=i+264|0;d=a|0;e=cB(1,1312)|0;c[e+1296>>2]=b;f=b+836|0;g=f;h=e+1288|0;c[h>>2]=c[b+840>>2]|0;j=c[b>>2]|0;do{if((j|0)>0){k=b+4|0;l=b+128|0;m=0;n=0;while(1){o=(c[l+(c[k+(n<<2)>>2]<<2)>>2]|0)+m|0;p=n+1|0;if((p|0)<(j|0)){m=o;n=p}else{break}}n=o+2|0;c[e+1284>>2]=n;if((n|0)>0){q=o;r=n;s=2067;break}aA(d|0,n|0,4,20);t=o;break}else{c[e+1284>>2]=2;q=0;r=2;s=2067;break}}while(0);L2993:do{if((s|0)==2067){o=f;j=0;while(1){c[d+(j<<2)>>2]=o+(j<<2)|0;n=j+1|0;if((n|0)<(r|0)){j=n}else{break}}aA(d|0,r|0,4,20);j=f;o=e+260|0;n=0;while(1){c[o+(n<<2)>>2]=(c[d+(n<<2)>>2]|0)-j>>2;m=n+1|0;if((m|0)<(r|0)){n=m}else{break}}n=e+260|0;j=e+520|0;o=0;while(1){c[j+(c[n+(o<<2)>>2]<<2)>>2]=o;m=o+1|0;if((m|0)<(r|0)){o=m}else{break}}o=e+260|0;n=e;j=0;while(1){c[n+(j<<2)>>2]=c[g+(c[o+(j<<2)>>2]<<2)>>2]|0;m=j+1|0;if((m|0)<(r|0)){j=m}else{t=q;break L2993}}}}while(0);q=c[b+832>>2]|0;if((q|0)==1){c[e+1292>>2]=256}else if((q|0)==2){c[e+1292>>2]=128}else if((q|0)==3){c[e+1292>>2]=86}else if((q|0)==4){c[e+1292>>2]=64}if((t|0)<=0){i=a;return e|0}q=e+1032|0;b=e+780|0;r=0;while(1){d=r+2|0;f=c[g+(d<<2)>>2]|0;L3018:do{if((d|0)>0){s=0;j=1;o=0;n=c[h>>2]|0;m=0;while(1){k=c[g+(m<<2)>>2]|0;l=(k|0)>(o|0)&(k|0)<(f|0);p=l?m:s;u=(k|0)<(n|0)&(k|0)>(f|0);v=u?m:j;w=m+1|0;if((w|0)<(d|0)){s=p;j=v;o=l?k:o;n=u?k:n;m=w}else{x=p;y=v;break L3018}}}else{x=0;y=1}}while(0);c[q+(r<<2)>>2]=x;c[b+(r<<2)>>2]=y;d=r+1|0;if((d|0)<(t|0)){r=d}else{break}}i=a;return e|0}function cm(a){a=a|0;if((a|0)==0){return}cG(a|0,0,1120);cA(a);return}function cn(a){a=a|0;if((a|0)==0){return}cG(a|0,0,1312);cA(a);return}function co(a,b){a=a|0;b=b|0;return(c[c[a>>2]>>2]|0)-(c[c[b>>2]>>2]|0)|0}function cp(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=c[b+1296>>2]|0;e=c[(c[(c[(c[a+64>>2]|0)+4>>2]|0)+28>>2]|0)+2848>>2]|0;f=a+4|0;if((cw(f,1)|0)!=1){g=0;return g|0}h=b+1284|0;i=(c[h>>2]<<2)+7&-8;j=a+72|0;k=c[j>>2]|0;l=a+76|0;m=a+68|0;n=c[m>>2]|0;if((i+k|0)>(c[l>>2]|0)){if((n|0)!=0){o=cz(8)|0;p=a+80|0;c[p>>2]=(c[p>>2]|0)+(c[j>>2]|0)|0;p=a+84|0;c[o+4>>2]=c[p>>2]|0;c[o>>2]=c[m>>2]|0;c[p>>2]=o}c[l>>2]=i;l=cz(i)|0;c[m>>2]=l;c[j>>2]=0;q=0;r=l}else{q=k;r=n}n=r+q|0;c[j>>2]=q+i|0;i=n;j=b+1292|0;k=(c[j>>2]|0)-1|0;L3045:do{if((k|0)==0){s=0}else{l=k;m=0;while(1){o=m+1|0;p=l>>>1;if((p|0)==0){s=o;break L3045}else{l=p;m=o}}}}while(0);c[i>>2]=cw(f,s)|0;s=(c[j>>2]|0)-1|0;L3049:do{if((s|0)==0){t=0}else{k=s;m=0;while(1){l=m+1|0;o=k>>>1;if((o|0)==0){t=l;break L3049}else{k=o;m=l}}}}while(0);c[r+(q+4|0)>>2]=cw(f,t)|0;t=d|0;L3053:do{if((c[t>>2]|0)>0){q=2;r=0;L3054:while(1){s=c[d+4+(r<<2)>>2]|0;m=c[d+128+(s<<2)>>2]|0;k=c[d+192+(s<<2)>>2]|0;l=1<<k;if((k|0)==0){u=0}else{o=c[d+256+(s<<2)>>2]|0;if((c[e+(o*56&-1)+8>>2]|0)<=0){g=0;v=2144;break}p=b6(e+(o*56&-1)|0,f)|0;if((p|0)<=-1){g=0;v=2140;break}a=c[(c[e+(o*56&-1)+24>>2]|0)+(p<<2)>>2]|0;if((a|0)==-1){g=0;v=2142;break}else{u=a}}L3061:do{if((m|0)>0){a=l-1|0;p=u;w=0;while(1){o=c[d+320+(s<<5)+((p&a)<<2)>>2]|0;x=p>>k;if((o|0)>-1){if((c[e+(o*56&-1)+8>>2]|0)<=0){v=2121;break L3054}y=b6(e+(o*56&-1)|0,f)|0;if((y|0)<=-1){v=2121;break L3054}z=c[(c[e+(o*56&-1)+24>>2]|0)+(y<<2)>>2]|0;c[i+(w+q<<2)>>2]=z;if((z|0)==-1){g=0;v=2145;break L3054}}else{c[i+(w+q<<2)>>2]=0}z=w+1|0;if((z|0)<(m|0)){p=x;w=z}else{break L3061}}}}while(0);k=r+1|0;if((k|0)<(c[t>>2]|0)){q=m+q|0;r=k}else{break L3053}}if((v|0)==2144){return g|0}else if((v|0)==2145){return g|0}else if((v|0)==2121){c[i+(w+q<<2)>>2]=-1;g=0;return g|0}else if((v|0)==2142){return g|0}else if((v|0)==2140){return g|0}}}while(0);if((c[h>>2]|0)<=2){g=n;return g|0}v=b+1032|0;w=b+780|0;b=2;while(1){t=b-2|0;e=v+(t<<2)|0;f=c[e>>2]|0;u=c[d+836+(f<<2)>>2]|0;r=w+(t<<2)|0;t=c[r>>2]|0;k=c[i+(f<<2)>>2]&32767;f=(c[i+(t<<2)>>2]&32767)-k|0;s=(c[d+836+(t<<2)>>2]|0)-u|0;t=($((f|0)>-1?f:-f|0,(c[d+836+(b<<2)>>2]|0)-u|0)|0)/(s|0)&-1;s=((f|0)<0?-t|0:t)+k|0;k=(c[j>>2]|0)-s|0;t=i+(b<<2)|0;f=c[t>>2]|0;if((f|0)==0){c[t>>2]=s|32768}else{do{if((f|0)<(((k|0)<(s|0)?k:s)<<1|0)){if((f&1|0)==0){A=f>>1;break}else{A=-(f+1>>1)|0;break}}else{if((k|0)>(s|0)){A=f-s|0;break}else{A=f-k^-1;break}}}while(0);c[t>>2]=A+s&32767;k=i+(c[e>>2]<<2)|0;c[k>>2]=c[k>>2]&32767;k=i+(c[r>>2]<<2)|0;c[k>>2]=c[k>>2]&32767}k=b+1|0;if((k|0)<(c[h>>2]|0)){b=k}else{g=n;break}}return g|0}function cq(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0.0;f=c[b+1296>>2]|0;h=(c[(c[(c[(c[a+64>>2]|0)+4>>2]|0)+28>>2]|0)+(c[a+28>>2]<<2)>>2]|0)/2&-1;if((d|0)==0){cG(e|0,0,h<<2|0);i=0;return i|0}a=d;d=f+832|0;j=$(c[d>>2]|0,c[a>>2]|0);if((j|0)<0){k=0}else{k=(j|0)>255?255:j}j=b+1284|0;L3108:do{if((c[j>>2]|0)>1){l=b+260|0;m=1;n=0;o=0;p=k;while(1){q=c[l+(m<<2)>>2]|0;r=c[a+(q<<2)>>2]|0;L3112:do{if((r&32767|0)==(r|0)){s=c[f+836+(q<<2)>>2]|0;t=$(c[d>>2]|0,r);if((t|0)<0){u=0}else{u=(t|0)>255?255:t}t=u-p|0;v=s-o|0;w=(t|0)/(v|0)&-1;x=t>>31|1;y=$(w,v);z=((t|0)>-1?t:-t|0)-((y|0)>-1?y:-y|0)|0;y=(h|0)>(s|0)?s:h;if((y|0)>(o|0)){t=e+(o<<2)|0;g[t>>2]=+g[56544+(p<<2)>>2]*+g[t>>2]}t=o+1|0;if((t|0)<(y|0)){A=p;B=0;C=t}else{D=u;E=s;F=s;break}while(1){t=B+z|0;G=(t|0)<(v|0);H=(A+w|0)+(G?0:x)|0;I=e+(C<<2)|0;g[I>>2]=+g[56544+(H<<2)>>2]*+g[I>>2];I=C+1|0;if((I|0)<(y|0)){A=H;B=t-(G?0:v)|0;C=I}else{D=u;E=s;F=s;break L3112}}}else{D=p;E=o;F=n}}while(0);r=m+1|0;if((r|0)<(c[j>>2]|0)){m=r;n=F;o=E;p=D}else{J=F;K=D;break L3108}}}else{J=0;K=k}}while(0);if((J|0)>=(h|0)){i=1;return i|0}L=+g[56544+(K<<2)>>2];K=J;while(1){J=e+(K<<2)|0;g[J>>2]=L*+g[J>>2];J=K+1|0;if((J|0)<(h|0)){K=J}else{i=1;break}}return i|0}function cr(a,b,d,e,f,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;i=+i;j=+j;var k=0.0,l=0,m=0.0,n=0,o=0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0;k=3.141592653589793/+(e|0);L3131:do{if((h|0)>0){e=0;while(1){l=f+(e<<2)|0;g[l>>2]=+R(+(+g[l>>2]))*2.0;l=e+1|0;if((l|0)<(h|0)){e=l}else{break L3131}}}}while(0);if((d|0)<=0){return}e=(h|0)>1;m=i;i=j;l=0;while(1){n=c[b+(l<<2)>>2]|0;j=+R(+(k*+(n|0)))*2.0;L3140:do{if(e){o=1;p=.5;q=.5;while(1){r=q*(j- +g[f+(o-1<<2)>>2]);s=p*(j- +g[f+(o<<2)>>2]);t=o+2|0;if((t|0)<(h|0)){o=t;p=s;q=r}else{u=t;v=s;w=r;break L3140}}}else{u=1;v=.5;w=.5}}while(0);if((u|0)==(h|0)){q=w*(j- +g[f+(h-1<<2)>>2]);x=q*q;y=4.0-j*j}else{x=w*(j+2.0)*w;y=2.0-j}q=+Y(+((m/+P(+(x+v*v*y))-i)*.1151292473077774));o=a+(l<<2)|0;g[o>>2]=+g[o>>2]*q;o=l+1|0;L3148:do{if((c[b+(o<<2)>>2]|0)==(n|0)){t=o;while(1){z=a+(t<<2)|0;g[z>>2]=q*+g[z>>2];z=t+1|0;if((c[b+(z<<2)>>2]|0)==(n|0)){t=z}else{A=z;break L3148}}}else{A=o}}while(0);if((A|0)<(d|0)){l=A}else{break}}return}function cs(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=b;if((c[e>>2]|0)>1){cy(d,1,1);cy(d,(c[e>>2]|0)-1|0,4)}else{cy(d,0,1)}f=b+1156|0;L3158:do{if((c[f>>2]|0)>0){cy(d,1,1);cy(d,(c[f>>2]|0)-1|0,8);if((c[f>>2]|0)<=0){break}g=b+1160|0;h=a+4|0;i=b+2184|0;j=0;while(1){k=c[g+(j<<2)>>2]|0;l=c[h>>2]|0;m=(l|0)==0?0:l-1|0;L3164:do{if((m|0)==0){n=0}else{l=m;o=0;while(1){p=o+1|0;q=l>>>1;if((q|0)==0){n=p;break L3164}else{l=q;o=p}}}}while(0);cy(d,k,n);m=c[i+(j<<2)>>2]|0;o=c[h>>2]|0;l=(o|0)==0?0:o-1|0;L3168:do{if((l|0)==0){r=0}else{o=l;p=0;while(1){q=p+1|0;s=o>>>1;if((s|0)==0){r=q;break L3168}else{o=s;p=q}}}}while(0);cy(d,m,r);l=j+1|0;if((l|0)<(c[f>>2]|0)){j=l}else{break L3158}}}else{cy(d,0,1)}}while(0);cy(d,0,2);f=c[e>>2]|0;do{if((f|0)>1){r=a+4|0;if((c[r>>2]|0)<=0){break}n=b+4|0;j=0;while(1){cy(d,c[n+(j<<2)>>2]|0,4);h=j+1|0;if((h|0)<(c[r>>2]|0)){j=h}else{break}}t=c[e>>2]|0;u=2198;break}else{t=f;u=2198}}while(0);do{if((u|0)==2198){if((t|0)>0){break}return}}while(0);t=b+1028|0;u=b+1092|0;b=0;while(1){cy(d,0,8);cy(d,c[t+(b<<2)>>2]|0,8);cy(d,c[u+(b<<2)>>2]|0,8);f=b+1|0;if((f|0)<(c[e>>2]|0)){b=f}else{break}}return}function ct(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=cB(1,3208)|0;e=c[a+28>>2]|0;cG(d|0,0,3208);f=cw(b,1)|0;L3187:do{if((f|0)<0){g=2231}else{if((f|0)==0){c[d>>2]=1}else{h=cw(b,4)|0;c[d>>2]=h+1|0;if((h|0)<0){break}}h=cw(b,1)|0;if((h|0)<0){g=2231;break}L3194:do{if((h|0)!=0){i=cw(b,8)|0;j=i+1|0;k=d+1156|0;c[k>>2]=j;if((i|0)<0){g=2231;break L3187}i=a+4|0;l=d+1160|0;m=d+2184|0;n=0;o=j;while(1){if((n|0)>=(o|0)){break L3194}j=c[i>>2]|0;p=(j|0)==0?0:j-1|0;L3200:do{if((p|0)==0){q=0}else{j=p;r=0;while(1){s=r+1|0;t=j>>>1;if((t|0)==0){q=s;break L3200}else{j=t;r=s}}}}while(0);p=cw(b,q)|0;c[l+(n<<2)>>2]=p;r=c[i>>2]|0;j=(r|0)==0?0:r-1|0;L3204:do{if((j|0)==0){u=0}else{r=j;s=0;while(1){t=s+1|0;v=r>>>1;if((v|0)==0){u=t;break L3204}else{r=v;s=t}}}}while(0);j=cw(b,u)|0;c[m+(n<<2)>>2]=j;if((j|p|0)<0|(p|0)==(j|0)){g=2231;break L3187}s=c[i>>2]|0;if(!((p|0)<(s|0)&(j|0)<(s|0))){g=2231;break L3187}n=n+1|0;o=c[k>>2]|0}}}while(0);if((cw(b,2)|0)!=0){g=2231;break}h=d;k=c[h>>2]|0;L3212:do{if((k|0)>1){o=a+4|0;n=d+4|0;i=0;m=k;while(1){if((i|0)>=(c[o>>2]|0)){w=m;break L3212}l=cw(b,4)|0;c[n+(i<<2)>>2]=l;s=c[h>>2]|0;if((l|0)>=(s|0)|(l|0)<0){break L3187}else{i=i+1|0;m=s}}}else{w=k}}while(0);k=d+1028|0;m=e+16|0;i=d+1092|0;n=e+20|0;o=0;s=w;while(1){if((o|0)>=(s|0)){x=d;break}cw(b,8);l=cw(b,8)|0;c[k+(o<<2)>>2]=l;if((l|0)>=(c[m>>2]|0)|(l|0)<0){g=2231;break L3187}l=cw(b,8)|0;c[i+(o<<2)>>2]=l;if((l|0)>=(c[n>>2]|0)|(l|0)<0){g=2231;break L3187}o=o+1|0;s=c[h>>2]|0}return x|0}}while(0);do{if((g|0)==2231){if((d|0)==0){x=0}else{break}return x|0}}while(0);cG(d|0,0,3208);cA(d);x=0;return x|0}function cu(a){a=a|0;if((a|0)==0){return}cG(a|0,0,3208);cA(a);return}function cv(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0.0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0.0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0;b=i;d=a+64|0;e=c[d>>2]|0;f=c[e+4>>2]|0;h=c[f+28>>2]|0;j=c[e+104>>2]|0;e=c[a+104>>2]|0;l=c[a+36>>2]|0;m=f+4|0;f=c[m>>2]<<2;n=i;i=i+f|0;i=i+7>>3<<3;o=n;n=f+7&-8;f=a+72|0;p=c[f>>2]|0;q=a+76|0;r=c[q>>2]|0;s=a+68|0;t=c[s>>2]|0;if((n+p|0)>(r|0)){if((t|0)!=0){u=cz(8)|0;v=a+80|0;c[v>>2]=(c[v>>2]|0)+(c[f>>2]|0)|0;v=a+84|0;c[u+4>>2]=c[v>>2]|0;c[u>>2]=c[s>>2]|0;c[v>>2]=u}c[q>>2]=n;u=cz(n)|0;c[s>>2]=u;c[f>>2]=0;w=0;x=u;y=c[q>>2]|0}else{w=p;x=t;y=r}r=w+n|0;c[f>>2]=r;n=x+w|0;w=(c[m>>2]<<2)+7&-8;if((w+r|0)>(y|0)){if((x|0)!=0){t=cz(8)|0;p=a+80|0;c[p>>2]=(c[p>>2]|0)+(c[f>>2]|0)|0;p=a+84|0;c[t+4>>2]=c[p>>2]|0;c[t>>2]=c[s>>2]|0;c[p>>2]=t}c[q>>2]=w;t=cz(w)|0;c[s>>2]=t;c[f>>2]=0;z=0;A=t;B=c[q>>2]|0}else{z=r;A=x;B=y}y=z+w|0;c[f>>2]=y;w=A+z|0;z=(c[m>>2]<<2)+7&-8;if((z+y|0)>(B|0)){if((A|0)!=0){B=cz(8)|0;x=a+80|0;c[x>>2]=(c[x>>2]|0)+(c[f>>2]|0)|0;x=a+84|0;c[B+4>>2]=c[x>>2]|0;c[B>>2]=c[s>>2]|0;c[x>>2]=B}c[q>>2]=z;B=cz(z)|0;c[s>>2]=B;c[f>>2]=0;C=0;D=B}else{C=y;D=A}A=C+z|0;c[f>>2]=A;z=D+C|0;C=e+4|0;E=+g[C>>2];y=i;i=i+(c[m>>2]<<2)|0;i=i+7>>3<<3;B=y;y=a+28|0;x=c[y>>2]|0;r=c[(h+544|0)+(x<<2)>>2]|0;t=r;p=c[j+56>>2]|0;u=((x|0)!=0?2:0)+(c[e+8>>2]|0)|0;v=p+(u*52&-1)|0;F=a+40|0;c[F>>2]=x;L3253:do{if((c[m>>2]|0)>0){G=a|0;H=(l|0)/2&-1;I=(H<<2)+7&-8;J=a+80|0;K=a+84|0;L=+(((g[k>>2]=4.0/+(l|0),c[k>>2]|0)&2147483647)>>>0>>>0)*7.177114298428933e-7-764.6162109375+.345;M=j+4|0;N=h;O=a+24|0;P=a+32|0;Q=j+12|0;R=j+20|0;S=l-1|0;T=(S|0)>1;U=E;V=0;W=A;X=D;while(1){Y=c[(c[G>>2]|0)+(V<<2)>>2]|0;if((I+W|0)>(c[q>>2]|0)){if((X|0)!=0){Z=cz(8)|0;c[J>>2]=(c[J>>2]|0)+(c[f>>2]|0)|0;c[Z+4>>2]=c[K>>2]|0;c[Z>>2]=c[s>>2]|0;c[K>>2]=Z}c[q>>2]=I;Z=cz(I)|0;c[s>>2]=Z;c[f>>2]=0;_=0;$=Z}else{_=W;$=X}c[f>>2]=_+I|0;c[w+(V<<2)>>2]=$+_|0;Z=c[f>>2]|0;aa=c[s>>2]|0;if((Z+I|0)>(c[q>>2]|0)){if((aa|0)!=0){ab=cz(8)|0;c[J>>2]=(c[J>>2]|0)+(c[f>>2]|0)|0;c[ab+4>>2]=c[K>>2]|0;c[ab>>2]=c[s>>2]|0;c[K>>2]=ab}c[q>>2]=I;ab=cz(I)|0;c[s>>2]=ab;c[f>>2]=0;ac=0;ad=ab}else{ac=Z;ad=aa}c[f>>2]=ac+I|0;aa=n+(V<<2)|0;c[aa>>2]=ad+ac|0;b4(Y,M,N,c[O>>2]|0,c[y>>2]|0,c[P>>2]|0);bv(c[c[Q+(c[y>>2]<<2)>>2]>>2]|0,Y,c[aa>>2]|0);b0(R+((c[y>>2]|0)*12&-1)|0,Y);ae=L+(+(((g[k>>2]=+g[Y>>2],c[k>>2]|0)&2147483647)>>>0>>>0)*7.177114298428933e-7-764.6162109375)+.345;g[Y>>2]=ae;aa=B+(V<<2)|0;g[aa>>2]=ae;L3269:do{if(T){Z=1;af=ae;while(1){ag=+g[Y+(Z<<2)>>2];ab=Z+1|0;ah=+g[Y+(ab<<2)>>2];ai=L+(+(((g[k>>2]=ag*ag+ah*ah,c[k>>2]|0)&2147483647)>>>0>>>0)*7.177114298428933e-7-764.6162109375)*.5+.345;g[Y+(ab>>1<<2)>>2]=ai;if(ai>af){g[aa>>2]=ai;aj=ai}else{aj=af}ab=Z+2|0;if((ab|0)<(S|0)){Z=ab;af=aj}else{ak=aj;break L3269}}}else{ak=ae}}while(0);if(ak>0.0){g[aa>>2]=0.0;al=0.0}else{al=ak}ae=al>U?al:U;Y=V+1|0;Z=c[f>>2]|0;ab=c[s>>2]|0;if((Y|0)<(c[m>>2]|0)){U=ae;V=Y;W=Z;X=ab}else{am=ae;an=Z;ao=ab;ap=H;aq=I;break L3253}}}else{I=(l|0)/2&-1;am=E;an=A;ao=D;ap=I;aq=(I<<2)+7&-8}}while(0);D=c[q>>2]|0;if((aq+an|0)>(D|0)){if((ao|0)!=0){A=cz(8)|0;ac=a+80|0;c[ac>>2]=(c[ac>>2]|0)+(c[f>>2]|0)|0;ac=a+84|0;c[A+4>>2]=c[ac>>2]|0;c[A>>2]=c[s>>2]|0;c[ac>>2]=A}c[q>>2]=aq;A=cz(aq)|0;c[s>>2]=A;c[f>>2]=0;ar=0;as=A;at=c[q>>2]|0}else{ar=an;as=ao;at=D}D=ar+aq|0;c[f>>2]=D;ao=as+ar|0;if((D+aq|0)>(at|0)){if((as|0)!=0){at=cz(8)|0;ar=a+80|0;c[ar>>2]=(c[ar>>2]|0)+(c[f>>2]|0)|0;ar=a+84|0;c[at+4>>2]=c[ar>>2]|0;c[at>>2]=c[s>>2]|0;c[ar>>2]=at}c[q>>2]=aq;at=cz(aq)|0;c[s>>2]=at;c[f>>2]=0;au=0;av=at}else{au=D;av=as}as=au+aq|0;c[f>>2]=as;aq=av+au|0;L3293:do{if((c[m>>2]|0)>0){au=r+4|0;D=a|0;at=a+80|0;ar=a+84|0;an=(l|0)>1;A=v|0;ac=p+(u*52&-1)+4|0;ad=p+(u*52&-1)+48|0;_=p+(u*52&-1)+12|0;$=r+1028|0;I=h+800|0;H=j+48|0;X=0;W=as;V=av;while(1){S=c[au+(X<<2)>>2]|0;T=c[n+(X<<2)>>2]|0;R=c[(c[D>>2]|0)+(X<<2)>>2]|0;Q=R+(ap<<2)|0;c[F>>2]=x;if((W+64|0)>(c[q>>2]|0)){if((V|0)!=0){P=cz(8)|0;c[at>>2]=(c[at>>2]|0)+(c[f>>2]|0)|0;c[P+4>>2]=c[ar>>2]|0;c[P>>2]=c[s>>2]|0;c[ar>>2]=P}c[q>>2]=64;P=cz(64)|0;c[s>>2]=P;c[f>>2]=0;aw=0;ax=P}else{aw=W;ax=V}P=ax+aw|0;c[f>>2]=aw+64|0;O=z+(X<<2)|0;c[O>>2]=P;cG(P|0,0,60);L3303:do{if(an){P=0;while(1){g[R+(P+ap<<2)>>2]=+(((g[k>>2]=+g[T+(P<<2)>>2],c[k>>2]|0)&2147483647)>>>0>>>0)*7.177114298428933e-7-764.6162109375+.345;N=P+1|0;if((N|0)<(ap|0)){P=N}else{break L3303}}}}while(0);bA(v,Q,ao);bB(v,R,aq,am,+g[B+(X<<2)>>2]);aa=c[A>>2]|0;P=c[ac>>2]|0;E=+g[P+16>>2];L3307:do{if((aa|0)>0){al=+g[ad>>2];N=0;M=P;while(1){ak=+g[ao+(N<<2)>>2]+ +g[(c[(c[_>>2]|0)+4>>2]|0)+(N<<2)>>2];aj=+g[M+108>>2];U=ak>aj?aj:ak;ak=E+ +g[aq+(N<<2)>>2];g[R+(N<<2)>>2]=U<ak?ak:U;ak=U- +g[R+(N+ap<<2)>>2];U=ak+17.200000762939453;do{if(ak>-17.200000762939453){aj=1.0-al*U*.005;if(aj>=0.0){ay=aj;break}ay=9999999747378752.0e-20}else{ay=1.0-al*U*3.0e-4}}while(0);K=T+(N<<2)|0;g[K>>2]=ay*+g[K>>2];K=N+1|0;if((K|0)>=(aa|0)){break L3307}N=K;M=c[ac>>2]|0}}}while(0);aa=$+(S<<2)|0;T=c[aa>>2]|0;if((c[I+(T<<2)>>2]|0)!=1){az=-1;break}P=cf(a,c[(c[H>>2]|0)+(T<<2)>>2]|0,Q,R)|0;c[(c[O>>2]|0)+28>>2]=P;P=(c[(c[d>>2]|0)+104>>2]|0)+80|0;do{if((P|0)!=0){if((c[P>>2]|0)==0){break}if((c[(c[O>>2]|0)+28>>2]|0)==0){break}T=c[A>>2]|0;M=c[ac>>2]|0;E=+g[M+20>>2];L3323:do{if((T|0)>0){N=0;K=M;while(1){al=+g[ao+(N<<2)>>2]+ +g[(c[(c[_>>2]|0)+8>>2]|0)+(N<<2)>>2];U=+g[K+108>>2];ak=al>U?U:al;al=E+ +g[aq+(N<<2)>>2];g[R+(N<<2)>>2]=ak<al?al:ak;J=N+1|0;if((J|0)>=(T|0)){break L3323}N=J;K=c[ac>>2]|0}}}while(0);T=cf(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,Q,R)|0;c[(c[O>>2]|0)+56>>2]=T;T=c[A>>2]|0;M=c[ac>>2]|0;E=+g[M+12>>2];L3328:do{if((T|0)>0){K=0;N=M;while(1){ak=+g[ao+(K<<2)>>2]+ +g[(c[c[_>>2]>>2]|0)+(K<<2)>>2];al=+g[N+108>>2];U=ak>al?al:ak;ak=E+ +g[aq+(K<<2)>>2];g[R+(K<<2)>>2]=U<ak?ak:U;J=K+1|0;if((J|0)>=(T|0)){break L3328}K=J;N=c[ac>>2]|0}}}while(0);T=cf(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,Q,R)|0;c[c[O>>2]>>2]=T;T=c[O>>2]|0;M=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[T>>2]|0,c[T+28>>2]|0,9362)|0;c[(c[O>>2]|0)+4>>2]=M;M=c[O>>2]|0;T=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[M>>2]|0,c[M+28>>2]|0,18724)|0;c[(c[O>>2]|0)+8>>2]=T;T=c[O>>2]|0;M=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[T>>2]|0,c[T+28>>2]|0,28086)|0;c[(c[O>>2]|0)+12>>2]=M;M=c[O>>2]|0;T=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[M>>2]|0,c[M+28>>2]|0,37449)|0;c[(c[O>>2]|0)+16>>2]=T;T=c[O>>2]|0;M=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[T>>2]|0,c[T+28>>2]|0,46811)|0;c[(c[O>>2]|0)+20>>2]=M;M=c[O>>2]|0;T=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[M>>2]|0,c[M+28>>2]|0,56173)|0;c[(c[O>>2]|0)+24>>2]=T;T=c[O>>2]|0;M=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[T+28>>2]|0,c[T+56>>2]|0,9362)|0;c[(c[O>>2]|0)+32>>2]=M;M=c[O>>2]|0;T=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[M+28>>2]|0,c[M+56>>2]|0,18724)|0;c[(c[O>>2]|0)+36>>2]=T;T=c[O>>2]|0;M=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[T+28>>2]|0,c[T+56>>2]|0,28086)|0;c[(c[O>>2]|0)+40>>2]=M;M=c[O>>2]|0;T=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[M+28>>2]|0,c[M+56>>2]|0,37449)|0;c[(c[O>>2]|0)+44>>2]=T;T=c[O>>2]|0;M=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[T+28>>2]|0,c[T+56>>2]|0,46811)|0;c[(c[O>>2]|0)+48>>2]=M;M=c[O>>2]|0;T=ch(a,c[(c[H>>2]|0)+(c[aa>>2]<<2)>>2]|0,c[M+28>>2]|0,c[M+56>>2]|0,56173)|0;c[(c[O>>2]|0)+52>>2]=T}}while(0);O=X+1|0;if((O|0)>=(c[m>>2]|0)){break L3293}X=O;W=c[f>>2]|0;V=c[s>>2]|0}i=b;return az|0}}while(0);g[C>>2]=am;C=c[m>>2]<<2;s=i;i=i+C|0;i=i+7>>3<<3;f=s;s=i;i=i+C|0;i=i+7>>3<<3;C=s;s=c[(c[d>>2]|0)+104>>2]|0;aq=s+80|0;do{if((aq|0)==0){aA=2311}else{if((c[aq>>2]|0)==0){aA=2311;break}else{aB=0;break}}}while(0);if((aA|0)==2311){aB=7}aq=e+12|0;e=j+44|0;ao=a+24|0;ap=a+32|0;B=h+2868|0;aw=h+3240|0;ax=r;q=r+1092|0;F=h+1312|0;h=j+52|0;av=r+4|0;as=r+1028|0;r=j+48|0;j=aB;aB=s;while(1){s=aB+80|0;do{if((s|0)==0){aA=2315}else{if((c[s>>2]|0)==0){aA=2315;break}else{aC=14;break}}}while(0);if((aA|0)==2315){aA=0;aC=7}if((j|0)>(aC|0)){az=0;break}s=c[aq+(j<<2)>>2]|0;cy(s,0,1);cy(s,x,c[e>>2]|0);if((c[y>>2]|0)!=0){cy(s,c[ao>>2]|0,1);cy(s,c[ap>>2]|0,1)}u=c[m>>2]|0;L3353:do{if((u|0)>0){p=0;while(1){c[o+(p<<2)>>2]=ci(s,a,c[(c[r>>2]|0)+(c[as+(c[av+(p<<2)>>2]<<2)>>2]<<2)>>2]|0,c[(c[z+(p<<2)>>2]|0)+(j<<2)>>2]|0,c[w+(p<<2)>>2]|0)|0;l=p+1|0;V=c[m>>2]|0;if((l|0)<(V|0)){p=l}else{aD=V;break L3353}}}else{aD=u}}while(0);bE(j,B,v,t,n,w,o,c[aw+((c[y>>2]|0)*60&-1)+(j<<2)>>2]|0,aD);L3357:do{if((c[ax>>2]|0)>0){u=0;while(1){p=c[q+(u<<2)>>2]|0;V=c[m>>2]|0;L3360:do{if((V|0)>0){l=0;W=0;X=V;while(1){if((c[av+(l<<2)>>2]|0)==(u|0)){H=C+(W<<2)|0;c[H>>2]=0;if((c[o+(l<<2)>>2]|0)!=0){c[H>>2]=1}c[f+(W<<2)>>2]=c[w+(l<<2)>>2]|0;aE=W+1|0;aF=c[m>>2]|0}else{aE=W;aF=X}H=l+1|0;if((H|0)<(aF|0)){l=H;W=aE;X=aF}else{aG=aE;break L3360}}}else{aG=0}}while(0);V=F+(p<<2)|0;X=aR[c[(c[56040+(c[V>>2]<<2)>>2]|0)+20>>2]&15](a,c[(c[h>>2]|0)+(p<<2)>>2]|0,f,C,aG)|0;W=c[m>>2]|0;L3370:do{if((W|0)>0){l=0;H=0;ac=W;while(1){if((c[av+(l<<2)>>2]|0)==(u|0)){c[f+(H<<2)>>2]=c[w+(l<<2)>>2]|0;aH=H+1|0;aI=c[m>>2]|0}else{aH=H;aI=ac}_=l+1|0;if((_|0)<(aI|0)){l=_;H=aH;ac=aI}else{aJ=aH;break L3370}}}else{aJ=0}}while(0);aU[c[(c[56040+(c[V>>2]<<2)>>2]|0)+24>>2]&7](s,a,c[(c[h>>2]|0)+(p<<2)>>2]|0,f,C,aJ,X,u);W=u+1|0;if((W|0)<(c[ax>>2]|0)){u=W}else{break L3357}}}}while(0);j=j+1|0;aB=c[(c[d>>2]|0)+104>>2]|0}i=b;return az|0}function cw(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;L3380:do{if(b>>>0>32){e=c[a+16>>2]|0;f=a|0;g=a+4|0}else{h=c[55792+(b<<2)>>2]|0;i=a+4|0;j=c[i>>2]|0;k=j+b|0;l=a|0;m=c[l>>2]|0;n=c[a+16>>2]|0;do{if((m|0)>=(n-4|0)){if((m|0)>(n-(k+7>>3)|0)){e=n;f=l;g=i;break L3380}if((k|0)==0){o=0}else{break}return o|0}}while(0);n=a+12|0;p=c[n>>2]|0;q=(d[p]|0)>>>(j>>>0);do{if((k|0)>8){r=(d[p+1|0]|0)<<8-j|q;if((k|0)<=16){s=r;break}t=(d[p+2|0]|0)<<16-j|r;if((k|0)<=24){s=t;break}r=(d[p+3|0]|0)<<24-j|t;if((k|0)<33|(j|0)==0){s=r;break}s=(d[p+4|0]|0)<<32-j|r}else{s=q}}while(0);q=(k|0)/8&-1;c[n>>2]=p+q|0;c[l>>2]=m+q|0;c[i>>2]=k&7;o=s&h;return o|0}}while(0);c[a+12>>2]=0;c[f>>2]=e;c[g>>2]=1;o=-1;return o|0}function cx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0.0,K=0.0,L=0;d=i;e=c[a+64>>2]|0;f=c[e+4>>2]|0;h=c[f+28>>2]|0;j=c[e+104>>2]|0;e=a+28|0;k=c[h+(c[e>>2]<<2)>>2]|0;c[a+36>>2]=k;l=f+4|0;f=c[l>>2]<<2;m=i;i=i+f|0;i=i+7>>3<<3;n=m;m=i;i=i+f|0;i=i+7>>3<<3;o=m;m=i;i=i+f|0;i=i+7>>3<<3;p=m;m=i;i=i+f|0;i=i+7>>3<<3;f=m;m=c[l>>2]|0;L3398:do{if((m|0)>0){q=b+4|0;r=b+1028|0;s=h+800|0;t=j+48|0;u=a|0;v=k<<1&2147483646;w=0;while(1){x=c[r+(c[q+(w<<2)>>2]<<2)>>2]|0;y=aW[c[(c[56536+(c[s+(x<<2)>>2]<<2)>>2]|0)+20>>2]&31](a,c[(c[t>>2]|0)+(x<<2)>>2]|0)|0;c[f+(w<<2)>>2]=y;c[p+(w<<2)>>2]=(y|0)!=0&1;cG(c[(c[u>>2]|0)+(w<<2)>>2]|0,0,v|0);y=w+1|0;x=c[l>>2]|0;if((y|0)<(x|0)){w=y}else{z=x;break L3398}}}else{z=m}}while(0);m=b+1156|0;w=c[m>>2]|0;L3403:do{if((w|0)>0){v=b+1160|0;u=b+2184|0;t=0;while(1){s=p+(c[v+(t<<2)>>2]<<2)|0;q=c[u+(t<<2)>>2]|0;do{if((c[s>>2]|0)==0){if((c[p+(q<<2)>>2]|0)==0){break}else{A=2362;break}}else{A=2362}}while(0);if((A|0)==2362){A=0;c[s>>2]=1;c[p+(q<<2)>>2]=1}r=t+1|0;if((r|0)<(w|0)){t=r}else{break L3403}}}}while(0);A=b;if((c[A>>2]|0)>0){t=b+1092|0;u=h+1312|0;v=j+52|0;r=b+4|0;x=a|0;y=0;B=z;while(1){L3417:do{if((B|0)>0){z=0;C=0;D=B;while(1){if((c[r+(C<<2)>>2]|0)==(y|0)){c[o+(z<<2)>>2]=(c[p+(C<<2)>>2]|0)!=0&1;c[n+(z<<2)>>2]=c[(c[x>>2]|0)+(C<<2)>>2]|0;E=z+1|0;F=c[l>>2]|0}else{E=z;F=D}G=C+1|0;if((G|0)<(F|0)){z=E;C=G;D=F}else{H=E;break L3417}}}else{H=0}}while(0);D=c[t+(y<<2)>>2]|0;aR[c[(c[56040+(c[u+(D<<2)>>2]<<2)>>2]|0)+28>>2]&15](a,c[(c[v>>2]|0)+(D<<2)>>2]|0,n,o,H);D=y+1|0;if((D|0)>=(c[A>>2]|0)){break}y=D;B=c[l>>2]|0}I=c[m>>2]|0}else{I=w}L3427:do{if((I|0)>0){w=b+1160|0;m=a|0;B=b+2184|0;y=(k|0)/2&-1;A=(k|0)>1;H=I;while(1){o=H-1|0;n=c[m>>2]|0;v=c[n+(c[w+(o<<2)>>2]<<2)>>2]|0;u=c[n+(c[B+(o<<2)>>2]<<2)>>2]|0;L3431:do{if(A){n=0;while(1){t=v+(n<<2)|0;J=+g[t>>2];E=u+(n<<2)|0;K=+g[E>>2];F=K>0.0;do{if(J>0.0){if(F){g[t>>2]=J;g[E>>2]=J-K;break}else{g[E>>2]=J;g[t>>2]=J+K;break}}else{if(F){g[t>>2]=J;g[E>>2]=J+K;break}else{g[E>>2]=J;g[t>>2]=J-K;break}}}while(0);t=n+1|0;if((t|0)<(y|0)){n=t}else{break L3431}}}}while(0);if((o|0)>0){H=o}else{break L3427}}}}while(0);if((c[l>>2]|0)<=0){i=d;return 0}I=a|0;k=b+4|0;H=b+1028|0;b=h+800|0;h=j+48|0;y=0;while(1){A=c[H+(c[k+(y<<2)>>2]<<2)>>2]|0;aV[c[(c[56536+(c[b+(A<<2)>>2]<<2)>>2]|0)+24>>2]&15](a,c[(c[h>>2]|0)+(A<<2)>>2]|0,c[f+(y<<2)>>2]|0,c[(c[I>>2]|0)+(y<<2)>>2]|0);A=y+1|0;L=c[l>>2]|0;if((A|0)<(L|0)){y=A}else{break}}if((L|0)<=0){i=d;return 0}L=a|0;a=j+12|0;j=0;while(1){y=c[(c[L>>2]|0)+(j<<2)>>2]|0;bt(c[c[a+(c[e>>2]<<2)>>2]>>2]|0,y,y);y=j+1|0;if((y|0)<(c[l>>2]|0)){j=y}else{break}}i=d;return 0}function cy(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;do{if(f>>>0<=32){g=b|0;h=b+16|0;i=c[h>>2]|0;j=b+12|0;k=c[j>>2]|0;if((c[g>>2]|0)<(i-4|0)){l=k}else{if((k|0)==0){return}if((i|0)>2147483391){break}k=b+8|0;m=cC(c[k>>2]|0,i+256|0)|0;if((m|0)==0){break}c[k>>2]=m;c[h>>2]=(c[h>>2]|0)+256|0;h=m+(c[g>>2]|0)|0;c[j>>2]=h;l=h}h=c[55792+(f<<2)>>2]&e;j=b+4|0;m=c[j>>2]|0;k=m+f|0;i=b+12|0;a[l]=(d[l]|0|h<<m)&255;do{if((k|0)>7){a[(c[i>>2]|0)+1|0]=h>>>((8-(c[j>>2]|0)|0)>>>0)&255;if((k|0)<=15){break}a[(c[i>>2]|0)+2|0]=h>>>((16-(c[j>>2]|0)|0)>>>0)&255;if((k|0)<=23){break}a[(c[i>>2]|0)+3|0]=h>>>((24-(c[j>>2]|0)|0)>>>0)&255;if((k|0)<=31){break}m=c[j>>2]|0;if((m|0)==0){a[(c[i>>2]|0)+4|0]=0;break}else{a[(c[i>>2]|0)+4|0]=h>>>((32-m|0)>>>0)&255;break}}}while(0);h=(k|0)/8&-1;c[g>>2]=(c[g>>2]|0)+h|0;c[i>>2]=(c[i>>2]|0)+h|0;c[j>>2]=k&7;return}}while(0);l=c[b+8>>2]|0;if((l|0)!=0){cA(l)}cG(b|0,0,20);return}function cz(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,at=0,au=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aK=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[14016]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=56104+(h<<2)|0;j=56104+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[14016]=e&(1<<g^-1)}else{if(l>>>0<(c[14020]|0)>>>0){av();return 0;return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{av();return 0;return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[14018]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=56104+(p<<2)|0;m=56104+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[14016]=e&(1<<r^-1)}else{if(l>>>0<(c[14020]|0)>>>0){av();return 0;return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{av();return 0;return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[14018]|0;if((l|0)!=0){q=c[14021]|0;d=l>>>3;l=d<<1;f=56104+(l<<2)|0;k=c[14016]|0;h=1<<d;do{if((k&h|0)==0){c[14016]=k|h;s=f;t=56104+(l+2<<2)|0}else{d=56104+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[14020]|0)>>>0){s=g;t=d;break}av();return 0;return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[14018]=m;c[14021]=e;n=i;return n|0}l=c[14017]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[56368+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[14020]|0;if(r>>>0<i>>>0){av();return 0;return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){av();return 0;return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L56:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L56}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){av();return 0;return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){av();return 0;return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){av();return 0;return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{av();return 0;return 0}}}while(0);L78:do{if((e|0)!=0){f=d+28|0;i=56368+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[14017]=c[14017]&(1<<c[f>>2]^-1);break L78}else{if(e>>>0<(c[14020]|0)>>>0){av();return 0;return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L78}}}while(0);if(v>>>0<(c[14020]|0)>>>0){av();return 0;return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[14018]|0;if((f|0)!=0){e=c[14021]|0;i=f>>>3;f=i<<1;q=56104+(f<<2)|0;k=c[14016]|0;g=1<<i;do{if((k&g|0)==0){c[14016]=k|g;y=q;z=56104+(f+2<<2)|0}else{i=56104+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[14020]|0)>>>0){y=l;z=i;break}av();return 0;return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[14018]=p;c[14021]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[14017]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[56368+(A<<2)>>2]|0;L126:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L126}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L126}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[56368+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L141:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L141}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[14018]|0)-g|0)>>>0){o=g;break}k=K;q=c[14020]|0;if(k>>>0<q>>>0){av();return 0;return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){av();return 0;return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L154:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L154}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){av();return 0;return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){av();return 0;return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){av();return 0;return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{av();return 0;return 0}}}while(0);L176:do{if((e|0)!=0){i=K+28|0;q=56368+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[14017]=c[14017]&(1<<c[i>>2]^-1);break L176}else{if(e>>>0<(c[14020]|0)>>>0){av();return 0;return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L176}}}while(0);if(L>>>0<(c[14020]|0)>>>0){av();return 0;return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=56104+(e<<2)|0;r=c[14016]|0;j=1<<i;do{if((r&j|0)==0){c[14016]=r|j;O=q;P=56104+(e+2<<2)|0}else{i=56104+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[14020]|0)>>>0){O=d;P=i;break}av();return 0;return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=56368+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[14017]|0;l=1<<Q;if((q&l|0)==0){c[14017]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=151;break}else{l=l<<1;q=j}}if((T|0)==151){if(S>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[14020]|0;if(q>>>0<i>>>0){av();return 0;return 0}if(j>>>0<i>>>0){av();return 0;return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[14018]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[14021]|0;if(S>>>0>15){R=J;c[14021]=R+o|0;c[14018]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[14018]=0;c[14021]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[14019]|0;if(o>>>0<J>>>0){S=J-o|0;c[14019]=S;J=c[14022]|0;K=J;c[14022]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[13942]|0)==0){J=as(8)|0;if((J-1&J|0)==0){c[13944]=J;c[13943]=J;c[13945]=-1;c[13946]=2097152;c[13947]=0;c[14127]=0;c[13942]=aM(0)&-16^1431655768;break}else{av();return 0;return 0}}}while(0);J=o+48|0;S=c[13944]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[14126]|0;do{if((O|0)!=0){P=c[14124]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L268:do{if((c[14127]&4|0)==0){O=c[14022]|0;L270:do{if((O|0)==0){T=181}else{L=O;P=56512;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=181;break L270}else{P=M}}if((P|0)==0){T=181;break}L=R-(c[14019]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=aI(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=190;break}}while(0);do{if((T|0)==181){O=aI(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[13943]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[14124]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[14126]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=aI($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=190;break}}while(0);L290:do{if((T|0)==190){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=201;break L268}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[13944]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aI(O|0)|0)==-1){aI(q|0);W=Y;break L290}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=201;break L268}}}while(0);c[14127]=c[14127]|4;ad=W;T=198;break}else{ad=0;T=198}}while(0);do{if((T|0)==198){if(S>>>0>=2147483647){break}W=aI(S|0)|0;Z=aI(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=201;break}}}while(0);do{if((T|0)==201){ad=(c[14124]|0)+aa|0;c[14124]=ad;if(ad>>>0>(c[14125]|0)>>>0){c[14125]=ad}ad=c[14022]|0;L310:do{if((ad|0)==0){S=c[14020]|0;if((S|0)==0|ab>>>0<S>>>0){c[14020]=ab}c[14128]=ab;c[14129]=aa;c[14131]=0;c[14025]=c[13942]|0;c[14024]=-1;S=0;while(1){Y=S<<1;ac=56104+(Y<<2)|0;c[56104+(Y+3<<2)>>2]=ac;c[56104+(Y+2<<2)>>2]=ac;ac=S+1|0;if(ac>>>0<32){S=ac}else{break}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[14022]=ab+ae|0;c[14019]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[14023]=c[13946]|0}else{S=56512;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=213;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==213){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[14022]|0;Y=(c[14019]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[14022]=Z+ai|0;c[14019]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[14023]=c[13946]|0;break L310}}while(0);if(ab>>>0<(c[14020]|0)>>>0){c[14020]=ab}S=ab+aa|0;Y=56512;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=223;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==223){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[14022]|0)){J=(c[14019]|0)+K|0;c[14019]=J;c[14022]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[14021]|0)){J=(c[14018]|0)+K|0;c[14018]=J;c[14021]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L355:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=56104+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[14020]|0)>>>0){av();return 0;return 0}if((c[U+12>>2]|0)==(Z|0)){break}av();return 0;return 0}}while(0);if((Q|0)==(U|0)){c[14016]=c[14016]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[14020]|0)>>>0){av();return 0;return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}av();return 0;return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L376:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){an=0;break L376}else{ao=M;ap=e;break}}else{ao=L;ap=g}}while(0);while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[14020]|0)>>>0){av();return 0;return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){av();return 0;return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;an=P;break}else{av();return 0;return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=56368+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[14017]=c[14017]&(1<<c[P>>2]^-1);break L355}else{if(q>>>0<(c[14020]|0)>>>0){av();return 0;return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[q+20>>2]=an}if((an|0)==0){break L355}}}while(0);if(an>>>0<(c[14020]|0)>>>0){av();return 0;return 0}c[an+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa|0)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=ar|1;c[ab+(ar+W|0)>>2]=ar;J=ar>>>3;if(ar>>>0<256){V=J<<1;X=56104+(V<<2)|0;P=c[14016]|0;q=1<<J;do{if((P&q|0)==0){c[14016]=P|q;at=X;au=56104+(V+2<<2)|0}else{J=56104+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[14020]|0)>>>0){at=U;au=J;break}av();return 0;return 0}}while(0);c[au>>2]=_;c[at+12>>2]=_;c[ab+(W+8|0)>>2]=at;c[ab+(W+12|0)>>2]=X;break}V=ac;q=ar>>>8;do{if((q|0)==0){aw=0}else{if(ar>>>0>16777215){aw=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;aw=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=56368+(aw<<2)|0;c[ab+(W+28|0)>>2]=aw;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[14017]|0;Q=1<<aw;if((X&Q|0)==0){c[14017]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((aw|0)==31){ax=0}else{ax=25-(aw>>>1)|0}Q=ar<<ax;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}ay=X+16+(Q>>>31<<2)|0;q=c[ay>>2]|0;if((q|0)==0){T=296;break}else{Q=Q<<1;X=q}}if((T|0)==296){if(ay>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[ay>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[14020]|0;if(X>>>0<$>>>0){av();return 0;return 0}if(q>>>0<$>>>0){av();return 0;return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=56512;while(1){az=c[W>>2]|0;if(az>>>0<=Y>>>0){aA=c[W+4>>2]|0;aB=az+aA|0;if(aB>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=az+(aA-39|0)|0;if((W&7|0)==0){aC=0}else{aC=-W&7}W=az+((aA-47|0)+aC|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aD=0}else{aD=-_&7}_=(aa-40|0)-aD|0;c[14022]=ab+aD|0;c[14019]=_;c[ab+(aD+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[14023]=c[13946]|0;c[ac+4>>2]=27;c[W>>2]=c[14128]|0;c[W+4>>2]=c[56516>>2]|0;c[W+8>>2]=c[56520>>2]|0;c[W+12>>2]=c[56524>>2]|0;c[14128]=ab;c[14129]=aa;c[14131]=0;c[14130]=W;W=ac+28|0;c[W>>2]=7;L474:do{if((ac+32|0)>>>0<aB>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aB>>>0){_=K}else{break L474}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=56104+(K<<2)|0;S=c[14016]|0;q=1<<_;do{if((S&q|0)==0){c[14016]=S|q;aE=Z;aF=56104+(K+2<<2)|0}else{_=56104+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[14020]|0)>>>0){aE=Q;aF=_;break}av();return 0;return 0}}while(0);c[aF>>2]=ad;c[aE+12>>2]=ad;c[ad+8>>2]=aE;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aG=0}else{if(W>>>0>16777215){aG=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aG=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=56368+(aG<<2)|0;c[ad+28>>2]=aG;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[14017]|0;Q=1<<aG;if((Z&Q|0)==0){c[14017]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aG|0)==31){aH=0}else{aH=25-(aG>>>1)|0}Q=W<<aH;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aK=Z+16+(Q>>>31<<2)|0;q=c[aK>>2]|0;if((q|0)==0){T=331;break}else{Q=Q<<1;Z=q}}if((T|0)==331){if(aK>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[aK>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[14020]|0;if(Z>>>0<q>>>0){av();return 0;return 0}if(W>>>0<q>>>0){av();return 0;return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[14019]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[14019]=W;ad=c[14022]|0;Q=ad;c[14022]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[aJ()>>2]=12;n=0;return n|0}function cA(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[14020]|0;if(b>>>0<e>>>0){av()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){av()}h=f&-8;i=a+(h-8|0)|0;j=i;L527:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){av()}if((n|0)==(c[14021]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[14018]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=56104+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){av()}if((c[k+12>>2]|0)==(n|0)){break}av()}}while(0);if((s|0)==(k|0)){c[14016]=c[14016]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){av()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}av()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L561:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L561}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){av()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){av()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){av()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{av()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=56368+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[14017]=c[14017]&(1<<c[v>>2]^-1);q=n;r=o;break L527}else{if(p>>>0<(c[14020]|0)>>>0){av()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L527}}}while(0);if(A>>>0<(c[14020]|0)>>>0){av()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[14020]|0)>>>0){av()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[14020]|0)>>>0){av()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){av()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){av()}do{if((e&2|0)==0){if((j|0)==(c[14022]|0)){B=(c[14019]|0)+r|0;c[14019]=B;c[14022]=q;c[q+4>>2]=B|1;if((q|0)==(c[14021]|0)){c[14021]=0;c[14018]=0}if(B>>>0<=(c[14023]|0)>>>0){return}cD(0);return}if((j|0)==(c[14021]|0)){B=(c[14018]|0)+r|0;c[14018]=B;c[14021]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L632:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=56104+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[14020]|0)>>>0){av()}if((c[u+12>>2]|0)==(j|0)){break}av()}}while(0);if((g|0)==(u|0)){c[14016]=c[14016]&(1<<C^-1);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[14020]|0)>>>0){av()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}av()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16|0)>>2]|0;t=c[a+(h|4)>>2]|0;L653:do{if((t|0)==(b|0)){p=a+(h+12|0)|0;v=c[p>>2]|0;do{if((v|0)==0){m=a+(h+8|0)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break L653}else{F=k;G=m;break}}else{F=v;G=p}}while(0);while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[14020]|0)>>>0){av()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[14020]|0)>>>0){av()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){av()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{av()}}}while(0);if((f|0)==0){break}t=a+(h+20|0)|0;u=56368+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[14017]=c[14017]&(1<<c[t>>2]^-1);break L632}else{if(f>>>0<(c[14020]|0)>>>0){av()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L632}}}while(0);if(E>>>0<(c[14020]|0)>>>0){av()}c[E+24>>2]=f;b=c[a+(h+8|0)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[14020]|0)>>>0){av()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12|0)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[14020]|0)>>>0){av()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[14021]|0)){H=B;break}c[14018]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=56104+(d<<2)|0;A=c[14016]|0;E=1<<r;do{if((A&E|0)==0){c[14016]=A|E;I=e;J=56104+(d+2<<2)|0}else{r=56104+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[14020]|0)>>>0){I=h;J=r;break}av()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=(14-(E|J|d)|0)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=56368+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[14017]|0;d=1<<K;do{if((r&d|0)==0){c[14017]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=510;break}else{A=A<<1;J=E}}if((N|0)==510){if(M>>>0<(c[14020]|0)>>>0){av()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[14020]|0;if(J>>>0<E>>>0){av()}if(B>>>0<E>>>0){av()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[14024]|0)-1|0;c[14024]=q;if((q|0)==0){O=56520}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[14024]=-1;return}function cB(a,b){a=a|0;b=b|0;var d=0,e=0;do{if((a|0)==0){d=0}else{e=$(b,a);if((b|a)>>>0<=65535){d=e;break}d=((e>>>0)/(a>>>0)>>>0|0)==(b|0)?e:-1}}while(0);b=cz(d)|0;if((b|0)==0){return b|0}if((c[b-4>>2]&3|0)==0){return b|0}cG(b|0,0,d|0);return b|0}function cC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=cz(b)|0;return d|0}if(b>>>0>4294967231){c[aJ()>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=cE(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=cz(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;cH(f|0,a|0,g>>>0<b>>>0?g:b);cA(a);d=f;return d|0}
function cD(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;do{if((c[13942]|0)==0){b=as(8)|0;if((b-1&b|0)==0){c[13944]=b;c[13943]=b;c[13945]=-1;c[13946]=2097152;c[13947]=0;c[14127]=0;c[13942]=aM(0)&-16^1431655768;break}else{av();return 0;return 0}}}while(0);if(a>>>0>=4294967232){d=0;return d|0}b=c[14022]|0;if((b|0)==0){d=0;return d|0}e=c[14019]|0;do{if(e>>>0>(a+40|0)>>>0){f=c[13944]|0;g=$(((((((-40-a|0)-1|0)+e|0)+f|0)>>>0)/(f>>>0)>>>0)-1|0,f);h=b;i=56512;while(1){j=c[i>>2]|0;if(j>>>0<=h>>>0){if((j+(c[i+4>>2]|0)|0)>>>0>h>>>0){k=i;break}}j=c[i+8>>2]|0;if((j|0)==0){k=0;break}else{i=j}}if((c[k+12>>2]&8|0)!=0){break}i=aI(0)|0;h=k+4|0;if((i|0)!=((c[k>>2]|0)+(c[h>>2]|0)|0)){break}j=aI(-(g>>>0>2147483646?-2147483648-f|0:g)|0)|0;l=aI(0)|0;if(!((j|0)!=-1&l>>>0<i>>>0)){break}j=i-l|0;if((i|0)==(l|0)){break}c[h>>2]=(c[h>>2]|0)-j|0;c[14124]=(c[14124]|0)-j|0;h=c[14022]|0;m=(c[14019]|0)-j|0;j=h;n=h+8|0;if((n&7|0)==0){o=0}else{o=-n&7}n=m-o|0;c[14022]=j+o|0;c[14019]=n;c[j+(o+4|0)>>2]=n|1;c[j+(m+4|0)>>2]=40;c[14023]=c[13946]|0;d=(i|0)!=(l|0)&1;return d|0}}while(0);if((c[14019]|0)>>>0<=(c[14023]|0)>>>0){d=0;return d|0}c[14023]=-1;d=0;return d|0}function cE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[14020]|0;if(g>>>0<j>>>0){av();return 0;return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){av();return 0;return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){av();return 0;return 0}if((k|0)==0){if(b>>>0<256){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[13944]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4|0)>>2]=k|3;c[l>>2]=c[l>>2]|1;cF(g+b|0,k);n=a;return n|0}if((i|0)==(c[14022]|0)){k=(c[14019]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4|0)>>2]=l|1;c[14022]=g+b|0;c[14019]=l;n=a;return n|0}if((i|0)==(c[14021]|0)){l=(c[14018]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15){c[d>>2]=e&1|b|2;c[g+(b+4|0)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4|0)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4|0)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[14018]=q;c[14021]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L865:do{if(m>>>0<256){l=c[g+(f+8|0)>>2]|0;k=c[g+(f+12|0)>>2]|0;o=56104+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){av();return 0;return 0}if((c[l+12>>2]|0)==(i|0)){break}av();return 0;return 0}}while(0);if((k|0)==(l|0)){c[14016]=c[14016]&(1<<e^-1);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){av();return 0;return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}av();return 0;return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24|0)>>2]|0;t=c[g+(f+12|0)>>2]|0;L886:do{if((t|0)==(o|0)){u=g+(f+20|0)|0;v=c[u>>2]|0;do{if((v|0)==0){w=g+(f+16|0)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break L886}else{z=x;A=w;break}}else{z=v;A=u}}while(0);while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){av();return 0;return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8|0)>>2]|0;if(u>>>0<j>>>0){av();return 0;return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){av();return 0;return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{av();return 0;return 0}}}while(0);if((s|0)==0){break}t=g+(f+28|0)|0;l=56368+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[14017]=c[14017]&(1<<c[t>>2]^-1);break L865}else{if(s>>>0<(c[14020]|0)>>>0){av();return 0;return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L865}}}while(0);if(y>>>0<(c[14020]|0)>>>0){av();return 0;return 0}c[y+24>>2]=s;o=c[g+(f+16|0)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20|0)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[14020]|0)>>>0){av();return 0;return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4|0)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;cF(g+b|0,q);n=a;return n|0}return 0}function cF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L941:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[14020]|0;if(i>>>0<l>>>0){av()}if((j|0)==(c[14021]|0)){m=d+(b+4|0)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[14018]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h|0)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h|0)>>2]|0;q=c[d+(12-h|0)>>2]|0;r=56104+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){av()}if((c[p+12>>2]|0)==(j|0)){break}av()}}while(0);if((q|0)==(p|0)){c[14016]=c[14016]&(1<<m^-1);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){av()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}av()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h|0)>>2]|0;t=c[d+(12-h|0)>>2]|0;L975:do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4|0)|0;w=c[v>>2]|0;do{if((w|0)==0){x=d+u|0;y=c[x>>2]|0;if((y|0)==0){z=0;break L975}else{A=y;B=x;break}}else{A=w;B=v}}while(0);while(1){v=A+20|0;w=c[v>>2]|0;if((w|0)!=0){A=w;B=v;continue}v=A+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{A=w;B=v}}if(B>>>0<l>>>0){av()}else{c[B>>2]=0;z=A;break}}else{v=c[d+(8-h|0)>>2]|0;if(v>>>0<l>>>0){av()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){av()}u=t+8|0;if((c[u>>2]|0)==(r|0)){c[w>>2]=t;c[u>>2]=v;z=t;break}else{av()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h|0)|0;l=56368+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=z;if((z|0)!=0){break}c[14017]=c[14017]&(1<<c[t>>2]^-1);n=j;o=k;break L941}else{if(m>>>0<(c[14020]|0)>>>0){av()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=z}else{c[m+20>>2]=z}if((z|0)==0){n=j;o=k;break L941}}}while(0);if(z>>>0<(c[14020]|0)>>>0){av()}c[z+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[14020]|0)>>>0){av()}else{c[z+16>>2]=t;c[t+24>>2]=z;break}}}while(0);t=c[d+(r+4|0)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[14020]|0)>>>0){av()}else{c[z+20>>2]=t;c[t+24>>2]=z;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[14020]|0;if(e>>>0<a>>>0){av()}z=d+(b+4|0)|0;A=c[z>>2]|0;do{if((A&2|0)==0){if((f|0)==(c[14022]|0)){B=(c[14019]|0)+o|0;c[14019]=B;c[14022]=n;c[n+4>>2]=B|1;if((n|0)!=(c[14021]|0)){return}c[14021]=0;c[14018]=0;return}if((f|0)==(c[14021]|0)){B=(c[14018]|0)+o|0;c[14018]=B;c[14021]=n;c[n+4>>2]=B|1;c[n+B>>2]=B;return}B=(A&-8)+o|0;s=A>>>3;L1040:do{if(A>>>0<256){g=c[d+(b+8|0)>>2]|0;t=c[d+(b+12|0)>>2]|0;h=56104+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){av()}if((c[g+12>>2]|0)==(f|0)){break}av()}}while(0);if((t|0)==(g|0)){c[14016]=c[14016]&(1<<s^-1);break}do{if((t|0)==(h|0)){C=t+8|0}else{if(t>>>0<a>>>0){av()}m=t+8|0;if((c[m>>2]|0)==(f|0)){C=m;break}av()}}while(0);c[g+12>>2]=t;c[C>>2]=g}else{h=e;m=c[d+(b+24|0)>>2]|0;l=c[d+(b+12|0)>>2]|0;L1061:do{if((l|0)==(h|0)){i=d+(b+20|0)|0;p=c[i>>2]|0;do{if((p|0)==0){q=d+(b+16|0)|0;v=c[q>>2]|0;if((v|0)==0){D=0;break L1061}else{E=v;F=q;break}}else{E=p;F=i}}while(0);while(1){i=E+20|0;p=c[i>>2]|0;if((p|0)!=0){E=p;F=i;continue}i=E+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{E=p;F=i}}if(F>>>0<a>>>0){av()}else{c[F>>2]=0;D=E;break}}else{i=c[d+(b+8|0)>>2]|0;if(i>>>0<a>>>0){av()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){av()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;D=l;break}else{av()}}}while(0);if((m|0)==0){break}l=d+(b+28|0)|0;g=56368+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=D;if((D|0)!=0){break}c[14017]=c[14017]&(1<<c[l>>2]^-1);break L1040}else{if(m>>>0<(c[14020]|0)>>>0){av()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=D}else{c[m+20>>2]=D}if((D|0)==0){break L1040}}}while(0);if(D>>>0<(c[14020]|0)>>>0){av()}c[D+24>>2]=m;h=c[d+(b+16|0)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[14020]|0)>>>0){av()}else{c[D+16>>2]=h;c[h+24>>2]=D;break}}}while(0);h=c[d+(b+20|0)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[14020]|0)>>>0){av()}else{c[D+20>>2]=h;c[h+24>>2]=D;break}}}while(0);c[n+4>>2]=B|1;c[n+B>>2]=B;if((n|0)!=(c[14021]|0)){G=B;break}c[14018]=B;return}else{c[z>>2]=A&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;G=o}}while(0);o=G>>>3;if(G>>>0<256){A=o<<1;z=56104+(A<<2)|0;D=c[14016]|0;b=1<<o;do{if((D&b|0)==0){c[14016]=D|b;H=z;I=56104+(A+2<<2)|0}else{o=56104+(A+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[14020]|0)>>>0){H=d;I=o;break}av()}}while(0);c[I>>2]=n;c[H+12>>2]=n;c[n+8>>2]=H;c[n+12>>2]=z;return}z=n;H=G>>>8;do{if((H|0)==0){J=0}else{if(G>>>0>16777215){J=31;break}I=(H+1048320|0)>>>16&8;A=H<<I;b=(A+520192|0)>>>16&4;D=A<<b;A=(D+245760|0)>>>16&2;o=(14-(b|I|A)|0)+(D<<A>>>15)|0;J=G>>>((o+7|0)>>>0)&1|o<<1}}while(0);H=56368+(J<<2)|0;c[n+28>>2]=J;c[n+20>>2]=0;c[n+16>>2]=0;o=c[14017]|0;A=1<<J;if((o&A|0)==0){c[14017]=o|A;c[H>>2]=z;c[n+24>>2]=H;c[n+12>>2]=n;c[n+8>>2]=n;return}if((J|0)==31){K=0}else{K=25-(J>>>1)|0}J=G<<K;K=c[H>>2]|0;while(1){if((c[K+4>>2]&-8|0)==(G|0)){break}L=K+16+(J>>>31<<2)|0;H=c[L>>2]|0;if((H|0)==0){M=826;break}else{J=J<<1;K=H}}if((M|0)==826){if(L>>>0<(c[14020]|0)>>>0){av()}c[L>>2]=z;c[n+24>>2]=K;c[n+12>>2]=n;c[n+8>>2]=n;return}L=K+8|0;M=c[L>>2]|0;J=c[14020]|0;if(K>>>0<J>>>0){av()}if(M>>>0<J>>>0){av()}c[M+12>>2]=z;c[L>>2]=z;c[n+8>>2]=M;c[n+12>>2]=K;c[n+24>>2]=0;return}function cG(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function cH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function cI(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function cJ(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function cK(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(D=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function cL(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(D=e,a-c>>>0|0)|0}function cM(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}D=a<<c-32;return 0}function cN(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=0;return b>>>c-32|0}function cO(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=(b|0)<0?-1:0;return b>>c-32|0}function cP(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function cQ(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function cR(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=$(d,c);f=a>>>16;a=(e>>>16)+$(d,f)|0;d=b>>>16;b=$(d,c);return(D=((a>>>16)+$(d,f)|0)+(((a&65535)+b|0)>>>16)|0,0|(a+b<<16|e&65535))|0}function cS(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=cL(e^a,f^b,e,f)|0;b=D;a=g^e;e=h^f;f=cL(cX(i,b,cL(g^c,h^d,g,h)|0,D,0)^a,D^e,a,e)|0;return(D=D,f)|0}function cT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=cL(h^a,j^b,h,j)|0;b=D;cX(m,b,cL(k^d,l^e,k,l)|0,D,g);l=cL(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=D;i=f;return(D=j,l)|0}function cU(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=cR(e,a)|0;f=D;return(D=($(b,a)+$(d,e)|0)+f|f&0,0|c&-1)|0}function cV(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=cX(a,b,c,d,0)|0;return(D=D,e)|0}function cW(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;cX(a,b,d,e,g);i=f;return(D=c[g+4>>2]|0,c[g>>2]|0)|0}function cX(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(D=n,o)|0}else{if(!m){n=0;o=0;return(D=n,o)|0}c[f>>2]=a&-1;c[f+4>>2]=b&0;n=0;o=0;return(D=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(D=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(D=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=0|a&-1;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((cQ(l|0)|0)>>>0);return(D=n,o)|0}p=(cP(l|0)|0)-(cP(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}else{if(!m){r=(cP(l|0)|0)-(cP(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=((cP(j|0)|0)+33|0)-(cP(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=0|a&-1;return(D=n,o)|0}else{p=cQ(j|0)|0;n=0|i>>>(p>>>0);o=i<<32-p|g>>>(p>>>0)|0;return(D=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;E=u;F=t;G=0;H=0}else{g=0|d&-1;d=k|e&0;e=cK(g,d,-1,-1)|0;k=D;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=0|(u<<1|i>>>31);a=u>>>31|v<<1|0;cL(e,k,j,a);b=D;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=cL(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=D;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;E=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=0|F;c[f+4>>2]=E|0}n=(0|K)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(D=n,o)|0}function cY(a,b){a=a|0;b=b|0;return aO[a&3](b|0)|0}function cZ(a,b){a=a|0;b=b|0;aP[a&15](b|0)}function c_(a,b,c){a=a|0;b=b|0;c=c|0;aQ[a&7](b|0,c|0)}function c$(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return aR[a&15](b|0,c|0,d|0,e|0,f|0)|0}function c0(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aS[a&3](b|0,c|0,d|0)}function c1(a){a=a|0;aT[a&1]()}function c2(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return aU[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function c3(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return aV[a&15](b|0,c|0,d|0,e|0)|0}function c4(a,b,c){a=a|0;b=b|0;c=c|0;return aW[a&31](b|0,c|0)|0}function c5(a){a=a|0;aa(0);return 0}function c6(a){a=a|0;aa(1)}function c7(a,b){a=a|0;b=b|0;aa(2)}function c8(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(3);return 0}function c9(a,b,c){a=a|0;b=b|0;c=c|0;aa(4)}function da(){aa(5)}function db(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;aa(6);return 0}function dc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aa(7);return 0}function dd(a,b){a=a|0;b=b|0;aa(8);return 0}
// EMSCRIPTEN_END_FUNCS
var aO=[c5,c5,cv,c5];var aP=[c6,c6,bG,c6,cm,c6,cn,c6,cu,c6,cb,c6,bH,c6,cc,c6];var aQ=[c7,c7,cj,c7,bI,c7,c7,c7];var aR=[c8,c8,bR,c8,bL,c8,bT,c8,bP,c8,bQ,c8,c8,c8,c8,c8];var aS=[c9,c9,cs,c9];var aT=[da,da];var aU=[db,db,bS,db,bN,db,db,db];var aV=[dc,dc,cq,dc,b8,dc,b7,dc,ce,dc,dc,dc,dc,dc,dc,dc];var aW=[dd,dd,ck,dd,b9,dd,cx,dd,bC,dd,cp,dd,bJ,dd,bV,dd,bK,dd,ct,dd,co,dd,ca,dd,cl,dd,cd,dd,dd,dd,dd,dd];return{_memcmp:cI,_strlen:cJ,_free:cA,_memcpy:cH,_realloc:cC,_VorbisGetChannels:a9,_VorbisDestroy:bh,_VorbisHeaderDecode:bf,_memset:cG,_VorbisGetComment:bc,_VorbisDecode:bg,_VorbisInit:be,_calloc:cB,_malloc:cz,_VorbisGetNumComments:bb,_VorbisGetSampleRate:ba,_VorbisProbe:bd,stackAlloc:aX,stackSave:aY,stackRestore:aZ,setThrew:a_,setTempRet0:a$,setTempRet1:a0,setTempRet2:a1,setTempRet3:a2,setTempRet4:a3,setTempRet5:a4,setTempRet6:a5,setTempRet7:a6,setTempRet8:a7,setTempRet9:a8,dynCall_ii:cY,dynCall_vi:cZ,dynCall_vii:c_,dynCall_iiiiii:c$,dynCall_viii:c0,dynCall_v:c1,dynCall_iiiiiiiii:c2,dynCall_iiiii:c3,dynCall_iii:c4}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "copyTempDouble": copyTempDouble, "copyTempFloat": copyTempFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiiii": invoke_iiiiii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_iiiii": invoke_iiiii, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_fabsf": _fabsf, "_sysconf": _sysconf, "_rint": _rint, "_ldexp": _ldexp, "_abort": _abort, "_AVCallback": _AVCallback, "_log": _log, "_floor": _floor, "___setErrNo": ___setErrNo, "_qsort": _qsort, "_sqrt": _sqrt, "_exit": _exit, "_sin": _sin, "_atan": _atan, "_ceil": _ceil, "_cos": _cos, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_llvm_lifetime_start": _llvm_lifetime_start, "_exp": _exp, "_time": _time, "__exit": __exit, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity }, buffer);
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _VorbisGetChannels = Module["_VorbisGetChannels"] = asm["_VorbisGetChannels"];
var _VorbisDestroy = Module["_VorbisDestroy"] = asm["_VorbisDestroy"];
var _VorbisHeaderDecode = Module["_VorbisHeaderDecode"] = asm["_VorbisHeaderDecode"];
var _memset = Module["_memset"] = asm["_memset"];
var _VorbisGetComment = Module["_VorbisGetComment"] = asm["_VorbisGetComment"];
var _VorbisDecode = Module["_VorbisDecode"] = asm["_VorbisDecode"];
var _VorbisInit = Module["_VorbisInit"] = asm["_VorbisInit"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _VorbisGetNumComments = Module["_VorbisGetNumComments"] = asm["_VorbisGetNumComments"];
var _VorbisGetSampleRate = Module["_VorbisGetSampleRate"] = asm["_VorbisGetSampleRate"];
var _VorbisProbe = Module["_VorbisProbe"] = asm["_VorbisProbe"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
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
    var callbacks = [];
function AVMakeCallback(fn) {
    callbacks.push(fn);
    return callbacks.length - 1;
}

function AVRemoveCallback(callback) {
    callbacks.splice(callback, 1);
}    
    var VorbisInit = Module.cwrap('VorbisInit', '*', ['*', 'number']);
    var VorbisHeaderDecode = Module.cwrap('VorbisHeaderDecode', 'number', ['*', '*', 'number']);
    var VorbisGetChannels = Module.cwrap('VorbisGetChannels', 'number', ['*']);
    var VorbisGetSampleRate = Module.cwrap('VorbisGetSampleRate', 'number', ['*']);
    var VorbisGetNumComments = Module.cwrap('VorbisGetNumComments', 'number', '*');
    var VorbisGetComment = Module.cwrap('VorbisGetComment', 'string', ['*', 'number']);
    var VorbisDecode = Module.cwrap('VorbisDecode', null, ['*', '*', 'number']);
    var VorbisDestroy = Module.cwrap('VorbisDestroy', null, ['*']);
    
    this.prototype.init = function() {
        this.buflen = 4096;
        this.buf = _malloc(this.buflen);
        this.headers = 1;
        
        this.outlen = 4096;
        this.outbuf = _malloc(this.outlen << 2);
        this.decodedBuffer = null;
        
        this.vorbis = VorbisInit(this.outbuf, this.outlen);
        
        var self = this;
        var offset = self.outbuf >> 2;
        
        this.callback = AVMakeCallback(function(len) {
            var samples = Module.HEAPF32.subarray(offset, offset + len);
            self.decodedBuffer = new Float32Array(samples);
        });
    };
    
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
        var status = 0;
        if ((status = VorbisDecode(this.vorbis, this.buf, packet.length, this.callback)) !== 0)
            throw new Error("Vorbis decoding error: " + status);
            
        return this.decodedBuffer;
    };
    
    // vorbis demuxer plugin for Ogg
    AV.OggDemuxer.plugins.push({
        magic: "\001vorbis",
        
        init: function() {
            this.vorbis = VorbisInit();
            this.buflen = 4096;
            this.buf = _malloc(this.buflen);
            this.headers = 3;
            this.headerBuffers = [];
        },
    
        readHeaders: function(packet) {
            if (this.buflen < packet.length) {
                this.buf = _realloc(this.buf, packet.length);
                this.buflen = packet.length;
            }
            
            Module.HEAPU8.set(packet, this.buf);
            if (VorbisHeaderDecode(this.vorbis, this.buf, packet.length) !== 0)
                throw new Error("Invalid vorbis header");
                
            this.headerBuffers.push(packet);
            
            if (--this.headers === 0) {
                this.emit('format', {
                    formatID: 'vorbis',
                    sampleRate: VorbisGetSampleRate(this.vorbis),
                    channelsPerFrame: VorbisGetChannels(this.vorbis),
                    floatingPoint: true
                });
                
                var comments = VorbisGetNumComments(this.vorbis);
                this.metadata = {};
                for (var i = 0; i < comments; i++) {
                    var comment = VorbisGetComment(this.vorbis, i),
                        idx = comment.indexOf('=');
                    
                    this.metadata[comment.slice(0, idx).toLowerCase()] = comment.slice(idx + 1);
                }
                
                this.emit('metadata', this.metadata);
                
                VorbisDestroy(this.vorbis);
                _free(this.buf);
                this.vorbis = null;
                
                for (var i = 0; i < 3; i++)
                    this.emit('data', new AV.Buffer(this.headerBuffers[i]));
            }
            
            return this.headers === 0;
        },
        
        readPacket: function(packet) {
            this.emit('data', new AV.Buffer(packet));
        }
    });
});