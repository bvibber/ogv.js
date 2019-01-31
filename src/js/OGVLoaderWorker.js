/* global importScripts */

import OGVLoaderBase from './OGVLoaderBase.js';

class OGVLoaderWorker extends OGVLoaderBase {
    loadScript(src, callback) {
        importScripts(src);
        callback();
    }

    getGlobal() {
        return self;
    }
}

let OGVLoader = new OGVLoaderWorker();

export default OGVLoader;
