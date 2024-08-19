import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

import { dbManager } from '../store';

import Allowed from './Allowed';
import ChangePassword from './ChangePassword';
import CreateUser from './CreateUser';
import DatabaseAdministration from './DatabaseAdministration';
import DatabaseSelector from './DatabaseSelector';
import GroupMemberships from './GroupMemberships';
import Groups from './Groups';
import Home from './Home';
import Login from './Login';
import LoginButton from './LoginButton';
import NoMatch from './NoMatch';
import Sidebar from './Sidebar';

function AppImpl(props) {
  const { rocOnline } = props;
  const handleDbSelected = (event) => dbManager.switchDb(event.target.value);
  return (
    <HashRouter>
      <div>
        <div className="wrapper">
          <Sidebar
            rocOnline={rocOnline}
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
                  {rocOnline && (
                    <ul className="nav navbar-nav navbar-right">
                      <li>
                        <DatabaseSelector
                          dbName={props.dbName}
                          dbList={props.dbList}
                          onDbSelected={handleDbSelected}
                        />
                      </li>
                      <li>
                        <LoginButton />
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </nav>

            <div className="content">
              <div className="container-fluid">
                {rocOnline ? (
                  <Switch>
                    <Route
                      path="/"
                      exact
                      render={() => (
                        <Home
                          dbName={props.dbName}
                          dbList={props.dbList}
                          onDbSelected={handleDbSelected}
                          user={props.loggedUser}
                          provider={props.loginProvider}
                          isAdmin={props.isAdmin}
                        />
                      )}
                    />
                    <Route
                      path="/groups"
                      exact
                      render={() => {
                        if (!props.hasDb) {
                          return <Redirect to="/" />;
                        }
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
                        if (!props.hasDb) {
                          return <Redirect to="/" />;
                        }
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
                    <Route
                      path="/group_memberships"
                      render={() => {
                        if (!props.hasDb) {
                          return <Redirect to="/" />;
                        }
                        return <GroupMemberships />;
                      }}
                    />
                    <Route component={NoMatch} />
                  </Switch>
                ) : rocOnline === false ? (
                  <div>Could not connect to the database...</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}

AppImpl.propTypes = {
  loggedIn: PropTypes.bool.isRequired,
};

const App = connect((state) => ({
  rocOnline: state.main.rocOnline,
  loggedUser: state.login.username,
  loggedIn: !!state.login.username,
  loginProvider: state.login.provider,
  isAdmin: state.login.admin,
  userRights: state.db.userRights,
  isGroupOwner: state.db.userGroups.length !== 0,
  dbList: state.db.dbList,
  dbName: state.dbName,
  hasDb: !!state.dbName,
}))(AppImpl);

export default App;
