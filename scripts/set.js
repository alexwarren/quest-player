var scriptrunner = require('../scriptrunner.js');
var state = require('../state.js');

module.exports = {
    execute: function (ctx) {
        scriptrunner.evaluateExpression(ctx.parameters.value, function (result) {
            if (ctx.parameters.elementExpr) {
                scriptrunner.evaluateExpression(ctx.parameters.elementExpr, function (element) {
                    if (element.type !== 'element') {
                        throw 'Expected element, got ' + element;
                    }
                    state.set(state.getElement(element.name), ctx.parameters.variable, result);
                    ctx.complete();
                });
            }
            else {
                ctx.locals[ctx.parameters.variable] = result;
                ctx.complete();
            }
        });
    }
};