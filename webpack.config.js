var webpack = require('webpack');
var path = require("path");

const BUILD_DIR = 'build';

function publicPath() {
  return '/' + BUILD_DIR + '/';
}

var plugins = [
  new webpack.DefinePlugin({
    '__OGV_FULL_VERSION__': JSON.stringify(process.env.OGV_FULL_VERSION)
  }),
];

module.exports = [
  {
    entry: './index',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv.js'
      // don't use library module format...
      // we export a couple few symbols to the global context on purpose.
    },
    plugins: plugins
  },
	{
	  entry: './src/js/workers/ogv-worker-audio.js',
	  output: {
	    path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
	    filename: 'ogv-worker-audio.js'
	  },
    plugins: plugins
	},
  {
    entry: './src/js/workers/ogv-worker-video.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-worker-video.js'
    },
    plugins: plugins
  },
];
