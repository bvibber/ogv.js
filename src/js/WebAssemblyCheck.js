function testSafariWebAssemblyBug() {
    /*
        Source of module at https://github.com/brion/min-wasm-fail
        (module
            (memory 1)
            (func $test (param $loc i32) (result i32)
                ;; Safari on iOS 11.2.5 returns 0 when asked to modify and read loc 4
                ;; via a parameter. If using an i32.const or a local for the location,
                ;; it works as expected.
                get_local $loc
                i32.const 1
                i32.store
                get_local $loc
                i32.load
            )
            (export "test" (func $test))
        )
    */
    let bin = new Uint8Array([0,97,115,109,1,0,0,0,1,6,1,96,1,127,1,127,3,2,1,0,5,3,1,0,1,7,8,1,4,116,101,115,116,0,0,10,16,1,14,0,32,0,65,1,54,2,0,32,0,40,2,0,11]);
    let mod = new WebAssembly.Module(bin);
    let inst = new WebAssembly.Instance(mod, {});

    // test storing to and loading from a non-zero location via a parameter.
    // Safari on iOS 11.2.5 returns 0 unexpectedly at non-zero locations
    return (inst.exports.test(4) !== 0);
}

class WebAssemblyChecker {
    constructor() {
        this.tested = false;
        this.testResult = undefined;
    }

    /**
     * Check if WebAssembly appears to be present and working.
     * Tests for presence of the APIs, and runs a test for a known bug
     * in Safari/WebKit on iOS 11.2.2-11.2.5.
     *
     * @return boolean do we think wasm will work on this device?
     */
    wasmSupported() {
        if (!this.tested) {
            try {
                if (typeof WebAssembly === 'object') {
                    this.testResult = testSafariWebAssemblyBug();
                } else {
                    this.testResult = false;
                }
            } catch (e) {
                // Something else went wrong with compilation.
                console.log('Exception while testing WebAssembly', e);
                this.testResult = false;
            }
            this.tested = true;
        }
        return this.testResult;
    }
}

let WebAssemblyCheck = new WebAssemblyChecker();

export default WebAssemblyCheck;
