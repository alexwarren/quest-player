var state = require('./state.js');

var load = function (node, element, attributeName) {
    if (state.get(element, 'isverb')) {
        state.onLoadFinished(function () {
            // do this after loading, as we need the separator attribute to exist to create
            // the correct regex
            loadVerb(node, element, attributeName);
        });
    }
    else {
        loadCommand(node, element, attributeName);
    }
};

var loadCommand = function (node, element, attributeName) {
    var value = node.textContent
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '\\?')
        .replace(/#([A-Za-z]\w+)#/g, function (match, group1) {
            return '(?<' + group1 + '>.*)';
        });
    
    if (value.indexOf('#') !== -1)
    {
        throw 'Invalid command pattern ' + element.attributes.name + '.' + attributeName + ' = ' + node.textContent;
    }
    
    var patterns = value.split(/\s*;\s*/).map(function (pattern) {
        return '^' + pattern + '$';
    }).join('|');
    
    state.set(element, attributeName, patterns);
};

var loadVerb = function (node, element, attributeName) {
    var value = convertVerbSimplePattern(node.textContent, state.get(element, 'separator'));
    state.set(element, attributeName, value);
    var verbs = node.textContent.split(';');
    state.set(element, 'displayverb', verbs[0].replace('#object#', '').trim());
};

var convertVerbSimplePattern = function (pattern, separator) {
    // For verbs, we replace "eat; consume; munch" with
    // "^eat (?<object>.*)$|^consume (?<object>.*)$|^munch (?<object>.*)$"
    
    // Optionally the position of the object can be specified, for example
    // "switch #object# on" would become "^switch (?<object>.*) on$"

    var verbs = pattern.split(/\s*;\s*/);
    var result = '';
    var separatorRegex = null;

    if (separator)
    {
        var separators = separator.split(/\s*;\s*/);
        separatorRegex = '(' + separators.join('|') + ')';
    }

    verbs.forEach(function (verb) {
        if (result.length > 0) result += '|';
        var objectRegex = '(?<object>.*?)';

        var textToAdd;
        if (verb.indexOf('#object#') !== -1)
        {
            textToAdd = '^' + verb.replace(/#object#/g, objectRegex);
        }
        else
        {
            textToAdd = '^' + verb + ' ' + objectRegex;
        }

        if (separatorRegex != null)
        {
            textToAdd += '( ' + separatorRegex + ' (?<object2>.*))?';
        }

        textToAdd += '$';

        result += textToAdd;
    });

    return result;
};

exports.load = load;