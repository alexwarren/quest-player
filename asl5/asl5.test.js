'use strict';

const asl5 = require('./asl5');
const fs = require('fs');

const output = [];

window.addTextAndScroll = (text) => {
    output.push(text);
};

window.uiShow = () => {};
window.uiHide = () => {};

test('loads test.aslx', () => {
    const data = fs.readFileSync('examples/test.aslx', 'utf-8');
    asl5.load(data);
    asl5.begin();
    expect(output).toMatchSnapshot();
});