'use strict';
const NO_MARKER = -1;

class Tracks {

    constructor(seekHeadHeader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = seekHeadHeader.offset;
        this.size = seekHeadHeader.size;
        this.trackEntries = [];
        this.loaded = false;
        this.marker = NO_MARKER;
        this.tempEntry = null;
        this.currentElement = null;
        this.trackLoader = new TrackLoader();
    }

    load() {
        console.warn("LOADING TRACKS");

        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0xAE: //Track Entry
                    if (!this.trackLoader.loading)
                        this.trackLoader.init(this.currentElement, this.dataInterface);
                    this.trackLoader.load();
                    if (!this.trackLoader.loaded)
                        return;
                    else
                        this.trackEntries.push(this.trackLoader.getTrackEntry());
                    break;
                default:
                    console.warn("TRACK BUG");
                    break;

            }


            this.currentElement = null;
        }

        //Cleanup Marker
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.loaded = true;
    }

    loadTrackEntry() {
        if (!this.tempEntry)
            this.tempEntry = new Seek(this.currentElement, this.dataInterface);
    }

    parse() {
        console.warn("PARSING TRACKS");
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

class TrackLoader {

    constructor() {
        this.dataInterface = null;
        this.offset = null;
        this.size = null;
        this.loaded = false;
        this.loading = false;
        this.marker = NO_MARKER;
        this.trackData = {};
        this.trackData.trackNumber = null;
        this.trackData.trackType = null;
        this.trackData.name = null;
        this.trackData.codecName = null;
        this.trackData.defaultDuration = null;
        this.trackData.codecId = null;
        this.trackData.lacing = null;
        this.trackData.codecPrivate = null;
        this.trackData.codecDelay = null;
        this.trackData.seekPreRoll = null;
        this.tempTrack = null;
    }

    init(trackheader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = trackheader.offset;
        this.size = trackheader.size;
        this.loaded = false;
        this.loading = true;
        this.marker = NO_MARKER;
        this.trackData.trackNumber = null;
        this.trackData.trackType = null;
        this.trackData.name = null;
        this.trackData.codecName = null;
        this.trackData.defaultDuration = null;
        this.trackData.codecId = null;
        this.trackData.lacing = null;
        this.trackData.codecPrivate = null;
        this.trackData.codecDelay = null;
        this.trackData.seekPreRoll = null;
        this.tempTrack = null;
    }

    load() {
        console.warn("loading track info");
        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {
                //TODO support content encodings
                case 0xE0: //Video Track
                    if (!this.tempTrack)
                        this.tempTrack = new VideoTrack(this.currentElement, this.dataInterface);
                    this.tempTrack.load();
                    if (!this.tempTrack.loaded)
                        return;
                    break;

                case 0xE1: //Audio Number
                    if (!this.tempTrack)
                        this.tempTrack = new AudioTrack(this.currentElement, this.dataInterface);
                    this.tempTrack.load();
                    if (!this.tempTrack.loaded)
                        return;
                    break;

                case 0xD7: //Track Number
                    var trackNumber = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (trackNumber !== null)
                        this.trackData.trackNumber = trackNumber;
                    else
                        return null;
                    break;

                case 0x83: //TrackType 
                    var trackType = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (trackType !== null)
                        this.trackData.trackType = trackType;
                    else
                        return null;
                    break;

                case 0x536E: //Name
                    var name = this.dataInterface.readString(this.currentElement.size);
                    if (name !== null)
                        this.trackData.name = name;
                    else
                        return null;
                    break;

                case 0x258688: //CodecName
                    var codecName = this.dataInterface.readString(this.currentElement.size);
                    if (codecName !== null)
                        this.trackData.codecName = codecName;
                    else
                        return null;
                    break;

                case 0x22B59C: //Language
                    var language = this.dataInterface.readString(this.currentElement.size);
                    if (language !== null)
                        this.trackData.language = language;
                    else
                        return null;
                    break;

                case 0x23E383: //DefaultDuration 
                    var defaultDuration = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (defaultDuration !== null)
                        this.trackData.defaultDuration = defaultDuration;
                    else
                        return null;
                    break;

                case 0x86: //CodecId
                    var codecID = this.dataInterface.readString(this.currentElement.size);
                    if (codecID !== null)
                        this.trackData.codecID = codecID;
                    else
                        return null;
                    break;

                case 0x9C: //FlagLacing 
                    var lacing = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (lacing !== null)
                        this.trackData.lacing = lacing;
                    else
                        return null;
                    break;

                case 0x63A2: //Codec Private 
                    var codecPrivate = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (codecPrivate !== null)
                        this.trackData.codecPrivate = codecPrivate;
                    else
                        return null;
                    break;

                case 0x56AA: //Codec Delay 
                    var codecDelay = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (codecDelay !== null)
                        this.trackData.codecDelay = codecDelay;
                    else
                        return null;
                    break;

                case 0x56BB: //Pre Seek Roll 
                    var seekPreRoll = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (seekPreRoll !== null)
                        this.trackData.seekPreRoll = seekPreRoll;
                    else
                        return null;
                    break;

                default:
                    console.warn("track data element not found, skipping");
                    break;

            }
            this.tempTrack = null;
            this.currentElement = null;
        }

        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.loaded = true;
    }

    getTrackEntry() {
        this.tempTrack.loadMeta(this.trackData);
        var tempTrack = this.tempTrack;
        this.tempTrack = null;
        this.loading = false;
        return tempTrack;
    }

}

