'use strict';

const hasOwn = require('has-own');

module.exports = function simpleMerge(source, target) {
  for (var key in source) {
    if (hasOwn(key, source)) {
      target[key] = source[key];
    }
  }
  return target;
};
