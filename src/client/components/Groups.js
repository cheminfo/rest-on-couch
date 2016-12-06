import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {
    addValueToGroup,
    removeValueFromGroup,
    createGroup,
    removeGroup
} from '../actions/db';

import GroupCreator from './GroupCreator';
import GroupEditor from './GroupEditor';

const Groups = (props) => {
    const groups = props.userGroups.map((group, i) => (
        <div className="card" key={group.name}>
            <GroupEditor
                group={group}
                addValueToGroup={props.addValueToGroup}
                removeValueFromGroup={props.removeValueFromGroup}
                removeGroup={props.removeGroup}
            />
        </div>
    ));
    return (
        <div>
            {props.hasCreateGroupRight ? <GroupCreator createGroup={props.createGroup} /> : null}
            {groups}
        </div>
    );
};

Groups.propTypes = {
    userGroups: PropTypes.array.isRequired,
    addValueToGroup: PropTypes.func.isRequired,
    removeValueFromGroup: PropTypes.func.isRequired,
    removeGroup: PropTypes.func.isRequired
};

export default connect(
    (state) => ({
        userGroups: state.db.userGroups,
        hasCreateGroupRight: state.db.userRights.includes('createGroup')
    }),
    (dispatch) => ({
        addValueToGroup: (group, type, value) => dispatch(addValueToGroup(group, type, value)),
        removeValueFromGroup: (group, type, value) => dispatch(removeValueFromGroup(group, type, value)),
        createGroup: (group) => dispatch(createGroup(group)),
        removeGroup: (group) => dispatch(removeGroup(group))
    })
)(Groups);
