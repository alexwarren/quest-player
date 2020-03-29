'use strict';

const scriptrunner = require('../scriptrunner.js');
const delegates = require('../delegates.js');

module.exports = {
    minParameters: 2,
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters, (result) => {
            delegates.runDelegate(result, ctx.complete);
        });
    }
};