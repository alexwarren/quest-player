//var state = require('../state.js');

module.exports = {
    execute: function (ctx) {
        // TODO
        console.log(ctx.parameters.appliesTo + ' => ' + ctx.parameters.value);
        ctx.complete();
    }
};