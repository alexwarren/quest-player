'use strict';

/* global quest */
/* global addTextAndScroll */
/* global playWav */
/* global playMp3 */
/* global updateCompass */
/* global uiHide */
/* global uiShow */

// Globals are all in ui/player.js
// TODO: Remove globals, move player.js stuff in here
// For Quest 5 games, may need to put existing globals back so games can call them

// UI functions based on the IPlayer interface in WorldModel and implementation in PlayerHandler

window.quest = window.quest || {};

const state = require('./state.js');
const scripts = require('./scripts.js');

const elementMap = {
    'Panes': '#gamePanes',
    'Location': '#location',
    'Command': '#txtCommandDiv'
};

const showHide = function (element, show) {
    const jsElement = elementMap[element];
    if (!jsElement) return;
    const uiFunction = show ? uiShow : uiHide;
    uiFunction(jsElement);
};
    
const show = function (element) {
    showHide(element, true);
};

const hide = function (element) {
    showHide(element, false);
};

const updateCompassDirections = function (listData) {
    const directions = listData.map((item) => {
        return item.Text;
    });
    updateCompass(directions);
};

const playSound = function (filename, synchronous, looped) {
    if (filename.toLowerCase().substr(-4) === '.mp3') {
        playMp3(filename, synchronous, looped);
    }
    else if (filename.toLowerCase().substr(-4) === '.wav') {
        playWav(filename, synchronous, looped);
    }
};

const print = function (text, linebreak) {
    if (state.minVersion(540) && state.functionExists('OutputText')) {
        scripts.executeScript(state.getFunction('OutputText'), {
            text: text
        }, true);
    }
    else {
        if (typeof linebreak === 'undefined') linebreak = true;
        if (linebreak) text += '<br/>';
        addTextAndScroll(text);
    }
};

quest.ui = quest.ui || {};
quest.ui.show = show;
quest.ui.hide = hide;
quest.ui.locationUpdated = window.updateLocation;
quest.ui.updateList = window.updateList;
quest.ui.updateCompass = updateCompassDirections;
quest.ui.beginWait = window.beginWait;
quest.ui.showQuestion = window.showQuestion;
quest.ui.showMenu = window.showMenu;
quest.ui.requestNextTimerTick = window.requestNextTimerTick;
quest.ui.clearScreen = window.clearScreen;
quest.ui.updateStatus = window.updateStatus;
quest.ui.setGameName = window.setGameName;
quest.ui.setPanelContents = window.setPanelContents;
quest.ui.playSound = playSound;
quest.ui.stopSound = window.stopAudio;
quest.ui.setBackground = window.setBackground;
quest.ui.panesVisible = window.panesVisible;
quest.print = print;

exports.show = show;
exports.hide = hide;
exports.locationUpdated = window.updateLocation;
exports.updateList = window.updateList;
exports.updateCompass = updateCompassDirections;
exports.beginWait = window.beginWait;
exports.showQuestion = window.showQuestion;
exports.showMenu = window.showMenu;
exports.requestNextTimerTick = window.requestNextTimerTick;
exports.clearScreen = window.clearScreen;
exports.updateStatus = window.updateStatus;
exports.setGameName = window.setGameName;
exports.setPanelContents = window.setPanelContents;
exports.playSound = playSound;
exports.stopSound = window.stopAudio;
exports.setBackground = window.setBackground;
exports.panesVisible = window.panesVisible;
exports.print = print;
exports.setCompassDirections = window.setCompassDirections;
exports.setInterfaceString = window.setInterfaceString;
exports.scrollToEnd = window.scrollToEnd;