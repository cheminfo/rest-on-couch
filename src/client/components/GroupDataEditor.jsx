import PropTypes from 'prop-types';
import { useState } from 'react';

import EnterTextField from './EnterTextField';
import GroupDataElement from './GroupDataElement';
import ResponsiveTable from './ResponsiveTable';

function GroupDataEditor({
  canAdd = true,
  editable = 'all',
  type,
  data,
  addValue,
  limit = Infinity,
  removeValue,
}) {
  const [showAll, setShowAll] = useState(false);

  const slicedData = showAll ? data : data.slice(0, limit);
  return (
    <>
      <ResponsiveTable>
        <thead>
          <tr>
            <th>{type}</th>
          </tr>
        </thead>
        <tbody>
          {slicedData.map((value, i) => (
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
      {limit < data.length ? (
        <button
          onClick={() => (showAll ? setShowAll(false) : setShowAll(true))}
          type="button"
          className="btn btn-fill"
        >
          {showAll ? 'Show less' : `Show ${data.length - limit} more`}
        </button>
      ) : null}
    </>
  );
}

GroupDataEditor.propTypes = {
  addValue: PropTypes.func.isRequired,
  removeValue: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired,
};

function isEditable(type, idx) {
  if (typeof type === 'number') {
    return idx < type;
  }
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
