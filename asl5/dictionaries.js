var dictionaryAdd = function (dictionary, key, item) {
    // TODO: Add to undo log, if dictionary is attached to an element
    // TODO: Check item type is correct for dictionary
    
    dictionary.value[key] = item;
};

exports.dictionaryAdd = dictionaryAdd;