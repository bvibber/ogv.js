var webpack = require('webpack');

module.exports = [
  {
    entry: './src/index.js',
    output: {
      path: 'build',
      filename: 'AudioFeeder.js',
      libraryTarget: 'umd',
      library: 'AudioFeeder'
    }
  },
  {
    entry: './src/demo.js',
    output: {
      path: 'build',
      filename: 'demo.js',
      libraryTarget: 'var',
      library: 'demo'
    }
  }
];
