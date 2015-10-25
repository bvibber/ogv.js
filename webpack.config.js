var webpack = require('webpack');

const BUILD_DIR = '/build';

module.exports = [
  {
    entry: './index',
    output: {
      path: __dirname + BUILD_DIR,
      filename: 'ogv.js',
      libraryTarget: 'this',
      library: 'ogv'
    }
  },
	{
	  entry: './src/js/workers/ogv-worker-audio.js',
	  output: {
	    path: __dirname + BUILD_DIR,
	    filename: 'ogv-worker-audio.js',
	    libraryTarget: 'this',
	    library: 'ogv-worker-audio'
	  }
	},
  {
    entry: './src/js/workers/ogv-worker-video.js',
    output: {
      path: __dirname + BUILD_DIR,
      filename: 'ogv-worker-video.js',
      libraryTarget: 'this',
      library: 'ogv-worker-video'
    }
  },
];
