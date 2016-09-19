'use strict';

class SegmentInfo {

    constructor(infoHeader, dataInterface) {
        this.dataInterface = dataInterface;
        this.offset = infoHeader.offset;
        this.size = infoHeader.size;
        this.end = infoHeader.end;
        this.muxingApp = null;
        this.writingApp = null;
        this.title = null;
        this.dataOffset = null;
        this.timecodeScale = 1000000;
        this.duration = -1;
        this.loaded = false;
        this.segmentUID = null;
        this.duration = null;

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
                //TODO add duration and title
                case 0x2AD7B1: //TimeCodeScale
                    var timecodeScale = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (timecodeScale !== null)
                        this.timecodeScale = timecodeScale;
                    else
                        return null;
                    break;

                case 0x4D80: //Muxing App 
                    var muxingApp = this.dataInterface.readString(this.currentElement.size);
                    if (muxingApp !== null)
                        this.muxingApp = muxingApp;
                    else
                        return null;
                    break;
                case 0x5741: //writing App 
                    var writingApp = this.dataInterface.readString(this.currentElement.size);
                    if (writingApp !== null)
                        this.writingApp = writingApp;
                    else
                        return null;
                    break;

                case 0x7BA9: //title
                    var title = this.dataInterface.readString(this.currentElement.size);
                    if (title !== null)
                        this.title = title;
                    else
                        return null;
                    break;
                    
                case 0x73A4: //segmentUID
                    //TODO, LOAD THIS AS A BINARY ARRAY, SHOULD BE 128 BIT UNIQUE ID
                    var segmentUID = this.dataInterface.readString(this.currentElement.size);
                    if (segmentUID !== null)
                        this.segmentUID = segmentUID;
                    else
                        return null;
                    break;
                    
                case 0x4489: //duration
                    var duration = this.dataInterface.readFloat(this.currentElement.size);
                    if (duration !== null)
                        this.duration = duration;
                    else
                        return null;
                    break;
                    
                default:
                    console.error("Ifno element not found, skipping : " + this.currentElement.id);
                    break; 

            }

            this.currentElement = null;
        }

        if(this.dataInterface.offset !== this.end)
            console.error("Invalid SegmentInfo Formatting");
            

        this.loaded = true;
    }

}

module.exports = SegmentInfo;