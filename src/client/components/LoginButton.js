import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { logout as logoutAction } from '../actions/login';

const LoginButton = ({ logout, username }) => {
  if (username) {
    return (
      <a href="#" onClick={logout}>
        {username} - Logout
      </a>
    );
  } else {
    return <Link to="/login">Login</Link>;
  }
};

LoginButton.propTypes = {
  logout: PropTypes.func.isRequired,
  username: PropTypes.string
};

export default connect(
  (state) => ({ username: state.login.username }), // mapStateToProps
  {
    logout: logoutAction
  }
)(LoginButton);
