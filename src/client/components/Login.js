import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {login as loginAction} from '../actions/login';
import LoginGoogle from './LoginGoogle';
import LoginLDAP from './LoginLDAP';

const Login = (props) => (
    <div>
        {
            props.loginProviders.length === 0 ? 'No login provider available' : ''
        }
        {
            props.loginProviders.includes('google') ?
                <div className="card">
                    <div className="header">
                        <h4 className="title">Google login</h4>
                    </div>
                    <div className="content">
                        <LoginGoogle/>
                    </div>
                </div> : ''
        }
        {
            props.loginProviders.includes('ldap') ?
                <div className="card">
                    <div className="header">
                        <h4 className="title">LDAP Login</h4>
                    </div>
                    <div className="content">
                        <LoginLDAP error={props.error} login={props.login} />
                    </div>
                </div> : ''
        }
    </div>
);

Login.propTypes = {
    error: PropTypes.bool.isRequired,
    login: PropTypes.func.isRequired,
    loginProviders: PropTypes.array.isRequired
};

export default connect(
    (state) => ({
        error: state.login.error,
        loginProviders: state.login.loginProviders.filter(p => p.visible).map(p => p.name)
    }),
    (dispatch) => ({login: loginAction(dispatch)})
)(Login);
