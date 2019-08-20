import React from 'react';
import { connect } from 'react-redux';

import { createCouchDBUser } from '../actions/login';

class CreateUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  handleSubmit() {
    if (this.isEmpty()) return;
    this.props.createCouchDBUser(this.state.email, this.state.password);
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') this.handleSubmit();
  }

  isEmpty() {
    return this.state.email === '' || this.state.password === '';
  }

  render() {
    return (
      <div>
        <h3>Create a new user</h3>
        <form>
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  value={this.state.username}
                  onChange={this.handleChange}
                  onKeyPress={this.handleKeyPress}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-control"
                  value={this.state.password}
                  onChange={this.handleChange}
                  onKeyPress={this.handleKeyPress}
                />
              </div>
            </div>
          </div>
          {this.props.error ? (
            <p className="text-danger">{this.props.error}</p>
          ) : (
            ''
          )}
          {this.props.success ? (
            <p className="text-success">{this.props.success}</p>
          ) : (
            ''
          )}
          <button
            disabled={this.isEmpty()}
            type="button"
            className="btn btn-info btn-fill"
            onClick={this.handleSubmit}
          >
            Create user
          </button>
          <div className="clearfix" />
        </form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    username: state.login.username,
    error: state.login.errors.createUser,
    success: state.login.success.createUser,
  };
}

export default connect(
  mapStateToProps,
  { createCouchDBUser },
)(CreateUser);
