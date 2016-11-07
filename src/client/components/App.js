import React, {PropTypes} from 'react';
import {BrowserRouter, Match, Miss, Link, Redirect} from 'react-router';
import {connect} from 'react-redux';

import Home from './Home';
import Login from './Login';
import NoMatch from './NoMatch';
import LoginButton from './LoginButton';
import DatabaseSelector from './DatabaseSelector';

const App = (props) => (
    <BrowserRouter>
        <div>
            <div className="wrapper">
                <div className="sidebar" data-color="blue">
                    <div className="sidebar-wrapper">
                        <div className="logo">
                            <Link to="/" className="simple-text">rest-on-couch</Link>
                        </div>
                        <ul className="nav">
                            <li>
                                <Link to="/dashboard" activeClassName="active">
                                    <i className="fa fa-fighter-jet"/>
                                    <p>Dashboard</p>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="main-panel">
                    <nav className="navbar navbar-default navbar-fixed">
                        <div className="container-fluid">
                            <div className="navbar-header">
                                <a className="navbar-brand" href="#">Dashboard</a>
                            </div>
                            <div className="collapse navbar-collapse">
                                <ul className="nav navbar-nav navbar-right">
                                    <li>
                                        <DatabaseSelector/>
                                    </li>
                                    <li>
                                        <LoginButton/>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>

                    <div className="content">
                        <div className="container-fluid">
                            <Match exactly pattern="/" component={Home}/>
                            <Match pattern="/dashboard" component={Home}/>
                            <Match pattern="/login" render={() => {
                                if (props.loggedIn) {
                                    return <Redirect to="/dashboard"/>;
                                } else {
                                    return <Login/>;
                                }
                            }} />
                            <Miss component={NoMatch}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </BrowserRouter>
);

App.propTypes = {
    loggedIn: PropTypes.bool.isRequired
};

export default connect(
    (state) => ({loggedIn: state.login.loggedIn})
)(App);
