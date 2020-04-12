'use strict';

const state = require('../state.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const script = scripts.parseScript(line.substr('get input '.length));
        
        return {
            script: script
        };
    },
    execute: function (ctx) {
        state.setGetInputCallback(ctx.parameters.script, ctx.locals);
        ctx.complete();
    }
};