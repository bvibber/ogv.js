//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2016 Brion Vibber
//
// Entry point for pre-built ogv.js distribution, can be pulled in
// via webpack, browserify etc.
//
// You'll also need the static assets from the 'dist' subdirectory,
// for the Flash audio shim and Web Worker modules. At runtime set:
//
//  require('ogv').OGVLoader.base = 'path/to/target-dir';
//
// if it differs from your HTML's location.
//
// For webpack projects, try require('ogv/webpack-bundle') instead,
// this uses file-loader to put the dist files into 'ogv.js' subdir in
// your output dir.
//
// Uses file-loader to reference the various static assets
// for the Flash shim and Web Worker modules.
//
// Bundles everything into ogvjs subdir, without changing filenames
// as that would confuse the worker threads' loader.
//
// OGVLoader handles applying cache-breaking URL parameters, so hash
// is not used in the output filename.

module.exports = require('./dist/ogv.js');
