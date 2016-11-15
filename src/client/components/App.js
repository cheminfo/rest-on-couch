import React, {PropTypes} from 'react';
import {BrowserRouter, Match, Miss, Redirect} from 'react-router';
import {connect} from 'react-redux';

import {setDbName} from '../actions/db';

import DatabaseSelector from './DatabaseSelector';
import Home from './Home';
import Login from './Login';
import LoginButton from './LoginButton';
import NoMatch from './NoMatch';
import Sidebar from './Sidebar';

const App = (props) => (
    <BrowserRouter>
        <div>
            <div className="wrapper">
                <Sidebar />
                <div className="main-panel">
                    <nav className="navbar navbar-default navbar-fixed">
                        <div className="container-fluid">
                            <div className="collapse navbar-collapse">
                                <ul className="nav navbar-nav navbar-right">
                                    <li>
                                        <DatabaseSelector dbName={props.dbName} dbList={props.dbList} onDbSelected={(event) => props.dispatch(setDbName(event.target.value))} />
                                    </li>
                                    <li>
                                        <LoginButton />
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
    (state) => ({
        loggedIn: state.login.loggedIn,
        dbList: state.db.dbList,
        dbName: state.dbName
    })
)(App);
