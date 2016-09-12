'use strict';
//http://localhost:8888/ogv.js/build/demo/#file=Curiosity's_Seven_Minutes_of_Terror.ogv&size=720p.webm

/**
 * @classdesc This class keeps a queue of arraybuffers in order for demuxer to read continuously without having to overwrite anything
 * 
 */
class DataInterface{
    
    constructor(){
        
        this.overallPointer = 0;
        this.internalPointer = 0;
        this.dataBuffers = [];
        this.currentBuffer = null;
        this.markerPointer = 0;
        this.markerIsSet = false;
        
        Object.defineProperty(this, 'markerBytesRead' , {
            get: function(){
                return this.markerPointer;
            }
        });
        
        this.tempId = null;
        this.tempSize = null;
        this.tempOctetWidth = null;
        this.tempOctet = null;
        this.tempByteBuffer = 0;
        this.tempByteCounter = 0;
        this.tempElementId = null;
        this.tempElementSize = null;
        this.tempVintWidth = null;
        this.tempResult = null;
        this.tempCounter = null;
        this.usingBufferedRead = false;
        
        /**
         * Returns the bytes left in the current buffer
         */
        Object.defineProperty(this, 'remainingBytes' , {

            get: function () {
                if (this.dataBuffers.length === 0)
                    return 0;
                else
                    return this.currentBuffer.byteLength - this.internalPointer;
            }
        });
        
        
    }
    
    clearTemp() {
        this._tempId = null;
        this._tempSize = null;
        this._tempOctetWidth = null;
        this._tempOctet = null;
        this._tempByteBuffer = null;
    }
    
    recieveInput(data){
        this.dataBuffers.push(new DataView(data));
        if (this.dataBuffers.length === 1) {
            this.currentBuffer = this.dataBuffers[0];
            this.internalPointer = 0;
        }
            
    }
    
    popBuffer(){
        this.dataBuffers.shift();
        this.internalPointer = 0;
        if(this.dataBuffers.length !== 0){
            this.currentBuffer = this.dataBuffers[0];
        }else{
            this.currentBuffer = null;
        }
    }
    
    readId(){
         if(this.dataBuffers.length === 0)
            return null; //Nothing to parse
 
        if (!this.tempOctet) {
            
            if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse
            
            this.tempOctet = this.currentBuffer.getUint8(this.internalPointer);
            this.incrementPointers();
            this.tempOctetWidth = this.calculateOctetWidth();
            
                    
            if (this.remainingBytes === 0)
                this.popBuffer();       

        }
        
        //We will have at least one byte to read
        var tempByte;
        while (this.tempByteCounter < this.tempOctetWidth) {
            
            if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse 
            
            if (this.tempByteCounter === 0) {
                this.tempByteBuffer = this.tempOctet;
            } else {
                tempByte = this.readByte();
                this.tempByteBuffer = (this.tempByteBuffer << 8) | tempByte;
            }

            
            this.tempByteCounter++;
            
            if (this.remainingBytes === 0)
                this.popBuffer();
            
        }
        
        var result = this.tempByteBuffer;
        
        
        this.clearTemps();
        
        return result;       
    }
    
    readVint() {

        if(this.dataBuffers.length === 0)
            return null; //Nothing to parse
  
        if (!this.tempOctet) {
            
            if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse
            
            this.tempOctet = this.currentBuffer.getUint8(this.internalPointer);
            this.incrementPointers();
            this.tempOctetWidth = this.calculateOctetWidth();
            
                    
            if (this.remainingBytes === 0)
                this.popBuffer();

        }
        
        if(this.usingBufferedRead ||  this.remainingBytes < (this.tempOctetWidth - 1)){
            this.usingBufferedRead = true;
            var result = this.bufferedReadVint();
            return (!result) ? null : result; 
        }else{
            
            return this.forceReadVint();
        }
       
        
        
        
    }
    
    /**
     * Use this function to read a vint with more overhead by saving the state on each step
     * @returns {number | null}
     */
    bufferedReadVint(){
        
        //We will have at least one byte to read
        var tempByte;
        while (this.tempByteCounter < this.tempOctetWidth) {
            
            if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse
            
            if (this.tempByteCounter === 0) {
                var mask = ((0xFF << this.tempOctetWidth) & 0xFF) >> this.tempOctetWidth;
                this.tempByteBuffer = this.tempOctet & mask;
            } else {
                tempByte = this.readByte();
                this.tempByteBuffer = (this.tempByteBuffer << 8) | tempByte;
            }
    
            
            this.tempByteCounter++;
            
            if (this.remainingBytes === 0)
                this.popBuffer();
            
        }
        
        var result = this.tempByteBuffer;
        
        
        this.clearTemps();
        return result;
        
    }
    
    clearTemps() {
        this.tempId = null;
        this.tempSize = null;
        this.tempOctetMask = null;
        this.tempOctetWidth = null;
        this.tempOctet = null;
        this.tempByteBuffer = 0;
        this.tempByteCounter = 0;
        this.usingBufferedRead = false;
    }
    
