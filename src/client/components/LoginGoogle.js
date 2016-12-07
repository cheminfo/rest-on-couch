import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {API_ROOT} from '../api';
import {checkLogin} from '../actions/login';

const LoginGoogle = ({doGoogleLogin}) => (
    <a href="#" onClick={doGoogleLogin}>
        <img src="/assets/img/logo/google_signin.png" />
    </a>
);

LoginGoogle.propTypes = {
    doGoogleLogin: PropTypes.func.isRequired
};

export default connect(
    null,
    (dispatch) => ({
        doGoogleLogin: () => {
            const height = 600;
            const width = 450;
            const left = Math.round(window.outerWidth / 2 - width / 2);
            const top = Math.round(window.outerHeight / 2 - height / 2);
            const win = window.open(API_ROOT + '/auth/login/google/popup', 'loginPopup', `location=1,scrollbars=1,height=${height},width=${width},left=${left},top=${top}`);
            if (win.focus) win.focus();
            checkWindowStatus();

            function checkWindowStatus() {
                if (win.closed) {
                    checkLogin(dispatch);
                } else {
                    setTimeout(checkWindowStatus, 250);
                }
            }
        }
    })
)(LoginGoogle);
