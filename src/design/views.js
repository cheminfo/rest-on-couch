'use strict';

const views = module.exports = {};

views.byId = {
    map: function (doc) {
        emit(doc.id);
    }
};
