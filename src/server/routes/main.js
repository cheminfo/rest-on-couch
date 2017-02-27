'use strict';

const router = require('koa-router')();

router.get('/', async (ctx) => {
    ctx.state.hello = 'world';
    await ctx.render('index');
});

router.get('/close', async (ctx) => {
    await ctx.render('close');
});

module.exports = router;
