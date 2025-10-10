import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { checkLogin } from '../actions/login';
import { API_ROOT } from '../api';
import { dbManager } from '../store';

import googleSigninImage from '../../../public/assets/img/logo/google_signin.png';

const LoginGoogleImpl = ({ doGoogleLogin }) => (
  <a href="#" onClick={doGoogleLogin}>
    <img alt="Google signin" src={googleSigninImage} />
  </a>
);

LoginGoogleImpl.propTypes = {
  doGoogleLogin: PropTypes.func.isRequired,
};

const LoginGoogle = connect(null, (dispatch) => ({
  doGoogleLogin: () => {
    const height = 600;
    const width = 450;
    const left = Math.round(window.outerWidth / 2 - width / 2);
    const top = Math.round(window.outerHeight / 2 - height / 2);
    const win = window.open(
      `${API_ROOT}auth/login/google/popup`,
      'loginPopup',
      `location=1,scrollbars=1,height=${height},width=${width},left=${left},top=${top}`,
    );
    if (win.focus) win.focus();
    checkWindowStatus();

    function checkWindowStatus() {
      if (win.closed) {
        checkLogin(dispatch, 'google');
        dbManager.syncDb();
      } else {
        setTimeout(checkWindowStatus, 250);
      }
    }
  },
}))(LoginGoogleImpl);

export default LoginGoogle;
