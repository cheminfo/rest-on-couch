'use strict';

module.exports = function ensureStringArray(value) {
    if (typeof value === 'string') {
        return [value];
    } else if (Array.isArray(value)) {
        return value;
    }
    throw new Error('value must be a string or array');
};
