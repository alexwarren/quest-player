'use strict';

const output = [];

window.addTextAndScroll = (text) => {
    output.push(text);
};

window.uiShow = () => {};
window.uiHide = () => {};
window.scrollToEnd = () => {};

const asl5 = require('./asl5');
const fs = require('fs');

test('loads test.aslx', () => {
    const data = fs.readFileSync('examples/test.aslx', 'utf-8');
    asl5.load(data);
    asl5.begin();
    asl5.sendCommand('hello');
    asl5.sendCommand('fn');
    asl5.sendCommand('invoke');
    asl5.sendCommand('for');
    asl5.sendCommand('foreach');
    asl5.sendCommand('hasstring');
    asl5.sendCommand('a');
    asl5.sendCommand('attrs');
    asl5.sendCommand('input');
    asl5.sendCommand('test some input for GetInput...');
    asl5.sendCommand('sw');
    expect(output).toMatchSnapshot();
});