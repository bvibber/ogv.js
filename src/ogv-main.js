OgvJs = (function() {
    
    var Module = {
    	noInitialRun: true,
    	noExitRuntime: true,
    	print: function(str) {
    		console.log("OgvJs: " + str);
    	}
    };
    //import "../build/ogv-libs.js"
    
    var OgvJsInit = Module.cwrap('OgvJsInit', 'void', []);
    var OgvJsDestroy = Module.cwrap('OgvJsDestroy', 'void', []);
    var OgvJsReceiveInput = Module.cwrap('OgvJsReceiveInput', 'void', ['*', 'number']);
    var OgvJsProcess = Module.cwrap('OgvJsProcess', 'int', []);

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
		
		/**
		 * @param ArrayBuffer data
		 */
		receiveInput: function(data) {
			// Map the blob into a buffer in emscripten's runtime heap
			var len = data.byteLength;
			var buffer = reallocInputBuffer(len);
			Module.HEAPU8.set(new Uint8Array(data), buffer);

			console.log("receiving! " + buffer + "; " + len);
			OgvJsReceiveInput(buffer, len);
			console.log("received...?");
		},
		
		process: function() {
			return OgvJsProcess();
		}
	};
});
