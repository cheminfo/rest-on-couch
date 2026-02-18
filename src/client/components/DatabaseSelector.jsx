export default function DatabaseSelector({ dbName, dbList, onDbSelected }) {
  return (
    <div
      style={{
        margin: '10px 3px',
        position: 'relative',
      }}
    >
      <select
        style={{
          width: '200px',
        }}
        className="form-select"
        value={dbName}
        onChange={(event) => {
          onDbSelected(event);
        }}
      >
        {!dbList.includes(dbName) && (
          <option value={dbName} style={{ color: 'lightblue' }}>
            Select a database...
          </option>
        )}

        {dbList.map((element) => (
          <option value={element} key={element}>
            {element}
          </option>
        ))}
      </select>
    </div>
  );
}
