'use strict';

module.exports = function simpleMerge(source, target) {
  for (var key in source) {
    if (Object.hasOwn(source, key)) {
      target[key] = source[key];
    }
  }
  return target;
};
