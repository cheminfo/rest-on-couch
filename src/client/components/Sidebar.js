import React from 'react';
import {Link} from 'react-router-dom';

import SidebarLink from './SidebarLink';

export default ({hasDb, loggedIn, loginProvider, isAdmin}) => (
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
                    <SidebarLink to="/password/change" icon="key" text="Change Password" />
                    : null}
                { isAdmin ?
                    <SidebarLink to="/user/create" icon="plus" text="New user" />
                    : null}
            </ul>

        </div>
    </div>
);
