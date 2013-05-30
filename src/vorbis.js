var VorbisDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('vorbis', this);
    AV.Decoder.register('vrbs', this);
    
    var Module = {};
    //import "../build/libvorbis.js"
    //import "shared.js"
    
    var VorbisInit = Module.cwrap('VorbisInit', '*', ['*', 'number']);
    var VorbisHeaderDecode = Module.cwrap('VorbisHeaderDecode', 'number', ['*', '*', 'number']);
    var VorbisGetChannels = Module.cwrap('VorbisGetChannels', 'number', ['*']);
    var VorbisGetSampleRate = Module.cwrap('VorbisGetSampleRate', 'number', ['*']);
    var VorbisGetNumComments = Module.cwrap('VorbisGetNumComments', 'number', '*');
    var VorbisGetComment = Module.cwrap('VorbisGetComment', 'string', ['*', 'number']);
    var VorbisDecode = Module.cwrap('VorbisDecode', null, ['*', '*', 'number']);
    var VorbisDestroy = Module.cwrap('VorbisDestroy', null, ['*']);
    
    this.prototype.init = function() {
        this.buflen = 4096;
        this.buf = _malloc(this.buflen);
        this.headers = 1;
        
        this.outlen = 4096;
        this.outbuf = _malloc(this.outlen << 2);
        this.decodedBuffer = null;
        
        this.vorbis = VorbisInit(this.outbuf, this.outlen);
        
        var self = this;
        var offset = self.outbuf >> 2;
        
        this.callback = AVMakeCallback(function(len) {
            var samples = Module.HEAPF32.subarray(offset, offset + len);
            self.decodedBuffer = new Float32Array(samples);
        });
    };
    
    this.prototype.readChunk = function() {
        if (!this.stream.available(1))
            throw new AV.UnderflowError();
                
        var list = this.stream.list;
        var packet = list.first;
        list.advance();
        
        if (this.buflen < packet.length) {
            this.buf = _realloc(this.buf, packet.length);
            this.buflen = packet.length;
        }
        
        Module.HEAPU8.set(packet.data, this.buf);
        var status = 0;
        if ((status = VorbisDecode(this.vorbis, this.buf, packet.length, this.callback)) !== 0)
            throw new Error("Vorbis decoding error: " + status);
            
        return this.decodedBuffer;
    };
    
    // vorbis demuxer plugin for Ogg
    AV.OggDemuxer.plugins.push({
        magic: "\001vorbis",
        
        init: function() {
            this.vorbis = VorbisInit();
            this.buflen = 4096;
            this.buf = _malloc(this.buflen);
            this.headers = 3;
            this.headerBuffers = [];
        },
    
        readHeaders: function(packet) {
            if (this.buflen < packet.length) {
                this.buf = _realloc(this.buf, packet.length);
                this.buflen = packet.length;
            }
            
            Module.HEAPU8.set(packet, this.buf);
            if (VorbisHeaderDecode(this.vorbis, this.buf, packet.length) !== 0)
                throw new Error("Invalid vorbis header");
                
            this.headerBuffers.push(packet);
            
            if (--this.headers === 0) {
                this.emit('format', {
                    formatID: 'vorbis',
                    sampleRate: VorbisGetSampleRate(this.vorbis),
                    channelsPerFrame: VorbisGetChannels(this.vorbis),
                    floatingPoint: true
                });
                
                var comments = VorbisGetNumComments(this.vorbis);
                this.metadata = {};
                for (var i = 0; i < comments; i++) {
                    var comment = VorbisGetComment(this.vorbis, i),
                        idx = comment.indexOf('=');
                    
                    this.metadata[comment.slice(0, idx).toLowerCase()] = comment.slice(idx + 1);
                }
                
                this.emit('metadata', this.metadata);
                
                VorbisDestroy(this.vorbis);
                _free(this.buf);
                this.vorbis = null;
                
                for (var i = 0; i < 3; i++)
                    this.emit('data', new AV.Buffer(this.headerBuffers[i]));
            }
            
            return this.headers === 0;
        },
        
        readPacket: function(packet) {
            this.emit('data', new AV.Buffer(packet));
        }
    });
});