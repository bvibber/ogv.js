//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2016 Brion Vibber
//
// Webpack entry point for pre-built ogv.js distribution
//
// Uses file-loader to reference the various static assets
// for the Flash shim and Web Worker modules.
//
// Bundles everything into ogvjs subdir, without changing filenames
// as that would confuse the worker threads' loader.
//
// OGVLoader handles applying cache-breaking URL parameters, so hash
// is not used in the output filename.

var ogvjs = require('./dist/ogv.js'),
  OGVLoader = ogvjs.OGVLoader,
  moduleUrls = [
    // AudioFeeder's Flash shim
    require("file?name=ogv.js/[name].[ext]!./dist/dynamicaudio.swf"),

    // Web Worker entry points
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-worker-audio.js"),
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-worker-video.js"),

    // Audio decoders
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-decoder-audio-opus.js"),
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-decoder-audio-vorbis.js"),

    // Video decoders
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-decoder-video-theora.js"),
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-decoder-video-vp8.js"),

    // Demuxers
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-demuxer-ogg.js"),
    require("file?name=ogv.js/[name].[ext]!./dist/ogv-demuxer-webm.js")
  ];
OGVLoader.base = moduleUrls[0].replace(/\/[^\/]+$/, '');

module.exports = ogvjs;
