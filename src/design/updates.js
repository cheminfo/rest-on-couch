'use strict';

const updates = module.exports;

updates.addGroup = function(doc, req) {
    log(req.body);
    var group = JSON.parse(req.body).group || req.query.group;
    var resp = {
        headers: {
            'Content-Type': "application/json"
        }
    };

    if(!doc) {
        resp.code = 404;
        resp.body = '"document does not exist"';
        return [null, resp];
    }
    if(doc.$type !== 'entry') {
        resp.code = 400;
        resp.body = '"Document is not of type entry"';
        return [null, resp];
    }
    var owners = doc.$owners;
    if(!group) {
        resp.body = '"no group in request"';
        resp.code = 400;
        return [null, resp];
    }
    var idx = owners.indexOf(group);
    if(idx > 1) {
        resp.body = '"group already exists for this entry"';
        return [null, resp];
    }

    doc.$owners.push(group);
    return [doc, 'Group added'];
};


