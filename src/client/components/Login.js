import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {login as loginAction} from '../actions/login';

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: ''
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
        this.props.login(this.state.username, this.state.password);
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') this.handleSubmit();
    }

    isEmpty() {
        return (this.state.username === '' || this.state.password === '');
    }

    render() {
        return (
            <div className="card">
                <div className="header">
                    <h4 className="title">LDAP Login</h4>
                </div>
                <div className="content">
                    <form>
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input name="username" type="text" className="form-control" value={this.state.username} onChange={this.handleChange} onKeyPress={this.handleKeyPress}/>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Password</label>
                                    <input name="password" type="password" className="form-control" value={this.state.password} onChange={this.handleChange} onKeyPress={this.handleKeyPress}/>
                                </div>
                            </div>
                        </div>
                        {this.props.error ? (<p>Wrong username or password!</p>) : ''}
                        <button disabled={this.isEmpty()} type="button" className="btn btn-info btn-fill" onClick={this.handleSubmit}>Login</button>
                        <div className="clearfix"></div>
                    </form>
                </div>
            </div>
        );
    }
}

Login.propTypes = {
    error: PropTypes.bool,
    login: PropTypes.func.isRequired
};

export default connect(
    (state) => ({error: state.login.error}),
    (dispatch) => ({login: loginAction(dispatch)})
)(Login);
