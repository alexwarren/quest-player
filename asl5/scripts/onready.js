'use strict';

const state = require('../state.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const script = scripts.parseScript(line.substr('on ready '.length));
        
        return {
            script: script
        };
    },
    execute: function (ctx) {
        state.addOnReadyCallback(ctx.parameters.script, ctx.locals);
        ctx.complete();
    }
};