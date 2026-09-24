import { applyMiddleware, createStore } from 'redux';
import { persistCombineReducers, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import promiseMiddleware from 'redux-promise-middleware';
import { thunk as thunkMiddleware } from 'redux-thunk';

import { setDatabaseName } from './actions/database.js';
import { getRocStatus } from './actions/main';
import DatabaseManager from './databaseManager.js';
import databaseReducer from './reducers/database.js';
import databaseNameReducer from './reducers/databaseName.js';
import loginReducer from './reducers/login';
import mainReducer from './reducers/main';

const composeStoreWithMiddleware = applyMiddleware(
  promiseMiddleware,
  thunkMiddleware,
)(createStore);

const rootReducer = persistCombineReducers(
  {
    key: 'reduxPersist',
    storage: storage.default,
    whitelist: ['dbName'],
    throttle: 1000,
  },
  {
    main: mainReducer,
    db: databaseReducer,
    dbName: databaseNameReducer,
    login: loginReducer,
  },
);

const store = composeStoreWithMiddleware(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);

// eslint-disable-next-line unicorn/no-top-level-side-effects
persistStore(store, null, onRehydrated);

// eslint-disable-next-line unicorn/no-top-level-side-effects
store.dispatch(getRocStatus());

export default store;
export const databaseManager = new DatabaseManager(store);

function getParameterByName(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function onRehydrated() {
  // If url has a database name, we override the persisted database name
  const initialDatabaseName = getParameterByName('database');
  if (initialDatabaseName) store.dispatch(setDatabaseName(initialDatabaseName));
  databaseManager.syncDb();
}
