var webpack = require('webpack');
var path = require("path");

const BUILD_DIR = 'build';

function publicPath() {
  return '';
}

var plugins = [
  new webpack.DefinePlugin({
    '__OGV_FULL_VERSION__': JSON.stringify(process.env.OGV_FULL_VERSION)
  }),
];

var babelRule = {
  test: /\.m?js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env'],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-runtime'
      ]
    }
  }
};

module.exports = [
  {
    // Main entry point!
    entry: './src/js/ogv.js',
    mode: 'production',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv.js',
      libraryTarget: 'umd',
      library: 'ogvjs'
    },
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.swf$/,
          loader: 'file-loader',
          options: {
            'name': '[name].[ext]?version=[hash]'
          }
        },
        babelRule
      ]
    }
  },
  {
    // Alt limited entry point for compat testing before loading
    entry: './src/js/ogv-support.js',
    mode: 'production',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-support.js'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRule
      ]
    }
  },
  {
    // Alt limited entry point for just exposting the version marker string
    entry: './src/js/ogv-version.js',
    mode: 'production',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-version.js'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRule
      ]
    }
  },
	{
	  entry: './src/js/workers/ogv-worker-audio.js',
    mode: 'production',
	  output: {
	    path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
	    filename: 'ogv-worker-audio.js'
	  },
    plugins: plugins,
    module: {
      rules: [
        babelRule
      ]
    }
	},
  {
    entry: './src/js/workers/ogv-worker-video.js',
    mode: 'production',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-worker-video.js'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRule
      ]
    }
  },
];
