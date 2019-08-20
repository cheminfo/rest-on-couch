import React from 'react';

import DisplayRight from './DisplayRight';

const rightImportance = {
  read: 1,
  create: 2,
  write: 3,
  delete: 4,
};

const DisplayRightList = (props) => {
  if (!props.rights) return null;
  const rights = props.rights.slice().sort(function(a, b) {
    return (rightImportance[a] || 0) - (rightImportance[b] || 0);
  });

  return (
    <div>
      {rights.map((right) => (
        <DisplayRight style={{ margin: 2 }} right={right} key={right} />
      ))}
    </div>
  );
};

export default DisplayRightList;
