var state = require('./state.js');
var scriptrunner = require('./scriptrunner.js');

var runDelegate = function (args, complete) {
    var element = args[0];
    var delName = args[1];
    var impl = state.getAttributeOfType(element, delName, 'delegateimplementation');
    if (!impl) {
        throw 'Object "' + element.name + '" has no delegate implementation "' + delName + '"';
    }

    var delegateDefinition = state.getElement(impl.delegateType);
    var script = impl.script;
    if (!script) {
        complete();
        return;
    }
    
    var locals = {};
    if (args.length > 2) {
        var paramNames = state.getAttributeOfType(delegateDefinition, 'paramnames', 'stringlist');
        for (var i = 0; i < paramNames.value.length; i++) {
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