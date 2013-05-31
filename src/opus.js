var OpusDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('opus', this);
    
    var Module = {};
    //import "../build/libopus.js"
    
    this.prototype.init = function() {
        this.buflen = 4096;
        this.buf = _malloc(this.buflen);
        
        this.outlen = 4096;
        this.outbuf = _malloc(this.outlen * this.format.channelsPerFrame * 4);
        this.f32 = this.outbuf >> 2;
        
        this.opus = _opus_decoder_create(this.format.sampleRate, this.format.channelsPerFrame, this.buf);
    }
    
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
        
        var len = _opus_decode_float(this.opus, this.buf, packet.length, this.outbuf, this.outlen, 0);
        if (len < 0)
            throw new Error("Opus decoding error: " + len);
            
        var samples = Module.HEAPF32.subarray(this.f32, this.f32 + len * this.format.channelsPerFrame);
        return new Float32Array(samples);
    }
    
    AV.OggDemuxer.plugins.push({
        magic: "OpusHead",
        
        readHeaders: function(packet) {
            if (packet[8] !== 1)
                throw new Error("Unknown opus version");
            
            this.emit('format', {
                formatID: 'opus',
                sampleRate: 48000,
                channelsPerFrame: packet[9],
                floatingPoint: true
            });
            
            return true;
        },
        
        readPacket: function(packet) {
            var tag = packet.subarray(0, 8);
            if (String.fromCharCode.apply(String, tag) === "OpusTags")
                console.log('tag!');
            else
                this.emit('data', new AV.Buffer(packet));
        }
    });
});