import {
  CHANGE_COUCHDB_PASSWORD,
  CHECK_LOGIN,
  CREATE_COUCHDB_USER,
  GET_LOGIN_PROVIDERS,
  LOGOUT,
} from '../actions/login';

const initialState = {
  loginProviders: [],
  username: null,
  provider: null,
  admin: null,
  errors: {},
  success: {},
};

const loginReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case `${CHECK_LOGIN}_FULFILLED`: {
      return { ...state, ...onLogin(action.payload) };
    }
    case `${LOGOUT}_FULFILLED`:
      return {
        ...state,
        errors: {},
        username: null,
        provider: null,
        admin: null,
      };
    case `${GET_LOGIN_PROVIDERS}_FULFILLED`:
      return { ...state, loginProviders: action.payload };
    case `${CHANGE_COUCHDB_PASSWORD}_FULFILLED`:
      return {
        ...state,
        errors: { changePassword: action.payload.error || '' },
        success: {
          changePassword: action.payload.error
            ? ''
            : 'Successfully changed password',
        },
      };
    case `${CREATE_COUCHDB_USER}_FULFILLED`:
      return {
        ...state,
        errors: { createUser: action.payload.error || '' },
        success: {
          createUser: action.payload.error ? '' : 'Successfully created user',
        },
      };
    default:
      return state;
  }
};

export default loginReducer;

function onLogin(result) {
  if (!result.authenticated) {
    return { errors: { [result.provider]: true } };
  } else {
    return {
      errors: {},
      username: result.username,
      provider: result.provider,
      admin: result.admin,
    };
  }
}