    /**
     * Use this function to implement a more efficient vint reading if there are enough bytes in the buffer
     * @returns {Number|null} 
     */
    forceReadVint() {
        
        var result;
        switch (this.tempOctetWidth) {
            case 1:
                result = this.tempOctet & 0x7F;
                break;
            case 2:
                result = this.tempOctet & 0x3F;
                result = (result << 8) | this.currentBuffer.getUint8(this.internalPointer);
                this.incrementPointers();
                break;
            case 3:
                result = this.tempOctet & 0x1F;
                result = (result << 16) | this.currentBuffer.getUint16(this.internalPointer);
                this.incrementPointers(2);
                break;
            case 4:
                result = this.tempOctet & 0x0F;
                result = (result << 16) | this.currentBuffer.getUint16(this.internalPointer);
                this.incrementPointers(2);
                result = (result << 8) | this.currentBuffer.getUint8(this.internalPointer);
                this.incrementPointers();
                break;
            case 5:
                console.warn("finish this");
                break;
            case 6:
                /* fix this */
                console.warn("finish this");
                break;
            case 7:
                /* fix this */
                console.warn("finish this");
                break;
            case 8:
                result = this.tempOctet & 0x00;
                //Largest allowable integer in javascript is 2^53-1 so gonna have to use one less bit for now
                result = (result << 8) | this.currentBuffer.getUint8(this.internalPointer);
                this.incrementPointers();
                result = (result << 16) | this.currentBuffer.getUint16(this.internalPointer);
                this.incrementPointers(2);
                result = (result << 32) | this.currentBuffer.getUint32(this.internalPointer);
                this.incrementPointers(4);
                break;
        }

        if (this.remainingBytes === 0)
            this.popBuffer();

        this.tempOctetWidth = null;
        this.tempOctet = null;
        return result;
    }
    
    
    readByte(){
        var byteToRead = this.currentBuffer.getUint8(this.internalPointer);
        this.incrementPointers();
        return byteToRead;
    }
    
    peekElement(){

        if(this.dataBuffers.length === 0)
            return null; //Nothing to parse
        
        //check if we return an id
        if (!this.tempElementId){
            this.tempElementId = this.readId();
            if(this.tempElementId === null)
                return null;
        }
        
        
        if (!this.tempElementSize) {
            this.tempElementSize = this.readVint();
            if (this.tempElementSize === null)
                return null;
        }
        
        var element = new ElementHeader(this.tempElementId , this.tempElementSize);
        
        //clear the temp holders
        this.tempElementId = null;
        this.tempElementSize = null;
        
        
        return element;
                
    }
    
    /*
     * Check if we have enough bytes available in the buffer to read
     * @param {number} n test if we have this many bytes available to read
     * @returns {boolean} has enough bytes to read
     */
    peekBytes(n){
        //First check if the first buffer has enough remaining bytes, don't need to loop if this is the case
        var currentBufferBytes = this.dataBuffers[0].byteLength - this.internalPointer - n;
        //If we have enough in this buffer just return true
        if(currentBufferBytes > 0)
            return true;
        
        if((this.getTotalBytes() - this.internalPointer - n) > 0)
            return true;
        else 
            return false;
    }
    
    getTotalBytes(){
        var totalBytes;
        for(var i in this.dataBuffers){
            totalBytes += this.dataBuffers[i].byteLength;
        }
        return totalBytes;
    }
    
    getRemainingBytes(){
        return this.dataBuffers[0].byteLength - this.internalPointer;
    }
    
    setMarker(){
        this.markerIsSet = true;
        this.markerPointer = 0;
    }
    
    removeMarker(){
        this.markerIsSet = false;
    }
    
    calculateOctetWidth(){
        var leadingZeroes = 0;
        var zeroMask = 0x80;
        do {
            if (this.tempOctet & zeroMask)
                break;

            zeroMask = zeroMask >> 1;
            leadingZeroes++;

        } while (leadingZeroes < 8);

        //Set the width of the octet
        return leadingZeroes + 1;
    }
    
    incrementPointers(n) {
        var bytesToAdd = n || 1;
        this.internalPointer += bytesToAdd;
        this.overallPointer += bytesToAdd;
        this.markerPointer += bytesToAdd;
    }
    
    readUnsignedInt(size){

        if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse
            
        //need to fix overflow for 64bit unsigned int
        if ( size <= 0 || size > 8) {
            console.warn("invalid file size");
        }

        var dataView = this.dataBuffers[0];
           
        if(this.tempResult === null)
            this.tempResult = 0;

        if (this.tempCounter === null)
            this.tempCounter = 0;
        
        var b;

        for (var i = this.tempCounter; i < size; i++) {
            
            if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse

            b = this.readByte();
            
            if(b === null)
                return null;
            
            if (this.tempCounter === 0 && b < 0) {
                console.warn("invalid integer value");
            }
            

            this.tempResult <<= 8;
            this.tempResult |= b;

            if (this.remainingBytes === 0)
                this.popBuffer();

             
        }

        //clear the temp resut
        var result = this.tempResult;
        this.tempResult = null;
        this.tempCounter = null;
        return result;
    }
    
    
    readString(size) {
        console.log("reading string");
        if (!this.tempString)
            this.tempString = '';
        
        if (this.tempCounter === null)
            this.tempCounter = 0;
        

        while (this.tempCounter < size) {

            if (!this.currentBuffer)// if we run out of data return null
                return null; //Nothing to parse

            this.tempString += String.fromCharCode(this.readByte());

            if (this.remainingBytes === 0)
                this.popBuffer();

            this.tempCounter++;
        }
        
        var tempString = this.tempString;
        this.tempString = null;
        this.tempCounter = null;
        return tempString;
    }
    
}

class ElementHeader{
    
    constructor(id, size){
        this.id = id;
        this.size = size;
        this.headerSize;
        this.offset;
    }
    
}

module.exports = DataInterface;