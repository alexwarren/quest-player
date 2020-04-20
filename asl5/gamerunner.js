'use strict';

const scripts = require('./scripts.js');
const state = require('./state.js');

const runCallbackAndFinishTurn = function (script, locals) {
    scripts.executeScript(script, locals, false);
    tryFinishTurn();
    // TODO: TryFinishTurn
    // TODO: UpdateLists if game not finished
    // TODO: SendNextTimerRequest
};

const tryFinishTurn = function () {
    tryRunOnFinallyScripts();
    // TODO: If no callbacks outstanding, run a FinishTurn game function if it exists
};

const tryRunOnFinallyScripts = function () {
    if (state.anyOutstandingCallbacks()) {
        return;
    }
    const onReadyScripts = state.flushOnReadyCallbacks();
    for (const callback of onReadyScripts) {
        scripts.executeScript(callback.script, callback.locals, true);
    }
};

exports.runCallbackAndFinishTurn = runCallbackAndFinishTurn;
exports.tryFinishTurn = tryFinishTurn;