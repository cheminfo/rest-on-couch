import React from 'react';
import Select2 from 'react-select2-wrapper';
import 'react-select2-wrapper/css/select2.css';

export default function DatabaseSelector({ dbName, dbList, onDbSelected }) {
  return (
    <div
      style={{
        margin: '10px 3px',
        position: 'relative'
      }}
    >
      <Select2
        style={{
          width: '200px'
        }}
        multiple={false}
        value={dbName}
        data={[''].concat(dbList)}
        options={{
          placeholder: 'Select a database'
        }}
        onSelect={onDbSelected}
      />
    </div>
  );
}
