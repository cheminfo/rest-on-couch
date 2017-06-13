import React from 'react';

export default (props) => {
    if (!props.user) {
        return (
            <div>
                <p>Welcome! Your are currently not logged in.</p>
            </div>
        );
    } else {
        return (
            <div>
                <p>Your are logged in as {props.user} (provided by {props.provider})</p>
                <p>Currently selected database is <code>{props.dbName}</code>. Your are{props.isAdmin ? ' ' : ' not'} an admin of this database.</p>
            </div>
        );
    }
};
