'use strict';

const statusMessages = {
    400: 'bad request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'not found',
    409: 'conflict',
    500: 'internal server error'
};

function decorateError(ctx, status, error = true) {
    ctx.status = status;
    ctx.body = {
        error,
        code: statusMessages[status] || `error ${status}`
    };
}

module.exports = decorateError;
