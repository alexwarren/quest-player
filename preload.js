'use strict';

const ipcRenderer = require('electron').ipcRenderer;

window.addEventListener('DOMContentLoaded', () => {
    // Start screen (start.html)
    const fileOpen = document.getElementById('file-open');
    if (fileOpen) {
        fileOpen.addEventListener('click', () => ipcRenderer.send('file-open'));
    }

    // Main screen (index.html)
    window.onLoadDesktop = function () {
        const remote = require('electron').remote;
        const openFile = remote.getCurrentWindow().openFile;
        window.launchFilename(openFile);
        return true;
    };
});