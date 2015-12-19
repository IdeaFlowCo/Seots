var fs = require('fs');
var package = require('./package.json')

var nodeModules = {};
Object.keys(package.dependencies).forEach((mod) => {
  nodeModules[mod] = 'commonjs ' + mod;
})

module.exports = {
  context: __dirname,
  entry: {
    seots: './seots'
  },
  target: "node",
  output: {
    filename: "build/[name].bundle.js",
    chunkFilename: "build/[id].bundle.js",
    library: 'Seots',
    libraryTarget: 'umd'
  },
  externals: nodeModules,
  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.json$/,
        exclude: /node_modules/,
        loader: 'json'
      }
    ]
  }
};
