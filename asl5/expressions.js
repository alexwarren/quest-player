'use strict';

const jsep = require('./lib/jsep.min.js');

jsep.removeUnaryOp('~');
jsep.addUnaryOp('not');
    
jsep.removeBinaryOp('>>>');
jsep.removeBinaryOp('<<');
jsep.removeBinaryOp('>>');

jsep.removeBinaryOp('==');
jsep.removeBinaryOp('===');
jsep.removeBinaryOp('!==');
jsep.addBinaryOp('=', 6);
jsep.addBinaryOp('<>', 6);

jsep.addBinaryOp('^', 10);

jsep.removeBinaryOp('||');
jsep.removeBinaryOp('|');
jsep.addBinaryOp('or', 1);

jsep.removeBinaryOp('&&');
jsep.removeBinaryOp('&');
jsep.addBinaryOp('and', 2);

const parseExpression = function (expr) {
    return {
        expr: expr,
        tree: jsep(expr)
    };
};

exports.parseExpression = parseExpression;