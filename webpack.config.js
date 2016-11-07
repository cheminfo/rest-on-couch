'use strict';

const isProduction = process.env.NODE_ENV === 'production';

const webpack = require('webpack');

let babelConfig = 'babel-loader?plugins[]=transform-async-to-generator&plugins[]=transform-es2015-modules-commonjs&presets[]=react';

if (isProduction) {
    babelConfig += '&presets[]=es2015'
}

module.exports = {
    entry: ['whatwg-fetch', './src/client/index.js'],

    output: {
        path: 'public',
        filename: 'bundle.js',
        publicPath: '/'
    },

    plugins: isProduction ? [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin()
    ] : [
        new (require('webpack-dashboard/plugin'))
    ],

    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: babelConfig },
            { test: /\.css$/, loader: 'style-loader!css-loader' },
        ]
    }
};
