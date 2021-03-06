'use strict';

const scriptrunner = require('../scriptrunner.js');

module.exports = {
    parameters: [1, 2],
    execute: function (ctx) {
        scriptrunner.evaluateExpression(ctx.parameters[0], (result) => {
            scriptrunner.getCallstack().push({
                script: result,
                locals: result[1] || {},
                index: 0,
                onReturn: ctx.complete
            });
            scriptrunner.continueRunningScripts();
        });
    }
};