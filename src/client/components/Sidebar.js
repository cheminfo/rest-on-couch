import React from 'react';
import {Link} from 'react-router';

import SidebarLink from './SidebarLink';

export default () => (
    <div className="sidebar" data-color="blue">
        <div className="sidebar-wrapper">
            <div className="logo">
                <Link to="/" className="simple-text">rest-on-couch</Link>
            </div>
            <ul className="nav">
                <SidebarLink to="/dashboard" icon="fighter-jet" text="Dashboard" />
            </ul>
        </div>
    </div>
);
