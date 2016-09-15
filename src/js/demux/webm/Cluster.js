'use strict';
const NO_MARKER = -1;
const UNSET = -1;

class Cluster {

    constructor(clusterHeader, dataInterface, demuxer) {
        this.demuxer = demuxer; // reference to parent demuxer for passing data
        this.dataInterface = dataInterface;
        this.offset = clusterHeader.offset;
        this.size = clusterHeader.size;
        this.loaded = false;  
        this.marker = NO_MARKER;
        this.tempEntry = null;
        this.currentElement = null;
        this.timeCode = null;
        this.tempBlock = null;
        this.blocks = [];
        this.demuxer.loadedMetadata = true; // Testing only
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

                case 0xE7: //TimeCode
                    var timeCode = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (timeCode !== null)
                        this.timeCode = timeCode;
                    else
                        return null;
                    break;

                case 0xA3: //Simple Block
                    if (!this.tempBlock)
                        this.tempBlock = new SimpleBlock(this.currentElement, this.dataInterface, this);
                    this.tempBlock.load();
                    if (!this.tempBlock.loaded)
                        return null;
                    else
                        this.blocks.push(this.tempBlock); //Later save positions for seeking
                    this.tempBlock = null;
                    break;
                    
                    //TODO, ADD VOID
                default:
         
                    console.log(this);
                    console.warn("Cluster element not found + id: " + this.currentElement.id);
                    throw "STOP HERE";
                    break;

            }
            
            this.tempEntry = null;
            this.currentElement = null;
        }
        

        if (this.dataInterface.getMarkerOffset(this.marker) !== this.size){
            console.log(this);
            throw "INVALID CLUSTER FORMATTING";
        }
        
        //Cleanup Marker
        console.log("CLUSTER LOADED");
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.loaded = true;
    }
}

const NO_LACING = 0;
const XIPH_LACING = 1;
const FIXED_LACING = 2;
const EBML_LACING = 3;

class SimpleBlock{
    
    constructor(blockHeader , dataInterface, cluster) {
        this.cluster = cluster;
        this.dataInterface = dataInterface;
        this.offset = blockHeader.offset;
        this.size = blockHeader.size;
        this.loaded = false;  
        this.marker = NO_MARKER;
        this.trackNumber = null;
        this.timeCode = null;
        this.flags = null;
        this.keyframe = false;
        this.invisible = false;
        this.lacing = NO_LACING;
        this.discardable = false;
        this.lacedFrameCount = null;
        this.headerSize = null;
        this.frameSizes = [];
        this.tempCounter = null;
        this.tempFrame = null;
        this.track = null;
        this.frameLength = null;
        this.isLaced = false;

    }
    
    loadTrack(){
        //could be cleaner
        this.track = this.cluster.demuxer.tracks.trackEntries[this.trackNumber - 1];
    }
    
    load() {
        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();
        
        if (!this.trackNumber) {
            this.trackNumber = this.dataInterface.readVint();
            if (this.trackNumber === null)
                return null;
            this.loadTrack();
        }
        
        if (!this.timeCode) {
            this.timeCode = this.dataInterface.readSignedInt(2);
            if (this.timeCode === null)
                return null;
        }
        
        if (!this.flags) {
            this.flags = this.dataInterface.readUnsignedInt(1);
            if (this.flags === null)
                return null;
        }
        
        this.keyframe = (((this.flags >> 7) & 0x01) === 0) ? false : true;
        this.invisible = (((this.flags >> 3) & 0x03) === 0) ? false : true;
        this.lacing = ((this.flags >> 1) & 0x03);
        if(this.lacing > 3 || this.lacing < 0)
            throw "INVALID LACING";
        
        
        if (this.lacing === XIPH_LACING || this.lacing === EBML_LACING) {
            if (!this.lacedFrameCount) {
                this.lacedFrameCount = this.dataInterface.readByte();
                if (this.lacedFrameCount === null)
                    return null;
                
                this.lacedFrameCount-=1;
            }
            
            if (!this.tempCounter)
                this.tempCounter = 0;
            
            while(this.tempCounter < this.lacedFrameCount){
                var frameSize = this.dataInterface.readByte();
                if (frameSize === null)
                    return null;
                this.frameSizes.push(frameSize);
                this.tempCounter++;
            }
            
            
        }
        
  
        
        if(!this.headerSize)
            this.headerSize = this.dataInterface.getMarkerOffset(this.marker);
        
        switch (this.lacing) {
            
            case NO_LACING:
            case XIPH_LACING:
            case FIXED_LACING:
            case EBML_LACING:
                if (!this.frameLength)
                    this.frameLength = this.size - this.headerSize;
                var tempFrame = this.dataInterface.getBinary(this.frameLength);
                if (!tempFrame)
                    return null;
                
                if (this.track.trackType === 1) {
                    this.cluster.demuxer.videoPackets.push({//This could be improved
                        data: tempFrame,
                        timestamp: this.timeCode + this.cluster.timeCode,
                        keyframeTimestamp: this.timeCode + this.cluster.timeCode,
                    });
                } else if (this.track.trackType === 2) {
                    this.cluster.demuxer.audioPackets.push({//This could be improved
                        data: tempFrame,
                        timestamp: this.timeCode + this.cluster.timeCode
                    });
                }

                break;
            default:
                console.log(this);
                console.warn("LACED ELEMENT FOUND");
                throw "STOP HERE";
        }
        
        /*
        if (!this.dataInterface.peekBytes(this.size))
            return;
        else
            this.dataInterface.skipBytes(this.size);
            */
        this.loaded = true;
        this.headerSize = null;
        this.tempFrame = null;
        this.tempCounter = null;
        this.dataInterface.removeMarker(this.marker);
    }
    
}

module.exports = Cluster;

