'use strict';

const state = require('./state.js');
const loader = require('./loader.js');
const scripts = require('./scripts.js');
const ui = require('./ui.js');

const begin = function () {
    // Based on WorldModel.Begin
    
    // TODO: Init timer runner
    // TODO: Show Panes, Location, Command for ASL <= 540
    
    if (state.functionExists('InitInterface')) {
        scripts.executeScript(state.getFunction('InitInterface'));
    }
    
    // TODO: Only call StartGame if not loaded from saved game
    scripts.executeScript(state.getFunction('StartGame'));
    
    
    // TODO: Run on finally scripts
    // TODO: Update lists
    // TODO: If loaded from saved, load output etc.
    // TODO: Send next timer request
};

const sendCommand = function (command, elapsedTime, metadata) {
    // (*** see SendCommand in WorldModel.cs ***)

    // TODO: Increment time
    // TODO: Check if command override mode is on
    // TODO: Echo input for ASL < 520
    
    const metadataArg = state.newAttribute('stringdictionary');
    if (metadata) metadataArg.value = metadata;
    
    scripts.executeScript(state.getFunction('HandleCommand'), {
        command: command,
        metadata: metadataArg
    });

    if (state.minVersion(540)) {
        ui.scrollToEnd();
    }
    
    // TODO: TryFinishTurn (for ASL < 580)
    // TODO: UpdateLists
    // TODO: Send next timer request
};

const load = function (data) {
    loader.load(data);
};

exports.begin = begin;
exports.sendCommand = sendCommand;
exports.load = load;