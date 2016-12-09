import React, {PropTypes} from 'react';

import GroupDataEditor from './GroupDataEditor';

const GroupEditor = ({group, addValueToGroup, removeValueFromGroup, removeGroup}) => (
    <div>
        <div className="header">
            <h4 className="title">
                {group.name}
                <button type="button" className="btn btn-danger btn-simple btn-s pull-right" onClick={() => removeGroup(group.name)}>
                    REMOVE
                </button>
            </h4>
        </div>
        <div className="content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-4">
                        <GroupDataEditor
                            type="owners"
                            owners={true}
                            data={group.$owners}
                            addValue={(value) => addValueToGroup(group.name, 'owners', value)}
                            removeValue={(value) => removeValueFromGroup(group.name, 'owners', value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <GroupDataEditor
                            type="users"
                            data={group.users}
                            addValue={(value) => addValueToGroup(group.name, 'users', value)}
                            removeValue={(value) => removeValueFromGroup(group.name, 'users', value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <GroupDataEditor
                            type="rights"
                            data={group.rights}
                            addValue={(value) => addValueToGroup(group.name, 'rights', value)}
                            removeValue={(value) => removeValueFromGroup(group.name, 'rights', value)}
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
    removeGroup: PropTypes.func.isRequired,
    removeValueFromGroup: PropTypes.func.isRequired
};

export default GroupEditor;
