'use strict';

const state = require('./state.js');
const functions = require('./functions.js');
const ui = require('./ui.js');

let callstack = [];
let isReady = true;

const getCallstack = function () {
    return callstack;
};

const executeScript = function (script, locals, appendToCallstack) {
    const frame = {
        script: script,
        index: 0,
        locals: locals || {}
    };
    
    if (callstack.length !== 0) {
        if (!appendToCallstack) {
            throw 'Existing callstack is not empty';
        }
        callstack.push(frame);
        executeNext();
        return;
    }
    
    callstack = [frame];
    
    continueRunningScripts();
};

let isRunning = false;

const continueRunningScripts = function () {
    isRunning = true;
    do {
        isReady = false;
        executeNext();
    } while (isReady);
    isRunning = false;
};

const executeNext = function () {
    if (callstack.length === 0) return;
    
    // An "if" script is inside a child frame. The parent frame is the one
    // with the local variables and any "return" script.
    const parentFrameIndex = getParentFrameIndex();
    const parentFrame = callstack[parentFrameIndex];
    const frame = callstack[callstack.length - 1];
    
    const popCallstack = function () {
        const framesToRemove = callstack.length - parentFrameIndex;
        callstack.splice(-framesToRemove);
    };
    
    if (parentFrame.finished) {
        popCallstack();
        isReady = true;
        return;
    }
    
    if (frame.index === frame.script.length) {
        callstack.pop();
        isReady = true;
        return;
    }
    
    const script = frame.script[frame.index++];
    
    script.command.execute({
        parameters: script.parameters,
        locals: parentFrame.locals,
        onReturn: function (result) {
            parentFrame.finished = true;
            popCallstack();
            parentFrame.onReturn(result);
        },
        complete: function () {
            if (isRunning) {
                isReady = true;
                return;
            }

            continueRunningScripts();
        }
    });
};

const getParentFrameIndex = function () {
    let frameIndex = callstack.length - 1;
    while (frameIndex >= 0) {
        if (callstack[frameIndex].locals) return frameIndex;
        frameIndex--; 
    }
    throw 'Could not find parent frame';
};

const getParentFrame = function () {
    return callstack[getParentFrameIndex()];
};
    
const evaluateExpression = function (expr, complete) {
    if (!expr.tree) {
        throw 'Not an expression: ' + expr;
    }
    const frame = callstack[callstack.length - 1];
    if (!frame.expressionStack) frame.expressionStack = [];
    frame.expressionStack.push({
        expr: expr.expr,
        tree: expr.tree,
        complete: function (result) {
            complete(result);
        }
    });
    
    evaluateNext();
};

const evaluateExpressions = function (exprs, complete) {
    let index = 0;
    const results = [];
    const go = function () {
        if (index === exprs.length) {
            complete(results);
        }
        else {
            evaluateExpression(exprs[index], (result) => {
                results.push(result);
                index++;
                go();
            });
        }
    };
    go();
};

let lastExpr = null;

