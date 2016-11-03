import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {logout as logoutAction} from '../actions/login';

const LoginButton = ({loggedIn, logout}) => {
    if (loggedIn) {
        return (
            <a href="#" onClick={logout}>
                Logout
            </a>
        );
    } else {
        return (
            <Link to='/login'>
                Login
            </Link>
        );
    }
};

LoginButton.propTypes = {
    loggedIn: PropTypes.bool.isRequired
};

export default connect(
    (state) => ({loggedIn: state.login.loggedIn}),
    (dispatch) => ({logout: logoutAction(dispatch)})
)(LoginButton);
