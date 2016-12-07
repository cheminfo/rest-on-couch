'use strict';

const isProduction = process.env.NODE_ENV === 'production';
const config = require('./lib/config/config').globalConfig;
const webpack = require('webpack');

let babelConfig = 'babel-loader?plugins[]=transform-async-to-generator&plugins[]=transform-es2015-modules-commonjs&presets[]=react';
const entry = ['whatwg-fetch', './src/client/index.js'];

const plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'dev')
        },
        WP_API_ROOT_URL: JSON.stringify(config.publicAddress),
        WP_API_PROXY_PREFIX: JSON.stringify(config.proxyPrefix)
    })
];

if (isProduction) {
    babelConfig += '&presets[]=es2015';
    entry.unshift('regenerator-runtime/runtime');
   plugins.push(
       new webpack.optimize.DedupePlugin(),
       new webpack.optimize.OccurrenceOrderPlugin(),
       new webpack.optimize.UglifyJsPlugin()
   );
} else {
    plugins.push(new (require('webpack-dashboard/plugin')));
}

module.exports = {
    entry: entry,

    output: {
        path: 'public',
        filename: 'bundle.js',
        publicPath: '/'
    },

    plugins: plugins,

    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: babelConfig },
            { test: /\.css$/, loader: 'style-loader!css-loader' },
        ]
    }
};
