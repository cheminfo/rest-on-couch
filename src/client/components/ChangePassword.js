import React from 'react';
import {changeCouchDBPassword} from '../actions/login';
import {connect} from 'react-redux';

class ChangePassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            oldPassword: '',
            newPassword: ''
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleSubmit() {
        if (this.isEmpty()) return;
        this.props.changeCouchDBPassword(this.state.oldPassword, this.state.newPassword);
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') this.handleSubmit();
    }

    isEmpty() {
        return (this.state.oldPassword === '' || this.state.newPassword === '');
    }

    render() {
        return (
            <div>
                <h3>Change password</h3>
                <form>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Current password</label>
                                <input name="oldPassword" type="password" className="form-control" value={this.state.username} onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>New password</label>
                                <input name="newPassword" type="password" className="form-control" value={this.state.password} onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
                            </div>
                        </div>
                    </div>
                    {this.props.error ? (<p className="text-danger">{this.props.error}</p>) : ''}
                    <button disabled={this.isEmpty()} type="button" className="btn btn-info btn-fill" onClick={this.handleSubmit}>Change Password</button>
                    <div className="clearfix"></div>
                </form>
            </div>

        );
    }
}

function mapStateToProps(state) {
    return {
        username: state.login.username,
        error: state.login.errors.changePassword
    };
}


export default connect(mapStateToProps, {changeCouchDBPassword})(ChangePassword);
