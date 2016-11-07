import {createStore, combineReducers, applyMiddleware} from 'redux';
import promiseMiddleware from 'redux-promise-middleware';

import dbReducer from './reducers/db';
import loginReducer from './reducers/login';

import {getDbList} from './actions/db';
import {checkLogin, getLoginProviders} from './actions/login';

const composeStoreWithMiddleware = applyMiddleware(
    promiseMiddleware()
)(createStore);

const store = composeStoreWithMiddleware(combineReducers({
    db: dbReducer,
    login: loginReducer
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

checkLogin(store.dispatch);
getLoginProviders(store.dispatch);
getDbList(store.dispatch);

export default store;
