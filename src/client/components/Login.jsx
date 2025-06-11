import PropTypes from 'prop-types';
import { useState } from 'react';
import { connect } from 'react-redux';

import { loginCouchDB, loginLDAP } from '../actions/login';
import { API_ROOT } from '../api';

import LoginGeneric from './LoginGeneric';
import LoginGoogle from './LoginGoogle';

const LoginImpl = (props) => {
  const [redirectURL] = useState(() => {
    const url = new URL(window.location.href);
    url.hash = '';
    return url.toString();
  });
  const googleProvider = props.loginProviders.find((p) => p.name === 'google');
  const couchdbProvider = props.loginProviders.find(
    (p) => p.name === 'couchdb',
  );
  const ldapProvider = props.loginProviders.find((p) => p.name === 'ldap');
  const oidcProvider = props.loginProviders.find((p) => p.name === 'oidc');
  return (
    <div>
      {props.loginProviders.length === 0 ? 'No login provider available' : ''}
      {googleProvider && (
        <div className="card">
          <div className="header">
            <h4 className="title">{googleProvider.title}</h4>
          </div>
          <div className="content">
            <LoginGoogle />
          </div>
        </div>
      )}
      {ldapProvider && (
        <div className="card">
          <div className="header">
            <h4 className="title">{ldapProvider.title}</h4>
          </div>
          <div className="content">
            <LoginGeneric error={props.errors.ldap} login={props.loginLDAP} />
          </div>
        </div>
      )}
      {couchdbProvider && (
        <div className="card">
          <div className="header">
            <h4 className="title">{couchdbProvider.title}</h4>
          </div>
          <div className="content">
            <LoginGeneric
              error={props.errors.couchdb}
              login={props.loginCouchDB}
            />
          </div>
        </div>
      )}
      {oidcProvider && (
        <div className="card">
          <div className="header">
            <h4 className="title">{oidcProvider.title}</h4>
          </div>
          <div className="content">
            <a
              href={`${API_ROOT}auth/login/oidc?continue=${encodeURIComponent(redirectURL)}`}
            >
              Click here to login with {oidcProvider.title}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

LoginImpl.propTypes = {
  errors: PropTypes.object.isRequired,
  loginLDAP: PropTypes.func,
  loginProviders: PropTypes.array.isRequired,
};

const Login = connect(
  (state) => ({
    errors: state.login.errors,
    loginProviders: state.login.loginProviders.filter((p) => p.visible),
  }),
  (dispatch) => ({
    loginLDAP: loginLDAP(dispatch),
    loginCouchDB: loginCouchDB(dispatch),
  }),
)(LoginImpl);

export default Login;
