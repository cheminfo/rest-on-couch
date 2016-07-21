'use strict';

const router = require('koa-router')();

router.get('/', function*() {
    this.state.hello = 'world';
    yield this.render('index');
});

router.get('/close', function * () {
    yield this.render('close');
});

module.exports = router;
