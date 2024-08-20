'use strict';

// do not forget to update the same regex in design/validateDocUpdate
const isEmailRegExp = /^.+@.+$/;

module.exports = function isEmail(str) {
  return isEmailRegExp.test(str);
};
