var VorbisDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('vorbis', this);
    AV.Decoder.register('vrbs', this);
    
    var Module = {};
    //import "../build/libvorbis.js"
    //import "shared.js"
    
    var VorbisInit = Module.cwrap('VorbisInit', '*');
    var VorbisHeaderDecode = Module.cwrap('VorbisHeaderDecode', 'number', ['*', '*', 'number']);
    var VorbisGetChannels = Module.cwrap('VorbisGetChannels', 'number', ['*']);
    var VorbisGetSampleRate = Module.cwrap('VorbisGetSampleRate', 'number', ['*']);
    var VorbisGetNumComments = Module.cwrap('VorbisGetNumComments', 'number', '*');
    var VorbisGetComment = Module.cwrap('VorbisGetComment', 'string', ['*', 'number']);
    var VorbisDecode = Module.cwrap('VorbisDecode', null, ['*', '*', 'number']);
    var VorbisDestroy = Module.cwrap('VorbisDestroy', null, ['*']);
    
    this.prototype.init = function() {
        this.vorbis = VorbisInit();
        this.buflen = 4096;
        this.buf = _malloc(this.buflen);
        
        this.callback = AVMakeCallback(function(packet, bytes) {
            console.log(packet, bytes);
        });
    };
    
    this.prototype.readChunk = function() {
        if (!this.stream.available(1))
            throw new AV.UnderflowError();
                
        var packet = this.stream.readSingleBuffer(this.stream.remainingBytes());
        console.log('packet', packet.length, packet.data[0])
        
        if (this.buflen < packet.length) {
            this.buf = _realloc(this.buf, packet.length);
            this.buflen = packet.length;
        }
        
        VorbisDecode(this.vorbis, this.buf, packet.length, this.callback);
    };
    
    // vorbis demuxer plugin for Ogg
    AV.OggDemuxer.plugins.push({
        magic: "\001vorbis",
        
        init: function() {
            this.vorbis = VorbisInit();
            this.buflen = 4096;
            this.buf = _malloc(this.buflen);
            this.headers = 3;
        },
    
        readHeaders: function(packet) {
            if (this.buflen < packet.length) {
                this.buf = _realloc(this.buf, packet.length);
                this.buflen = packet.length;
            }
            
            Module.HEAPU8.set(packet, this.buf);
            if (VorbisHeaderDecode(this.vorbis, this.buf, packet.length) !== 0)
                throw new Error("Invalid vorbis header");
                
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
                this.vorbis = null;
            }
            
            return this.headers === 0;
        },
        
        readPacket: function(packet) {
            console.log(packet.length);
            this.emit('data', new AV.Buffer(new Uint8Array(packet)));
        }
    });
});