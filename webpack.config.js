"use strict";

var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    default: './src/default.js',
    "curl-to-ruby": './src/curl-to-ruby.js'
  },

  output: {
    path: path.join(__dirname, "resources/js/"),
    filename: "[name].js"
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
