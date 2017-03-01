'use strict';

const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const config = require('./src/config/config').globalConfig;
const webpack = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');

const babelConfig = {
    plugins: ['transform-async-to-generator', 'transform-es2015-modules-commonjs'],
    presets: ['react']
};
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
    babelConfig.presets.push(['env', {
        targets: {
            browsers: ['chrome >= 51', 'last 2 firefox versions', 'last 1 safari version', 'last 2 edge versions']
        }
    }]);
    entry.unshift('regenerator-runtime/runtime');
    plugins.push(new BabiliPlugin())
}

module.exports = {
    entry: entry,

    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
        publicPath: '/'
    },

    plugins: plugins,

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
