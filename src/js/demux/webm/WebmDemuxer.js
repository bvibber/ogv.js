'use strict';

var DataInterface = require('./DataInterface.js');
var SeekHead = require('./SeekHead.js');
//States
const INITIAL_STATE = 0;
const HEADER_LOADED = 1;
const SEGMENT_LOADED = 2;
const META_LOADED = 3;
const NO_MARKER = -1;


class OGVDemuxerWebM {

    constructor() {
        this.shown = false; // for testin
        this.bufferQueue = [];
        this.segmentInfo = [];
        this.state = INITIAL_STATE;
        this.videoPackets = [];
        this.audioPackets = [];
        this.loadedMetadata = false;
        this.seekable = false;
        this.dataInterface = new DataInterface();
        this.segment = null;
        this.currentElement = null; // placeholder for last element
        this.segmentIsLoaded = false; // have we found the segment position
        //this.segmentOffset;
        this.segmentDataOffset;
        this.headerIsLoaded = false;
        this.currentElement = null;
        this.markerIsSet = false;
        this.marker = NO_MARKER;

        //Only need this property cause nest egg has it

        Object.defineProperty(this, 'videoCodec', {

            get: function () {
                var codecID;
                //Multiple video tracks are allowed, for now just return the first one
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry instanceof VideoTrack) {
                        codecID = trackEntry.info.codecID;
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
                    if (trackEntry instanceof AudioTrack) {
                        codecID = trackEntry.info.codecID;
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

    init(callback) {
        console.warn("initializing demuxer webm");
        callback();
    }

    receiveInput(data, callback) {

        //this.bufferQueue.push(new DataView(data));
        this.dataInterface.recieveInput(data);
        callback();

    }

    process(callback) {
        this.processing = true;
        console.log("processing");

        
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
                this.loadMeta();
                if (this.state !== META_LOADED)
                    break;
            default:  
            
                if(this.shown === false && this.state === META_LOADED){
                    console.log(this);
                    this.shown = true;
                    return;
                }
        }

        this.processing = false;
        callback();


    }
    
    loadMeta() {
        this.state = META_LOADED;
        return;
        if (!this.currentElement)
            this.currentElement = this.dataInterface.peekElement();

        if (!this.currentElement)
            return null;

        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.segment.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0x114D9B74: //Seek Head
                    if (!this.seekHead)
                        this.seekHead = new SeekHead(seekHead);
                    this.seekHead.load();
                    if (!this.seekHead.loaded)
                        return;
                    break;
                    
                default:
                    console.warn("body element not found, skipping");
                    break;

            }

            this.currentElement = null;
        }
        
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.state = META_LOADED;
    }

    loadSegment() {
        if (!this.currentElement)
            this.currentElement = this.dataInterface.peekElement();
        
        if (!this.currentElement)
            return null;

   
        switch (this.currentElement.id) {
            
            case 0x18538067: // Segment
                    console.log("segment found");
                    this.segment = this.currentElement;
                    //this.segmentOffset = segmentOffset;
                    break;
            case 0xEC: // void
                    console.log("void found");
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


        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.elementEBML.size) {
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
        
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.headerIsLoaded = true;
        this.state = HEADER_LOADED;

    }


    parse() {

        var dataView = this.bufferQueue[0];
        var offset = this.headerSize;

        var end = offset + dataView.byteLength;
        var elementId;
        var elementSize;
        var elementOffset;


        elementId = VINT.read(dataView, offset);
        offset += elementId.width;
        elementSize = VINT.read(dataView, offset);
        offset += elementSize.width;
        console.log("Segment width = " + elementSize.data);

        if (elementId.raw !== 0x18538067) { //segment code
            console.warn('INVALID Segment');
        }




        while (offset < end) {

            //console.log(offset +","+ end);
            elementOffset = offset;
            elementId = VINT.read(dataView, offset);
            offset += elementId.width;
            elementSize = VINT.read(dataView, offset);
            offset += elementSize.width;
            console.log("id is" + elementId.raw);

            switch (elementId.raw) {
                case 0x1549A966: //Info
                    console.log("loading info");
                    var info = new SegmentInfo(dataView);
                    info.offset = elementOffset;
                    info.size = elementSize.data;
                    info.dataOffset = offset;
                    info.parse();
                    this.segmentInfo.push(info);
                    break;

                case 0x1654AE6B: //Tracks
                    this.tracks = new Tracks(dataView);
                    this.tracks.offset = elementOffset;
                    this.tracks.size = elementSize.data;
                    this.tracks.dataOffset = offset;
                    this.tracks.parse();
                    break;
                case 0x1C53BB6B: // Cues
                    this.cues = new Cues(this.dataView);
                    this.cues.offset = elementOffset;
                    this.cues.size = elementSize.data;
                    this.cues.dataOffset = offset;
                    break;
                case 0x114D9B74: //SeekHead
                    this.seekHead = new SeekHead(dataView);
                    this.seekHead.offset = elementOffset;
                    this.seekHead.size = elementSize.data;
                    this.seekHead.dataOffset = offset;
                    this.seekHead.parse();
                    break;

                case 0x1043A770: // Chapters
                    console.log("found chapters");
                    /*
                     this.chapters = new Chapters(this.dataView);
                     this.chapters.offset = elementOffset;
                     this.chapters.size = elementSize.data;
                     this.chapters.dataOffset = offset;
                     this.chapters.parse();
                     */
                    break;
                case 0x1254C367: //Tags
                    console.log("found tags");
                    /*
                     this.tags = new Tags(this.dataView);
                     this.tags.offset = elementOffset;
                     this.tags.size = elementSize.data;
                     this.tags.dataOffset = offset;
                     this.tags.parse();
                     */
                    break;
                    //For now just load cluster data here    
                case 0x1F43B675: //Cluster
                    var cluster;
                    console.log("found cluster");
                    /*
                     cluster = new Cluster(this.dataView);
                     cluster.offset = elementOffset;
                     cluster.size = elementSize.data;
                     cluster.dataOffset = offset;
                     cluster.parse();
                     this.cluster = cluster;
                     */
                    break;

                case 0xEC: //Void
                    //skip it
                    break;
                default:
                    console.warn("not found id = " + elementId.raw);
                    break;


            }





            offset += elementSize.data;

        }
    }

    parseInfo() {

    }

    parseHeader() {

        var dataView = this.bufferQueue[0];
        var offset = 0;//assume header starts at 0 for now
        var headerOffset = offset;
        var elementId;
        var elementSize;

        elementId = VINT.read(dataView, offset);
        offset += elementId.width;
        elementSize = VINT.read(dataView, offset);
        offset += elementSize.width;

        if (elementId.raw !== 0x1A45DFA3) { //EBML code
            // console.warn('INVALID HEADER');
        }



        var end = headerOffset + elementId.width + elementSize.width + elementSize.data; //total header size
        this.headerSize = end - 0;

        while (offset < end) {
            elementId = VINT.read(dataView, offset);
            offset += elementId.width;
            elementSize = VINT.read(dataView, offset);
            offset += elementSize.width;


            switch (elementId.raw) {
                case 0x4286: //EBMLVersion
                    this.version = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x42F7: //EBMLReadVersion
                    this.readVersion = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x42F2: //EBMLMaxIDLength
                    this.maxIdLength = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x42F3: //EBMLMaxSizeLength
                    this.maxSizeLength = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x4282: //DocType
                    this.docType = OGVDemuxerWebM.readString(dataView, offset, elementSize.data);
                    break;
                case 0x4287: //DocTypeVersion
                    this.docTypeVersion = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x4285: //DocTypeReadVersion
                    this.docTypeReadVersion = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                default:
                    console.warn("not found");
                    break;

            }
            offset += elementSize.data;
        }

        if (offset !== end) {
            console.warn("invalid file format");
        }



        if (this.docType === null || this.docTypeReadVersion <= 0 || this.docTypeVersion <= 0) {
            console.warn("invalid file format");
        }

        // Make sure EBMLMaxIDLength and EBMLMaxSizeLength are valid.
        if (this.maxIdLength <= 0 || this.maxIdLength > 4 || this.maxSizeLength <= 0 ||
                this.maxSizeLength > 8) {
            console.warn("invalid file format");
        }

        this.state = 1; //Set State To Decode Ready
        console.log(this);

    }

    static readFloat(dataView, offset, size) {
        //need to fix overflow for 64bit unsigned int
        if (offset < 0 && (size === 4 || size === 8)) {
            console.warn("invalid float size");
        }

        if (size === 4) {
            return dataView.getFloat32(offset);
        } else {
            return dataView.getFloat64(offset);
        }


    }

    static readUnsignedInt(dataView, offset, size) {
        //need to fix overflow for 64bit unsigned int
        if (offset < 0 || size <= 0 || size > 8) {
            console.warn("invalid file size");
        }


        var result = 0;
        var b;

        for (var i = 0; i < size; i++) {


            b = dataView.getUint8(offset);
            if (i === 0 && b < 0) {
                console.warn("invalid integer value");
            }

            result <<= 8;
            result |= b;

            offset++;
        }

        return result;
    }

    static readString(dataView, offset, size) {
        var tempString = '';
        for (var i = 0; i < size; i++) {
            tempString += String.fromCharCode(dataView.getUint8(offset + i));
        }
        return tempString;
    }
}
;


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

class SegmentInfo {

    constructor(dataView) {
        this.dataView = dataView;
        this.offset;
        this.size;
        this.dataOffset;
        this.muxingApp;
        this.writingApp;
        this.title;
        this.dataOffset;
        this.timecodeScale;
        this.duration;

    }

    parse() {
        console.log("parsing segment info");
        var end = this.dataOffset + this.size;
        var offset = this.dataOffset;

        var elementId;
        var elementSize;
        var elementOffset;
        this.timecodeScale = 1000000;
        this.duration = -1;

        while (offset < end) {

            elementOffset = offset;
            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementSize = VINT.read(this.dataView, offset);
            offset += elementSize.width;


            switch (elementId.raw) {

                case 0x2AD7B1: // TimecodeScale
                    this.timecodeScale = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementSize.data);
                    if (this.timecodeScale <= 0)
                        console.warn("Invalid timecode scale");
                    break;
                case 0x4489: // Duration
                    this.duration = OGVDemuxerWebM.readFloat(this.dataView, offset, elementSize.data);
                    if (this.duration <= 0)
                        console.warn("Invalid duration");
                    break;
                case 0x4D80: // MuxingApp
                    this.muxingApp = OGVDemuxerWebM.readString(this.dataView, offset, elementSize.data);
                    break;
                case 0x5741: //WritingApp
                    this.writingApp = OGVDemuxerWebM.readString(this.dataView, offset, elementSize.data);

                    break;
                case 0x7BA9:  //Title                   
                    this.title = OGVDemuxerWebM.readString(this.dataView, offset, elementSize.data);
                    break;
                default:
                    console.warn("segment info element not found");
                    break;

            }




            offset += elementSize.data;

        }

    }

}

class Tracks {

    constructor(dataView) {
        this.dataView = dataView;
        this.segment;
        this.offset;
        this.dataOffset;
        this.size;
        this.trackEntries;
        this.trackEntriesEnd;

    }

    parse() {
        console.log("parsing tracks");
        this.trackEntries = null;
        this.trackEntriesEnd = null;

        var end = this.dataOffset + this.size;
        var offset = this.dataOffset;
        var count = 0;
        var elementId;
        var elementWidth;
        var elementOffset;

        while (offset < end) {

            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementWidth = VINT.read(this.dataView, offset);
            offset += elementWidth.width;


            if (elementId.raw === 0xAE) { // track entry
                count++;
            }

            offset += elementWidth.data;
            if (offset > end)
                console.warn("invalid track format");

        }

        if (count < 0) {
            return;//done
        }

        this.trackEntries = [];//new array(count);
        //this.trackEntriesEnd = this.trackEntries;


        offset = this.dataOffset;
        var payloadEnd;
        var elementTotalSize;
        while (offset < end) {
            //5571
            elementOffset = offset;
            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementWidth = VINT.read(this.dataView, offset);
            offset += elementWidth.width;

            payloadEnd = offset + elementWidth.data;
            elementTotalSize = payloadEnd - elementOffset;

            if (elementId.raw === 0xAE) {

                this.trackEntries.push(this.ParseTrackEntry(offset, elementWidth.data));

            }
            offset += elementWidth.data;
        }
    }

    ParseTrackEntry(dataOffset, size) {

        var trackEntry;// = new Track();
        var trackInfo = new TrackInfo();
        var videoSettings = new TrackSettings();
        var audioSettings = new TrackSettings();
        var encodingSettings = new TrackSettings();
        var lacing = 1;


        var end = dataOffset + size;
        var offset = dataOffset;
        var elementId;
        var elementWidth;
        var elementOffset;
        var lacing;

        while (offset < end) {
            //5621
            elementOffset = offset;
            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementWidth = VINT.read(this.dataView, offset);
            offset += elementWidth.width;


            switch (elementId.raw) {
                case 0xE0: // Video
                    videoSettings.offset = elementOffset;
                    videoSettings.dataOffset = offset;
                    videoSettings.size = elementWidth.data;
                    break;
                case 0xE1 : //Audio
                    audioSettings.offset = elementOffset;
                    audioSettings.dataOffset = offset;
                    audioSettings.size = elementWidth.data;
                    break;
                case 0x6D80 : //ContentEncodings
                    encodingSettings.offset = elementOffset;
                    encodingSettings.dataOffset = offset;
                    encodingSettings.size = elementWidth.data;
                    break;
                case 0x73C5 : //TrackUID
                    //need to get uid
                    break;
                case 0xD7 : //TrackNumber
                    trackInfo.number = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x83 : //TrackType
                    trackInfo.type = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x536E : //Name
                    trackInfo.name = OGVDemuxerWebM.readString(this.dataView, offset, elementWidth.data);
                    break;
                case 0x258688 : //CodecName
                    trackInfo.codecName = OGVDemuxerWebM.readString(this.dataView, offset, elementWidth.data);
                    break;
                case 0x22B59C: //Language
                    trackInfo.language = OGVDemuxerWebM.readString(this.dataView, offset, elementWidth.data);
                    break;
                case 0x23E383 : //DefaultDuration
                    trackInfo.defaultDuration = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x86 : //CodecID
                    trackInfo.codecID = OGVDemuxerWebM.readString(this.dataView, offset, elementWidth.data);
                    break;
                case 0x9C : //FlagLacing
                    lacing = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    if ((lacing < 0) || (lacing > 1))
                        console.warn("invalid lacing");
                    break;
                case 0x63A2 : //CodecPrivate
                    //need to fill binary
                    break;
                case 0x258688 : //CodecName
                    trackInfo.codecName = OGVDemuxerWebM.readString(this.dataView, offset, elementWidth.data);
                    break;
                case 0x56AA: //CodecDelay
                    trackInfo.codecDelay = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x56BB : //SeekPreRoll
                    trackInfo.seekPreRoll = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                default:
                    console.warn("track type not found id:" + elementId.raw);
                    break;
            }


            offset += elementWidth.data;
        }

        if (offset !== end)
            console.warn("invalid track");

        if (trackInfo.number <= 0)  // not specified
            console.warn("invalid track number");

        //if (GetTrackByNumber(info.number)) //check if track exists
        //return E_FILE_FORMAT_INVALID;

        if (trackInfo.type <= 0)  // not specified
            console.warn("invalid track type");

        trackInfo.lacing = (lacing > 0) ? true : false;
        console.log("NOT UPDATING");


        if (trackInfo.type === 1) { // 1 for video track
            console.log("loading video track");
            if (videoSettings.offset < 0 || audioSettings.offset >= 0)
                console.warn("invalid video settings");
            trackInfo.settings = videoSettings;
            trackEntry = new VideoTrack(this.dataView, trackInfo);
            trackEntry.parse();

        } else if (trackInfo.type === 2) { // 2 for audio track
            console.log("creating audio track");
            if (audioSettings.offset < 0 || videoSettings.offset >= 0)
                console.warn("invalid audio settings");
            trackInfo.settings = audioSettings;
            trackEntry = new AudioTrack(this.dataView, trackInfo);
            trackEntry.parse();

        } else {
            console.log("probably subtitles");
        }


        //console.log(trackInfo);
        return trackEntry;

    }

}

class TrackSettings {
    constructor() {
        this.offset = -1;
        this.size = -1;
    }
}


class Track {
    constructor(dataView) {
        this.dataView = dataView;
        this.offset;
        this.dataOffset;
        this.size;
    }
}

class VideoTrack extends Track {

    constructor(dataView, info) {
        super(dataView);
        this.width = 0;
        this.height = 0;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.displayUnit = 0;
        this.stereoMode = 0;

        this.rate = 0.0;
        this.info = info;
        this.settings = info.settings;
        this.dataOffset = this.settings.dataOffset;
        this.offset = this.settings.offset;
        this.size = this.settings.size;
        this.color;
    }

    parse() {
        //5197

        var end = this.dataOffset + this.size;
        var offset = this.dataOffset;
        var elementId;
        var elementWidth;
        var elementOffset;


        while (offset < end) {
            elementOffset = offset;
            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementWidth = VINT.read(this.dataView, offset);
            offset += elementWidth.width;


            switch (elementId.raw) {
                case 0xB0: //PixelWidth
                    this.width = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0xBA : //PixelHeight
                    this.height = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x54B0 : //DisplayWidth
                    this.displayWidth = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x54BA : //DisplayHeight
                    this.displayHeight = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x54B2 : //DisplayUnit
                    this.displayUnit = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x53B8 : //StereoMode
                    this.stereoMode = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x2383E3 : //FrameRate
                    this.rate = OGVDemuxerWebM.readFloat(this.dataView, offset, elementWidth.data);
                    break;
                case  0x55B0: //Colour
                    console.log("color needs loading");
                    //To do - load color here
                    break;
                default:
                    console.log("video meta not found, id : " + elementId.raw);
                    break;
            }


            offset += elementWidth.data;
        }

        //console.log(this);
    }

}


class AudioTrack extends Track {
    //5426
    constructor(dataView, info) {
        super(dataView);
        //this.width = 0;
        //this.height = 0;
        //5434

        this.info = info;
        this.settings = info.settings;
        this.dataOffset = this.settings.dataOffset;
        this.offset = this.settings.offset;
        this.size = this.settings.size;

        this.rate = 8000.0;  // MKV default
        this.channels = 1;
        this.bitDepth = 0;


    }

    parse() {
        //5197

        var end = this.dataOffset + this.size;
        var offset = this.dataOffset;
        var elementId;
        var elementWidth;
        var elementOffset;


        while (offset < end) {
            elementOffset = offset;
            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementWidth = VINT.read(this.dataView, offset);
            offset += elementWidth.width;


            switch (elementId.raw) {
                case 0xB5://SamplingFrequency
                    this.rate = OGVDemuxerWebM.readFloat(this.dataView, offset, elementWidth.data);
                    break;
                case 0x9F ://Channels
                    this.channels = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;
                case 0x6264 ://BitDepth
                    this.bitDepth = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
                    break;

                default:
                    console.warn("audio meta not found , id: " + elementId.raw);
                    break;
            }


            offset += elementWidth.data;
        }

        //console.log(this);
    }

}

class TrackInfo {
    constructor() {
        this.type = 0;
        this.number = 0;
        this.uid = 0;
        this.defaultDuration = 0;
        this.language;
        this.codecID;
        this.codecName;
    }
}




class Entry {

    constructor(dataView) {
        this.dataView = dataView;
        this.offset;
        this.dataOffset;
        this.size;
        this.id;

    }

    parse() {
        //1732
        //meeds to start with seek id
        this.voidElementCount = 0;
        var offset = this.dataOffset;
        var end = this.dataOffset + this.size;
        var elementId;
        var elementWidth;
        var elementOffset;

        elementOffset = offset;
        elementId = VINT.read(this.dataView, offset);
        if (elementId.raw !== 0x53AB) { // SeekID
            console.warn("Seek ID not found");
        }

        offset += elementId.width;
        elementWidth = VINT.read(this.dataView, offset);
        offset += elementWidth.width;
        this.id = VINT.read(this.dataView, offset).data;
        //this.id = OGVDemuxerWebM.readUnsignedInt(this.dataView,offset, elementWidth.data);
        offset += elementWidth.data;


        elementId = VINT.read(this.dataView, offset);
        if (elementId.raw !== 0x53AC) { // SeekPosition
            console.warn("Seek Position not found");
        }
        offset += elementId.width;
        elementWidth = VINT.read(this.dataView, offset);
        offset += elementWidth.width;
        this.seekPosition = OGVDemuxerWebM.readUnsignedInt(this.dataView, offset, elementWidth.data);
        offset += elementWidth.data;

    }

}


module.exports = OGVDemuxerWebM;