import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {login as loginAction} from '../actions/login';
import LoginGoogle from './LoginGoogle';
import LoginLDAP from './LoginLDAP';

const Login = (props) => (
    <div>
        <div className="card">
            <div className="header">
                <h4 className="title">LDAP Login</h4>
            </div>
            <div className="content">
                <LoginLDAP error={props.error} login={props.login} />
            </div>
        </div>
        <div className="card">
            <div className="header">
                <h4 className="title">Google login</h4>
            </div>
            <div className="content">
                <LoginGoogle/>
            </div>
        </div>
    </div>
);

Login.propTypes = {
    error: PropTypes.bool,
    login: PropTypes.func.isRequired
};

export default connect(
    (state) => ({error: state.login.error}),
    (dispatch) => ({login: loginAction(dispatch)})
)(Login);
