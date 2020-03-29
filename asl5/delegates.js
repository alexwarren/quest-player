'use strict';

const state = require('./state.js');
const scriptrunner = require('./scriptrunner.js');

const runDelegate = function (args, complete) {
    const element = args[0];
    const delName = args[1];
    const impl = state.getAttributeOfType(element, delName, 'delegateimplementation');
    if (!impl) {
        throw 'Object "' + element.name + '" has no delegate implementation "' + delName + '"';
    }

    const delegateDefinition = state.getElement(impl.delegateType);
    const script = impl.script;
    if (!script) {
        complete();
        return;
    }
    
    const locals = {};
    if (args.length > 2) {
        const paramNames = state.getAttributeOfType(delegateDefinition, 'paramnames', 'stringlist');
        for (let i = 0; i < paramNames.value.length; i++) {
            locals[paramNames.value[i]] = args[2 + i];
        }
    }
    locals['this'] = element;
    
    scriptrunner.getCallstack().push({
        script: script,
        locals: locals,
        index: 0,
        onReturn: complete
    });
    scriptrunner.continueRunningScripts();
};

exports.runDelegate = runDelegate;