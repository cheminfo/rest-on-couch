import React, {PropTypes} from 'react';

import EnterTextField from './EnterTextField';

const GroupCreator = ({createGroup}) => (
    <div className="card">
        <div className="header">
            <h4 className="title">Create new group</h4>
        </div>
        <div className="content">
            <EnterTextField onSubmit={createGroup} />
        </div>
    </div>
);

GroupCreator.propTypes = {
    createGroup: PropTypes.func.isRequired
};

export default GroupCreator;
