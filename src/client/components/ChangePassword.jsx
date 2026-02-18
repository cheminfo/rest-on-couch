import { Component } from 'react';
import { connect } from 'react-redux';

import { changeCouchDBPassword } from '../actions/login';

class ChangePasswordImpl extends Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
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
    this.props.changeCouchDBPassword(
      this.state.oldPassword,
      this.state.newPassword,
    );
    this.setState({
      oldPassword: '',
      newPassword: '',
    });
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') this.handleSubmit();
  }

  isEmpty() {
    return this.state.oldPassword === '' || this.state.newPassword === '';
  }

  render() {
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
                  value={this.state.oldPassword}
                  onChange={this.handleChange}
                  onKeyPress={this.handleKeyPress}
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
                  value={this.state.newPassword}
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
            Change Password
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
    error: state.login.errors.changePassword,
    success: state.login.success.changePassword,
  };
}

const ChangePassword = connect(mapStateToProps, { changeCouchDBPassword })(
  ChangePasswordImpl,
);

export default ChangePassword;
