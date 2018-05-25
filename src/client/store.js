import { createStore, combineReducers, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import thunkMiddleware from 'redux-thunk';
import { persistStore, autoRehydrate } from 'redux-persist';

import DbManager from './dbManager';
import dbReducer from './reducers/db';
import dbNameReducer from './reducers/dbName';
import loginReducer from './reducers/login';
import { getDbList, setDbName } from './actions/db';
import { checkLogin, getLoginProviders } from './actions/login';

const composeStoreWithMiddleware = applyMiddleware(
  promiseMiddleware(),
  thunkMiddleware
)(createStore);

const store = composeStoreWithMiddleware(
  combineReducers({
    db: dbReducer,
    dbName: dbNameReducer,
    login: loginReducer
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  autoRehydrate()
);

persistStore(
  store,
  {
    whitelist: ['dbName'],
    debounce: 1000
  },
  onRehydrated
);

checkLogin(store.dispatch);
getLoginProviders(store.dispatch);
getDbList(store.dispatch);

export default store;
export const dbManager = new DbManager(store);

function onRehydrated() {
  function getParameterByName(name) {
    var match = RegExp(`[?&]${name}=([^&]*)`).exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  // If url has a database name, we override the persisted database name
  const initialDbName = getParameterByName('database');
  if (initialDbName) store.dispatch(setDbName(initialDbName));
  dbManager.syncDb();
}
