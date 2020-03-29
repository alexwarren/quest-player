'use strict';

const removeSurroundingBraces = function (text) {
    // based on WorldModel.Utility.RemoveSurroundingBraces

    text = text.trim();
    if (text.substring(0, 1) === '{' && text.substring(text.length - 1, text.length) === '}') {
        return text.substring(1, text.length - 1);
    }
    return text;
};

const getScriptLine = function (text) {
    // based on WorldModel.Utility.GetScript
    // return one line of the script, and the remaining script

    let result;
    const obscuredScript = obscureStrings(text);
    const bracePos = obscuredScript.indexOf('{');
    const crlfPos = obscuredScript.indexOf('\n');
    const commentPos = obscuredScript.indexOf('//');
    if (crlfPos === -1) return {
        line: text.trim()
    };

    if (bracePos === - 1 || crlfPos < bracePos || (commentPos !== -1 && commentPos < bracePos && commentPos < crlfPos)) {
        return {
            line: text.substring(0, crlfPos).trim(),
            after: text.substring(crlfPos + 1)
        };
    }

    const beforeBrace = text.substring(0, bracePos);
    const parameterResult = getParameterInternal(text, '{', '}');
    const insideBraces = parameterResult.parameter;

    if (insideBraces.indexOf('\n') !== -1) {
        result = beforeBrace + '{' + insideBraces + '}';
    }
    else {
        result = beforeBrace + insideBraces;
    }

    return {
        line: result.trim(),
        after: parameterResult.after
    };
};

const getAndSplitParameters = function (text) {
    const parameter = getParameter(text);
    if (!parameter) return [];
    return splitParameters(parameter);
};

const splitParameters = function (parameter) {
    // based on WorldModel.Utility.SplitParameter
    const result = [];
    let inQuote = false;
    let processNextCharacter = true;
    let bracketCount = 0;
    let curParam = [];

    for (let i = 0; i < parameter.length; i++) {
        const c = parameter.charAt(i);
        const processThisCharacter = processNextCharacter;
        processNextCharacter = true;

        if (processThisCharacter) {
            if (c === '\\') {
                // Don't process the character after a backslash
                processNextCharacter = false;
            }
            else if (c === '"') {
                inQuote = !inQuote;
            }
            else {
                if (!inQuote) {
                    if (c === '(') bracketCount++;
                    if (c === ')') bracketCount--;
                    if (bracketCount === 0 && c === ',') {
                        result.push(curParam.join('').trim());
                        curParam = [];
                        continue;
                    }
                }
            }
        }

        curParam.push(c);
    }

    result.push(curParam.join('').trim());
    return result;
};

const getParameter = function (text) {
    const result = getParameterInternal(text, '(', ')');
    if (!result) return null;
    return result.parameter;
};

const getParameterInternal = function (text, open, close) {
    // based on WorldModel.Utility.GetParameterInt

    const obscuredText = obscureStrings(text);
    const start = obscuredText.indexOf(open);
    if (start === -1) return null;

    let finished = false;
    let braceCount = 1;
    let pos = start;

    while (!finished) {
        pos++;
        const curChar = obscuredText.charAt(pos);
        if (curChar === open) braceCount++;
        if (curChar === close) braceCount--;
        if (braceCount === 0 || pos === obscuredText.length - 1) finished = true;
    }

    if (braceCount !== 0) {
        throw 'Missing ' + close;
    }

    return {
        parameter: text.substring(start + 1, pos),
        after: text.substring(pos + 1)
    };
};

const obscureStrings = function (input) {
    // based on WorldModel.Utility.ObscureStrings

    const sections = splitQuotes(input);
    const result = [];

    let insideQuote = false;
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (insideQuote) {
            result.push(Array(section.length + 1).join('-'));
        }
        else {
            result.push(section);
        }
        if (i < sections.length - 1) {
            result.push('"');
        }
        insideQuote = !insideQuote;
    }
    return result.join('');
};

const splitQuotes = function (text) {
    // based on WorldModel.Utility.SplitQuotes

    const result = [];
    let processNextCharacter = true;
    let curParam = [];
    let gotCloseQuote = true;

    for (let i = 0; i < text.length; i++) {
        const curChar = text.charAt(i);

        const processThisCharacter = processNextCharacter;
        processNextCharacter = true;

        if (processThisCharacter) {
            if (curChar === '\\') {
                // Don't process the character after a backslash
                processNextCharacter = false;
            }
            else if (curChar === '"') {
                result.push(curParam.join(''));
                gotCloseQuote = !gotCloseQuote;
                curParam = [];
                continue;
            }
        }

        curParam.push(curChar);
    }

    if (!gotCloseQuote) {
        throw 'Missing quote character in ' + text;
    }

    result.push(curParam.join(''));
    return result;
};

exports.removeSurroundingBraces = removeSurroundingBraces;
exports.getScriptLine = getScriptLine;
exports.getAndSplitParameters = getAndSplitParameters;
exports.obscureStrings = obscureStrings;
exports.getParameter = getParameter;
exports.getParameterInternal = getParameterInternal;
exports.splitParameters = splitParameters;