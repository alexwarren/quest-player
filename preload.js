const ipcRenderer = require('electron').ipcRenderer;

window.addEventListener('DOMContentLoaded', () => {
    // Start screen (start.html)
    const fileOpen = document.getElementById("file-open");
    if (fileOpen) {
        fileOpen.addEventListener("click", () => ipcRenderer.send('file-open'));
    }

    // Main screen (index.html)
    window.onLoadDesktop = function () {
        var remote = require('electron').remote;
        var openFile = remote.getCurrentWindow().openFile;
        launchFilename(openFile);
        return true;
    };
});