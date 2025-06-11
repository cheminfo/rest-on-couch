import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { logout as logoutAction } from '../actions/login';

const LoginButtonImpl = ({ message = 'Login', logout, username }) => {
  if (username) {
    return (
      <a href="#" onClick={logout}>
        {`${username} - Logout`}
      </a>
    );
  } else {
    return <Link to="/login">{message}</Link>;
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
