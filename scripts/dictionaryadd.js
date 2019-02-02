var scriptrunner = require('../scriptrunner.js');
var dictionaries = require('../dictionaries.js');

module.exports = {
    parameters: [3],
    execute: function (ctx) {               
        scriptrunner.evaluateExpressions(ctx.parameters, function (result) {
            dictionaries.dictionaryAdd(result[0], result[1], result[2]);
            ctx.complete();
        });
    }
};