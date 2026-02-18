import {
  setDbName,
  setDefaultGroups,
  setGlobalRights,
  setMemberships,
  setUserGroups,
  setUserRights,
} from './actions/db';
import { apiFetchJSONOptional } from './api.ts';

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
      if (rights?.includes('admin')) {
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
    const rights = await apiFetchJSONOptional(`db/${this.currentDb}/rights`);
    if (rights) {
      this.store.dispatch(setUserRights(rights));
    }
    return rights;
  }

  async syncGroups() {
    const groups = await apiFetchJSONOptional(`db/${this.currentDb}/groups`);
    if (groups) {
      this.store.dispatch(setUserGroups(groups));
    }
  }

  async syncMemberships() {
    const memberships = await apiFetchJSONOptional(
      `db/${this.currentDb}/user/_me/groups`,
    );
    if (memberships) {
      this.store.dispatch(setMemberships(memberships));
    }
  }

  async syncDefaultGroups() {
    const defaultGroups = await apiFetchJSONOptional(
      `db/${this.currentDb}/rights/defaultGroups`,
    );
    if (defaultGroups) {
      this.store.dispatch(setDefaultGroups(defaultGroups));
    }
  }

  async syncGlobalRights() {
    const globalRights = await apiFetchJSONOptional(
      `db/${this.currentDb}/rights/doc`,
    );
    if (globalRights) {
      this.store.dispatch(setGlobalRights(globalRights));
    }
  }

  resetDefaultGroups() {
    this.store.dispatch(setDefaultGroups([]));
  }

  resetGlobalRights() {
    this.store.dispatch(setGlobalRights([]));
  }
}
