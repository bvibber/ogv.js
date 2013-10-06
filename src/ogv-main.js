var OgvJs = (function() {
    
    var Module = {};
    //import "../build/ogv-libs.js"
    
    var OgvJsInit = Module.cwrap('OgvJsInit', '*', ['*', 'number']);
    var OgvJsDestroy = Module.cwrap('OgvJsInit', '*', ['*', 'void']);

	return {
		init: function() {
			OgvJsInit();
			console.log("ogv.js initialized");
		},
		
		destroy: function() {
			OgvJsDestroy();
			console.log("ogv.js destroyed");
		}
	};
})();
