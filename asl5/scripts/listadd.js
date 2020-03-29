var scriptrunner = require('../scriptrunner.js');
var lists = require('../lists.js');

module.exports = {
    parameters: [2],
    execute: function (ctx) {               
        scriptrunner.evaluateExpressions(ctx.parameters, function (result) {
            lists.listAdd(result[0], result[1]);
            ctx.complete();
        });
    }
};