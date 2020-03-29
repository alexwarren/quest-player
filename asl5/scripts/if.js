const scriptrunner = require('../scriptrunner.js');
const scriptParser = require('../scriptparser.js');
const expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const parameters = scriptParser.getParameterInternal(line, '(', ')');
        const thenScript = scripts.parseScript(parameters.after);

        return {
            expression: expressions.parseExpression(parameters.parameter),
            then: thenScript
        };
    },
    execute: function (ctx) {
        scriptrunner.evaluateExpression(ctx.parameters.expression, (result) => {
            if (result) {
                scriptrunner.getCallstack().push({
                    script: ctx.parameters.then,
                    index: 0
                });
                ctx.complete();
            }
            else {
                const evaluateElse = function () {
                    if (ctx.parameters.else) {
                        scriptrunner.getCallstack().push({
                            script: ctx.parameters.else,
                            index: 0
                        });
                    }
                    ctx.complete();
                };
                
                if (ctx.parameters.elseIf) {
                    let index = 0;
                    
                    const evaluateElseIf = function () {
                        scriptrunner.evaluateExpression(ctx.parameters.elseIf[index].expression, (result) => {
                            if (result) {
                                scriptrunner.getCallstack().push({
                                    script: ctx.parameters.elseIf[index].script,
                                    index: 0
                                });
                                ctx.complete();
                            }
                            else {
                                index++;
                                if (index < ctx.parameters.elseIf.length) {
                                    evaluateElseIf();
                                }
                                else {
                                    evaluateElse();
                                }
                            }
                        });
                    };
                    evaluateElseIf();
                }
                else {
                    evaluateElse();
                }
            }
        });
    }
};