'use strict';

const path = require('path');

module.exports = {
    mode: 'development',
    watch: true,
    devtool: 'source-map',
    entry: {
        app: ['./quest.js']
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist')
    },
    output: {
        filename: 'quest.js'
    }
};