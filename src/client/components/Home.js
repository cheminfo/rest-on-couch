import React from 'react';

export default function Home(props) {
  if (!props.user) {
    return (
      <div>
        <p>Welcome! You are currently not logged in.</p>
      </div>
    );
  } else {
    return (
      <div>
        <p>
          You are logged in as {props.user} (provided by {props.provider})
        </p>
        <p>
          Currently selected database is <code>{props.dbName}</code>. You are{props.isAdmin
            ? ' '
            : ' not'}{' '}
          an admin of this database.
        </p>
      </div>
    );
  }
}
