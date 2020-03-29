'use strict';

const state = require('./state.js');

const load = function (node, element, attributeName) {
    if (state.get(element, 'isverb')) {
        state.onLoadFinished(() => {
            // do this after loading, as we need the separator attribute to exist to create
            // the correct regex
            loadVerb(node, element, attributeName);
        });
    }
    else {
        loadCommand(node, element, attributeName);
    }
};

const loadCommand = function (node, element, attributeName) {
    const value = node.textContent
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '\\?')
        .replace(/#([A-Za-z]\w+)#/g, (match, group1) => {
            return '(?<' + group1 + '>.*)';
        });
    
    if (value.indexOf('#') !== -1)
    {
        throw 'Invalid command pattern ' + element.attributes.name + '.' + attributeName + ' = ' + node.textContent;
    }
    
    const patterns = value.split(/\s*;\s*/).map((pattern) => {
        return '^' + pattern + '$';
    }).join('|');
    
    state.set(element, attributeName, patterns);
};

const loadVerb = function (node, element, attributeName) {
    const value = convertVerbSimplePattern(node.textContent, state.get(element, 'separator'));
    state.set(element, attributeName, value);
    const verbs = node.textContent.split(';');
    state.set(element, 'displayverb', verbs[0].replace('#object#', '').trim());
};

const convertVerbSimplePattern = function (pattern, separator) {
    // For verbs, we replace "eat; consume; munch" with
    // "^eat (?<object>.*)$|^consume (?<object>.*)$|^munch (?<object>.*)$"
    
    // Optionally the position of the object can be specified, for example
    // "switch #object# on" would become "^switch (?<object>.*) on$"

    const verbs = pattern.split(/\s*;\s*/);
    let result = '';
    let separatorRegex = null;

    if (separator)
    {
        const separators = separator.split(/\s*;\s*/);
        separatorRegex = '(' + separators.join('|') + ')';
    }

    verbs.forEach((verb) => {
        if (result.length > 0) result += '|';
        const objectRegex = '(?<object>.*?)';

        let textToAdd;
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