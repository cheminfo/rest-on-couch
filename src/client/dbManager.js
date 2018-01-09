import {
  setDbName,
  setUserRights,
  setUserGroups,
  setDefaultGroups,
  setGlobalRights,
  setMemberships
} from './actions/db';
import { apiFetchJSON } from './api';

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

  async syncDb() {
    if (this.currentDb) {
      const rights = await this.syncRights();
      this.syncGroups();
      if (rights.includes('admin')) {
        this.syncDefaultGroups();
        this.syncGlobalRights();
      } else {
        this.resetDefaultGroups();
        this.resetGlobalRights();
      }
      this.syncMemberships();
    }
  }

  async syncRights() {
    const rights = await apiFetchJSON(`db/${this.currentDb}/rights`);
    this.store.dispatch(setUserRights(rights));
    return rights;
  }

  async syncGroups() {
    const groups = await apiFetchJSON(`db/${this.currentDb}/groups`);
    this.store.dispatch(setUserGroups(groups));
  }

  async syncMemberships() {
    const memberships = await apiFetchJSON(
      `db/${this.currentDb}/user/_me/groups`
    );
    this.store.dispatch(setMemberships(memberships));
  }

  async syncDefaultGroups() {
    const defaultGroups = await apiFetchJSON(
      `db/${this.currentDb}/rights/defaultGroups`
    );
    this.store.dispatch(setDefaultGroups(defaultGroups));
  }

  async syncGlobalRights() {
    const globalRights = await apiFetchJSON(`db/${this.currentDb}/rights/doc`);
    this.store.dispatch(setGlobalRights(globalRights));
  }

  resetDefaultGroups() {
    this.store.dispatch(setDefaultGroups([]));
  }

  resetGlobalRights() {
    this.store.dispatch(setGlobalRights([]));
  }
}
