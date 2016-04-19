//
// -- ogv-support.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2016 Brion Vibber
//

(function() {

  var OGVVersion = __OGV_FULL_VERSION__;

  if (window) {
    // 1.0-compat globals
    window.OGVVersion = OGVVersion;
  }

  module.exports = {
    OGVVersion: OGVVersion
  };

})();
