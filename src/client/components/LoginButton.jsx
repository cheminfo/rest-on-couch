import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { logout as logoutAction } from '../actions/login';
import { clsx } from 'clsx';

const LoginButtonImpl = ({ message = 'Login', logout, username, isNav }) => {
  const className = clsx({ 'nav-link': isNav });
  if (username) {
    return (
      <a className={className} href="#" onClick={logout}>
        {`${username} - Logout`}
      </a>
    );
  } else {
    return (
      <Link className={className} to="/login">
        {message}
      </Link>
    );
  }
};

LoginButtonImpl.propTypes = {
  logout: PropTypes.func.isRequired,
  username: PropTypes.string,
};

const LoginButton = connect((state) => ({ username: state.login.username }), {
  logout: logoutAction,
})(LoginButtonImpl);

export default LoginButton;
