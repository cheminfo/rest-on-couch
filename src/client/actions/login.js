import {createAction} from 'redux-actions';

export const HAS_LOGGED = Symbol('HAS_LOGGED');
export const hasLogged = createAction(HAS_LOGGED);
