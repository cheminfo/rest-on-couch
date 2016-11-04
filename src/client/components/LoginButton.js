import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {logout as logoutAction} from '../actions/login';

const LoginButton = ({loggedIn, logout, username}) => {
    if (loggedIn) {
        return (
            <a href="#" onClick={logout}>
                {username} - Logout
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
    (state) => ({loggedIn: state.login.loggedIn, username: state.login.username}), // mapStateToProps
    (dispatch) => ({logout: logoutAction(dispatch)}) // mapDispatchToProps
)(LoginButton);
