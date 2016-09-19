'use strict';

var DataInterface = require('./DataInterface.js');
var SeekHead = require('./SeekHead.js');
var SegmentInfo = require('./SegmentInfo.js');
var Tracks = require('./Tracks.js');
var Cluster = require('./Cluster.js');


//States
var INITIAL_STATE = 0;
var HEADER_LOADED = 1;
var SEGMENT_LOADED = 2;
var META_LOADED = 3;
var EXIT_OK = 666;


var STATE_BEGIN = 0;
var STATE_DECODING = 1;
var STATE_SEEKING = 2;

var getTimestamp;
if (typeof performance === 'undefined' || typeof performance.now === 'undefined') {
    getTimestamp = Date.now;
} else {
    getTimestamp = performance.now.bind(performance);
}


class OGVDemuxerWebM {

    constructor() {
        this.shown = false; // for testin
        this.clusters = [];
        this.segmentInfo = [];
        this.state = INITIAL_STATE;
        this.videoPackets = [];
        this.audioPackets = [];
        this.loadedMetadata = false;
        this.seekable = true;
        this.dataInterface = new DataInterface();
        this.segment = null;
        this.currentElement = null; // placeholder for last element
        this.segmentIsLoaded = false; // have we found the segment position
        this.segmentDataOffset;
        this.headerIsLoaded = false;
        this.currentElement = null;
        this.segmentInfo = null; // assuming 1 for now
        this.tracks = null;
        this.currentCluster = null;
        this.cpuTime = 0;

        Object.defineProperty(this, 'duration', {
            get: function () {
                if(this.segmentInfo.duration < 0)
                    return -1;
                return this.segmentInfo.duration / 1000;// / 1000000000.0; ;
            }
        });

        Object.defineProperty(this, 'frameReady', {
            get: function () {
                return this.videoPackets.length > 0;
            }
        });

        Object.defineProperty(this, 'hasAudio', {
            get: function () {
                if (this.loadedMetadata && this.audioCodec) {
                    return true;
                } else {
                    return false;
                }
            }
        });


        Object.defineProperty(this, 'audioFormat', {
            get: function () {                  
                var channels;
                var rate;
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry.trackType === 2) { // audio track
                        channels = trackEntry.channels;
                        rate = trackEntry.rate;
                        break;
                    }
                }
                //console.error("channels : " + channels + "rate : " + rate);
                var test;
                return test;
                return {
                    channels: channels,
                    rate: rate
                };
            }
        });
        
        Object.defineProperty(this, 'videoFormat', {
            get: function () {
                var tempTrack;
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry.trackType === 1) { // video track
                        tempTrack = trackEntry;
                        break;
                    }
                }

                return {
                    frameWidth: tempTrack.width,
                    frameHeight: tempTrack.height,
                    hdec: 1,
                    vdec: 1,
                    fps: 0,
                    picWidth: tempTrack.width - tempTrack.pixelCropLeft - tempTrack.pixelCropRight,
                    picHeight: tempTrack.height - tempTrack.pixelCropTop - tempTrack.pixelCropBottom,
                    picX: tempTrack.pixelCropLeft,
                    picY: tempTrack.pixelCropTop,
                    displayWidth: tempTrack.displayWidth,
                    displayHeight: tempTrack.displayHeight
                };
            }
        });

        Object.defineProperty(this, 'audioReady', {
            get: function () {
                return this.audioPackets.length > 0;
            }
        });

        Object.defineProperty(this, 'audioTimestamp', {
            get: function () {
                if (this.audioPackets.length > 0) {
                    return this.audioPackets[0].timestamp;
                } else {
                    return -1;
                }
            }
        });

        Object.defineProperty(this, 'frameTimestamp', {
            get: function () {
                if (this.videoPackets.length > 0) {
                    return this.videoPackets[0].timestamp;
                } else {
                    return -1;
                }
            }
        });

        Object.defineProperty(this, 'keyframeTimestamp', {
            get: function () {
                if (this.videoPackets.length > 0) {
                    return this.videoPackets[0].keyframeTimestamp;
                } else {
                    return -1;
                }
            }
        });

        Object.defineProperty(this, 'hasVideo', {
            get: function () {
                if (this.loadedMetadata && this.videoCodec) {
                    return true;
                } else {
                    return false;
                }
            }
        });

        //Only need this property cause nest egg has it

        Object.defineProperty(this, 'videoCodec', {
            get: function () {
                var codecID;
                //Multiple video tracks are allowed, for now just return the first one
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry.trackType === 1) { // video track
                        codecID = trackEntry.codecID;
                        break;
                    }


                }
                var codecName;
                switch (codecID) {
                    case "V_VP8" :
                        codecName = "vp8";
                        break;
                    default:
                        codecName = null;
                        break;
                }
                ;

                return codecName;

            }
        });


        Object.defineProperty(this, 'audioCodec', {
            get: function () {
                var codecID;
                //Multiple video tracks are allowed, for now just return the first one
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry.trackType === 2) {
                        codecID = trackEntry.codecID;
                        break;
                    }


                }
                var codecName;
                switch (codecID) {
                    case "A_VORBIS" :
                        codecName = "vorbis";
                        break;
                    default:
                        codecName = null;
                        break;
                }
                ;

                return codecName;

            }
        });
    }

    time(func) {
        var start = getTimestamp(),
                ret;
        ret = func();
        var delta = (getTimestamp() - start);
        this.cpuTime += delta;
        //console.log('demux time ' + delta);
        return ret;
    }

    init(callback) {

        callback();
    }

    receiveInput(data, callback) {
        var ret = this.time(function () {
            //this.bufferQueue.push(new DataView(data));
            this.dataInterface.recieveInput(data);
        }.bind(this));
        callback();

    }

    process(callback) {
        var start = getTimestamp();
        var status = false;
        //this.processing = true;

        switch (this.state) {
            case INITIAL_STATE:
                this.loadHeader();
                if (this.state !== HEADER_LOADED)
                    break;
            case HEADER_LOADED:
                this.loadSegment();
                if (this.state !== SEGMENT_LOADED)
                    break;
            case SEGMENT_LOADED:
                status = this.loadMeta();
                if (this.state !== META_LOADED)
                    break;
            default:
            //fill this out
        }

        //this.processing = false;
        var delta = (getTimestamp() - start);
        this.cpuTime += delta;
        var result;
        //return status;
        if (status === 1 || status === true) {
            result = 1;
        } else {
            result = 0;
        }

        callback(!!result);
    }

    loadMeta() {
        var status = false;

        while (this.dataInterface.offset < this.segment.end) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0x114D9B74: //Seek Head
                    if (!this.seekHead)
                        this.seekHead = new SeekHead(this.currentElement, this.dataInterface);
                    this.seekHead.load();
                    if (!this.seekHead.loaded)
                        return false;
                    break;

                case 0xEC: //VOid
                    if (!this.dataInterface.peekBytes(this.currentElement.size))
                        return false;
                    else
                        this.dataInterface.skipBytes(this.currentElement.size);

                    console.log("FOUND VOID, SKIPPING");
                    break;

                case 0x1549A966: //Info
                    if (!this.segmentInfo)
                        this.segmentInfo = new SegmentInfo(this.currentElement, this.dataInterface);
                    this.segmentInfo.load();
                    if (!this.segmentInfo.loaded)
                        return false;
                    break;

                case 0x1654AE6B: //Tracks
                    if (!this.tracks)
                        this.tracks = new Tracks(this.currentElement, this.dataInterface, this);
                    this.tracks.load();
                    if (!this.tracks.loaded)
                        return false;
                    break;

                case 0x1F43B675: //Cluster
                    if (!this.currentCluster){
                        var metaWasLoaded = this.loadedMetadata; 
                        this.currentCluster = new Cluster(this.currentElement, this.dataInterface, this);
                        if(this.loadedMetadata && !metaWasLoaded)
                            return true;
                    }
                    status = this.currentCluster.load();
                    if (!this.currentCluster.loaded){
                       return status;                      
                    }
                        
                    this.clusters.push(this.currentCluster); //TODO: Don't overwrite this, make id's to keep track or something
                    this.currentCluster = null;
                    break;

                default:
                    this.state = META_LOADED;//testing
                    return;
                    console.error("body element not found, skipping, id = " + this.currentElement.id);
                    break;

            }

            this.currentElement = null;
        }

        this.state = META_LOADED;
        return status;
    }

    /**
     * finds the beginnign of the segment. Should modify to allow level 0 voids, apparantly they are possible 
     */
    loadSegment() {
        if (this.state !== HEADER_LOADED)
            console.error("HEADER NOT LOADED");

        if (!this.currentElement)
            this.currentElement = this.dataInterface.peekElement();

        if (!this.currentElement)
            return null;


        switch (this.currentElement.id) {

            case 0x18538067: // Segment
                this.segment = this.currentElement;
                //this.segmentOffset = segmentOffset;
                break;
            case 0xEC: // void
                if (this.dataInterface.peekBytes(this.currentElement.size))
                    this.dataInterface.skipBytes();
                else
                    return null;
                break;
            default:
                console.warn("Global element not found, id: " + this.currentElement.id);
        }


        this.currentElement = null;
        this.segmentIsLoaded = true;
        this.state = SEGMENT_LOADED;
    }

    loadHeader() {
        //Header is small so we can read the whole thing in one pass or just wait for more data if necessary


        //only load it if we didnt already load it
        if (!this.elementEBML) {
            this.elementEBML = this.dataInterface.peekElement();
            if (!this.elementEBML)
                return null;

            if (this.elementEBML.id !== 0x1A45DFA3) { //EBML 
                //If the header has not loaded and the first element is not the header, do not continue
                console.warn('INVALID PARSE, HEADER NOT LOCATED');
            }
        }

        while (this.dataInterface.offset < this.elementEBML.end) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0x4286: //EBMLVersion
                    var version = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (version !== null)
                        this.version = version;
                    else
                        return null;
                    break;

                case 0x42F7: //EBMLReadVersion 
                    var readVersion = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (readVersion !== null)
                        this.readVersion = readVersion;
                    else
                        return null;
                    break;

                case 0x42F2: //EBMLMaxIDLength
                    var maxIdLength = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (maxIdLength !== null)
                        this.maxIdLength = maxIdLength;
                    else
                        return null;
                    break;

                case 0x42F3: //EBMLMaxSizeLength
                    var maxSizeLength = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (maxSizeLength !== null)
                        this.maxSizeLength = maxSizeLength;
                    else
                        return null;
                    break;

                case 0x4282: //DocType
                    var docType = this.dataInterface.readString(this.currentElement.size);
                    if (docType !== null)
                        this.docType = docType;
                    else
                        return null;
                    break;

                case 0x4287: //DocTypeVersion //worked
                    var docTypeVersion = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (docTypeVersion !== null)
                        this.docTypeVersion = docTypeVersion;
                    else
                        return null;
                    break;

                case 0x4285: //DocTypeReadVersion //worked
                    var docTypeReadVersion = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (docTypeReadVersion !== null)
                        this.docTypeReadVersion = docTypeReadVersion;
                    else
                        return null;
                    break;
                default:
                    console.warn("Header element not found, skipping");
                    break;

            }

            this.currentElement = null;
        }

        this.headerIsLoaded = true;
        this.state = HEADER_LOADED;
    }

    dequeueAudioPacket(callback) {
        //console.warn("Dequeing audio");
        
        if (this.audioPackets.length) {
            var packet = this.audioPackets.shift().data;
            callback(packet);
        } else {
            callback(null);
        }
    }

    dequeueVideoPacket(callback) {
        if (this.videoPackets.length) {
            var packet = this.videoPackets.shift().data;
            callback(packet);
        } else {
            callback(null);
        }
    }

    /**
     * Clear the current packet buffers and reset the pointers for new read position
     * @param {function} callback after flush complete
     */
    flush(callback) {
        //Note: was wrapped in a time function but the callback doesnt seem to take that param
        console.warn("flushing");
        this.audioPackets = [];
        this.videoPackets = [];
        console.log(this);
        throw "TEST";
        callback();
    }
    
    getKeypointOffset(timeSeconds, callback) {
        var offset = this.time(function () {
            //return Module._ogv_demuxer_keypoint_offset(timeSeconds * 1000);
            console.warn("need this");
        }.bind(this));
        callback(offset);
    }

}








module.exports = OGVDemuxerWebM;
