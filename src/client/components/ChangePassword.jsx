import { useState } from 'react';
import { connect } from 'react-redux';

import { changeCouchDBPassword } from '../actions/login';

export function ChangePasswordImplementation(props) {
  const [state, setState] = useState(() => ({
    oldPassword: '',
    newPassword: '',
  }));

  const isEmpty = state.oldPassword === '' || state.newPassword === '';

  function handleChange(event) {
    setState((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSubmit() {
    if (isEmpty) return;
    props.changeCouchDBPassword(state.oldPassword, state.newPassword);
    setState({
      oldPassword: '',
      newPassword: '',
    });
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') handleSubmit();
  }

  return (
    <div>
      <h3>Change password</h3>
      <form>
        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <label>Current password</label>
              <input
                name="oldPassword"
                type="password"
                className="form-control"
                autoComplete="current-password"
                value={state.oldPassword}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label>New password</label>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                className="form-control"
                value={state.newPassword}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>
        {props.error ? <p className="text-danger">{props.error}</p> : ''}
        {props.success ? <p className="text-success">{props.success}</p> : ''}
        <button
          disabled={isEmpty}
          type="button"
          className="btn btn-info btn-fill"
          onClick={handleSubmit}
        >
          Change Password
        </button>
        <div className="clearfix" />
      </form>
    </div>
  );
}

function mapStateToProps(state) {
  return {
    username: state.login.username,
    error: state.login.errors.changePassword,
    success: state.login.success.changePassword,
  };
}

const ChangePassword = connect(mapStateToProps, { changeCouchDBPassword })(
  ChangePasswordImplementation,
);

export default ChangePassword;
