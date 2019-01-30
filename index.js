//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2019 Brion Vibber
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

module.exports = require('./dist/ogv.js');
