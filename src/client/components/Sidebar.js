import React from 'react';
import {Link} from 'react-router-dom';

import SidebarLink from './SidebarLink';

export default ({hasDb, loggedIn, loginProvider, isAdmin, userRights}) => (
    <div className="sidebar" data-color="blue">
        <div className="sidebar-wrapper">
            <div className="logo">
                <Link to="/" className="simple-text">rest-on-couch</Link>
            </div>
            <ul className="nav">
                { hasDb ?
                    <SidebarLink to="/groups" icon="users" text="Groups" />
                    : null }
                { loggedIn && loginProvider === 'local' ?
                    <SidebarLink to="/change_password" icon="key" text="Change Password" />
                    : null}
                { isAdmin ?
                    <SidebarLink to="/create_user" icon="plus" text="New user" />
                    : null}
                { userRights && userRights.includes('admin') ?
                    <SidebarLink to="/manage_database" icon="database" text="DB administration"/>
                    : null}
            </ul>

        </div>
    </div>
);
