import {createStore, combineReducers, applyMiddleware} from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import {persistStore, autoRehydrate, createTransform} from 'redux-persist';

import dbReducer from './reducers/db';
import dbNameReducer from './reducers/dbName';
import loginReducer from './reducers/login';

import {getDbList} from './actions/db';
import {checkLogin, getLoginProviders} from './actions/login';

const composeStoreWithMiddleware = applyMiddleware(
    promiseMiddleware()
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

persistStore(store, {
    whitelist: ['dbName'],
    debounce: 1000
});

checkLogin(store.dispatch);
getLoginProviders(store.dispatch);
getDbList(store.dispatch);

export default store;
