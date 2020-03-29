'use strict';

const state = require('./state.js');
const scriptrunner = require('./scriptrunner.js');
const delegates = require('./delegates.js');

const asyncFunctions = {
    'GetInput': function (args, complete) {
        // TODO: Override input handler
        
        setTimeout(() => {
            complete('test');
        }, 200);
    },
    'DynamicTemplate': function (args, complete) {
        const name = getParameter(args[0], 'DynamicTemplate', 'string');
        const element = state.tryGetElement(name);
        if (!element || element.elementType !== 'dynamictemplate') {
            // if there is no dynamictemplate of this name, return the "ordinary" template instead.
            return state.getTemplate(name).attributes.text;
        }
        if (args.length > 2) {
            // TODO
            throw 'DynamicTemplate with multiple parameters not implemented';
        }
        if (args[1].type !== 'element') {
            // TODO
            throw 'DynamicTemplate with non-object parameter not implemented';
        }
        const expr = state.get(element, 'text');
        scriptrunner.evaluateExpression(expr, complete);
    },
    'RunDelegateFunction': function (args, complete) {
        delegates.runDelegate(args, complete);
    }
};

const functions = {
    // String Functions
    'Left': function (args) {
        const input = args[0];
        const length = args[1];
        if (input == null) return '';
        return input.substring(0, length);
    },
    'Right': function (args) {
        const input = args[0];
        const length = args[1];
        if (input == null) return '';
        return input.substring(input.length - length - 1);
    },
    'Mid': function (args) {
        const input = args[0];
        const start = args[1];
        if (args.length > 2) {
            const length = args[2];
            return input.substr(start - 1, length);
        }
        return input.substr(start - 1);
    },
    'UCase': function (args) {
        const input = args[0];
        return input.toUpperCase();
    },
    'LCase': function (args) {
        const input = args[0];
        return input.toLowerCase();
    },
    'LengthOf': function (args) {
        const input = args[0];
        if (typeof input === 'undefined' || input === null) return 0;
        return input.length;
    },
    'CapFirst': function (args) {
        const input = args[0];
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    },
    'Instr': function (args) {
        let input, search;
        if (args.length > 2) {
            const start = args[0];
            input = args[1];
            search = args[2];
            return input.indexOf(search, start - 1) + 1;
        }
        input = args[0];
        search = args[1];
        return input.indexOf(search) + 1;
    },
    'InstrRev': function (args) {
        let input, search;
        if (args.length > 2) {
            const start = args[0];
            input = args[1];
            search = args[2];
            return input.lastIndexOf(search, start - 1) + 1;
        }
        input = args[0];
        search = args[1];
        return input.lastIndexOf(search) + 1;
    },
    'StartsWith': function (args) {
        const input = args[0];
        const search = args[1];
        return input.indexOf(search) === 0;
    },
    'EndsWith': function (args) {
        const input = args[0];
        const search = args[1];
        return input.indexOf(search) === input.length - search.length;
    },
    'Split': function (args) {
        const input = args[0];
        const splitChar = args[1];
        const result = state.newAttribute('stringlist');
        result.value = input.split(splitChar);
        return result;
    },
    'Join': function (args) {
        const input = args[0];
        const joinChar = args[1];
        // TODO: Handle other types
        if (!input.type || input.type !== 'stringlist') {
            throw 'Unhandled type passed to Join';
        }
        return input.value.join(joinChar);
    },
    'IsNumeric': function (args) {
        const input = args[0];
        return !isNaN(parseFloat(input)) && isFinite(input);
    },
    'Replace': function (args) {
        const input = args[0];
        const oldString = args[1];
        const newString = args[2];
        return input.split(oldString).join(newString);
    },
    'Trim': function (args) {
        const input = args[0];
        return input.trim();
    },
    'LTrim': function (args) {
        const input = args[0];
        return input.replace(/^\s+/,'');
    },
    'RTrim': function (args) {
        const input = args[0];
        return input.replace(/\s+$/,'');
    },
    'Asc': function (args) {
        const input = args[0];
        return input.charCodeAt(0);
    },
    'Chr': function (args) {
        const input = args[0];
        return String.fromCharCode(input);
    },
    // ExpressionOwner functions
    'Template': function (args) {
        const name = getParameter(args[0], 'Template', 'string');
        return state.getTemplate(name).attributes.text;
    },
    'HasString': function (args) {
        const element = getParameter(args[0], 'HasString', 'element');
        const attribute = getParameter(args[1], 'HasString', 'string');
        return state.hasAttributeOfType(element, attribute, 'string');
    },
    'GetString': function (args) {
        const element = getParameter(args[0], 'GetString', 'element');
        const attribute = getParameter(args[1], 'GetString', 'string');
        return state.getAttributeOfType(element, attribute, 'string');
    },
    'HasBoolean': function (args) {
        const element = getParameter(args[0], 'HasBoolean', 'element');
        const attribute = getParameter(args[1], 'HasBoolean', 'string');
        return state.hasAttributeOfType(element, attribute, 'boolean');
    },
    'GetBoolean': function (args) {
        const element = getParameter(args[0], 'GetBoolean', 'element');
        const attribute = getParameter(args[1], 'GetBoolean', 'string');
        return state.getAttributeOfType(element, attribute, 'boolean');
    },
    'HasInt': function (args) {
        const element = getParameter(args[0], 'HasInt', 'element');
        const attribute = getParameter(args[1], 'HasInt', 'string');
        return state.hasAttributeOfType(element, attribute, 'int');
    },
    'GetInt': function (args) {
        const element = getParameter(args[0], 'GetInt', 'element');
        const attribute = getParameter(args[1], 'GetInt', 'string');
        return state.getAttributeOfType(element, attribute, 'int');
    },
    'HasDouble': function (args) {
        const element = getParameter(args[0], 'HasString', 'element');
        const attribute = getParameter(args[1], 'HasString', 'string');
        return state.hasAttributeOfType(element, attribute, 'double');
    },
    'GetDouble': function (args) {
        const element = getParameter(args[0], 'HasDouble', 'element');
        const attribute = getParameter(args[1], 'HasDouble', 'string');
        return state.getAttributeOfType(element, attribute, 'double');
    },
    'HasScript': function (args) {
        const element = getParameter(args[0], 'HasScript', 'element');
        const attribute = getParameter(args[1], 'HasScript', 'string');
        return state.hasAttributeOfType(element, attribute, 'script');
    },
    'HasObject': function (args) {
        const element = getParameter(args[0], 'HasObject', 'element');
        const attribute = getParameter(args[1], 'HasObject', 'string');
        return state.hasAttributeOfType(element, attribute, 'object');
    },
    'HasDelegateImplementation': function (args) {
        const element = getParameter(args[0], 'HasDelegateImplementation', 'element');
        const attribute = getParameter(args[1], 'HasDelegateImplementation', 'string');
        return state.hasAttributeOfType(element, attribute, 'delegateimplementation');
    },
    'GetAttribute': function () {
        // TODO
        throw 'GetAttribute not implemented';
    },
    'HasAttribute': function (args) {
        const element = getParameter(args[0], 'HasAttribute', 'element');
        const attribute = getParameter(args[1], 'HasAttribute', 'string');
        return state.hasAttribute(element, attribute);
    },
    'GetAttributeNames': function (args) {
        const element = getParameter(args[0], 'GetAttributeNames', 'element');
        const includeInheritedAttributes = getParameter(args[1], 'GetAttributeNames', 'boolean');
        const result = state.newAttribute('stringlist');
        result.value = state.attributeNames(element, includeInheritedAttributes);
        return result;
    },
    'GetExitByLink': function () {
        // TODO
        throw 'GetExitByLink not implemented';
    },
    'GetExitByName': function () {
        // TODO
        throw 'GetExitByName not implemented';
    },
    'Contains': function (args) {
        const parent = getParameter(args[0], 'Contains', 'element');
        const element = getParameter(args[1], 'Contains', 'element');
        return state.contains(parent, element);
    },
    'NewStringList': function () {
        return state.newAttribute('stringlist');
    },
    'NewObjectList': function () {
        return state.newAttribute('objectlist');
    },
    'NewList': function () {
        return state.newAttribute('list');
    },
    'NewStringDictionary': function () {
        return state.newAttribute('stringdictionary');
    },
    'NewObjectDictionary': function () {
        return state.newAttribute('objectdictionary');
    },
    'NewScriptDictionary': function () {
        return state.newAttribute('scriptdictionary');
    },
    'NewDictionary': function () {
        return state.newAttribute('dictionary');
    },
    'ListContains': function (args) {
        const list = args[0];
        const item = args[1];
        checkIsList(list);
        return list.value.indexOf(item) !== -1;
    },
    'AllObjects': function () {
        const objects = state.getElements('object', 'object');
        const result = state.newAttribute('objectlist');
        result.value = objects;
        return result;
    },
    'AllExits': function () {
        const exits = state.getElements('object', 'exit');
        const result = state.newAttribute('objectlist');
        result.value = exits;
        return result;
    },
    'AllTurnScripts': function () {
        const turnScripts = state.getElements('object', 'turnscript');
        const result = state.newAttribute('objectlist');
        result.value = turnScripts;
        return result;
    },
    'AllCommands': function () {
        const commands = state.getElements('object', 'command');
        const result = state.newAttribute('objectlist');
        result.value = commands;
        return result;
    },
    'ListCount': function (args) {
        const list = args[0];
        if (isList(list)) {
            return list.value.length;
        }
        if (isDictionary(list)) {
            return Object.keys(list.value).length;
        }
        throw 'ListCount function expected list parameter but was passed ' + state.typeOf(list);
    },
    'ListItem': function (args) {
        return listItem('ListItem', args);
    },
    'StringListItem': function (args) {
        return listItem('StringListItem', args);
    },
    'ObjectListItem': function (args) {
        return listItem('ObjectListItem', args);
    },
    'GetObject': function (args) {
        const name = getParameter(args[0], 'GetObject', 'string');
        return state.tryGetElement(name);
    },
    'GetTimer': function () {
        // TODO
        throw 'GetTimer not implemented';
    },
    'TypeOf': function (args) {
        let value;
        if (args.length === 1) {
            value = args[0];
        }
        else {
            const element = getParameter(args[0], 'TypeOf', 'element');
            const attribute = getParameter(args[1], 'TypeOf', 'string');
            value = state.get(element, attribute);
        }
        return state.typeOf(value);
    },
    'SafeXML': function (args) {
        const input = getParameter(args[0], 'SafeXML', 'string');
        return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    'IsRegexMatch': function (args) {
        const pattern = getParameter(args[0], 'IsRegexMatch', 'string');
        const input = getParameter(args[1], 'IsRegexMatch', 'string');
        const cacheId = getParameter(args[2], 'IsRegexMatch', 'string', true);
        const regex = getRegex(pattern, cacheId).regex;
        const result = regex.test(input);
        return result;
    },
    'GetMatchStrength': function (args) {
        const pattern = getParameter(args[0], 'GetMatchStrength', 'string');
        const input = getParameter(args[1], 'GetMatchStrength', 'string');
        const cacheId = getParameter(args[2], 'GetMatchStrength', 'string', true);
        const regex = getRegex(pattern, cacheId);
        return getMatchStrength(regex, input);
    },
    'Populate': function (args) {
        const pattern = getParameter(args[0], 'Populate', 'string');
        const input = getParameter(args[1], 'Populate', 'string');
        const cacheId = getParameter(args[2], 'Populate', 'string', true);
        const regex = getRegex(pattern, cacheId);
        const result = state.newAttribute('stringdictionary');
        result.value = populate(regex, input);
        return result;
    },
    'DictionaryItem': function (args) {
        return dictionaryItem('DictionaryItem', args);
    },
    'StringDictionaryItem': function (args) {
        return dictionaryItem('DictionaryItem', args);
    },
    'ObjectDictionaryItem': function (args) {
        return dictionaryItem('DictionaryItem', args);
    },
    'ScriptDictionaryItem': function (args) {
        return dictionaryItem('DictionaryItem', args);
    },
    'ShowMenu': function () {
        // TODO
        throw 'ShowMenu not implemented';
    },
    'DictionaryContains': function (args) {
        const dic = args[0];
        const key = getParameter(args[1], 'DictionaryContains', 'string');
        checkIsDictionary(dic);
        return Object.prototype.hasOwnProperty.call(dic.value, key);
    },
    'DictionaryCount': function () {
        // TODO
        throw 'DictionaryCount not implemented';
    },
    'ToInt': function () {
        // TODO
        throw 'ToInt not implemented';
    },
    'ToDouble': function () {
        // TODO
        throw 'ToDouble not implemented';
    },
    'ToString': function (args) {
        return '' + args[0];
    },
    'IsInt': function () {
        // TODO
        throw 'IsInt not implemented';
    },
    'IsDouble': function () {
        // TODO
        throw 'IsDouble not implemented';
    },
    'GetInput': function () {
        // TODO
        throw 'GetInput not implemented';
    },
    'GetFileURL': function () {
        // TODO
        throw 'GetFileURL not implemented';
    },
    'GetFileData': function () {
        // TODO
        throw 'GetFileData not implemented';
    },
    'GetUniqueElementName': function () {
        // TODO
        throw 'GetUniqueElementName not implemented';
    },
    'Ask': function () {
        // TODO
        throw 'Ask not implemented';
    },
    'GetRandomInt': function () {
        // TODO
        throw 'GetRandomInt not implemented';
    },
    'GetRandomDouble': function () {
        // TODO
        throw 'GetRandomDouble not implemented';
    },
    'Eval': function () {
        // TODO
        throw 'Eval not implemented';
    },
    'Clone': function () {
        // TODO
        throw 'Clone not implemented';
    },
    'DoesInherit': function () {
        // TODO
        throw 'DoesInherit not implemented';
    },
    'ListCombine': function (args) {
        const list1 = args[0];
        const list2 = args[1];
        checkIsList(list1);
        if (list1.type !== list2.type) {
            throw 'Mismatched list types passed to ListCombine';
        }
        const result = state.newAttribute(list1.type);
        result.value = list1.value.concat(list2.value);
        return result;
    },
    'ListExclude': function (args) {
        const list = args[0];
        const exclude = args[1];
        checkIsList(list);
        const result = state.newAttribute(list.type);
        result.value = list.value.filter((value) => {
            return value !== exclude;
        });
        return result;
    },
    'GetAllChildObjects': function (args) {
        const element = getParameter(args[0], 'GetAllChildObjects', 'element');
        const result = state.newAttribute('objectlist');
        result.value = state.getAllChildren(element, 'object', 'object');
        return result;
    },
    'GetDirectChildren': function (args) {
        const element = getParameter(args[0], 'GetAllChildObjects', 'element');
        const result = state.newAttribute('objectlist');
        result.value = state.getDirectChildren(element, 'object', 'object');
        return result;
    },
    'IsGameRunning': function () {
        // TODO
        throw 'IsGameRunning not implemented';
    },
    'ObjectListSort': function () {
        // TODO
        throw 'ObjectListSort not implemented';
    },
    'ObjectListSortDescending': function () {
        // TODO
        throw 'ObjectListSortDescending not implemented';
    },
    'StringListSort': function () {
        // TODO
        throw 'StringListSort not implemented';
    },
    'StringListSortDescending': function () {
        // TODO
        throw 'StringListSortDescending not implemented';
    },
    'GetUIOption': function (args) {
        const option = getParameter(args[0], 'GetUIOption', 'string');
        if (option === 'UseGameColours' || option === 'UseGameFont') {
            return 'true';
        }
        return null;
    }
};

const checkIsList = function (list) {
    state.checkIsList(list);
};

const isList = function (list) {
    return state.isList(list);
};

const checkIsDictionary = function (dic) {
    state.checkIsDictionary(dic);
};

const isDictionary = function (dic) {
    return state.isDictionary(dic);
};

const getParameter = function (parameter, caller, type, allowNull) {
    if (allowNull && parameter == null) return null;
    const actualType = state.typeOf(parameter);
    if (actualType !== type) {
        throw caller + ' function expected ' + type + ' parameter but was passed ' + actualType;
    }
    return parameter;
};

const listItem = function (fn, args) {
    const list = args[0];
    checkIsList(list);
    const index = getParameter(args[1], fn, 'int');
    if (index < 0 || index >= list.value.length) {
        throw fn + ': index ' + index +
            ' is out of range for this list (' +
            list.value.length +
            ' items, last index is ' +
            list.value.length - 1 + ')';
    }
    return list.value[index];

    // TODO: If type does not match expected type, return null
};

const dictionaryItem = function (fn, args) {
    const dic = args[0];
    checkIsDictionary(dic);
    const key = getParameter(args[1], fn, 'string');
    return dic.value[key];

    // TODO: Check behaviour when key does not exist
    // TODO: If type does not match expected type, return null
};

const regexCache = {};

const getRegex = function (regex, cacheId) {
    let result;
    if (cacheId) {
        result = regexCache[cacheId];
        if (result) return result;
    }
    const cleanPattern = namedRegex.cleanRegExp(regex);
    result = {
        map: namedRegex.getMap(regex),
        regex: new RegExp(cleanPattern, 'i')
    };
    if (cacheId) {
        regexCache[cacheId] = result;
    }
    return result;
};

const getMatchStrength = function (regexAndMap, input) {
    // Based on Utility.GetMatchStrengthInternal

    const regex = regexAndMap.regex;

    if (!regex.test(input)) {
        throw '"' + input + '" is not a match for regex "' + regex + '"';
    }

    // The idea is that you have a regex like
    //          look at (?<object>.*)
    // And you have a string like
    //          look at thing
    // The strength is the length of the "fixed" bit of the string, in this case "look at ".
    // So we calculate this as the length of the input string, minus the length of the
    // text that matches the named groups.

    let lengthOfTextMatchedByGroups = 0;
    const matches = regex.exec(input);
    const groupIndexes = Object.keys(regexAndMap.map);
    console.log(groupIndexes);

    groupIndexes.forEach((idx) => {
        const match = matches[parseInt(idx)];
        if (match) lengthOfTextMatchedByGroups += match.length;
    });

    return input.length - lengthOfTextMatchedByGroups;
};

const populate = function (regexAndMap, input) {
    const matches = regexAndMap.regex.exec(input);
    const result = namedRegex.mapCaptures(regexAndMap.map, matches);
    return result;
};

const namedRegex = {
    getMap: function (rx) {
        const map = {};
        let bracketCount = 0;
        const namedGroupMatch = /^\(\?<(\w+)>/;

        for (let i = 0; i < rx.length; i++) {
            switch (rx[i]) {
                case '(': {
                    bracketCount++;
                    const match = namedGroupMatch.exec(rx.substr(i));
                    if (match) {
                        map[bracketCount] = match[1];
                    }
                    break;
                }
            }
        }

        return map;
    },
    mapCaptures: function (map, captures) {
        if (captures === null) {
            return null;
        }
        const result = {};
        for (const idx in map) {
            if (!result[map[idx]]) {
                result[map[idx]] = captures[idx] || '';
            }
        }
        return result;
    },
    cleanRegExp: function (rx) {
        return rx.replace(/\(\?<\w+>/g, '(');
    }
};

exports.asyncFunctions = asyncFunctions;
exports.functions = functions;