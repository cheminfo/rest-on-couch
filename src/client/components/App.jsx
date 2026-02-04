import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { dbManager } from '../store';

import ChangePassword from './ChangePassword';
import CreateUser from './CreateUser';
import DatabaseSelector from './DatabaseSelector';
import Home from './Home';
import LoginButton from './LoginButton';
import NoMatch from './NoMatch';
import Sidebar from './Sidebar';
import GroupMembershipsPage from './pages/GroupMembershipsPage';
import GroupsPage from './pages/GroupsPage';
import { LoginPage } from './pages/LoginPage';
import ManageDatabasePage from './pages/ManageDatabasePage';

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
                    <ul
                      style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      className="nav navbar-nav navbar-right"
                    >
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
                  <Routes>
                    <Route
                      path="/"
                      exact
                      element={
                        <Home
                          dbName={props.dbName}
                          dbList={props.dbList}
                          onDbSelected={handleDbSelected}
                          user={props.loggedUser}
                          provider={props.loginProvider}
                          isAdmin={props.isAdmin}
                        />
                      }
                    />
                    <Route
                      path="/groups"
                      exact
                      element={
                        <GroupsPage
                          hasDb={props.hasDb}
                          userRights={props.userRights}
                          isGroupOwner={props.isGroupOwner}
                        />
                      }
                    />
                    <Route path="/create_user" element={<CreateUser />} />
                    <Route
                      path="/manage_database"
                      element={
                        <ManageDatabasePage userRights={props.userRights} />
                      }
                    />
                    <Route
                      path="/login"
                      element={<LoginPage loggedIn={props.loggedIn} />}
                    />
                    <Route
                      path="/change_password"
                      element={<ChangePassword />}
                    />
                    <Route
                      path="/group_memberships"
                      element={<GroupMembershipsPage hasDb={props.hasDb} />}
                    />
                    <Route path="*" element={<NoMatch />} />
                  </Routes>
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

const App = connect((state) => {
  const dbName = state.db.dbList.includes(state.dbName) ? state.dbName : '';
  return {
    rocOnline: state.main.rocOnline,
    loggedUser: state.login.username,
    loggedIn: !!state.login.username,
    loginProvider: state.login.provider,
    isAdmin: state.login.admin,
    userRights: state.db.userRights,
    isGroupOwner: state.db.userGroups.length !== 0,
    dbList: state.db.dbList,
    dbName,
    hasDb: !!dbName,
  };
})(AppImpl);

export default App;
