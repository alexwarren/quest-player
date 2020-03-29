'use strict';

const ui = require('../ui.js');
const scriptrunner = require('../scriptrunner.js');

module.exports = {
    parameters: [1],
    execute: function (ctx) {               
        scriptrunner.evaluateExpression(ctx.parameters[0], (result) => {
            ui.print(result);
            ctx.complete();
        });
    }
};