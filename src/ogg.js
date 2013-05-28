(function() {
//import "../build/libogg.js"

var OggDemuxer = AV.Demuxer.extend(function() {
    AV.Demuxer.register(this);
    
    this.probe = function(buffer) {
        return buffer.peekString(0, 4) === 'OggS';
    }
    
    var AVOggInit = Module.cwrap('AVOggInit', '*');
    var AVOggRead = Module.cwrap('AVOggRead', null, ['*', '*', 'number']);
    var AVOggDestroy = Module.cwrap('AVOggDestroy', null, ['*']);

    var callbacks = [];
    function AVMakeCallback(fn) {
        callbacks.push(fn);
        return callbacks.length - 1;
    }

    function AVRemoveCallback(callback) {
        callbacks.splice(callback, 1);
    }
    
    this.prototype.init = function() {
        this.ogg = AVOggInit();
        this.buf = _malloc(4096);
        
		this.realStream = this.stream;
		var format = null;
		var self = this;
		var flac = null;
		
		var list = new AV.BufferList();
		var stream = new AV.Stream(list);
		this.stream = stream;
                
        this.callback = AVMakeCallback(function(packet, bytes) {                        
        	var data = Module.HEAPU8.subarray(packet, packet + bytes);			
			list.append(new AV.Buffer(new Uint8Array(data)));
                        
        	if (!flac) {
				stream.advance(1);
            	if (stream.readString(4) != 'FLAC')
					throw new Error('Not flac');
					
				if (stream.readUInt8() != 1)
					throw new Error('Unsupported FLAC version');
					
				stream.advance(3);
				if (stream.peekString(0, 4) != 'fLaC')
					throw new Error('Not flac');
					
				flac = AV.Demuxer.find(new AV.Buffer(new Uint8Array(data.subarray(stream.offset))));
			}
				
			flac.prototype.readChunk.apply(self);
        });
    }
    
    this.prototype.readChunk = function() {
        while (this.realStream.available(4096)) {
            Module.HEAPU8.set(this.realStream.readBuffer(4096).data, this.buf);
            AVOggRead(this.ogg, this.buf, 4096, this.callback);
        }
    }
});

})();