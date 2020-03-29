var listAdd = function (list, item) {
    // TODO: Add to undo log, if list is attached to an element
    // TODO: Check item type is correct for list
    
    list.value.push(item);
};

exports.listAdd = listAdd;