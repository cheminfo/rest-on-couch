import { useState } from 'react';

export default function LoginGeneric(props) {
  const [state, setState] = useState(() => ({ username: '', password: '' }));
  const isEmpty = state.username === '' || state.password === '';

  function handleChange(event) {
    setState((previousState) => ({
      ...previousState,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSubmit() {
    if (isEmpty) return;
    props.login(state.username, state.password);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') handleSubmit();
  }
  return (
    <form>
      <div className="row">
        <div className="col-md-4">
          <div className="mb-3">
            <label>{props.userLabel}</label>
            <input
              name="username"
              type="text"
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
      {props.error ? (
        <p className="text-danger">Wrong username or password!</p>
      ) : (
        ''
      )}
      <button
        disabled={isEmpty}
        type="button"
        className="btn btn-info btn-fill"
        onClick={handleSubmit}
      >
        Login
      </button>
      <div className="clearfix" />
    </form>
  );
}
