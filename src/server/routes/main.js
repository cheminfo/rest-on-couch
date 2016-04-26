'use strict';

const router = require('koa-router')();

router.get('/', function *() {
    this.state.hello = 'world';
    yield this.render('index');
});

module.exports = router;
