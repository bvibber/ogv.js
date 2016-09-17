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
        return true;
    }
    
load() {
        var status = false;
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
                        return 0;
                    else
                        this.blocks.push(this.tempBlock); //Later save positions for seeking and debugging
                    this.tempBlock = null;
                    
                    this.tempEntry = null;
                    this.currentElement = null;
                    return true;
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
            return status;
            //return 1;
        }
        

        if (this.dataInterface.getMarkerOffset(this.marker) !== this.size){
            console.log(this);
            throw "INVALID CLUSTER FORMATTING";
        }
        
        //Cleanup Marker
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
        this.dataOffset = null;
        this.stop = this.offset + this.size;
        
        this.testMarker = NO_MARKER;
    }
    
    loadTrack(){
        //could be cleaner
        this.track = this.cluster.demuxer.tracks.trackEntries[this.trackNumber - 1];
    }
    
    load() {
        //6323
        if(this.loaded)
            throw "ALREADY LOADED";
        
        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();
        
        if (!this.trackNumber) {
            this.trackNumber = this.dataInterface.readVint();
            if (this.trackNumber === null)
                return null;
            this.loadTrack();
        }
        
        if (!this.timeCode) {
            this.timeCode = this.dataInterface.readUnsignedInt(2);//Be signed for some reason?
            if (this.timeCode === null)
                return null;
        }
        
        if (this.flags === null) {/// FIX THIS
            this.flags = this.dataInterface.readUnsignedInt(1);
            if (this.flags === null)
                return null;

            this.keyframe = (((this.flags >> 7) & 0x01) === 0) ? false : true;
            this.invisible = (((this.flags >> 2) & 0x01) === 0) ? false : true;
            this.lacing = ((this.flags & 0x06) >> 1);
            if (this.lacing > 3 || this.lacing < 0)
                throw "INVALID LACING";
        }
        
        
        
        
        if (this.lacing === XIPH_LACING || this.lacing === EBML_LACING) {
            console.warn("DETECTING LACING");
            if (!this.lacedFrameCount) {
                this.lacedFrameCount = this.dataInterface.readByte();
                if (this.lacedFrameCount === null)
                    return null;
                
                this.lacedFrameCount++;
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
            
            
            case XIPH_LACING:
            case FIXED_LACING:
            case EBML_LACING:
            case NO_LACING:
                /*
                if(this.lacing === FIXED_LACING){
                   console.warn("FIXED_LACING");
                }
                if(this.lacing === EBML_LACING){
                   console.warn("EBML_LACING");
                }
                if(this.lacing === XIPH_LACING){
                   console.warn("XIPH_LACING");
                }
                if(this.lacing === NO_LACING){
                   console.warn("NO_LACING");
                }
                            */
                
                if (!this.frameLength){
                    this.frameLength = this.size - this.headerSize;
                    if(this.frameLength <= 0)
                        throw "INVALID FRAME LENGTH " + this.frameLength;
                }
                    
                if (!this.tempMarker)
                    this.tempMarker = this.dataInterface.offset;

                var tempFrame = this.dataInterface.getBinary(this.frameLength);
                
                if (tempFrame === null){
                    if(this.dataInterface.usingBufferedRead === false)
                        throw "SHOULD BE BUFFERED READ";
                    //console.warn("frame has been split");
                    return null;
                }else{
                    if(this.dataInterface.usingBufferedRead === true)
                    throw "SHOULD NOT BE BUFFERED READ";
                
                    if(tempFrame.byteLength !== this.frameLength)
                        throw "INVALID FRAME";
                    
                    if((this.dataInterface.offset - this.tempMarker) !== this.frameLength){
                      console.warn((this.dataInterface.offset - this.tempMarker));
                        throw "OFFSET ERROR";  
                    }
                        
                
                    //console.warn("frame complete");
                }
                
               
                if(this.dataInterface.usingBufferedRead === true)
                    throw "SHOULD NOT BE BUFFERED READ";
                
                var fullTimeCode = this.timeCode + this.cluster.timeCode;
                //var fullTimeCode = this.cluster.timeCode;
                var timeStamp = fullTimeCode / 1000;
                if(timeStamp < 0){
                   throw "INVALID TIMESTAMP"; 
                }
                
                
                if (this.track.trackType === 1) {
                    this.cluster.demuxer.videoPackets.push({//This could be improved
                        data: tempFrame,
                        timestamp: timeStamp,
                        keyframeTimestamp: timeStamp
                    });
                } else if (this.track.trackType === 2) {
                    this.cluster.demuxer.audioPackets.push({//This could be improved
                        data: tempFrame,
                        timestamp: timeStamp
                    });
                }

                tempFrame = null;
                
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

        if( this.size !== this.dataInterface.getMarkerOffset(this.marker)){
            console.log(this);
            throw "INVALID BLOCK SIZE";
        }
            

        this.loaded = true;
        this.headerSize = null;
        this.tempFrame = null;
        this.tempCounter = null;
        this.frameLength = null;
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
    }
    
}

module.exports = Cluster;

