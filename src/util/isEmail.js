'use strict';

// do not forget to update the same regex in design/validateDocUpdate
const isEmail = /^.+@.+$/;

module.exports = function(str) {
  return isEmail.test(str);
};
