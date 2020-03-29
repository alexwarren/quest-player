const scriptrunner = require('../scriptrunner.js');
const scriptParser = require('../scriptparser.js');
const expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        const scripts = require('../scripts');
        const parameterAndScript = scriptParser.getParameterInternal(line, '(', ')');
        const loopScript = scripts.parseScript(parameterAndScript.after);
        const parameters = scriptParser.splitParameters(parameterAndScript.parameter);
        
        if (parameters.length !== 2) {
            throw '"foreach" script should have 2 parameters: ' + line;
        }

        return {
            variable: parameters[0],
            list: expressions.parseExpression(parameters[1]),
            loopScript: loopScript
        };
    },
    execute: function (ctx) {
        // TODO: Pre Quest 5.3 allows foreach over a string to get each character
        // TODO: "return" breaks loop
        // TODO: Handle types other than stringlist
        scriptrunner.evaluateExpression(ctx.parameters.list, (listResult) => {
            if (!listResult.type || 
                (listResult.type != 'stringlist' &&
                listResult.type != 'objectlist' &&
                listResult.type != 'stringdictionary' &&
                listResult.type != 'objectdictionary' &&
                listResult.type != 'scriptdictionary')) {
                throw 'Unexpected "foreach" list type: ' + listResult.type;
            }

            let list = listResult.value;

            if (listResult.type == 'stringdictionary' ||
                listResult.type == 'objectdictionary' ||
                listResult.type == 'scriptdictionary') {
                list = Object.keys(list);
            }
            
            if (list.length == 0) {
                ctx.complete();
                return;
            }
            
            ctx.locals[ctx.parameters.variable] = list[0];
            let index = 0;
            
            const runLoop = function () {
                if (index < list.length) {
                    const script = [].concat(ctx.parameters.loopScript);
                    script.push({
                        command: {
                            execute: function () {
                                index++;
                                ctx.locals[ctx.parameters.variable] = list[index];
                                if (index % 1000 != 0) {
                                    runLoop();
                                }
                                else {
                                    setTimeout(() => {
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
        });
    }
};