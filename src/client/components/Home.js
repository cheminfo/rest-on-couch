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
          {`You are logged in as ${props.user} (provided by ${props.provider})`}
        </p>
        <p>
          <span>Currently selected database is </span>
          <code>{props.dbName}</code>
          <span>
            {`. You are ${
              props.isAdmin ? '' : 'not '
            } an admin of this database.`}
          </span>
        </p>
      </div>
    );
  }
}
