"use strict";

var path = require('path');
var webpack = require('webpack');
var config = module.exports = {};

config.context = __dirname;

config.entry = {
  default: './src/default.js',
  "curl-to-ruby": './src/curl-to-ruby.js'
};

config.output = {
  path: path.join(__dirname, "resources/js/"),
  filename: "[name].js"
}

config.module = {
  loaders: [
    { test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        presets: ['es2015']
      }
    }
  ]
}

config.resolve = {
  // So we can do `require('./utils')` instead of `require('./utils.js')`
  extensions: ['', '.js']
};

