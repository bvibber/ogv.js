var webpack = require('webpack');
var path = require("path");

const BUILD_DIR = 'build';

function publicPath() {
  return '/' + BUILD_DIR + '/';
}

module.exports = [
  {
    entry: './index',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv.js',
      libraryTarget: 'var',
      library: 'ogv'
    }
  },
	{
	  entry: './src/js/workers/ogv-worker-audio.js',
	  output: {
	    path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
	    filename: 'ogv-worker-audio.js',
	    libraryTarget: 'this',
	    library: 'ogv-worker-audio'
	  }
	},
  {
    entry: './src/js/workers/ogv-worker-video.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-worker-video.js',
      libraryTarget: 'this',
      library: 'ogv-worker-video'
    }
  },
];
