'use strict';

const scriptrunner = require('../scriptrunner.js');
const state = require('../state.js');

module.exports = {
    parameters: [3],
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters, (result) => {
            state.set(result[0], result[1], result[2]);
            ctx.complete();
        });
    }
};