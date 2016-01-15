'use strict';

const router = require('koa-router')();

router.get('/', function*() {
    yield this.render('index', {hello: 'world'});
});

module.exports = router;
