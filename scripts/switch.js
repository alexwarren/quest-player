var scriptrunner = require('../scriptrunner.js');
var scriptParser = require('../scriptparser.js');
var expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        var scripts = require('../scripts.js');
        var parameters = scriptParser.getParameterInternal(line, '(', ')');
        var cases = scriptParser.getScriptLine(parameters.after).line;

        var finished = false;
        var result = [];
        var defaultScript = null;
        cases = scriptParser.removeSurroundingBraces(cases);

        while (!finished)
        {
            var scriptLine = scriptParser.getScriptLine(cases);
            cases = scriptLine.line;
            var remainingCases = scriptLine.after;

            if (cases) cases = cases.trim();

            if (cases)
            {
                if (cases.indexOf('case') === 0)
                {
                    var caseParameter = scriptParser.getParameterInternal(cases, '(', ')');
                    var expr = caseParameter.parameter;
                    var afterExpr = caseParameter.after;
                    var caseScript = scriptParser.getScriptLine(afterExpr).line;
                    var script = scripts.parseScript(caseScript);

                    var matchList = scriptParser.splitParameters(expr);
                    result = result.concat(matchList.map(function (match) {
                        return {
                            expr: expressions.parseExpression(match),
                            script: script
                        };
                    }));
                }
                else if (cases.indexOf('default') === 0) {
                    defaultScript = scripts.parseScript(cases.substring(8).trim());
                }
                else {
                    throw 'Invalid inside switch block: "' + cases + '"';
                }
            }

            cases = remainingCases;
            if (!cases) finished = true;
        }

        return {
            expression: expressions.parseExpression(parameters.parameter),
            cases: result,
            defaultScript: defaultScript
        };
    },
    execute: function (ctx) {
        scriptrunner.evaluateExpression(ctx.parameters.expression, function (result) {            
            var index = 0;
            var evaluateCase = function () {
                scriptrunner.evaluateExpression(ctx.parameters.cases[index].expr, function (caseResult) {
                    if (result.toString() === caseResult.toString()) {
                        scriptrunner.getCallstack().push({
                            script: ctx.parameters.cases[index].script,
                            index: 0
                        });
                        ctx.complete();
                    }
                    else {
                        index++;
                        if (index < ctx.parameters.cases.length) {
                            evaluateCase();
                        }
                        else {
                            if (ctx.parameters.defaultScript) {
                                scriptrunner.getCallstack().push({
                                    script: ctx.parameters.defaultScript,
                                    index: 0
                                });
                            }
                            ctx.complete();
                        }
                    }
                });
            };
            evaluateCase();
        });
    }
};