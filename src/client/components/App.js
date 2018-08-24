import React from 'react';
import PropTypes from 'prop-types';
import { HashRouter, Route, Redirect, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

import { dbManager } from '../store';

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
import GroupMemberships from './GroupMemberships';
import Allowed from './Allowed';

const App = (props) => (
  <HashRouter>
    <div>
      <div className="wrapper">
        <Sidebar
          hasDb={props.hasDb}
          loggedIn={props.loggedIn}
          loginProvider={props.loginProvider}
          isAdmin={props.isAdmin}
          userRights={props.userRights}
          isGroupOwner={props.isGroupOwner}
        />
        <div className="main-panel">
          <nav className="navbar navbar-default navbar-fixed">
            <div className="container-fluid">
              <div className="collapse navbar-collapse">
                <ul className="nav navbar-nav navbar-right">
                  <li>
                    <DatabaseSelector
                      dbName={props.dbName}
                      dbList={props.dbList}
                      onDbSelected={(event) =>
                        dbManager.switchDb(event.target.value)
                      }
                    />
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
                <Route
                  path="/"
                  exact
                  render={() => (
                    <Home
                      user={props.loggedUser}
                      provider={props.loginProvider}
                      dbName={props.dbName}
                      isAdmin={props.isAdmin}
                    />
                  )}
                />
                <Route
                  path="/groups"
                  exact
                  render={() => {
                    return (
                      <Allowed
                        allowed={
                          props.userRights.includes('createGroup') ||
                          props.isGroupOwner
                        }
                      >
                        <Groups />
                      </Allowed>
                    );
                  }}
                />
                <Route path="/create_user" component={CreateUser} />
                <Route
                  path="/manage_database"
                  render={() => {
                    return (
                      <Allowed allowed={props.userRights.includes('admin')}>
                        <DatabaseAdministration
                          isAdmin={props.userRights.includes('admin')}
                        />
                        ;
                      </Allowed>
                    );
                  }}
                />
                <Route
                  path="/login"
                  render={() => {
                    if (props.loggedIn) {
                      return <Redirect to="/" />;
                    } else {
                      return <Login />;
                    }
                  }}
                />
                <Route path="/change_password" component={ChangePassword} />
                <Route path="/group_memberships" component={GroupMemberships} />
                <Route component={NoMatch} />
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </div>
  </HashRouter>
);

App.propTypes = {
  loggedIn: PropTypes.bool.isRequired
};

export default connect((state) => ({
  loggedUser: state.login.username,
  loggedIn: !!state.login.username,
  loginProvider: state.login.provider,
  isAdmin: state.login.admin,
  userRights: state.db.userRights,
  isGroupOwner: state.db.userGroups.length !== 0,
  dbList: state.db.dbList,
  dbName: state.dbName,
  hasDb: !!state.dbName
}))(App);
