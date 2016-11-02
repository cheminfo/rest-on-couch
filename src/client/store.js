import {createStore, combineReducers} from 'redux';
import loginReducer from './reducers/login';

const store = createStore(combineReducers({
    login: loginReducer
}));

export default store;
