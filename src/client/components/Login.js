import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import includes from 'array-includes';

import {loginLDAP} from '../actions/login';
import LoginGoogle from './LoginGoogle';
import LoginLDAP from './LoginLDAP';

const Login = (props) => (
    <div>
        {
            props.loginProviders.length === 0 ? 'No login provider available' : ''
        }
        {
            includes(props.loginProviders, 'google') ?
                <div className="card">
                    <div className="header">
                        <h4 className="title">Google login</h4>
                    </div>
                    <div className="content">
                        <LoginGoogle />
                    </div>
                </div> : ''
        }
        {
            includes(props.loginProviders, 'ldap') ?
                <div className="card">
                    <div className="header">
                        <h4 className="title">LDAP Login</h4>
                    </div>
                    <div className="content">
                        <LoginLDAP error={props.errors.ldap} login={props.loginLDAP} />
                    </div>
                </div> : ''
        }
    </div>
);

Login.propTypes = {
    errors: PropTypes.object.isRequired,
    loginLDAP: PropTypes.func,
    loginProviders: PropTypes.array.isRequired
};

export default connect(
    (state) => ({
        errors: state.login.errors,
        loginProviders: state.login.loginProviders.filter(p => p.visible).map(p => p.name)
    }),
    (dispatch) => ({loginLDAP: loginLDAP(dispatch)})
)(Login);