class VideoTrack {
    constructor(trackHeader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = trackHeader.offset;
        this.size = trackHeader.size;
        this.loaded = false;
        this.marker = NO_MARKER;
        this.width = null;
        this.height = null;
        this.displayWidth = null;
        this.displayHeight = null;
        this.displayUnit = null;
        this.stereoMode = null;
        this.frameRate = null;
    }

    load() {
        console.log("audio track loading");
        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {
                //TODO add color
                case 0xB0: //Pixel width
                    var width = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (width !== null)
                        this.width = width;
                    else
                        return null;
                    break;

                case 0xBA: //Pixel Height 
                    var height = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (height !== null)
                        this.height = height;
                    else
                        return null;
                    break;

                case 0x54B0: //Display width
                    var displayWidth = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (displayWidth !== null)
                        this.displayWidth = displayWidth;
                    else
                        return null;
                    break;

                case 0x54BA: //Display height
                    var displayHeight = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (displayHeight !== null)
                        this.displayHeight = displayHeight;
                    else
                        return null;
                    break;

                case 0x54B2: //Display unit
                    var displayUnit = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (displayUnit !== null)
                        this.displayUnit = displayUnit;
                    else
                        return null;
                    break;

                case 0x53B8: //Stereo mode
                    var stereoMode = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (stereoMode !== null)
                        this.stereoMode = stereoMode;
                    else
                        return null;
                    break;

                case 0x2383E3: //FRAME RATE //NEEDS TO BE FLOAT
                    var frameRate = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (frameRate !== null)
                        this.frameRate = frameRate;
                    else
                        return null;
                    break;

                case 0x55B0: //Color
                    console.error("NO COLOR LOADING YET");
                default:
                    console.warn("Ifno element not found, skipping");
                    break;

            }

            this.currentElement = null;
        }

        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.loaded = true;
    }

    loadMeta(meta) {
        for(var key in meta){
            this[key] = meta[key];
        }
    }
    
}

class AudioTrack {
    constructor(trackHeader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = trackHeader.offset;
        this.size = trackHeader.size;
        this.loaded = false;
        this.marker = NO_MARKER;
        this.rate = null;
        this.channel = null;
        this.bitDepth = null;
    }

    load() {
        console.log("audio track loading");
        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {
                //TODO add duration and title
                case 0xB5: //Sample Frequency
                    var rate = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (rate !== null)
                        this.rate = rate;
                    else
                        return null;
                    break;

                case 0x9F: //Channels 
                    var channels = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (channels !== null)
                        this.channels = channels;
                    else
                        return null;
                    break;

                case 0x6264: //bitDepth 
                    var bitDepth = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (bitDepth !== null)
                        this.bitDepth = bitDepth;
                    else
                        return null;
                    break;

                default:
                    console.warn("Ifno element not found, skipping");
                    break;

            }

            this.currentElement = null;
        }

        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.loaded = true;
    }
    
    loadMeta(meta) {
        for(var key in meta){
            this[key] = meta[key];
        }
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

class VideoTrack2 extends Track {

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


class AudioTrack2 extends Track {
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

module.exports = Tracks;