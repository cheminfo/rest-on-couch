import { useState } from 'react';
import { connect } from 'react-redux';

import { createCouchDBUser } from '../actions/login';

function CreateUserImplementation(props) {
  const [state, setState] = useState(() => ({ email: '', password: '' }));
  const isEmpty = state.email === '' || state.password === '';

  function handleChange(event) {
    setState((previousState) => ({
      ...previousState,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSubmit() {
    if (isEmpty) return;
    props.createCouchDBUser(state.email, state.password);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') handleSubmit();
  }

  return (
    <div>
      <h3>Create a new user</h3>
      <form>
        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <label>Email</label>
              <input
                name="email"
                type="email"
                className="form-control"
                value={state.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label>Password</label>
              <input
                name="password"
                type="password"
                className="form-control"
                value={state.password}
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
          Create user
        </button>
        <div className="clearfix" />
      </form>
    </div>
  );
}

function mapStateToProps(state) {
  return {
    username: state.login.username,
    error: state.login.errors.createUser,
    success: state.login.success.createUser,
  };
}

const CreateUser = connect(mapStateToProps, { createCouchDBUser })(
  CreateUserImplementation,
);

export default CreateUser;
