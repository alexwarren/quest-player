const state = require('./state.js');
const scripts = require('./scripts.js');
const expressions = require('./expressions.js');
const simplepattern = require('./simplepattern.js');
    
const allowedVersions = [500, 510, 520, 530, 540, 550];
const impliedTypes = {};

const getXmlAttribute = function (node, attributeName) {
    const attribute = node.attributes[attributeName];
    if (!attribute) return null;
    return attribute.value;
};

const attributeLoaders = {
    'string': function (node, element, attributeName) {
        const attributeValue = node.textContent; 
        state.set(element, attributeName, attributeValue);
    },
    'int': function (node, element, attributeName) {
        const attributeValue = node.textContent; 
        state.set(element, attributeName, parseInt(attributeValue, 10));
    },
    'double': function (node, element, attributeName) {
        const attributeValue = node.textContent; 
        state.set(element, attributeName, parseFloat(attributeValue));
    },
    'stringlist': function (node, element, attributeName) {
        const list = state.newAttribute('stringlist');
        for (let i = 0; i < node.childNodes.length; i++) {
            const childNode = node.childNodes[i];
            if (childNode.nodeName != 'value') continue;
            list.value.push(childNode.textContent);
        }
        state.set(element, attributeName, list);
    },
    'boolean': function (node, element, attributeName) {
        const attributeValue = node.textContent;
        if (attributeValue === '' || attributeValue == 'true') {
            state.set(element, attributeName, true);
        }
        else if (attributeValue == 'false') {
            state.set(element, attributeName, false);
        }
        else {
            throw 'Invalid boolean "' + element.name + '" = "' + attributeValue + '"';
        }
    },
    'script': function (node, element, attributeName) {
        const script = scripts.parseScript(node.textContent);
        state.set(element, attributeName, {
            type: 'script',
            script: script
        });
    },
    'simplepattern': function (node, element, attributeName) {
        simplepattern.load(node, element, attributeName);
    }
};

const loadElementAttributes = function (element, nodes) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.nodeType !== 1) continue;
        let attributeName = node.nodeName;
        if (attributeName == 'inherit') {
            const name = getXmlAttribute(node, 'name');
            state.addInheritedType(element, name);
        }
        else if (attributeName == 'object' || attributeName == 'command') {
            const child = elementLoaders[attributeName](node);
            state.set(child, 'parent', element);
        }
        else {
            if (attributeName == 'attr') {
                attributeName = getXmlAttribute(node, 'name');
            }
            let attributeType = getXmlAttribute(node, 'type');
            if (!attributeType) {
                const key = (element.elementSubType || element.elementType) + '~' + attributeName;
                attributeType = impliedTypes[key];
                
                if (!attributeType) {
                    if (node.textContent.length === 0) {
                        attributeType = 'boolean';
                    }
                    else {
                        attributeType = 'string';
                    }
                }
            }
            const loader = attributeLoaders[attributeType];
            if (loader) {
                loader(node, element, attributeName);
            }
            else {
                const delegate = state.tryGetElement(attributeType);
                if (delegate && delegate.elementType === 'delegate') {
                    const script = scripts.parseScript(node.textContent);
                    state.set(element, attributeName, {
                        script: script,
                        type: 'delegateimplementation',
                        delegateType: attributeType
                    });
                }
                else {
                    throw('Unrecognised attribute type "' +
                        attributeType +
                        '" in "' +
                        element.name + '.' + attributeName + '"');
                }
            }
        }
    }
};

const getParamList = function (node) {
    let paramList;
    const parameters = getXmlAttribute(node, 'parameters');
    if (parameters) {
        paramList = parameters.split(/, ?/);
    }
    return paramList;
};

