/* global $, quest, apiRoot, $_GET, onLoadDesktop */

require('babel-polyfill');
var asl6 = require('./asl6.js');

window.quest = window.quest || {};

var paperScript = document.createElement('script');
paperScript.setAttribute('src', 'ui/grid.js');
paperScript.setAttribute('type', 'text/paperscript');
paperScript.setAttribute('canvas', 'gridCanvas');
document.head.appendChild(paperScript);

var paperJs = document.createElement('script');
paperJs.setAttribute('src', 'ui/paper.js');
document.head.appendChild(paperJs);

var fileFetcher = function (filename, onSuccess, onFailure) {
    $.ajax({
        url: filename,
        success: onSuccess,
        error: onFailure
    });
};

var binaryFileFetcher = function (filename, onSuccess, onFailure) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
        if (this.status == 200) {
            var result = new Uint8Array(this.response);
            onSuccess(result);
        }
        else {
            onFailure();
        }
    };
    xhr.send();
};

var checkCanSave = function () {
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

var launchV4 = function (url, resourceRoot, resumeData) {
    var asl4 = require('./asl4.js');
    var game = asl4.createGame(url, url, resumeData, fileFetcher, binaryFileFetcher, resourceRoot);
    var onSuccess = function () {
        game.Begin();
    };
    var onFailure = function () {
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

var launchV6 = function (url) {
    $.get(url, function (data) {
        quest.sendCommand = asl6.sendCommand;
        asl6.load(data);
        asl6.begin();
    });
};

var launchFilename = function (filename) {
    var extRegex = /\.[0-9a-z]+$/i;
    var extMatch = extRegex.exec(filename);
    if (!extMatch) return;
    var ext = extMatch[0];
    if (ext == '.aslx') {
        launchV6(filename);
    }
    else if (ext == '.asl' || ext == '.cas') {
        launchV4(filename);
    }
};

var onLoadWeb = function () {
    var id = $_GET['id'];
    var resume = $_GET['resume'];
    
    var filename = $_GET['file'];
    
    if (filename) {
        launchFilename(filename);
        return;
    }
    
    if (!id) return;
    
    var load = function () {
        $.get('http://textadventures.co.uk/api/game/' + id, function (result) {
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
    
    var resumeData = null;
    
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