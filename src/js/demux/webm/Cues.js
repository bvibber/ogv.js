'use strict';
/**
 * @classdesc This class keeps track of keyframes for seeking
 * 
 */

class Cues {

    constructor(dataView) {
        this.dataView = dataView;
        this.offset;
        this.dataOffset;
        this.size;
        this.segment;
        this.cuePoints = [];
        this.count;
        this.preloadCount;
        //this.position;
    }

    getCount() {
        return this.cuePoints.length;
    }

    init() {

    }

    preloadCuePoint() {

    }

    find() {

    }

    getFirst() {

    }

    getLast() {

    }

    getNext() {

    }

    getBlock() {

    }

    findOrPreloadCluster() {

    }

}

module.exports = cues;