const elementLoaders = {
    'game': function (node) {
        const element = state.create('game', 'object', 'game');
        const name = getXmlAttribute(node, 'name');
        state.set(element, 'gamename', name);
        loadElementAttributes(element, node.childNodes);
    },
    'function': function (node) {
        const paramList = getParamList(node);
        state.addFunction(getXmlAttribute(node, 'name'),
            scripts.parseScript(node.textContent),
            paramList);
    },
    'type': function (node) {
        const name = getXmlAttribute(node, 'name');
        const element = state.create(name, 'type');
        loadElementAttributes(element, node.childNodes);
    },
    'object': function (node) {
        const name = getXmlAttribute(node, 'name');
        const element = state.create(name, 'object', 'object');
        loadElementAttributes(element, node.childNodes);
        return element;
    },
    'command': function (node) {
        let name = getXmlAttribute(node, 'name');
        if (name == null) name = state.getUniqueId();
        const element = state.create(name, 'object', 'command');
        loadElementAttributes(element, node.childNodes);
        return element;
    },
    'verb': function (node) {
        // TODO: There may be "property" and "response" attributes,
        // see ElementLoaders.cs (VerbLoader)
        let name = getXmlAttribute(node, 'name');
        if (name == null) name = state.getUniqueId();
        const element = state.create(name, 'object', 'command');
        state.addInheritedType(element, 'defaultverb');
        state.set(element, 'isverb', true);
        loadElementAttributes(element, node.childNodes);
        return element;
    },
    'implied': function (node) {
        const element = getXmlAttribute(node, 'element');
        const attribute = getXmlAttribute(node, 'property');
        const type = getXmlAttribute(node, 'type');
        impliedTypes[element + '~' + attribute] = type;
    },
    'template': function (node) {
        const name = getXmlAttribute(node, 'name');
        //var templateType = getXmlAttribute(node, 'templatetype');
        // TODO: Template overrides - see Templates.cs (AddTemplate)
        const elementName = state.getUniqueId('template');
        const template = state.create(elementName, 'template');
        state.set(template, 'templatename', name);
        state.set(template, 'text', node.textContent);
        state.addTemplate(template);
    },
    'dynamictemplate': function (node) {
        const name = getXmlAttribute(node, 'name');
        // TODO: Template overrides - see Templates.cs (AddDynamicTemplate)
        const element = state.create(name, 'dynamictemplate');
        const expr = expressions.parseExpression(node.textContent);
        state.set(element, 'text', expr);
    },
    'delegate': function (node) {
        const name = getXmlAttribute(node, 'name');
        const element = state.create(name, 'delegate');
        const paramList = getParamList(node);
        // Functions don't care about their return type in v6,
        // so we probably don't care about them for delegates too
        //var returnType = getXmlAttribute(node, 'type');
        const paramListAttribute = state.newAttribute('stringlist');
        paramListAttribute.value = paramList;
        state.set(element, 'paramnames', paramListAttribute);
    }
};

const load = function (data) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'application/xml');
    let firstNode = 0;
    let i;
    for (i = 0; i < doc.childNodes.length; i++) {
        if (doc.childNodes[i].nodeType === 1) {
            firstNode = i;
            break;
        }
    }
    const asl = doc.childNodes[firstNode];
    if (asl.nodeName !== 'asl') {
        throw 'File must begin with an ASL element';
    }
    const versionAttribute = asl.attributes.version;
    if (!versionAttribute) {
        throw 'No ASL version number found';
    }
    const version = parseInt(versionAttribute.value);
    if (allowedVersions.indexOf(version) === -1) {
        throw 'Unrecognised ASL version number';
    }
    state.setVersion(version);
    
    for (i = 1; i < asl.childNodes.length; i++) {
        if (asl.childNodes[i].nodeType !== 1) continue;
        const loader = elementLoaders[asl.childNodes[i].nodeName];
        if (loader) {
            loader(asl.childNodes[i]);
        }
        else {
            console.log('no loader for ' + asl.childNodes[i].nodeName);
        }
    }
    
    state.finishedLoading();
    state.dump();
};

exports.load = load;