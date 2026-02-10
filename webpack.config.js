const path = require('path');

module.exports = {
  entry: {
    forum: path.resolve(__dirname, 'js/src/forum/index.js')
  },
  output: {
    path: path.resolve(__dirname, 'js/dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2' // ensures module.exports = { ... }
  },
  // no externals needed since we are DOM-only
  mode: 'production',
  devtool: 'source-map'
};