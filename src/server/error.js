var exp = module.exports = {};

exp.handleError = function handleError(ctx, code, error) {
    if(code instanceof Error) {
        error = code;
        code = null;
    }
    error = error || {};
    var err;
    var errCode;
    switch(code) {
        case 'private':
            err =  {
                error: 'unauthorized',
                reason: 'The resource is private'
            };
            errCode = 401;
            break;
        case 'readonly':
            err = {
                error: 'unauthorized',
                reason: 'The resource is readonly'
            };
            errCode = 401;
            break;
        default:
            err = {
                error: 'unknown',
                reason: 'Unknown'
            };
            errCode = 520;
            break;
    }
    errCode = error.statusCode || errCode;
    err.reason = error.reason || err.reason;
    err.error = error.error || err.error;
    ctx.response.body = JSON.stringify(err);
    ctx.response.status = errCode;
};