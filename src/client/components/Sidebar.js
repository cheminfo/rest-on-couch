import React from 'react';
import {Link} from 'react-router-dom';

import SidebarLink from './SidebarLink';

export default ({hasDb}) => (
    <div className="sidebar" data-color="blue">
        <div className="sidebar-wrapper">
            <div className="logo">
                <Link to="/" className="simple-text">rest-on-couch</Link>
            </div>
            { hasDb ?
                <ul className="nav">
                    {/*<SidebarLink to="/rights" icon="unlock-alt" text="Rights" />*/}
                    <SidebarLink to="/groups" icon="users" text="Groups" />
                </ul>
                    : null }
        </div>
    </div>
);
