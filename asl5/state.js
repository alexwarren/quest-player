'use strict';

const scripts = require('./scripts.js');

const elements = {};
const elementsOfType = {};
const templateLookup = {};
let version;
let loadFinishedActions = [];
let loading = true;
let commandOverride = null;

const setVersion = function (value) {
    version = value;
};

const minVersion = function (value) {
    return version >= value;
};

const maxVersion = function (value) {
    return version <= value;
};

const onLoadFinished = function (fn) {
    loadFinishedActions.push(fn);
};

const finishedLoading = function () {
    removeMissingDefaultTypeReferences();
    loading = false;
    loadFinishedActions.forEach((fn) => {
        fn();
    });
    loadFinishedActions = [];
};

const newAttribute = function (type) {
    if (type === 'stringlist' || type === 'objectlist' || type === 'list') {
        return {
            value: [],
            type: type
        };
    }
    
    if (type === 'stringdictionary' || type === 'objectdictionary' || type === 'scriptdictionary' || type === 'dictionary') {
        return {
            value: {},
            type: type
        };
    }
    
    throw 'Unknown attribute type: ' + type;
};

const getElement = function (elementName) {
    const element = elements[elementName];
    if (!element) {
        throw 'No element named ' + elementName;
    }
    return element;
};

const tryGetElement = function (elementName) {
    return elements[elementName];
};

const set = function (element, attribute, value) {
    // TODO: See Fields.Set
    let oldValue = null;
    if (attribute in element.attributes) {
        oldValue = get(element, attribute);
    }
    else {
        // TODO: Check IsValidAttributeName
    }

    // TODO: Determine if changed
    // TODO: Clone clonable value if required
    // TODO: Name must be a string, and can't be changed once set
    // TODO: Parent cannot be set to self
    // TODO: If >v530, setting an attribute to null removes it from the attributes
    //       (TODO: Reassess if null => remove makes sense for >v600)
    element.attributes[attribute] = value;

    if (oldValue !== value) {
        const changedScript = getAttributeOfType(element, 'changed' + attribute, 'script');

        if (changedScript !== null) {
            scripts.executeScript(changedScript.script, {
                oldvalue: oldValue,
                locals: {
                    'this': element
                }
            }, true);
        }
    }
};

const get = function (element, attribute) {
    let result = element.attributes[attribute];
    if (typeof result === 'undefined') {
        if (loading) {
            // Types haven't been initialised yet if we're still loading
            return null;
        }

        for (const idx in element.inheritedTypes) {
            const inheritedTypeElement = getElement(element.inheritedTypes[idx]);
            if (hasAttribute(inheritedTypeElement, attribute)) {
                result = get(inheritedTypeElement, attribute);
                break;
            }
        }
        
        if (typeof result === 'undefined') {
            result = null;
        }
    }
    
    // TODO: Check for listextend
    return result;
};

const addInheritedType = function (element, typeName) {
    // TODO: Check for circular inheritance
    element.inheritedTypes.splice(0, 0, typeName);
};

const hasAttribute = function (element, attribute) {
    if (attribute in element.attributes) return true;

    // Types haven't been initialised yet if we're still loading
    if (loading) return false;
    
    for (const idx in element.inheritedTypes) {
        const inheritedTypeElement = getElement(element.inheritedTypes[idx]);
        return hasAttribute(inheritedTypeElement, attribute);
    }
    // TODO: Optional includeExtendableFields parameter to check for listexend,
    // as per WorldModel.Fields.Exists
    return false;
};

const hasAttributeOfType = function (element, attribute, type) {
    if (!hasAttribute(element, attribute)) return false;
    const value = get(element, attribute);
    return isValueOfType(value, type);
};

const getAttributeOfType = function (element, attribute, type) {
    if (!hasAttribute(element, attribute)) return defaultValue(type);
    const value = get(element, attribute);
    if (isValueOfType(value, type)) return value;
    return defaultValue(type);
};

const isValueOfType = function (value, type) {
    const actualType = typeOf(value);
    if (actualType === type) return true;
    if (actualType === 'int' && type === 'double') return true;
    return false;
};

const defaultValue = function (type) {
    if (type === 'boolean') return false;
    return null;
};

const typeOf = function (value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
        if (value % 1 === 0) return 'int';
        return 'double';
    }
    if (value.type) return value.type;
    throw 'Unknown type';
};

