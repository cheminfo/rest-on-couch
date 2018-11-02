import { apiFetchJSON } from '../api';

import { checkLogin, getLoginProviders } from './login';
import { getDbList } from './db';

export const ROC_ONLINE = 'ROC_ONLINE';

export function getRocStatus() {
  return async (dispatch, getState) => {
    try {
      const result = await apiFetchJSON('auth/session');
      if (result.ok) {
        if (!getState().main.rocOnline) {
          // first time we are online or went from offline to online
          // do various queries to initialize the view
          dispatch({ type: ROC_ONLINE, payload: true });
          checkLogin(dispatch);
          getLoginProviders(dispatch);
          getDbList(dispatch);
        }
      } else {
        dispatch({ type: ROC_ONLINE, payload: false });
      }
    } catch (e) {
      dispatch({ type: ROC_ONLINE, payload: false });
    }
    setTimeout(() => dispatch(getRocStatus()), 10000);
  };
}
