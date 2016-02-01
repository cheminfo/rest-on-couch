'use strict';

/* eslint-disable no-undef */

const views = module.exports = {};

views.ownersById = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$id, doc.$owners);
    }
};

views.entryById = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$id);
    },
    reduce: '_count',
    type: 'string'
};

views.entryByOwnerAndId = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit([doc.$owners[0], doc.$id]);
    }
};

views.entryByKindAndId = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit([doc.$kind ? doc.$kind : null, doc.$id]);
    }
};

views.entryByCreationDate = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$creationDate);
    }
};

views.entryByModificationDate = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$modificationDate);
    }
};

views.entryByOwner = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        for (var i=0; i<doc.$owners.length; i++) {
            emit(doc.$owners[i]);
        }
    },
    reduce: '_count'
};


views.groupByName = {
    map: function (doc) {
        if (doc.$type !== 'group') return;
        emit(doc.name);
    },
    reduce: '_count'
};

views.groupByUser = {
    map: function (doc) {
        if (doc.$type !== 'group') return;
        for (var i = 0; i < doc.users.length; i++) {
            emit(doc.users[i]);
        }
    },
    reduce: '_count'
};

views.groupByUserAndRight = {
    map: function (doc) {
        if (doc.$type !== 'group') return;
        for (var i = 0; i < doc.users.length; i++) {
            for (var j = 0; j < doc.rights.length; j++) {
                emit([doc.users[i], doc.rights[j]], doc.name);
            }
        }
    }
};

views.globalRight = {
    map: function (doc) {
        if (doc._id !== 'rights') return;
        for (var i in doc) {
            if (Array.isArray(doc[i])) {
                for (var j = 0; j < doc[i].length; j++) {
                    emit(i, doc[i][j]);
                }
            }
        }
    }
};

views.logsByEpoch = {
    map: function (doc) {
        if (doc.$type !== 'log') return;
        emit(doc.epoch);
    }
};

views.user = {
    map: function (doc) {
        if (doc.$type !== 'user') return;
        if (doc.user) {
            emit(doc.user);
        }
    }
};
