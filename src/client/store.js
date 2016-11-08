import {createStore, combineReducers, applyMiddleware} from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import {persistStore, autoRehydrate, createTransform} from 'redux-persist';

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
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(), autoRehydrate());

const dbTransform = createTransform(
    // transform state coming form redux on its way to being serialized and stored
    (inboundState) => inboundState.dbName,
    // transform state coming from storage, on its way to be rehydrated into redux
    (outboundState) => ({dbName: outboundState}),
    // configuration options
    {whitelist: ['db']}
);

persistStore(store, {
    whitelist: ['db'],
    transforms: [dbTransform],
    debounce: 1000
});

checkLogin(store.dispatch);
getLoginProviders(store.dispatch);
getDbList(store.dispatch);

export default store;
