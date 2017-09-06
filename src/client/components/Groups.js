import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {
    addValueToGroup,
    removeValueFromGroup,
    createGroup,
    removeGroup,
    setLdapGroupProperties,
    syncLdapGroup
} from '../actions/db';

import GroupCreator from './GroupCreator';
import GroupEditor from './GroupEditor';

const Groups = (props) => {
    const groups = props.userGroups.map((group) => (
        <div className="card" key={group.name}>
            <GroupEditor
                group={group}
                addValueToGroup={props.addValueToGroup}
                removeValueFromGroup={props.removeValueFromGroup}
                removeGroup={props.removeGroup}
                setLdapGroupProperties={props.setLdapGroupProperties}
                syncLdapGroup={props.syncLdapGroup}
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
    {
        addValueToGroup,
        removeValueFromGroup,
        createGroup,
        removeGroup,
        setLdapGroupProperties,
        syncLdapGroup
    }
)(Groups);
