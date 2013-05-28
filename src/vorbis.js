var VorbisDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('vorbis', this);
    AV.Decoder.register('vrbs', this);
    
    this.prototype.readChunk = function() {
        
    }
});