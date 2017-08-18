'use strict';

module.exports = function ensureStringArray(value, name = 'value') {
    if (typeof value === 'string') {
        return [value];
    } else if (Array.isArray(value)) {
        return value;
    }
    throw new Error(`${name} must be a string or array`);
};
