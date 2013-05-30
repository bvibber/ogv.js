(function() {
//import "../build/libogg.js"
//import "shared.js"

var OggDemuxer = AV.Demuxer.extend(function() {
    AV.Demuxer.register(this);
    
    this.probe = function(buffer) {
        return buffer.peekString(0, 4) === 'OggS';
    };
    
    var AVOggInit = Module.cwrap('AVOggInit', '*');
    var AVOggRead = Module.cwrap('AVOggRead', null, ['*', '*', 'number']);
    var AVOggDestroy = Module.cwrap('AVOggDestroy', null, ['*']);
    
    this.plugins = [];
    
    this.prototype.init = function() {
        this.ogg = AVOggInit();
        this.buf = _malloc(4096);
        
        var self = this;
        var plugin = null;
        var doneHeaders = false;
        
        var list = new AV.BufferList();
        var stream = new AV.Stream(list);
        
        this.realStream = this.stream;
        this.stream = stream;
                
        this.callback = AVMakeCallback(function(packet, bytes) {                        
            var data = Module.HEAPU8.subarray(packet, packet + bytes);          
            list.append(new AV.Buffer(new Uint8Array(data)));
            
            // find plugin for codec
            if (!plugin) {
                for (var i = 0; i < OggDemuxer.plugins.length; i++) {
                    var cur = OggDemuxer.plugins[i]
                    if (stream.readString(cur.magic.length) == cur.magic) {
                        plugin = cur;
                        break;
                    }
                }
                
                if (!plugin)
                    throw new Error("Unknown format in Ogg file.");
            }
            
            // send packet to plugin
            if (!doneHeaders)
                doneHeaders = plugin.readHeaders.call(self, stream);
            else
                plugin.readPacket.call(self, stream);
        });
    };
    
    this.prototype.readChunk = function() {
        while (this.realStream.available(4096)) {
            Module.HEAPU8.set(this.realStream.readBuffer(4096).data, this.buf);
            AVOggRead(this.ogg, this.buf, 4096, this.callback);
        }
    };
});

OggDemuxer.plugins.push({
    magic: "\177FLAC",
    
    readHeaders: function(stream) {
        if (stream.readUInt8() != 1)
            throw new Error('Unsupported FLAC version');
            
        stream.advance(3);
        if (stream.peekString(0, 4) != 'fLaC')
            throw new Error('Not flac');
            
        this.flac = AV.Demuxer.find(stream.peekSingleBuffer(0, stream.remainingBytes()));
        if (!this.flac)
            throw new Error('Flac demuxer not found');
        
        this.flac.prototype.readChunk.call(this);
        return true;
    },
    
    readPacket: function(stream) {
        this.flac.prototype.readChunk.call(this);
    }
});

})();