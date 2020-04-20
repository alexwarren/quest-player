'use strict';

const state = require('../state.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const script = scripts.parseScript(line.substr('wait '.length));
        
        return {
            script: script
        };
    },
    execute: function (ctx) {
        state.setWaitCallback(ctx.parameters.script, ctx.locals);
        ctx.complete();
    }
};