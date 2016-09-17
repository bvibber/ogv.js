'use strict';
const NO_MARKER = -1;

class Tracks {

    constructor(seekHeadHeader, dataInterface, demuxer) {
        this.demuxer = demuxer;
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
                        var trackEntry = this.trackLoader.getTrackEntry()
                        this.trackEntries.push(trackEntry);
                        
                        
                    //Push the initializer on automatically
                    //put this in a vorbis class
                    if (trackEntry.trackType === 2) {
                        var headerParser = new DataView(trackEntry.codecPrivate);
                        var packetCount = headerParser.getUint8(0);
                        var firstLength = headerParser.getUint8(1);
                        var secondLength = headerParser.getUint8(2);
                        var thirdLength = headerParser.byteLength - firstLength - secondLength -1;
                        if(packetCount !== 2)
                            throw "INVALID VORBIS HEADER";
                        //throw "last length  = " + thirdLength;
                        var start = 3;
                        var end = start + firstLength;
                        this.demuxer.audioPackets.push({//This could be improved
                            data: headerParser.buffer.slice(start, end),
                            timestamp: -1
                        });
                        start = end;
                        end = start + secondLength;
                        
                        this.demuxer.audioPackets.push({//This could be improved
                            data: headerParser.buffer.slice(start, end),
                            timestamp: -1
                        });
                        start = end;
                        end = start + thirdLength;
                        this.demuxer.audioPackets.push({//This could be improved
                            data: headerParser.buffer.slice(start, end),
                            timestamp: -1
                        });
                    }
                    break;
                default:
                    console.warn("TRACK BUG");
                    throw "Track entry not found";
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
    
}

/**
 * @classdesc The TrackLoader class is a helper class to load the Track subelement types. Since the layout
 * of the Track entries is a little odd, it needs to parse the current 
 * level data plus the track container which can be either audio video, content encodings, and maybe subtitles.
 */
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
        this.trackData.codecID = null;
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
        this.trackData.codecID = null;
        this.trackData.lacing = null;
        this.trackData.codecPrivate = null;
        this.trackData.codecDelay = null;
        this.trackData.seekPreRoll = null;
        this.trackData.trackUID = null;
        this.tempTrack = null;
    }

    load() {
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
                    var codecPrivate = this.dataInterface.getBinary(this.currentElement.size);
                    if (codecPrivate !== null){
                        this.trackData.codecPrivate = codecPrivate;
                        //this must be pushed onto the queue!
                        
                    }else{
                        return null;
                    }
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

                case 0x73C5: //Track UID
                    var trackUID = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (trackUID !== null)
                        this.trackData.trackUID = trackUID;
                    else
                        return null;
                    break;

                default:
                    console.warn("track data element not found, skipping");
                    break;

            }

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

class Track {
    
    loadMeta(meta) {
        for (var key in meta) {
            this[key] = meta[key];
        }
    }
    
}

class VideoTrack extends Track{
    
    constructor(trackHeader, dataInterface) {
        super();
        this.dataInterface = dataInterface;
        this.offset = trackHeader.offset;
        this.size = trackHeader.size;
        this.loaded = false;
        this.marker = NO_MARKER;
        this.width = null;
        this.height = null;
        this.displayWidth = null;
        this.displayHeight = null;
        this.displayUnit = 0;
        this.stereoMode = null;
        this.frameRate = null;
        this.pixelCropBottom = 0;
        this.pixelCropTop = 0;
        this.pixelCropLeft = 0;
        this.pixelCropRight = 0;
    }

    load() {
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
        
        
        if(!this.displayWidth)
            this.displayWidth = this.width - this.pixelCropLeft;// - Math.PI;
        
        if(!this.displayHeight)
            this.displayHeight = this.height - this.pixelCropTop;// - Math.PI;
            

        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.loaded = true;
    }

}

class AudioTrack extends Track{
    
    constructor(trackHeader, dataInterface) {
        super();
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
                case 0xB5: //Sample Frequency //TODO: MAKE FLOAT
                    var rate = this.dataInterface.readFloat(this.currentElement.size);
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

}

class TrackSettings {
    constructor() {
        this.offset = -1;
        this.size = -1;
    }
}

module.exports = Tracks;