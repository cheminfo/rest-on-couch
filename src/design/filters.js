'use strict';

const filters = module.exports;

filters.logs = function (doc) {
    return doc.$type === 'log';
};
