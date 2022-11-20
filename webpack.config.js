var webpack = require('webpack');
var path = require("path");
const TerserPlugin = require('terser-webpack-plugin');

const BUILD_DIR = 'build';

function publicPath() {
  return '';
}

var plugins = [
  new webpack.DefinePlugin({
    '__OGV_FULL_VERSION__': JSON.stringify(process.env.OGV_FULL_VERSION)
  }),
];

var babelRuleModule = {
  test: /\.m?js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              esmodules: true
            }
          }
        ]
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-runtime'
      ]
    }
  }
};

var babelRuleES5 = {
  test: /\.m?js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              firefox: '4',
              chrome: '7',
              ie: '11',
              edge: '12',
              safari: '6',
              ios: '10'
            }
          }
        ]
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-runtime'
      ]
    }
  }
};

var urlLoader = {
  test: /\.(png|gif|jpg|jpeg|mp3|mp4|webm|ogg)$/,
  exclude: /node_modules/,
  use: [
    {
      loader: 'url-loader',
      options: {
        limit: 8192,
      },
    },
  ],
};

var optopts = {
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        keep_fnames: true
      }
    })
  ]
};

module.exports = [
  {
    // Main entry point! - ES Module
    entry: './src/js/ogv.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-es2017.js',
      libraryTarget: 'umd',
      library: 'ogvjs'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRuleModule,
        urlLoader
      ]
    },
    optimization: optopts,
  },
  {
    // Main entry point! - ES5
    entry: './src/js/ogv.js',
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
        babelRuleES5,
        urlLoader
      ]
    },
    optimization: optopts,
  },
  {
    // Alt limited entry point for compat testing before loading
    entry: './src/js/ogv-support.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-support.js'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRuleES5,
        urlLoader
      ]
    }
  },
  {
    // Alt limited entry point for just exposting the version marker string
    entry: './src/js/ogv-version.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-version.js'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRuleES5,
        urlLoader
      ]
    },
    optimization: optopts,
  },
	{
	  entry: './src/js/workers/ogv-worker-audio.js',
	  output: {
	    path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
	    filename: 'ogv-worker-audio.js'
	  },
    plugins: plugins,
    module: {
      rules: [
        babelRuleES5,
        urlLoader
      ]
    },
    optimization: optopts,
	},
  {
    entry: './src/js/workers/ogv-worker-video.js',
    output: {
      path: path.resolve(__dirname, BUILD_DIR),
      publicPath: publicPath(),
      filename: 'ogv-worker-video.js'
    },
    plugins: plugins,
    module: {
      rules: [
        babelRuleES5,
        urlLoader
      ]
    },
    optimization: optopts,
  },
];
