import {setDbName, setUserGroups} from './actions/db';
import {apiFetchJSON} from './api';

export default class DbManager {
    constructor(store) {
        this.store = store;
    }

    get currentDb() {
        return this.store.getState().dbName;
    }

    switchDb(newDb) {
        if (typeof newDb !== 'string') {
            throw new TypeError('db must be a string');
        }
        if (this.currentDb !== newDb) {
            this.store.dispatch(setDbName(newDb));
            this.syncDb();
        }
    }

    syncDb() {
        const db = this.currentDb;
        if (db) {
            this.syncGroups(db);
        }
    }

    async syncGroups(db) {
        const groups = await apiFetchJSON(`db/${db}/groups`);
        this.store.dispatch(setUserGroups(groups));
    }
}
