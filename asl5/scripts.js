'use strict';

const expressions = require('./expressions.js');
const scriptParser = require('./scriptparser.js');
const scriptRunner = require('./scriptrunner.js');
const state = require('./state.js');

const commands = {
    '=': require('./scripts/set'),
    '=>': require('./scripts/setscript'),
    'dictionary add': require('./scripts/dictionaryadd'),
    'do': require('./scripts/do'),
    'for': require('./scripts/for'),
    'foreach': require('./scripts/foreach'),
    'get input': require('./scripts/getinput'),
    'if': require('./scripts/if'),
    'invoke': require('./scripts/invoke'),
    'JS.': require('./scripts/js'),
    'list add': require('./scripts/listadd'),
    'msg': require('./scripts/msg'),
    'on ready': require('./scripts/onready'),
    'request': require('./scripts/request'),
    'return': require('./scripts/return'),
    'rundelegate': require('./scripts/rundelegate'),
    'set': require('./scripts/setfield'),
    'start transaction': require('./scripts/starttransaction'),
    'switch': require('./scripts/switch'),
    'wait': require('./scripts/wait')
};

const getSetScript = function (line) {
    // based on SetScriptConstuctor
    
    let isScript = false;
    
    let obscuredScript = scriptParser.obscureStrings(line);
    const bracePos = obscuredScript.indexOf('{');
    if (bracePos !== - 1) {
        // only want to look for = and => before any other scripts which may
        // be defined on the same line, for example procedure calls of type
        //     MyProcedureCall (5) { some other script }

        obscuredScript = obscuredScript.substring(0, bracePos);
    }
    
    let eqPos = obscuredScript.indexOf('=>');
    if (eqPos !== -1) {
        isScript = true;
    }
    else {
        eqPos = obscuredScript.indexOf('=');
    }
    
    if (eqPos === -1) return null;
    
    const keyword = isScript ? '=>' : '=';
    const appliesTo = line.substr(0, eqPos).trim();
    const lastDot = appliesTo.lastIndexOf('.');
    
    const elementExpr = lastDot === - 1 ? null : appliesTo.substr(0, lastDot);
    const variable = lastDot === -1 ? appliesTo : appliesTo.substr(lastDot + 1);
    
    let value;
    if (isScript) {
        value = parseScript(line.substr(eqPos + 2).trim());
    }
    else {
        value = expressions.parseExpression(line.substr(eqPos + 1).trim());
    }

    return {
        keyword: keyword,
        command: commands[keyword],
        parameters: {
            elementExpr: elementExpr === null ? null : expressions.parseExpression(elementExpr),
            variable: variable,
            value: value
        }
    };
};

const getFunctionCallScript = function (line) {
    // based on FunctionCallScriptConstructor
    
    let paramExpressions, procName, paramScript = null;
    
    const param = scriptParser.getParameterInternal(line, '(', ')');
    
    if (param && param.after) {
        // Handle functions of the form
        //    SomeFunction (parameter) { script }
        paramScript = parseScript(param.after);
    }
    
    if (!param && !paramScript) {
        procName = line;
    }
    else {
        const parameters = scriptParser.splitParameters(param.parameter);
        procName = line.substr(0, line.indexOf('(')).trim();
        if (param.parameter.trim().length > 0) {
            paramExpressions = parseParameters(parameters);
        }
    }
    
    return {
        command: {
            execute: function (ctx) {
                if (!state.functionExists(procName)) {
                    throw 'Unrecognised function ' + procName;
                }

                const args = [];
                let index = 0;
                const evaluateArgs = function () {
                    if (typeof ctx.parameters.expressions === 'undefined' || index === ctx.parameters.expressions.length) {
                        if (paramScript) {
                            args.push(paramScript);
                        }
                        scriptRunner.callFunction(procName, args, () => {
                            ctx.complete();
                        });
                        return;
                    }
                    scriptRunner.evaluateExpression(ctx.parameters.expressions[index], (result) => {
                        index++;
                        args.push(result);
                        evaluateArgs();
                    });
                };
                evaluateArgs();
            }
        },
        parameters: {
            expressions: paramExpressions,
            script: paramScript
        }
    };
};

const getScript = function (line, lastIf) {
    // based on WorldModel.ScriptFactory.GetScriptConstructor

    let command, keyword, parameters;
    
    if (line.substring(0, 2) === '//') return null;
    
    if (line.substring(0, 4) === 'else') {
        if (!lastIf) {
            throw 'Unexpected "else" (error with parent "if"?):' + line;
        }
        if (line.substring(0, 7) === 'else if') {
            if (!lastIf.elseIf) lastIf.elseIf = [];
            const elseIfParameters = scriptParser.getParameterInternal(line, '(', ')');
            const elseIfExpression = expressions.parseExpression(elseIfParameters.parameter);
            const elseIfScript = parseScript(elseIfParameters.after);
            lastIf.elseIf.push({
                expression: elseIfExpression,
                script: elseIfScript
            });
        }
        else {
            lastIf.else = parseScript(line.substring(5));
        }
        return null;
    }

    for (const candidate in commands) {
        if (line.substring(0, candidate.length) === candidate &&
            (line.length === candidate.length || line.substr(candidate.length).match(/^\W/) || candidate === 'JS.')) {
            keyword = candidate;
            command = commands[candidate];
        }
    }
    
    if (!command) {
        // see if it's a set script
        
        const setScript = getSetScript(line);
        if (setScript) {
            command = setScript.command;
            keyword = setScript.keyword;
            parameters = setScript.parameters;
        }
        else {
            // see if it's a function call
            const functionCall = getFunctionCallScript(line);
            if (functionCall) {
                command = functionCall.command;
                parameters = functionCall.parameters;
            }
        }
    }

    if (!command) {
        console.log('Unrecognised script command: ' + line);
        return null;
    }

    if (command.create) {
        parameters = command.create(line);
    }
    else if (!parameters) {
        parameters = parseParameters(scriptParser.getAndSplitParameters(line));
        if (command.minParameters && parameters.length < command.minParameters) {
            throw 'Expected at least ' + command.minParameters + ' parameters in command: ' + line;
        }
        else if (command.parameters && command.parameters.indexOf(parameters.length) === -1) {
            throw 'Expected ' + command.parameters.join(',') + ' parameters in command: ' + line;
        }
    }

    return {
        keyword: keyword,
        command: command,
        line: line,
        parameters: parameters
    };
};

const parseScript = function (text) {
    let lastIf;
    
    text = scriptParser.removeSurroundingBraces(text);

    const result = [];
    let scriptLine;
    do {
        scriptLine = scriptParser.getScriptLine(text);

        if (!scriptLine) break;
        if (scriptLine.line.length !== 0) {
            const script = getScript(scriptLine.line, lastIf);
            
            if (script) {
                result.push(script);
                if (script.keyword === 'if') lastIf = script.parameters;
            }
        }

        text = scriptLine.after;
    } while (scriptLine.after);

    return result;
};

const parseParameters = function (parameters) {
    return parameters.map(expressions.parseExpression);
};

exports.parseScript = parseScript;
exports.executeScript = scriptRunner.executeScript;
exports.getScript = getScript;
exports.parseParameters = parseParameters;