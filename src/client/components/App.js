import React, {PropTypes} from 'react';
import {BrowserRouter, Route, Redirect, Switch} from 'react-router-dom';
import {connect} from 'react-redux';

import {API_PROXY_PREFIX} from '../api';
import {dbManager} from '../store';

import DatabaseSelector from './DatabaseSelector';
import Home from './Home';
import Groups from './Groups';
import Login from './Login';
import LoginButton from './LoginButton';
import NoMatch from './NoMatch';
import Sidebar from './Sidebar';

const App = (props) => (
    <BrowserRouter basename={API_PROXY_PREFIX}>
        <div>
            <div className="wrapper">
                <Sidebar hasDb={props.hasDb} />
                <div className="main-panel">
                    <nav className="navbar navbar-default navbar-fixed">
                        <div className="container-fluid">
                            <div className="collapse navbar-collapse">
                                <ul className="nav navbar-nav navbar-right">
                                    <li>
                                        <DatabaseSelector dbName={props.dbName} dbList={props.dbList} onDbSelected={(event) => dbManager.switchDb(event.target.value)} />
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
                            <Switch>
                                <Route path="/" exact component={Home} />
                                <Route path="/groups" component={Groups} />
                                <Route path="/login" render={() => {
                                    if (props.loggedIn) {
                                        return <Redirect to="/" />;
                                    } else {
                                        return <Login />;
                                    }
                                }} />
                                <Route component={NoMatch} />
                            </Switch>
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
        loggedIn: !!state.login.username,
        dbList: state.db.dbList,
        dbName: state.dbName,
        hasDb: !!state.dbName
    })
)(App);
