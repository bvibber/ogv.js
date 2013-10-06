var OgvJs = (function() {
    
    var Module = {};
    //import "../build/ogv-libs.js"
    
    var OgvJsInit = Module.cwrap('OgvJsInit', 'void', []);
    var OgvJsDestroy = Module.cwrap('OgvJsDestroy', 'void', []);
    var OgvJsProcessInput = Module.cwrap('OgvJsProcessInput', 'void', ['*', 'number']);

	var inputBuffer, inputBufferSize;
	function reallocInputBuffer(size) {
		if (inputBuffer && inputBufferSize >= size) {
			// We're cool
			return inputBuffer;
		}
		if (inputBuffer) {
			Module._free(inputBuffer);
		}
		inputBufferSize = size;
		inputBuffer = Module._malloc(inputBufferSize);
		return inputBuffer;
	}

	return {
		init: function() {
			OgvJsInit();
			console.log("ogv.js initialized");
		},
		
		destroy: function() {
			if (inputBuffer) {
				Module._free(inputBuffer);
				inputBuffer = undefined;
			}
			OgvJsDestroy();
			console.log("ogv.js destroyed");
		},
		
		processInput: function(blob) {
			// Map the blob into a buffer in emscripten's runtime heap
			var buffer = reallocInputBuffer(blob.size);
			Module.HEAPU8.set(new Uint8Array(blob), buffer);

			OgvJsProcessInput(buffer, blob.size);
		}
	};
})();
