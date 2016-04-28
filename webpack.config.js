var webpack = require('webpack');

module.exports = [
  {
    entry: './src/index.js',
    output: {
      path: 'dist',
      filename: 'AudioFeeder.js',
      libraryTarget: 'umd',
      library: 'AudioFeeder'
    }
  },
  {
    entry: './src/demo.js',
    output: {
      path: 'dist',
      filename: 'demo.js',
      libraryTarget: 'var',
      library: 'demo'
    }
  }
];
