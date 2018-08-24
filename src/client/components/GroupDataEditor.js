import React from 'react';
import PropTypes from 'prop-types';

import GroupDataElement from './GroupDataElement';
import EnterTextField from './EnterTextField';
import ResponsiveTable from './ResponsiveTable';

const GroupDataEditor = ({
  canAdd = true,
  editable = 'all',
  type,
  data,
  addValue,
  removeValue
}) => (
  <ResponsiveTable>
    <thead>
      <tr>
        <th>{type}</th>
      </tr>
    </thead>
    <tbody>
      {data.map((value, i) => (
        <GroupDataElement
          key={value}
          value={value}
          removeValue={removeValue}
          editable={isEditable(editable, i)}
        />
      ))}
      {canAdd ? (
        <tr>
          <td>
            <EnterTextField onSubmit={addValue} />
          </td>
          <td />
        </tr>
      ) : null}
    </tbody>
  </ResponsiveTable>
);

GroupDataEditor.propTypes = {
  addValue: PropTypes.func.isRequired,
  removeValue: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired
};

function isEditable(type, idx) {
  switch (type) {
    case 'all-except-first':
      return idx !== 0;
    case 'none':
      return false;
    case 'all':
      return true;
    default:
      throw new Error('Invalid prop editable');
  }
}

export default GroupDataEditor;
