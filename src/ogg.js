(function() {
var Module = {};
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
    const BUFFER_SIZE = 4096;
    
    this.prototype.init = function() {
        this.ogg = AVOggInit();
        this.buf = _malloc(BUFFER_SIZE);
        
        var self = this;
        var plugin = null;
        var doneHeaders = false;
        
        // copy the stream in case we override it, e.g. flac
        this._stream = this.stream;
                
        this.callback = AVMakeCallback(function(packet, bytes) {
            var data = Module.HEAPU8.subarray(packet, packet + bytes);          
            
            // find plugin for codec
            if (!plugin) {
                for (var i = 0; i < OggDemuxer.plugins.length; i++) {
                    var cur = OggDemuxer.plugins[i];
                    var magic = data.subarray(0, cur.magic.length);
                    if (String.fromCharCode.apply(String, magic) === cur.magic) {
                        plugin = cur;
                        break;
                    }
                }
                
                if (!plugin)
                    throw new Error("Unknown format in Ogg file.");
                    
                if (plugin.init)
                    plugin.init.call(self);
            }
            
            // send packet to plugin
            if (!doneHeaders)
                doneHeaders = plugin.readHeaders.call(self, data);
            else
                plugin.readPacket.call(self, data);
        });
    };
    
    this.prototype.readChunk = function() {
        while (this._stream.available(BUFFER_SIZE)) {
            Module.HEAPU8.set(this._stream.readBuffer(BUFFER_SIZE).data, this.buf);
            AVOggRead(this.ogg, this.buf, BUFFER_SIZE, this.callback);
        }
    };
});

AV.OggDemuxer = OggDemuxer;

OggDemuxer.plugins.push({
    magic: "\177FLAC",
    
    init: function() {
        this.list = new AV.BufferList();
        this.stream = new AV.Stream(this.list);
    },
    
    readHeaders: function(packet) {
        var stream = this.stream;
        this.list.append(new AV.Buffer(new Uint8Array(packet)));
        
        stream.advance(5); // magic
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
    
    readPacket: function(packet) {
        this.list.append(new AV.Buffer(new Uint8Array(packet)));
        this.flac.prototype.readChunk.call(this);
    }
});

})();