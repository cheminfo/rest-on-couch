'use strict';

const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const babelConfig = {
  plugins: ['@babel/transform-async-to-generator'],
  presets: ['@babel/react']
};
const entry = ['whatwg-fetch', './src/client/index.js'];

const plugins = [];

if (isProduction) {
  babelConfig.presets.push([
    'env',
    {
      targets: {
        browsers: [
          'chrome >= 51',
          'last 2 firefox versions',
          'last 1 safari version',
          'last 2 edge versions'
        ]
      }
    }
  ]);
  entry.unshift('regenerator-runtime/runtime');
  plugins.push(new UglifyJsPlugin());
}

module.exports = {
  entry: entry,

  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/'
  },

  plugins: plugins,
  devtool: 'source-map',
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        options: babelConfig
      },
      {
        use: ['style-loader', 'css-loader'],
        test: /\.css$/
      }
    ]
  }
};
