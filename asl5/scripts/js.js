const scriptrunner = require('../scriptrunner.js');
const scriptParser = require('../scriptparser.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const parameters = scripts.parseParameters(scriptParser.getAndSplitParameters(line));
        const jsFunction = line.match(/^JS\.([\w.@]*)/)[1];

        return {
            arguments: parameters,
            jsFunction: jsFunction
        };
    },
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters.arguments, (results) => {
            const fn = window[ctx.parameters.jsFunction];
            fn.apply(window, results);
            ctx.complete();
        });
    }
};