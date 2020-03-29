'use strict';

const scriptrunner = require('../scriptrunner.js');
const state = require('../state.js');

module.exports = {
    parameters: [2, 3],
    execute: function (ctx) {
        scriptrunner.evaluateExpressions(ctx.parameters, (result) => {
            const script = state.getAttributeOfType(result[0], result[1], 'script');
            if (!script) {
                ctx.complete();
                return;
            }
            let locals;
            if (result[2]) {
                state.checkIsDictionary(result[2]);
                locals = result[2].value;
            }
            else {
                locals = {};
            }
            locals['this'] = result[0];
            scriptrunner.getCallstack().push({
                script: script.script,
                locals: locals,
                index: 0,
                onReturn: ctx.complete
            });
            scriptrunner.continueRunningScripts();
        });
    }
};