const fs = require('fs');
const crc32 = require('./crc32.js');

const OGVDemuxerWebM = require('../dist/ogv-demuxer-webm.js');
const OGVDemuxerWebMW = require('../dist/ogv-demuxer-webm-wasm.js');
const OGVDecoderVideoVP8 = require('../dist/ogv-decoder-video-vp8.js');
const OGVDecoderVideoVP8W = require('../dist/ogv-decoder-video-vp8-wasm.js');
const OGVDecoderVideoVP9 = require('../dist/ogv-decoder-video-vp9.js');
const OGVDecoderVideoVP9W = require('../dist/ogv-decoder-video-vp9-wasm.js');
const OGVDecoderVideoAV1 = require('../dist/ogv-decoder-video-av1.js');
const OGVDecoderVideoAV1W = require('../dist/ogv-decoder-video-av1-wasm.js');

let demuxerClass = OGVDemuxerWebMW;
let decoderClass = {
  'vp8': OGVDecoderVideoVP8W,
  'vp9': OGVDecoderVideoVP9W,
  'av1': OGVDecoderVideoAV1W
};
let checksum = false;

function locateFile(url) {
  if (url.slice(0, 5) === 'data:') {
    return url;
  } else {
    return __dirname + '/../dist/' + url;
  }
}

function frameChecksum(frame) {
  return crc32(frame.y.bytes);
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
  let checkin = 24;
  let last = 0;
  let lastFrames = 0;

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
        //if (!checksum) {
          //console.log('processing frame ' + frames);
        //}
        frames++;
        decoder.processFrame(packet, (ok) => {
          if (ok) {
            //console.log('frame decoded');
            if (checksum) {
              console.log(frameChecksum(decoder.frameBuffer));
            } else {
              const now = Date.now();
              const delta = (now - last) / 1000;
              if (frames % checkin == 0) {
                const fps = (frames - lastFrames) / delta;
                console.log(fps + ' fps decoding');
                lastFrames = frames;
                last = now;
              }
            }
          } else {
            //console.log('frame failed');
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
          console.log(fps + ' fps decoding average');
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
while (args.length >= 1) {
  if (args[0] == '--js') {
    demuxerClass = OGVDemuxerWebM;
    decoderClass = {
      'vp8': OGVDecoderVideoVP8,
      'vp9': OGVDecoderVideoVP9,
      'av1': OGVDecoderVideoAV1
    };
    args.shift();
  } else if (args[0] == '--wasm') {
    demuxerClass = OGVDemuxerWebMW;
    decoderClass = {
      'vp8': OGVDecoderVideoVP8W,
      'vp9': OGVDecoderVideoVP9W,
      'av1': OGVDecoderVideoAV1W
    };
    args.shift();
  } else if (args[0] == '--checksum') {
    checksum = true;
    args.shift();
  } else {
    break;
  }
}

if (args.length < 1) {
  console.log('pass a webm file on the command line to decode and benchmark');
  process.exit(1);
}

const filename = args[0];
decodeFile(filename);