const checkIsList = function (list) {
    if (!isList(list)) {
        throw 'Value is not a list type';
    }
};

const isList = function (list) {
    return list.type === 'list' ||
        list.type === 'stringlist' ||
        list.type === 'objectlist';
};

const checkIsDictionary = function (dic) {
    if (!isDictionary(dic)) {
        throw 'Value is not a dictionary type';
    }
};

const isDictionary = function (dic) {
    return dic.type === 'stringdictionary' ||
        dic.type === 'objectdictionary' ||
        dic.type === 'objectlist' ||
        dic.type === 'dictionary';
};

const attributeNames = function (element, includeInheritedAttributes) {
    let result = Object.keys(element.attributes);
    if (includeInheritedAttributes) {
        for (const idx in element.inheritedTypes) {
            const inheritedTypeElement = getElement(element.inheritedTypes[idx]);
            const additionalAttributes = attributeNames(inheritedTypeElement);
            result = result.concat(additionalAttributes.filter((a) => {
                return result.indexOf(a) === -1;
            }));
        }
    }
    return result;
};

const isElement = function (elementName) {
    return elementName in elements;
};

const create = function (elementName, elementType, elementSubType) {
    const inheritedTypes = [];
    if (elementType === 'object') {
        if (!elementSubType) throw 'Object must have a subtype';
        inheritedTypes.push('default' + elementSubType);
    }
    const element = {
        name: elementName,
        type: 'element',
        elementType: elementType,
        elementSubType: elementSubType,
        attributes: {
            name: elementName,
            elementtype: elementType,
            type: elementSubType
        },
        inheritedTypes: inheritedTypes
    };
    elements[elementName] = element;
    if (!elementsOfType[elementType]) elementsOfType[elementType] = {};
    elementsOfType[elementType][elementName] = element;
    return element;
};

const addTemplate = function (element) {
    templateLookup[element.attributes.templatename] = element;
};

const getTemplate = function (name) {
    return templateLookup[name];
};

const getElements = function (elementType, elementSubType) {
    const elements = elementsOfType[elementType];
    const result = [];
    for (const key in elements) {
        const element = elements[key];
        if (!elementSubType || element.elementSubType === elementSubType) {
            result.push(element);
        }
    }
    return result;
};

const addFunction = function (functionName, script, parameters) {
    const fn = create(functionName, 'function');
    fn.attributes = {
        script: script,
        parameters: parameters
    };
};

const functionExists = function (functionName) {
    return functionName in elementsOfType['function'];
};

const getFunction = function (functionName) {
    return elementsOfType['function'][functionName].attributes.script;
};

const getFunctionDefinition = function (functionName) {
    return elementsOfType['function'][functionName].attributes;
};

const getDirectChildren = function (parent, elementType, elementSubType) {
    const allElements = getElements(elementType, elementSubType);
    return allElements.filter((element) => {
        return element.attributes.parent === parent;
    });
};

const getAllChildren = function (parent, elementType, elementSubType) {
    const directChildren = getDirectChildren(parent, elementType, elementSubType);
    let result = [];
    for (const idx in directChildren) {
        const child = directChildren[idx];
        result = result.concat(child, getAllChildren(child, elementType, elementSubType));
    }
    return result;
};

const contains = function (parent, element) {
    if (!element.attributes.parent) return false;
    if (element.attributes.parent === parent) return true;
    return contains(parent, element.attributes.parent);
};

const nextUniqueId = {};

const getUniqueId = function (prefix) {
    prefix = prefix || 'k';
    if (!(prefix in nextUniqueId)) {
        nextUniqueId[prefix] = 1;
    }
    let newId;
    do {
        newId = prefix + nextUniqueId[prefix]++;
    } while (isElement(newId));
    return newId;
};

const removeMissingDefaultTypeReferences = function () {
    for (const elementName in elementsOfType.object) {
        const element = elementsOfType.object[elementName];
        const defaultTypeName = 'default' + element.elementSubType;
        const defaultType = tryGetElement(defaultTypeName);
        if (!defaultType) {
            const idx = element.inheritedTypes.indexOf(defaultTypeName);
            element.inheritedTypes.splice(idx, 1);
        }
    }
};

const dump = function () {
    console.log('Elements:');
    console.log(elements);
};

