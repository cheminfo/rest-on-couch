'use strict';

const views = module.exports = {};

views.documentByType = {
    map: function (doc) {
        emit(doc.$type);
    },
    reduce: '_count'
};

views.documentByOwners = {
    map: function (doc) {
        if (doc.$type !== 'entry' && doc.$type !== 'group') return;
        for (var i = 0; i < doc.$owners.length; i++) {
            emit([doc.$type, doc.$owners[i]]);
        }
    },
    reduce: '_count'
};

views.ownerByTypeAndId = {
    map: function (doc) {
        if (doc.$type === 'entry') {
            emit(['entry', doc.$id], doc.$owners[0]);
        } else if (doc.$type === 'group') {
            emit(['group', doc.name], doc.$owners[0]);
        }
    }
};

views.entryById = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$id);
    },
    reduce: '_count'
};

views.entryByKind = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$kind);
    },
    reduce: '_count'
};

views.entryByCreationDate = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$creationDate);
    },
    reduce: '_count'
};

views.entryByModificationDate = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$modificationDate);
    },
    reduce: '_count'
};

views.entryByLastModification = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$lastModification);
    },
    reduce: '_count'
};

views.ownersById = {
    map: function (doc) {
        if (doc.$type !== 'entry') return;
        emit(doc.$id, doc.$owners);
    }
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

views.logsByLevel = {
    map: function (doc) {
        if (doc.$type !== 'log') return;
        emit(doc.level);
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

views.tokenById = {
    map: function (doc) {
        if (doc.$type !== 'token') return;
        emit(doc.$id);
    }
};

views.tokenByOwner = {
    map: function (doc) {
        if (doc.$type !== 'token') return;
        emit(doc.$owner);
    }
};
