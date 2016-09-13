'use strict';
var DataInterface = require('./DataInterface.js');

class SeekHead {

    constructor(seekHeadHeader) {
        this.id = seekHeadHeader.id;
        this.offset = seekHeadHeader.offset;
        this.dataOffset;
        this.size = seekHeadHeader.size;
        this.entries = [];
        this.entryCount = 0;
        this.voidElements = [];
        this.voidElementCount = 0;
        this.loaded = false;
        
    }
    
    load(){
        console.log("Loading Seek Head");
    }

    parse() {
        //1495
        console.log("parsing seek head");
        this.entryCount = 0;
        this.voidElementCount = 0;
        var offset = this.dataOffset;
        var end = this.dataOffset + this.size;
        var elementId;
        var elementWidth;
        var elementOffset;

        while (offset < end) {

            //console.log(offset +","+ end);
            elementOffset = offset;
            elementId = VINT.read(this.dataView, offset);
            offset += elementId.width;
            elementWidth = VINT.read(this.dataView, offset);
            offset += elementWidth.width;

            if (elementId.raw === 0x4DBB) { //Seek
                var entry = new Entry(this.dataView);
                entry.dataOffset = offset;
                entry.offset = elementOffset;
                entry.size = elementWidth.data;
                entry.parse();
                this.entries.push(entry);
            } else if (elementId.raw === 0xEC) { // Void

            }

            offset += elementWidth.data;

        }

        this.entryCount = this.entries.length;
        this.voidElementCount = this.voidElements.length;

    }

}

module.exports = SeekHead;