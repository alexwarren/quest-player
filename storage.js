'use strict';

// based on http://www.mylifeforthecode.com/saving-and-restoring-window-state-in-electron/

const app = require('electron').app;
const fs = require('fs');
const path = require('path');
let data = null;
const dataFilePath = path.join(app.getPath('userData'), 'settings.json'); 

function load() {
    if (!fs.existsSync(dataFilePath)) {
        data = {};
        return;
    }

    data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8')); 
}

function save() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data)); 
}

exports.set = function (key, value) {
    load();
    data[key] = value; 
    save();
};

exports.get = function (key) { 
    load();
    let value = null;
    if (key in data) {
        value = data[key];
    } 
    return value;
};

exports.unset = function (key) { 
    load();
    if (key in data) {
        delete data[key];
        save();
    } 
};