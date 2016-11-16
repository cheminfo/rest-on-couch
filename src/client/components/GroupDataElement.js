import React from 'react';

const GroupDataElement = ({value, removeValue}) => (
    <tr>
        <td>
            {value}
        </td>
        <td className="td-action">
            <button type="button" className="btn btn-danger btn-simple btn-xs" onClick={() => removeValue(value)}>
                <i className="fa fa-times" />
            </button>
        </td>
    </tr>
);

export default GroupDataElement;
