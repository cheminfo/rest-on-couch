'use strict';

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
        emit(doc.$id, 1);
    },
    reduce: '_sum'
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

views.entryByParent = {
    map: function (doc) {
        if (doc.$type !== 'entry' || !doc.$parents) return;

        for (var i = 0; i < doc.$parents.length; i++) {
            emit(doc.$parents[i]);
        }
    }
};


views.groupByName = {
    map: function (doc) {
        if (doc.$type !== 'group') return;
        emit(doc.name, 1);
    },
    reduce: '_sum'
};

views.groupByUser = {
    map: function (doc) {
        if (doc.$type !== 'group') return;
        for (var i = 0; i < doc.users.length; i++) {
            emit(doc.users[i], 1);
        }
    },
    reduce: '_sum'
};





