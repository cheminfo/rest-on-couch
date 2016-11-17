import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import GroupEditor from './GroupEditor';

const Groups = (props) => {
    const groups = props.userGroups.map((group, i) => (
        <div className="card" key={i}>
            <GroupEditor
                group={group}
                addValueToGroup={props.addValueToGroup}
                removeValueFromGroup={props.removeValueFromGroup}
            />
        </div>
    ));
    return (
        <div>
            {groups}
        </div>
    );
};

Groups.propTypes = {
    userGroups: PropTypes.array.isRequired,
    addValueToGroup: PropTypes.func.isRequired,
    removeValueFromGroup: PropTypes.func.isRequired
};

export default connect(
    (state) => ({
        userGroups: state.db.userGroups
    }),
    // (dispatch) => ({
    //     addValueToGroup: (group, type, value) => (console.log('TODO: add value to group:', group.name, type, value)),
    //     removeValueFromGroup: (group, type, value) => (console.log('TODO: remove value from group:', group.name, type, value))
    // })
)(Groups);
