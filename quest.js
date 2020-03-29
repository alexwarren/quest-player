'use strict';

/* global $, quest, apiRoot, $_GET, onLoadDesktop */

require('babel-polyfill');
const asl5 = require('./asl5/asl5.js');

window.quest = window.quest || {};

const paperScript = document.createElement('script');
paperScript.setAttribute('src', 'ui/grid.js');
paperScript.setAttribute('type', 'text/paperscript');
paperScript.setAttribute('canvas', 'gridCanvas');
document.head.appendChild(paperScript);

const paperJs = document.createElement('script');
paperJs.setAttribute('src', 'ui/paper.js');
document.head.appendChild(paperJs);

const fileFetcher = function (filename, onSuccess, onFailure) {
    $.ajax({
        url: filename,
        success: onSuccess,
        error: onFailure
    });
};

const binaryFileFetcher = function (filename, onSuccess, onFailure) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', filename, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
        if (this.status === 200) {
            const result = new Uint8Array(this.response);
            onSuccess(result);
        }
        else {
            onFailure();
        }
    };
    xhr.send();
};

const checkCanSave = function () {
    $.ajax({
        url: apiRoot + 'games/cansave',
        success: function (result) {
            if (result) {
                $('#cmdSave').show();
            }
        },
        xhrFields: {
            withCredentials: true
        }
    });
};

const launchV4 = function (url, resourceRoot, resumeData) {
    const asl4 = require('./asl4/asl4.js');
    const game = asl4.createGame(url, url, resumeData, fileFetcher, binaryFileFetcher, resourceRoot);
    const onSuccess = function () {
        game.Begin();
    };
    const onFailure = function () {
        console.log('fail');
    };
    quest.sendCommand = game.SendCommand.bind(game);
    quest.endWait = game.EndWait.bind(game);
    quest.setQuestionResponse = game.SetQuestionResponse.bind(game);
    quest.setMenuResponse = game.SetMenuResponse.bind(game);
    quest.save = game.SaveGame.bind(game);
    quest.tick = game.Tick.bind(game);
    game.Initialise(onSuccess, onFailure);
};

const launchV6 = function (url) {
    $.get(url, (data) => {
        quest.sendCommand = asl5.sendCommand;
        asl5.load(data);
        asl5.begin();
    });
};

const launchFilename = function (filename) {
    const extRegex = /\.[0-9a-z]+$/i;
    const extMatch = extRegex.exec(filename);
    if (!extMatch) return;
    const ext = extMatch[0];
    if (ext === '.aslx') {
        launchV6(filename);
    }
    else if (ext === '.asl' || ext === '.cas') {
        launchV4(filename);
    }
};

const onLoadWeb = function () {
    const id = $_GET['id'];
    const resume = $_GET['resume'];
    
    const filename = $_GET['file'];
    
    if (filename) {
        launchFilename(filename);
        return;
    }
    
    if (!id) return;
    
    const load = function () {
        $.get('http://textadventures.co.uk/api/game/' + id, (result) => {
            checkCanSave();
            
            if (result.ASLVersion >= 500) {
                // TODO: Pass result.ResourceRoot
                launchV6(result.PlayUrl);
            }
            else {
                launchV4(result.PlayUrl, result.ResourceRoot, resumeData);
            }
        });
    };
    
    let resumeData = null;
    
    if (!resume) {
        load();
    }
    else {
        $.ajax({
            url: 'http://textadventures.co.uk/games/load/' + id,
            success: function(result) {
                resumeData = atob(result.Data);
                load();
            },
            error: function() {
                // TODO: Report error to user
            },
            xhrFields: {
                withCredentials: true
            }
        });
    }
};

window.gridApi = window.gridApi || {};
window.gridApi.onLoad = function () {
    if (window.process) {
        // desktop Quest Player
        onLoadDesktop();
    }
    else {
        onLoadWeb(); 
    }
};

// TODO: Game session logging for ActiveLit
// if (gameSessionLogId) {
//     $.ajax({
//         url: apiRoot + "games/startsession/?gameId=" + $_GET["id"] + "&blobId=" + gameSessionLogId,
//         success: function (result) {
//             if (result) {
//                 gameSessionLogData = result;
//                 setUpSessionLog();
//             }
//         },
//         type: "POST",
//         xhrFields: {
//             withCredentials: true
//         }
//     });
// }