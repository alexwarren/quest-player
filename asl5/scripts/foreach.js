var scriptrunner = require('../scriptrunner.js');
var scriptParser = require('../scriptparser.js');
var expressions = require('../expressions.js');

module.exports = {
    create: function (line) {
        var scripts = require('../scripts');
        var parameterAndScript = scriptParser.getParameterInternal(line, '(', ')');
        var loopScript = scripts.parseScript(parameterAndScript.after);
        var parameters = scriptParser.splitParameters(parameterAndScript.parameter);
        
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
        scriptrunner.evaluateExpression(ctx.parameters.list, function (listResult) {
            if (!listResult.type || 
                (listResult.type != 'stringlist' &&
                listResult.type != 'objectlist' &&
                listResult.type != 'stringdictionary' &&
                listResult.type != 'objectdictionary' &&
                listResult.type != 'scriptdictionary')) {
                throw 'Unexpected "foreach" list type: ' + listResult.type;
            }

            var list = listResult.value;

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
            var index = 0;
            
            var runLoop = function () {
                if (index < list.length) {
                    var script = [].concat(ctx.parameters.loopScript);
                    script.push({
                        command: {
                            execute: function () {
                                index++;
                                ctx.locals[ctx.parameters.variable] = list[index];
                                if (index % 1000 != 0) {
                                    runLoop();
                                }
                                else {
                                    setTimeout(function () {
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