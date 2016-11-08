import React from 'react';
import {Link} from 'react-router';

export default ({to, icon, text}) => (
    <li>
        <Link to={to} activeClassName="active">
            <i className={`fa fa-${icon}`} />
            <p>{text}</p>
        </Link>
    </li>
);
