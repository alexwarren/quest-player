var scripts = require('./scripts.js');

var elements = {};
var elementsOfType = {};
var templateLookup = {};
var version;
var loadFinishedActions = [];
var loading = true;

var setVersion = function (value) {
    version = value;
};

var minVersion = function (value) {
    return version >= value;
};

var maxVersion = function (value) {
    return version <= value;
};

var onLoadFinished = function (fn) {
    loadFinishedActions.push(fn);
};

var finishedLoading = function () {
    removeMissingDefaultTypeReferences();
    loading = false;
    loadFinishedActions.forEach(function (fn) {
        fn();
    });
    loadFinishedActions = [];
};

var newAttribute = function (type) {
    if (type == 'stringlist' || type == 'objectlist' || type == 'list') {
        return {
            value: [],
            type: type
        };
    }
    
    if (type == 'stringdictionary' || type == 'objectdictionary' || type == 'scriptdictionary' || type == 'dictionary') {
        return {
            value: {},
            type: type
        };
    }
    
    throw 'Unknown attribute type: ' + type;
};

var getElement = function (elementName) {
    var element = elements[elementName];
    if (!element) {
        throw 'No element named ' + elementName;
    }
    return element;	
};

var tryGetElement = function (elementName) {
    return elements[elementName];
};

var set = function (element, attribute, value) {
    // TODO: See Fields.Set
    var oldValue = null;
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
        var changedScript = getAttributeOfType(element, 'changed' + attribute, 'script');

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

var get = function (element, attribute) {
    var result = element.attributes[attribute];
    if (typeof result === 'undefined') {
        if (loading) {
            // Types haven't been initialised yet if we're still loading
            return null;
        }

        for (var idx in element.inheritedTypes) {
            var inheritedTypeElement = getElement(element.inheritedTypes[idx]);
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

var addInheritedType = function (element, typeName) {
    // TODO: Check for circular inheritance
    element.inheritedTypes.splice(0, 0, typeName);
};

var hasAttribute = function (element, attribute) {
    if (attribute in element.attributes) return true;

    // Types haven't been initialised yet if we're still loading 
    if (loading) return false;
    
    for (var idx in element.inheritedTypes) {
        var inheritedTypeElement = getElement(element.inheritedTypes[idx]);
        return hasAttribute(inheritedTypeElement, attribute);
    }
    // TODO: Optional includeExtendableFields parameter to check for listexend,
    // as per WorldModel.Fields.Exists
    return false;
};

var hasAttributeOfType = function (element, attribute, type) {
    if (!hasAttribute(element, attribute)) return false;
    var value = get(element, attribute);
    return isValueOfType(value, type);
};

var getAttributeOfType = function (element, attribute, type) {
    if (!hasAttribute(element, attribute)) return defaultValue(type);
    var value = get(element, attribute);
    if (isValueOfType(value, type)) return value;
    return defaultValue(type);
};

var isValueOfType = function (value, type) {
    var actualType = typeOf(value);
    if (actualType == type) return true;
    if (actualType == 'int' && type == 'double') return true;
    return false;
};

var defaultValue = function (type) {
    if (type === 'boolean') return false;
    return null;
};

var typeOf = function (value) {
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

var checkIsList = function (list) {
    if (!isList(list)) {
        throw 'Value is not a list type';
    }
};

var isList = function (list) {
    return list.type == 'list' ||
        list.type == 'stringlist' ||
        list.type == 'objectlist';
};

var checkIsDictionary = function (dic) {
    if (!isDictionary(dic)) {
        throw 'Value is not a dictionary type';
    }
};

var isDictionary = function (dic) {
    return dic.type == 'stringdictionary' ||
        dic.type == 'objectdictionary' ||
        dic.type == 'objectlist' ||
        dic.type == 'dictionary';
};


var attributeNames = function (element, includeInheritedAttributes) {
    var result = Object.keys(element.attributes);
    if (includeInheritedAttributes) {
        for (var idx in element.inheritedTypes) {
            var inheritedTypeElement = getElement(element.inheritedTypes[idx]);
            var additionalAttributes = attributeNames(inheritedTypeElement);
            result = result.concat(additionalAttributes.filter(function (a) {
                return result.indexOf(a) === -1;
            }));
        }
    }
    return result;
};

var isElement = function (elementName) {
    return elementName in elements;
};

var create = function (elementName, elementType, elementSubType) {
    var inheritedTypes = [];
    if (elementType == 'object') {
        if (!elementSubType) throw 'Object must have a subtype';
        inheritedTypes.push('default' + elementSubType);
    }
    var element = {
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

var addTemplate = function (element) {
    templateLookup[element.attributes.templatename] = element;
};

var getTemplate = function (name) {
    return templateLookup[name];
};

var getElements = function (elementType, elementSubType) {
    var elements = elementsOfType[elementType];
    var result = [];
    for (var key in elements) {
        var element = elements[key];
        if (!elementSubType || element.elementSubType == elementSubType) {
            result.push(element);
        }
    }
    return result;
};

var addFunction = function (functionName, script, parameters) {
    var fn = create(functionName, 'function');
    fn.attributes = {
        script: script,
        parameters: parameters
    };
};

var functionExists = function (functionName) {
    return functionName in elementsOfType['function'];
};

var getFunction = function (functionName) {
    return elementsOfType['function'][functionName].attributes.script;
};

var getFunctionDefinition = function (functionName) {
    return elementsOfType['function'][functionName].attributes;
};

var getDirectChildren = function (parent, elementType, elementSubType) {
    var allElements = getElements(elementType, elementSubType);
    return allElements.filter(function (element) {
        return element.attributes.parent == parent;
    });
};

var getAllChildren = function (parent, elementType, elementSubType) {
    var directChildren = getDirectChildren(parent, elementType, elementSubType);
    var result = [];
    for (var idx in directChildren) {
        var child = directChildren[idx];
        result = result.concat(child, getAllChildren(child, elementType, elementSubType));
    }
    return result;
};

var contains = function (parent, element) {
    if (!element.attributes.parent) return false;
    if (element.attributes.parent == parent) return true;
    return contains(parent, element.attributes.parent);
};

var nextUniqueId = {};

var getUniqueId = function (prefix) {
    prefix = prefix || 'k';
    if (!(prefix in nextUniqueId)) {
        nextUniqueId[prefix] = 1;
    }
    var newId;
    do {
        newId = prefix + nextUniqueId[prefix]++;
    } while (isElement(newId));
    return newId;
};

var removeMissingDefaultTypeReferences = function () {
    for (var elementName in elementsOfType.object) {
        var element = elementsOfType.object[elementName];
        var defaultTypeName = 'default' + element.elementSubType;
        var defaultType = tryGetElement(defaultTypeName);
        if (!defaultType) {
            var idx = element.inheritedTypes.indexOf(defaultTypeName);
            element.inheritedTypes.splice(idx, 1);
        }
    }
};

var dump = function () {
    console.log('Elements:');
    console.log(elements);
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