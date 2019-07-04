import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import thunkMiddleware from 'redux-thunk';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import DbManager from './dbManager';
import mainReducer from './reducers/main';
import dbReducer from './reducers/db';
import dbNameReducer from './reducers/dbName';
import loginReducer from './reducers/login';
import { setDbName } from './actions/db';
import { getRocStatus } from './actions/main';

const composeStoreWithMiddleware = applyMiddleware(
  promiseMiddleware,
  thunkMiddleware
)(createStore);

const rootReducer = persistCombineReducers(
  {
    key: 'reduxPersist',
    storage,
    whitelist: ['dbName'],
    throttle: 1000
  },
  {
    main: mainReducer,
    db: dbReducer,
    dbName: dbNameReducer,
    login: loginReducer
  }
);

const store = composeStoreWithMiddleware(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

persistStore(store, null, onRehydrated);

store.dispatch(getRocStatus());

export default store;
export const dbManager = new DbManager(store);

function onRehydrated() {
  function getParameterByName(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  // If url has a database name, we override the persisted database name
  const initialDbName = getParameterByName('database');
  if (initialDbName) store.dispatch(setDbName(initialDbName));
  dbManager.syncDb();
}
