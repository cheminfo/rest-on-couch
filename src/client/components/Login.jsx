import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { loginCouchDB, loginLDAP } from '../actions/login';

import LoginGeneric from './LoginGeneric';
import LoginGoogle from './LoginGoogle';

const LoginImpl = (props) => (
  <div>
    {props.loginProviders.length === 0 ? 'No login provider available' : ''}
    {props.loginProviders.includes('google') ? (
      <div className="card">
        <div className="header">
          <h4 className="title">Google login</h4>
        </div>
        <div className="content">
          <LoginGoogle />
        </div>
      </div>
    ) : (
      ''
    )}
    {props.loginProviders.includes('ldap') ? (
      <div className="card">
        <div className="header">
          <h4 className="title">LDAP Login</h4>
        </div>
        <div className="content">
          <LoginGeneric error={props.errors.ldap} login={props.loginLDAP} />
        </div>
      </div>
    ) : (
      ''
    )}
    {props.loginProviders.includes('couchdb') ? (
      <div className="card">
        <div className="header">
          <h4 className="title">CouchDB Login</h4>
        </div>
        <div className="content">
          <LoginGeneric
            error={props.errors.couchdb}
            login={props.loginCouchDB}
          />
        </div>
      </div>
    ) : (
      ''
    )}
  </div>
);

LoginImpl.propTypes = {
  errors: PropTypes.object.isRequired,
  loginLDAP: PropTypes.func,
  loginProviders: PropTypes.array.isRequired,
};

const Login = connect(
  (state) => ({
    errors: state.login.errors,
    loginProviders: state.login.loginProviders
      .filter((p) => p.visible)
      .map((p) => p.name),
  }),
  (dispatch) => ({
    loginLDAP: loginLDAP(dispatch),
    loginCouchDB: loginCouchDB(dispatch),
  }),
)(LoginImpl);

export default Login;
