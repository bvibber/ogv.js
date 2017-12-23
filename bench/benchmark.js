const fs = require('fs');

const OGVDemuxerWebM = require('../dist/ogv-demuxer-webm.js');
const OGVDemuxerWebMW = require('../dist/ogv-demuxer-webm-wasm.js');
const OGVDecoderVideoVP8 = require('../dist/ogv-decoder-video-vp8.js');
const OGVDecoderVideoVP8W = require('../dist/ogv-decoder-video-vp8-wasm.js');
const OGVDecoderVideoVP9 = require('../dist/ogv-decoder-video-vp9.js');
const OGVDecoderVideoVP9W = require('../dist/ogv-decoder-video-vp9-wasm.js');

let demuxerClass = OGVDemuxerWebMW;
let decoderClass = {
  'vp8': OGVDecoderVideoVP8W,
  'vp9': OGVDecoderVideoVP9W
};

function locateFile(url) {
  if (url.slice(0, 5) === 'data:') {
    return url;
  } else {
    return '../dist/' + url;
  }
}

function decodeFile(filename) {
  //console.log('opening ' + filename);
  const file = fs.openSync(filename, 'r');
  let eof = false;
  let loaded = false;
  let buf;
  let decoder;
  let demuxer;
  let frames = 0;
  const start = Date.now();
  
  function getData(callback) {
    const bufsize = 65536;
    buf = new ArrayBuffer(bufsize);
    const arr = new Uint8Array(buf);
    const bytes = fs.readSync(file, arr, 0, bufsize);
    if (bytes < bufsize) {
      buf = buf.slice(0, bufsize);
      eof = true; // ???
      //console.log('(eof)');
    }
    //console.log('reading ' + buf.byteLength + ' bytes');
    demuxer.receiveInput(buf, callback);
  }

  function nextFrame() {
    if (!loaded && demuxer.loadedMetadata) {
      decoderClass[demuxer.videoCodec]({locateFile, videoFormat: demuxer.videoFormat}).then((dec) => {
        loaded = true;
        decoder = dec;
        decoder.init(processData);
      });
      return;
    }

    //console.log('frameReady is ' + demuxer.frameReady);
    while (demuxer.audioReady) {
      demuxer.dequeueAudioPacket((packet) => {});
    }
    if (demuxer.frameReady) {
      demuxer.dequeueVideoPacket((packet) => {
        //console.log(packet);
        console.log('processing frame ' + frames);
        frames++;
        decoder.processFrame(packet, (ok) => {
          if (ok) {
            //console.log('frame decoded');
            const delta = (Date.now() - start) / 1000;
            const fps = frames / delta;
            console.log(fps + ' fps decoding');
          } else {
            console.log('frame failed');
          }
          process.nextTick(processData);
        });
      });
    } else {
      process.nextTick(processData);
    }
  }

  function processData() {
    if (demuxer.frameReady) {
      nextFrame();
    } else {
      //console.log('no frame; process()ing');
      demuxer.process((more) => {
        //console.log('process() returned ' + more);

        if (more) {
          //console.log('more ok?');
          process.nextTick(processData);
        } else if (eof) {
          console.log('done and done');
          const delta = (Date.now() - start) / 1000;
          const fps = frames / delta;
          console.log(fps + ' fps decoding');
          process.exit(0);
        } else {
          //console.log('loading more data');
          process.nextTick(() => {
            getData(processData);
          });
        }
      });
    }
  }

  demuxerClass({locateFile}).then((dem) => {
    demuxer = dem;
    demuxer.init(() => {
      getData(processData);
    });
  });
}

let args = process.argv.slice(2);
if (args.length >= 1) {
  if (args[0] == '--js') {
    demuxerClass = OGVDemuxerWebM;
    let decoderClass = {
      'vp8': OGVDecoderVideoVP8,
      'vp9': OGVDecoderVideoVP9
    };
    args.shift();
  } else if (args[0] == '--wasm') {
    demuxerClass = OGVDemuxerWebMW;
    let decoderClass = {
      'vp8': OGVDecoderVideoVP8W,
      'vp9': OGVDecoderVideoVP9W
    };
    args.shift();
  }
}

if (args.length < 1) {
  console.log('pass a webm file on the command line to decode and benchmark');
  process.exit(1);
}

const filename = args[0];
decodeFile(filename);
