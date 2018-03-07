'use strict';

const request = require('request');

module.exports = function (options) {
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      return resolve(body);
    });
  });
};

module.exports.get = function (url, options) {
  return new Promise((resolve, reject) => {
    request.get(url, options, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      return resolve(body);
    });
  });
};

module.exports.post = function (url, options) {
  return new Promise((resolve, reject) => {
    request.post(url, options, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      if (options.resolveWithFullResponse) {
        return resolve(response);
      }
      return resolve(body);
    });
  });
};
