import React, {PropTypes} from 'react';

import GroupDataEditor from './GroupDataEditor';

const DefaultGroupsEditor = ({defaultGroups, addGroup, removeGroup}) => (
    <div>
        <div className="content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <GroupDataEditor
                            type="anonymous"
                            owners={true}
                            data={defaultGroups.anonymous}
                            addValue={(value) => addGroup('anonymous', value)}
                            removeValue={(value) => removeGroup('anonymous', value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <GroupDataEditor
                            type="anyuser"
                            data={defaultGroups.anyuser}
                            addValue={(value) => addGroup('anyuser', value)}
                            removeValue={(value) => removeGroup('anyuser', value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

DefaultGroupsEditor.propTypes = {
    defaultGroups: PropTypes.object.isRequired,
    addGroup: PropTypes.func.isRequired,
    removeGroup: PropTypes.func.isRequired
};

export default DefaultGroupsEditor;
