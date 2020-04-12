'use strict';

const scriptrunner = require('../scriptrunner.js');
const scriptParser = require('../scriptparser.js');
const expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const parameters = scriptParser.getParameterInternal(line, '(', ')');
        let cases = scriptParser.getScriptLine(parameters.after).line;

        let finished = false;
        let result = [];
        let defaultScript = null;
        cases = scriptParser.removeSurroundingBraces(cases);

        while (!finished)
        {
            const scriptLine = scriptParser.getScriptLine(cases);
            cases = scriptLine.line;
            const remainingCases = scriptLine.after;

            if (cases) cases = cases.trim();

            if (cases)
            {
                if (cases.indexOf('case') === 0)
                {
                    const caseParameter = scriptParser.getParameterInternal(cases, '(', ')');
                    const expr = caseParameter.parameter;
                    const afterExpr = caseParameter.after;
                    const caseScript = scriptParser.getScriptLine(afterExpr).line;
                    const script = scripts.parseScript(caseScript);

                    const matchList = scriptParser.splitParameters(expr);
                    result = result.concat(matchList.map((match) => {
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
        scriptrunner.evaluateExpression(ctx.parameters.expression, (result) => {
            let index = 0;
            const evaluateCase = function () {
                scriptrunner.evaluateExpression(ctx.parameters.cases[index].expr, (caseResult) => {
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