import DatabaseSelector from './DatabaseSelector';
import LoginButton from './LoginButton';

export default function Home(props) {
  if (!props.user) {
    return (
      <div>
        <p>Welcome to the dashboard!</p>
        <p>
          {'Please '}
          <LoginButton message="log in" />
          {'.'}
        </p>
      </div>
    );
  }
  let databaseContent;
  if (!props.dbName) {
    databaseContent = (
      <DatabaseSelector
        dbName={props.dbName}
        dbList={props.dbList}
        onDbSelected={props.onDbSelected}
      />
    );
  } else {
    databaseContent = (
      <p>
        <span>Currently selected database is </span>
        <code>{props.dbName}</code>
      </p>
    );
  }
  return (
    <div>
      <p>{`You are logged in as ${props.user}.`}</p>
      {databaseContent}
      <p>{props.isAdmin && <span>You are an admin of this database.</span>}</p>
    </div>
  );
}
