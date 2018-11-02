import { apiFetchJSON } from '../api';

export const ROC_ONLINE = 'ROC_ONLINE';

export function getRocStatus() {
  return async (dispatch) => {
    try {
      const result = await apiFetchJSON('auth/session');
      dispatch({ type: ROC_ONLINE, payload: !!result.ok });
    } catch (e) {
      dispatch({ type: ROC_ONLINE, payload: false });
    }
    setTimeout(() => dispatch(getRocStatus()), 10000);
  };
}
