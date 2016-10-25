import React from 'react';
import {BrowserRouter, Match, Miss, Link} from 'react-router';

import Home from './Home';
import Login from './Login';
import NoMatch from './NoMatch';

export default () => (
    <BrowserRouter>
        <div>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/logout">Logout</Link></li>
            </ul>
            <div>
                <Match exactly pattern="/" component={Home}/>
                <Match pattern="/login" component={Login}/>
                <Miss component={NoMatch}/>
            </div>
        </div>
    </BrowserRouter>
);