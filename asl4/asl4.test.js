'use strict';

const output = [];

window.quest = window.quest || {};
window.quest.print = (text) => {
    output.push(text);
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

console.log = () => {};

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

test('loads test.asl', async (done) => {
    const game = asl4.createGame('examples/test.asl', null, null, fileFetcher, null, null);
    const onSuccess = async () => {
        await game.Begin();
        game.SendCommand('x book');
        setTimeout(() => {
            game.SetMenuResponse('1');
            setTimeout(() => {
                expect(output).toMatchSnapshot();
                done();
            }, 1);
        }, 1);
    };
    const onFailure = () => {};
    await game.Initialise(onSuccess, onFailure);
});