var webpack = require('webpack');

module.exports = [{
  entry: './index',
  output: {
    path: __dirname,
    filename: 'ogv_debug.js',
    libraryTarget: 'this',
    library: 'multimedia'
  }
}];
