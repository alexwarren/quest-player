'use strict';

const scriptrunner = require('../scriptrunner.js');
const dictionaries = require('../dictionaries.js');

module.exports = {
    parameters: [3],
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters, (result) => {
            dictionaries.dictionaryAdd(result[0], result[1], result[2]);
            ctx.complete();
        });
    }
};