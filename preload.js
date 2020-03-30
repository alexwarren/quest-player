const ipcRenderer = require('electron').ipcRenderer;

window.addEventListener('DOMContentLoaded', () => {
    const fileOpen = document.getElementById("file-open");
    if (fileOpen) {
        fileOpen.addEventListener("click", () => ipcRenderer.send('file-open'));
    }
});