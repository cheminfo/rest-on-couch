import React from 'react';
import {NavLink} from 'react-router-dom';

export default ({to, icon, text}) => (
    <li>
        <NavLink to={to} activeClassName="active">
            <i className={`fa fa-${icon}`} />
            <p>{text}</p>
        </NavLink>
    </li>
);
