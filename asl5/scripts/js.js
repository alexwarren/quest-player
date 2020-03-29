var scriptrunner = require('../scriptrunner.js');
var scriptParser = require('../scriptparser.js');

module.exports = {
    create: function (line) {
        var scripts = require('../scripts.js');
        var parameters = scripts.parseParameters(scriptParser.getAndSplitParameters(line));
        var jsFunction = line.match(/^JS\.([\w\.\@]*)/)[1];

        return {
            arguments: parameters,
            jsFunction: jsFunction
        };
    },
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters.arguments, function (results) {
            var fn = window[ctx.parameters.jsFunction];
            fn.apply(window, results);
            ctx.complete();
        });
    }
};