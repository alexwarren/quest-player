'use strict';

const scriptrunner = require('../scriptrunner.js');
const scriptParser = require('../scriptparser.js');
const expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts.js');
        const parameterAndScript = scriptParser.getParameterInternal(line, '(', ')');
        const loopScript = scripts.parseScript(parameterAndScript.after);
        const parameters = scriptParser.splitParameters(parameterAndScript.parameter);
        
        if (parameters.length !== 3 && parameters.length !== 4) {
            throw '"for" script should have 3 or 4 parameters: ' + line;
        }

        return {
            variable: parameters[0],
            from: expressions.parseExpression(parameters[1]),
            to: expressions.parseExpression(parameters[2]),
            step: parameters.length === 3 ? null : expressions.parseExpression(parameters[3]),
            loopScript: loopScript
        };
    },
    execute: function (ctx) {
        const go = function (fromResult, toResult, stepResult) {
            if (toResult < fromResult) {
                ctx.complete();
                return;
            }
            
            ctx.locals[ctx.parameters.variable] = fromResult;
            let iterations = 0;
            
            const runLoop = function () {
                if (ctx.locals[ctx.parameters.variable] <= toResult) {
                    const script = [].concat(ctx.parameters.loopScript);
                    script.push({
                        command: {
                            execute: function () {
                                ctx.locals[ctx.parameters.variable] = ctx.locals[ctx.parameters.variable] + stepResult;
                                iterations++;
                                if (iterations < 1000) {
                                    runLoop();
                                }
                                else {
                                    setTimeout(() => {
                                        iterations = 0;
                                        runLoop();
                                    }, 0);
                                }
                            }
                        }
                    });
                    scriptrunner.getCallstack().push({
                        script: script,
                        index: 0
                    });
                }
                ctx.complete();
            };
            
            runLoop();
        };
        
        scriptrunner.evaluateExpression(ctx.parameters.from, (fromResult) => {
            scriptrunner.evaluateExpression(ctx.parameters.to, (toResult) => {
                if (ctx.parameters.step) {
                    scriptrunner.evaluateExpression(ctx.parameters.step, (stepResult) => {
                        go (fromResult, toResult, stepResult);
                    });
                }
                else {
                    go (fromResult, toResult, 1);
                }
            });
        });
    }
};