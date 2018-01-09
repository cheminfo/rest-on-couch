import React from 'react';

const labelTypes = {
  create: 'success',
  read: 'info',
  write: 'warning',
  delete: 'danger'
};

const DisplayRight = (props) => {
  const labelType = labelTypes[props.right] || 'default';
  return (
    <span style={props.style} className={`label label-${labelType}`}>
      {' '}
      {props.right}{' '}
    </span>
  );
};

export default DisplayRight;
