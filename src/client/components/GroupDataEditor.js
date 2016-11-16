import React, {PropTypes} from 'react';

import GroupDataElement from './GroupDataElement';
import EnterTextField from './EnterTextField';
import ResponsiveTable from './ResponsiveTable';

const GroupDataEditor = ({type, data, addValue, removeValue}) => (
    <ResponsiveTable>
        <thead>
            <tr>
                <th>{type}</th>
            </tr>
        </thead>
        <tbody>
            {data.map((value, i) => (<GroupDataElement key={i} value={value} removeValue={removeValue} />))}
            <tr>
                <td>
                    <EnterTextField onSubmit={addValue} />
                </td>
                <td />
            </tr>
        </tbody>
    </ResponsiveTable>
);

GroupDataEditor.propTypes = {
    addValue: PropTypes.func.isRequired,
    removeValue: PropTypes.func.isRequired,
    data: PropTypes.array.isRequired,
    type: PropTypes.string.isRequired
};

export default GroupDataEditor;
