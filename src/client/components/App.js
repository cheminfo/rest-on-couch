import React, {PropTypes} from 'react';
import {BrowserRouter, Route, Redirect, Switch} from 'react-router-dom';
import {connect} from 'react-redux';

import {API_PROXY_PREFIX} from '../api';
import {dbManager} from '../store';

import DatabaseSelector from './DatabaseSelector';
import Home from './Home';
import Groups from './Groups';
import Login from './Login';
import ChangePassword from './ChangePassword';
import LoginButton from './LoginButton';
import CreateUser from './CreateUser';
import NoMatch from './NoMatch';
import Sidebar from './Sidebar';
import DatabaseAdministration from './DatabaseAdministration';

const App = (props) => (
    <BrowserRouter basename={API_PROXY_PREFIX}>
        <div>
            <div className="wrapper">
                <Sidebar hasDb={props.hasDb} loggedIn={props.loggedIn} loginProvider={props.loginProvider} isAdmin={props.isAdmin} userRights={props.userRights} isGroupOwner={props.isGroupOwner} />
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
                                <Route path="/groups" render={() => {
                                    if (props.userRights.includes('createGroup') || props.isGroupOwner) {
                                        return <Groups />;
                                    } else {
                                        return <Redirect to="/" />;
                                    }
                                }} />
                                <Route path="/create_user" component={CreateUser} />
                                <Route path="/manage_database" render={() => {
                                    if (props.userRights.includes('admin')) {
                                        return <DatabaseAdministration />;
                                    } else {
                                        return <Redirect to="/" />;
                                    }
                                }} />
                                <Route path="/login" render={() => {
                                    if (props.loggedIn) {
                                        return <Redirect to="/" />;
                                    } else {
                                        return <Login />;
                                    }
                                }} />
                                <Route path="/change_password" component={ChangePassword} />
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
        loginProvider: state.login.provider,
        isAdmin: state.login.admin,
        userRights: state.db.userRights,
        isGroupOwner: state.db.userGroups.length !== 0,
        dbList: state.db.dbList,
        dbName: state.dbName,
        hasDb: !!state.dbName
    })
)(App);