const setCommandOverride = function (fn) {
    commandOverride = fn;
};

const getCommandOverride = function () {
    return commandOverride;
};

const callbacks = {};
let onReadyCallbacks = [];

const pushCallback = function (type, callback, exception) {
    if (callbacks[type]) {
        throw exception;
    }
    callbacks[type] = callback;
};

const popCallback = function (type) {
    if (!callbacks[type]) return null;
    const result = callbacks[type];
    callbacks[type] = null;
    return result;
};

const setGetInputCallback = function (script, locals) {
    pushCallback('getinput', {
        script,
        locals
    }, 'Only one "get input" can be in progress at a time');
    
    setCommandOverride(result => {
        const callback = popCallback('getinput');
        const gameRunner = require('./gamerunner');
        gameRunner.runCallbackAndFinishTurn(callback.script, {
            ...callback.locals,
            result
        });
    });
};

const setWaitCallback = function (script, locals) {
    pushCallback('wait', {
        script,
        locals
    }, 'Only one "wait" can be in progress at a time');
    
    setEndWaitCallback(() => {
        const callback = popCallback('wait');
        const gameRunner = require('./gamerunner');
        gameRunner.runCallbackAndFinishTurn(callback.script, callback.locals);
    });

    const ui = require('./ui');
    ui.beginWait();
};

const anyOutstandingCallbacks = function () {
    return callbacks['menu'] || callbacks['wait'] || callbacks['question'] || callbacks['getinput'];
};

const addOnReadyCallback = function (script, locals) {
    if (!anyOutstandingCallbacks()) {
        scripts.executeScript(script, locals, true);
    }
    else {
        onReadyCallbacks.push({script, locals});
    }
};

const flushOnReadyCallbacks = function () {
    const currentList = onReadyCallbacks;
    onReadyCallbacks = [];
    return currentList;
};

let endWaitCallback = null;

const setEndWaitCallback = function (callback) {
    endWaitCallback = callback;
};

const flushEndWaitCallback = function () {
    const result = endWaitCallback;
    endWaitCallback = null;
    return result;
};

let showQuestionCallback = null;

const setShowQuestionCallback = function (callback) {
    showQuestionCallback = callback;
};

const flushShowQuestionCallback = function () {
    const result = showQuestionCallback;
    showQuestionCallback = null;
    return result;
};

exports.setVersion = setVersion;
exports.minVersion = minVersion;
exports.maxVersion = maxVersion;
exports.onLoadFinished = onLoadFinished;
exports.finishedLoading = finishedLoading;
exports.newAttribute = newAttribute;
exports.set = set;
exports.get = get;
exports.addInheritedType = addInheritedType;
exports.hasAttribute = hasAttribute;
exports.hasAttributeOfType = hasAttributeOfType;
exports.getAttributeOfType = getAttributeOfType;
exports.typeOf = typeOf;
exports.checkIsList = checkIsList;
exports.isList = isList;
exports.checkIsDictionary = checkIsDictionary;
exports.isDictionary = isDictionary;
exports.attributeNames = attributeNames;
exports.isElement = isElement;
exports.getElement = getElement;
exports.tryGetElement = tryGetElement;
exports.create = create;
exports.addTemplate = addTemplate;
exports.getTemplate = getTemplate;
exports.getElements = getElements;
exports.addFunction = addFunction;
exports.functionExists = functionExists;
exports.getFunction = getFunction;
exports.getFunctionDefinition = getFunctionDefinition;
exports.getDirectChildren = getDirectChildren;
exports.getAllChildren = getAllChildren;
exports.contains = contains;
exports.getUniqueId = getUniqueId;
exports.dump = dump;
exports.setCommandOverride = setCommandOverride;
exports.getCommandOverride = getCommandOverride;
exports.setGetInputCallback = setGetInputCallback;
exports.anyOutstandingCallbacks = anyOutstandingCallbacks;
exports.setWaitCallback = setWaitCallback;
exports.addOnReadyCallback = addOnReadyCallback;
exports.flushOnReadyCallbacks = flushOnReadyCallbacks;
exports.setEndWaitCallback = setEndWaitCallback;
exports.flushEndWaitCallback = flushEndWaitCallback;
exports.setShowQuestionCallback = setShowQuestionCallback;
exports.flushShowQuestionCallback = flushShowQuestionCallback;