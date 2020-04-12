'use strict';

const scripts = require('../scripts.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const script = scripts.parseScript(line.substr('get input '.length));
        
        return {
            script: script
        };
    },
    execute: function (ctx) {
        setTimeout(() => {
            scripts.executeScript(ctx.parameters.script, {
                ...ctx.locals,
                result: 'test get input result'
            }, false);
        }, 500);
        ctx.complete();
    }
};