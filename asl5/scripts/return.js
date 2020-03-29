var scriptrunner = require('../scriptrunner.js');

module.exports = {
    parameters: [1],
    execute: function (ctx) {
        scriptrunner.evaluateExpression(ctx.parameters[0], function (result) {
            ctx.onReturn(result);
        });
    }
};