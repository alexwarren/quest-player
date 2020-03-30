'use strict';

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        app: ['./quest.js']
    },
    target: 'electron-main',
    output: {
        filename: 'quest.js'
    }
};