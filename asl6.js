var state = require('./state.js');
var loader = require('./loader.js');
var scripts = require('./scripts.js');
var ui = require('./ui.js');

var begin = function () {
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

var sendCommand = function (command, elapsedTime, metadata) {
    // TODO: Increment time
    // TODO: Check if command override mode is on
    // TODO: Echo input for ASL <= 520
    
    var metadataArg = state.newAttribute('stringdictionary');
    if (metadata) metadataArg.value = metadata;
    
    scripts.executeScript(state.getFunction('HandleCommand'), {
        command: command,
        metadata: metadataArg
    });

    if (state.minVersion(540)) {
        ui.scrollToEnd();
    }
    
    // TODO: TryFinishTurn
    // TODO: UpdateLists
    // TODO: Send next timer request
};

var load = function (data) {
    loader.load(data);
};

exports.begin = begin;
exports.sendCommand = sendCommand;
exports.load = load;