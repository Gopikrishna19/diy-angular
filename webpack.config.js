const packageName = require('./package.json').name;

module.exports = {
  entry: './index',
  output: {
    path: __dirname + '/dist',
    filename: `${packageName}.js`
  },
  module: {
    loaders: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  }
};
