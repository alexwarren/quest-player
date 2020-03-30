const dictionaries = require('./dictionaries');
const state = require('./state');

test('adds an item to a dictionary', () => {
    const dictionary = state.newAttribute('stringdictionary');
    dictionaries.dictionaryAdd(dictionary, 'somekey', 'value');
    expect(dictionary.value).toHaveProperty('somekey', 'value');
});