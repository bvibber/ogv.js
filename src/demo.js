module.exports = function demo() {

  // Note: this demo is using the pre-built AudioFeeder.js rather than
  // including it locally via webpack.
  /* global AudioFeeder */

  var demoHtml = require('file?name=[name].[ext]!../assets/demo.html');

  var start = document.getElementById('start'),
    stop = document.getElementById('stop'),
    channels = 1,
    samples = 48000,
    feeder = new AudioFeeder();

  function bufferSineWave() {
    var freq = 261, // middle C
      buffer = new Float32Array(samples),
      packet = [buffer];

    for (var i = 0; i < samples; i++) {
      buffer[i] = Math.sin((i / samples) * freq * 2 * Math.PI);
    }

    feeder.bufferData(packet);
  }

  start.addEventListener('click', function() {
    start.disabled = true;
    feeder.init(channels, samples);
    feeder.waitUntilReady(function() {
      stop.disabled = false;

      bufferSineWave();
      feeder.start();
    });
  });

  stop.addEventListener('click', function() {
    stop.disabled = true;
    feeder.close();
    feeder = new AudioFeeder();
    start.disabled = false;
  });

  feeder.onstarved = function() {
    setTimeout(function() {
      stop.disabled = true;
      feeder.close();
      feeder = new AudioFeeder();
      start.disabled = false;
    });
  };

  start.disabled = false;
};
