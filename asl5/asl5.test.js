'use strict';

const asl5 = require('./asl5');
const fs = require('fs');

window.addTextAndScroll = (text) => {
    console.log(text);
};

window.uiShow = () => {};
window.uiHide = () => {};

test('loads test.aslx', () => {
    const data = fs.readFileSync('examples/test.aslx', 'utf-8');
    asl5.load(data);
    asl5.begin();
    
    // TODO: Capture output and compare against a snapshot
});