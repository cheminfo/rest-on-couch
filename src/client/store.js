import {createStore, combineReducers} from 'redux';
import {default as loginReducer, checkLogin} from './reducers/login';

const store = createStore(combineReducers({
    login: loginReducer
}));

checkLogin(store);

export default store;