const evaluateNext = function () {
    const frame = callstack[callstack.length - 1];
    const expressionFrame = frame.expressionStack.pop();
    if (!expressionFrame) {
        throw 'Expression has already been evaluated';
    }
    const tree = expressionFrame.tree;
    if (expressionFrame.expr) lastExpr = expressionFrame.expr;
    let locals;
    
    try {
        switch (tree.type) {
            case 'Literal':
                expressionFrame.complete(tree.value);
                break;
            case 'Identifier':
                locals = getParentFrame().locals;
                if (tree.name in locals) {
                    expressionFrame.complete(locals[tree.name]);   
                }
                else if (state.isElement(tree.name)) {
                    expressionFrame.complete(state.getElement(tree.name));
                }
                else {
                    throw 'Unknown variable ' + tree.name;
                }
                
                break;
            case 'ThisExpression':
                locals = getParentFrame().locals;
                if ('this' in locals) {
                    expressionFrame.complete(locals['this']);
                }
                else {
                    throw 'Unknown variable this';
                }
                break;
            case 'BinaryExpression':
                frame.expressionStack.push({
                    tree: tree.left,
                    complete: function (leftResult) {
                        frame.expressionStack.push({
                            tree: tree.right,
                            complete: function (rightResult) {
                                expressionFrame.complete(binaryOperator(tree.operator, leftResult, rightResult));
                            }
                        });
                        evaluateNext();
                    }
                });
                evaluateNext();
                break;
            case 'CallExpression': {
                if (tree.callee.type !== 'Identifier') {
                    throw 'Function name must be an identifier';
                }
                let index = 0;
                const args = [];
                const evaluateArgs = function () {
                    if (index === tree.arguments.length) {
                        callFunction(tree.callee.name, args, (result) => {
                            expressionFrame.complete(result);
                        });
                        return;
                    }
                    frame.expressionStack.push({
                        tree: tree.arguments[index],
                        complete: function (result) {
                            index++;
                            args.push(result);
                            evaluateArgs();
                        }
                    });
                    evaluateNext();
                };
                evaluateArgs();
                
                break;
            }
            case 'MemberExpression':
                if (tree.computed) {
                    throw 'Unsupported expression';
                }
                if (tree.property.type !== 'Identifier') {
                    throw 'Attribute name must be an identifier';
                }
                frame.expressionStack.push({
                    tree: tree.object,
                    complete: function (result) {
                        if (result.type !== 'element') {
                            throw 'Expected element, got ' + result;
                        }
                        expressionFrame.complete(state.get(state.getElement(result.name), tree.property.name));
                    }
                });
                evaluateNext();
                break;
            case 'UnaryExpression':
                if (tree.operator === 'not') {
                    frame.expressionStack.push({
                        tree: tree.argument,
                        complete: function (result) {
                            expressionFrame.complete(!result);
                        }
                    });
                    evaluateNext();
                }
                else if (tree.operator === '-') {
                    frame.expressionStack.push({
                        tree: tree.argument,
                        complete: function (result) {
                            expressionFrame.complete(-result);
                        }
                    });
                    evaluateNext();
                }
                else {
                    throw 'Unrecognised operator: ' + tree.operator;
                }
                break;
            default:
                throw 'Unknown expression tree type: ' + tree.type;
        }
    }
    catch (e) {
        if (lastExpr) {
            console.log('Error evaluating expression: ' + lastExpr);
            console.log(e);
            ui.print('<span style="color:red"><b>Script error:</b> ' + e + '</span>');
            lastExpr = null;
        }
        
        throw e;
    }
};

const binaryOperator = function (operator, left, right) {
    switch (operator) {
        case '=':
            return left === right;
        case '!=':
        case '<>':
            return left !== right;
        case '<':
            return left < right;
        case '>':
            return left > right;
        case '<=':
            return left <= right;
        case '>=':
            return left >= right;
        case '+':
            return left + right;
        case '-':
            return left - right;
        case '*':
            return left * right;
        case '/':
            return left / right;
        case 'and':
            return left && right;
        case 'or':
            return left || right;
        default:
            throw 'Undefined operator ' + operator;
    }
};

const callFunction = function (name, args, complete) {
    let fn;
    
    if (state.functionExists(name)) {
        fn = state.getFunctionDefinition(name);
        const argumentValues = {};
        if (fn.parameters) {
            for (let i = 0; i < fn.parameters.length; i++) {
                if (i >= args.length) break;
                argumentValues[fn.parameters[i]] = args[i];
            }
        }
        callstack.push({
            script: fn.script,
            locals: argumentValues,
            index: 0,
            onReturn: complete
            // onReturn: function (result) {
            //     console.log('FN: ' + name);
            //     console.log(result);
            //     complete(result);
            // }
        });
        executeNext();
        return;
    }
    
    if (name === 'IsDefined') {
        const frame = callstack[callstack.length - 1];
        let result = false;
        if (frame.locals) result = args[0] in frame.locals;
        complete(result);
        return;
    }
    
    fn = functions.functions[name];
    if (!fn) {
        fn = functions.asyncFunctions[name];
        if (!fn) {
            throw 'Unrecognised function ' + name;
        }
        fn(args, complete);
        return;
    }
    
    complete(fn(args));
};

exports.executeScript = executeScript;
exports.evaluateExpressions = evaluateExpressions;
exports.evaluateExpression = evaluateExpression;
exports.getCallstack = getCallstack;
exports.continueRunningScripts = continueRunningScripts;
exports.callFunction = callFunction;