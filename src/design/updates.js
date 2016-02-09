'use strict';

const updates = module.exports;

updates.addGroupToEntry = function(doc, req) {
    var group = JSON.parse(req.body).group || req.query.group;
    var resp = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (!doc) {
        resp.code = 404;
        resp.body = '"document does not exist"';
        return [null, resp];
    }
    if (doc.$type !== 'entry') {
        resp.code = 400;
        resp.body = '"Document is not of type entry"';
        return [null, resp];
    }
    if (!group) {
        resp.body = '"no group in request"';
        resp.code = 400;
        return [null, resp];
    }
    var idx = doc.$owners.indexOf(group);
    if (idx > 1) {
        resp.body = '"group already exists for this entry"';
        return [null, resp];
    }

    doc.$owners.push(group);
    return [doc, 'Group added'];
};

updates.removeGroupFromEntry = function(doc, req) {
    var group = JSON.parse(req.body).group || req.query.group;
    var resp = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (!doc) {
        resp.code = 404;
        resp.body = '"document does not exist"';
        return [null, resp];
    }
    if (doc.$type !== 'entry') {
        resp.code = 400;
        resp.body = '"Document is not of type entry"';
        return [null, resp];
    }
    if (!group) {
        resp.body = '"no group in request"';
        resp.code = 400;
        return [null, resp];
    }

    var idx = doc.$owners.indexOf(group);
    if (idx === -1) {
        resp.body = '"group does not exist for this entry"';
        return [null, resp];
    }

    if (idx === 0) {
        resp.body = '"cannot remove primary owner"';
        resp.code = 403;
        return [null, resp];
    }

    doc.$owners.splice(idx, 1);
    return [doc, 'Group removed'];
};
