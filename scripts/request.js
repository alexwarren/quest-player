var scriptrunner = require('../scriptrunner.js');
var ui = require('../ui.js');

module.exports = {
    parameters: [2],
    execute: function (ctx) {               
        scriptrunner.evaluateExpression(ctx.parameters[1], function (data) {
            var request = ctx.parameters[0].expr;

            // Any changes here should also be reflected in CoreEditorScriptsOutput.aslx (validvalues for "request" command)
            // and also in the documentation https://github.com/textadventures/quest/blob/gh-pages/scripts/request.md

            switch (request) {
                case 'Quit':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'UpdateLocation':
                    ui.locationUpdated(data);
                    break;
                case 'GameName':
                    ui.setGameName(data);
                    break;
                case 'FontName':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'FontSize':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'Background':
                    ui.setBackground(data);
                    break;
                case 'Foreground':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'LinkForeground':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'RunScript':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'SetStatus':
                    ui.updateStatus(data.replace(/\n/g, '<br/>'));
                    break;
                case 'ClearScreen':
                    ui.clearScreen();
                    break;
                case 'PanesVisible':
                    if (data === 'on') {
                        ui.panesVisible(true);
                    }
                    else if (data === 'off' || data === 'disabled') {
                        ui.panesVisible(false);
                    }
                    break;
                case 'ShowPicture':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'Show':
                    ui.show(data);
                    break;
                case 'Hide':
                    ui.hide(data);
                    break;
                case 'SetCompassDirections':
                    ui.setCompassDirections(data.split(';'));
                    break;
                case 'Pause':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'Wait':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'SetInterfaceString':
                    var args = data.split('=');
                    ui.setInterfaceString(args[0], args[1]);
                    break;
                case 'RequestSave':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;
                case 'SetPanelContents':
                    ui.setPanelContents(data);
                    break;
                case 'Log':
                    // TODO
                    console.log('Unhandled request type ' + request);
                    break;                
                case 'Speak':
                    // Do nothing
                    break;
                default:
                    throw 'Unhandled request type ' + request;
            }
            
            ctx.complete();
        });
    }
};