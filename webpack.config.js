'use strict';

const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const TerserPlugin = require('terser-webpack-plugin');

const babelConfig = {
  plugins: [
    '@babel/proposal-object-rest-spread',
    '@babel/transform-async-to-generator',
  ],
  presets: ['@babel/react'],
};
const entry = ['whatwg-fetch', './src/client/index.js'];

let optimization;
if (isProduction) {
  babelConfig.presets.push([
    'env',
    {
      targets: {
        browsers: [
          'chrome >= 64',
          'last 2 firefox versions',
          'last 2 safari versions',
          'last 2 edge versions',
        ],
      },
    },
  ]);
  entry.unshift('regenerator-runtime/runtime');
  optimization = {
    minimizer: [new TerserPlugin()],
  };
}

module.exports = {
  entry,

  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/',
  },

  optimization,
  devtool: 'source-map',
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        options: babelConfig,
      },
      {
        use: ['style-loader', 'css-loader'],
        test: /\.css$/,
      },
    ],
  },
  devServer: {
    open: true,
  },
};
