'use strict';

const scriptrunner = require('../scriptrunner.js');
const lists = require('../lists.js');

module.exports = {
    parameters: [2],
    execute: function (ctx) {               
        scriptrunner.evaluateExpressions(ctx.parameters, (result) => {
            lists.listAdd(result[0], result[1]);
            ctx.complete();
        });
    }
};