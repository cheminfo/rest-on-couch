'use strict';

const Couch = require('..');

describe('basic initialization tests', function () {
    it('should init', function () {
        const couch = new Couch();
        return couch._init();
    });
});
