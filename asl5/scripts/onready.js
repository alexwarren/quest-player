var scriptrunner = require('../scriptrunner.js');

module.exports = {
    create: function (line) {
        var scripts = require('../scripts.js');
        var script = scripts.parseScript(line.substr('on ready '.length));
        
        return {
            script: script
        };
    },
    execute: function (ctx) {
        // TODO: Implement callbacks as per WorldModel.AddOnReady.
        // i.e. if there are any Menu/Wait/Question/GetInput/callbacks outstanding,
        // add ctx.parameters.script to the list of onready callbacks. If there
        // are not, then just run the script immediately. 
        scriptrunner.getCallstack().push({
            script: ctx.parameters.script,
            index: 0
        });
        ctx.complete();
    }
};