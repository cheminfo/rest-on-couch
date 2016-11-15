'use strict';

const updates = module.exports;

updates.removeGroupFromEntry = function (doc, req) {
    var group = JSON.parse(req.body).group || req.query.group;
    var resp = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (!doc) {
        resp.code = 404;
        resp.body = '{"error": "not found"}';
        return [null, resp];
    }
    if (doc.$type !== 'entry') {
        resp.code = 400;
        resp.body = '{"error": "not an entry"}';
        return [null, resp];
    }
    if (!group) {
        resp.code = 400;
        resp.body = '{"error": "no group in query"}';
        return [null, resp];
    }

    if (!Array.isArray(group)) {
        group = [group];
    }

    for (var i = 0; i < group.length; i++) {
        if (typeof group[i] !== 'string') {
            resp.code = 400;
            resp.body = '{"error": "group must be a string or array"}';
            return [null, resp];
        }
        var idx = doc.$owners.indexOf(group[i]);
        if (idx === 0) {
            resp.code = 403;
            resp.body = '{"error": "cannot remove primary owner"}';
            return [null, resp];
        } else if (idx !== -1) {
            doc.$owners.splice(idx, 1);
        }
    }

    resp.code = 200;
    resp.body = '{"ok": true}';
    return [doc, resp];
};
