import React, {PropTypes} from 'react';

import GroupDataEditor from './GroupDataEditor';

const GroupEditor = ({group, addValueToGroup, removeValueFromGroup}) => (
    <div>
        <div className="header">
            <h4 className="title">{group.name}</h4>
        </div>
        <div className="content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <GroupDataEditor
                            type="users"
                            data={group.users}
                            addValue={(value) => addValueToGroup(group, 'users', value)}
                            removeValue={(value) => removeValueFromGroup(group, 'users', value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <GroupDataEditor
                            type="rights"
                            data={group.rights}
                            addValue={(value) => addValueToGroup(group, 'rights', value)}
                            removeValue={(value) => removeValueFromGroup(group, 'rights', value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

GroupEditor.propTypes = {
    group: PropTypes.object.isRequired,
    addValueToGroup: PropTypes.func.isRequired,
    removeValueFromGroup: PropTypes.func.isRequired
};

export default GroupEditor;
