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
    // Main entry point!
    entry: './index',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv.js'
      // don't use library module format...
      // we export a few symbols to the global context on purpose.
    },
    plugins: plugins
  },
  {
    // Alt limited entry point for compat testing before loading
    entry: './src/js/ogv-support.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-support.js'
    },
    plugins: plugins
  },
  {
    // Alt limited entry point for just exposting the version marker string
    entry: './src/js/ogv-version.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-version.js'
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
