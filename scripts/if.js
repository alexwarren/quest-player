var scriptrunner = require('../scriptrunner.js');
var scriptParser = require('../scriptparser.js');
var expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        var scripts = require('../scripts.js');
        var parameters = scriptParser.getParameterInternal(line, '(', ')');
        var thenScript = scripts.parseScript(parameters.after);

        return {
            expression: expressions.parseExpression(parameters.parameter),
            then: thenScript
        };
    },
    execute: function (ctx) {
        scriptrunner.evaluateExpression(ctx.parameters.expression, function (result) {
            if (result) {
                scriptrunner.getCallstack().push({
                    script: ctx.parameters.then,
                    index: 0
                });
                ctx.complete();
            }
            else {
                var evaluateElse = function () {
                    if (ctx.parameters.else) {
                        scriptrunner.getCallstack().push({
                            script: ctx.parameters.else,
                            index: 0
                        });
                    }
                    ctx.complete();
                };
                
                if (ctx.parameters.elseIf) {
                    var index = 0;
                    
                    var evaluateElseIf = function () {
                        scriptrunner.evaluateExpression(ctx.parameters.elseIf[index].expression, function (result) {
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