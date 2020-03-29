var scriptrunner = require('../scriptrunner.js');
var delegates = require('../delegates.js');

module.exports = {
    minParameters: 2,
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters, (result) => {
            delegates.runDelegate(result, ctx.complete);
        });
    }
};