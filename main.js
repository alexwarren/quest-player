'use strict';

const app = require('electron').app;
const BrowserWindow = require('electron').BrowserWindow;
const dialog = require('electron').dialog;
const ipcMain = require('electron').ipcMain;
const path = require('path');
const storage = require('./storage');

//var argv = process.argv;

let openFile;

if (process.platform !== 'darwin' && process.argv[1] !== '.') {
    openFile = process.argv[1];
}

app.on('open-file', (event /*, path */) => {
    event.preventDefault();
    // TODO: This handles dragging file onto app in OS X
    
    // openFile = path;
    // if (mainWindow) {
    //   mainWindow.webContents.executeJavaScript('loadFile(' + JSON.stringify(path) + ')');
    // }
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null;

const init = function() {
    let lastWindowState = storage.get('lastWindowState');
    if (lastWindowState === null) {
        lastWindowState = {
            width: 1200,
            height: 600,
            maximized: false
        };
    }
    
    mainWindow = new BrowserWindow({
        x: lastWindowState.x,
        y: lastWindowState.y,
        width: lastWindowState.width,
        height: lastWindowState.height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
        //icon: __dirname + '/quest.png'
    });
    
    if (lastWindowState.maximized) {
        mainWindow.maximize();
    }

    mainWindow.openFile = openFile;

    if (openFile) {
        mainWindow.loadURL('file://' + __dirname + '/dist/index.html');
    }
    else {
        mainWindow.loadURL('file://' + __dirname + '/dist/start.html');
    }
    
    mainWindow.on('close', () => {
        const bounds = mainWindow.getBounds();
        storage.set('lastWindowState', {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            maximized: mainWindow.isMaximized()
        });
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
    
    const Menu = require('electron').Menu;
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

// Quit when all windows are closed, except on OS X.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On OS X, this is called when the app is running in the Dock with no open windows.
app.on('activate-with-no-open-windows', init);

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', init);

const fileOpen = function () {
    const result = dialog.showOpenDialogSync({
        filters: [
            { name: 'Quest games', extensions: ['aslx', 'asl', 'cas'] }
        ]
    });
    if (!result) return;
    mainWindow.openFile = result[0];
    mainWindow.loadURL('file://' + __dirname + '/dist/index.html');
};

ipcMain.on('file-open', fileOpen);

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open...',
                accelerator: 'CmdOrCtrl+O',
                click: fileOpen
            },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+S',
                click: function () {
                    
                }
            },
            {
                label: 'Save As...',
                accelerator: 'CmdOrCtrl+Shift+S',
                click: function () {
                    
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.reload();
                    }
                }
            },
            {
                label: 'Toggle Full Screen',
                accelerator: (function() {
                    if (process.platform === 'darwin') {
                        return 'Ctrl+Command+F';
                    }
                    return 'F11';
                })(),
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
            },
            {
                label: 'Toggle Developer Tools',
                accelerator: (function() {
                    if (process.platform === 'darwin') {
                        return 'Alt+Command+I';
                    }
                    return 'Ctrl+Shift+I';
                })(),
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                }
            }
        ]
    },
    {
        label: 'Window',
        role: 'window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Documentation',
                click: function() { require('electron').shell.openExternal('http://docs.textadventures.co.uk/quest/'); }
            }
        ]
    }
];

const name = 'Quest Player';

const appMenuTemplate = {
    label: name,
    submenu: [
        {
            label: 'About ' + name,
            role: 'about'
        },
        {
            type: 'separator'
        },
        {
            label: 'Services',
            role: 'services',
            submenu: []
        },
        {
            type: 'separator'
        },
        {
            label: 'Hide ' + name,
            accelerator: 'Command+H',
            role: 'hide'
        },
        {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            role: 'hideothers'
        },
        {
            label: 'Show All',
            role: 'unhide'
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() { app.quit(); }
        }
    ]
};

if (process.platform === 'darwin') {
    template.unshift(appMenuTemplate);
    // Window menu.
    template[3].submenu.push(
        {
            type: 'separator'
        },
        {
            label: 'Bring All to Front',
            role: 'front'
        }
    );
}

