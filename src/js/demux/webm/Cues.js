'use strict';
/**
 * @classdesc This class keeps track of keyframes for seeking
 * 
 */

class Cues {

    constructor(cuesHeader, dataInterface, demuxer) {
        this.dataInterface = dataInterface;
        this.offset = cuesHeader.offset;
        this.size = cuesHeader.size;
        this.end = cuesHeader.end;
        this.entries = [];
        this.loaded = false;
        this.tempEntry = null;
        this.currentElement = null;
    }

    load() {
        var end = this.end;
        while (this.dataInterface.offset < end) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0xBB: //CuePoint
                    if (!this.tempEntry)
                        this.tempEntry = new CuePoint(this.currentElement, this.dataInterface);
                    this.tempEntry.load();
                    if (!this.tempEntry.loaded)
                        return;
                    else
                        this.entries.push(this.tempEntry);
                    break;
                    //TODO, ADD VOID
                default:
                    console.warn("Cue Head element not found"); // probably bad
                    break;

            }

            this.tempEntry = null;
            this.currentElement = null;
        }


        if (this.dataInterface.offset !== this.end) {
            console.log(this);
            throw "INVALID CUE FORMATTING"
        }

        this.loaded = true;
        console.warn(this);
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

class CuePoint {

    constructor(cuesPointHeader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = cuesPointHeader.offset;
        this.size = cuesPointHeader.size;
        this.end = cuesPointHeader.end;
        this.loaded = false;
        this.tempElement = null;
        this.currentElement = null;
        this.cueTime = null;
        this.cueTrackPositions = null;
    }

    load() {
        var end = this.end;
        while (this.dataInterface.offset < end) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {
                case 0xB7: //Cue Track Positions
                    if (!this.tempElement)
                        this.tempElement = new CueTrackPositions(this.currentElement, this.dataInterface);
                    this.tempElement.load();
                    if (!this.tempElement.loaded)
                        return;
                    break;

                case 0xB3: //Cue Time 
                    var cueTime = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (cueTime !== null)
                        this.cueTime = cueTime;
                    else
                        return null;
                    break;



                default:
                    console.warn("Cue Point not found, skipping");
                    break;

            }

            this.currentElement = null;
        }

        this.loaded = true;
    }

}


class CueTrackPositions {

    constructor(cuesPointHeader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = cuesPointHeader.offset;
        this.size = cuesPointHeader.size;
        this.end = cuesPointHeader.end;
        this.loaded = false;
        this.tempElement = null;
        this.currentElement = null;
        this.cueTrack = null;
        this.cueClusterPosition = 0;
        this.cueRelativePosition = 0;
    }

    load() {

        while (this.dataInterface.offset < this.end) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0xF7: //CueTrack
                    var cueTrack = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (cueTrack !== null)
                        this.cueTrack = cueTrack;
                    else
                        return null;
                    break;

                case 0xF1: //Cue ClusterPosition 
                    var cueClusterPosition = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (cueClusterPosition !== null)
                        this.cueClusterPosition = cueClusterPosition;
                    else
                        return null;
                    break;

                case 0xF0: //CueRelativePosition
                    var cueRelativePosition = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (cueRelativePosition !== null)
                        this.cueRelativePosition = cueRelativePosition;
                    else
                        return null;
                    break;

                default:
                    console.warn("Cue track positions not found! " + this.currentElement.id);
                    break;

            }

            this.currentElement = null;
        }

        if (this.dataInterface.offset !== this.end)
            console.error("Invalid Seek Formatting");

        this.loaded = true;
    }

}

module.exports = Cues;