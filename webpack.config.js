const path = require('path');

module.exports = {
  entry: {
    'examples/counter/app': './src/counter/index.js',
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'docs'),
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
