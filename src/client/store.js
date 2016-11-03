import {createStore, combineReducers, applyMiddleware} from 'redux';
import promiseMiddleware from 'redux-promise-middleware';

import loginReducer from './reducers/login';
import {checkLogin} from './actions/login';

const composeStoreWithMiddleware = applyMiddleware(
    promiseMiddleware()
)(createStore);

const store = composeStoreWithMiddleware(combineReducers({
    login: loginReducer
}));

checkLogin(store);

export default store;
