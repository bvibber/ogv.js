/**
 * Wrapper for pure javascript demuxer.
 * 
 * Can probably make a type checking object to make sure api is adhered to, but javascript doesn't have
 * interfaces.
 */


var FlareWebmDemuxer = require('flare-webm-demuxer');

window.FlareWebmDemuxer = FlareWebmDemuxer;