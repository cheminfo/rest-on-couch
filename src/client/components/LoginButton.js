import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { logout as logoutAction } from '../actions/login';

const LoginButton = ({ message = 'Login', logout, username }) => {
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

LoginButton.propTypes = {
  logout: PropTypes.func.isRequired,
  username: PropTypes.string,
};

export default connect((state) => ({ username: state.login.username }), {
  logout: logoutAction,
})(LoginButton);
