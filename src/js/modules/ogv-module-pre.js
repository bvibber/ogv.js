/* global Module:true */
/* global updateGlobalBufferAndViews */
/* global wasmMemory */
/* global buffer */
var options = Module;

// Currently only needed for pthreads builds
function checkMemoryGrowth() {
    if (typeof wasmMemory === 'object' && wasmMemory.buffer !== buffer) {
        updateGlobalBufferAndViews(wasmMemory.buffer);
    }
}
