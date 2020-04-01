'use strict';

window.quest = window.quest || {};
window.quest.print = (text) => {
    console.log(text);
};
window.quest.ui = {
    showMenu: () => {},
    beginWait: () => {},
    showQuestion: () => {},
    playSound: () => {},
    stopSound: () => {},
    clearScreen: () => {},
    setBackground: () => {},
    setPanelContents: () => {},
    panesVisible: () => {},
    locationUpdated: () => {},
    setGameName: () => {},
    show: () => {},
    updateStatus: () => {},
    updateList: () => {},
    updateCompass: () => {},
    requestNextTimerTick: () => {}
};

const asl4 = require('./asl4');
const fs = require('fs');

const fileFetcher = function (filename, onSuccess, onFailure) {
    try {
        const data = fs.readFileSync(filename, 'utf-8');
        onSuccess(data);
    }
    catch (e) {
        onFailure();
    }
};

test('loads test.asl', async () => {
    const game = asl4.createGame('examples/test.asl', null, null, fileFetcher, null, null);
    const onSuccess = () => game.Begin();
    const onFailure = () => {};
    await game.Initialise(onSuccess, onFailure);

    // TODO: Capture output and compare against a snapshot
});