import React from 'react';
import {connect} from 'react-redux';

import DisplayGroupList from './DisplayGroupList';

const GroupMemberships = props => {
    return (
        <div>
            <DisplayGroupList groups={props.groups} />
        </div>
    );
};

const mapStateToProps = state => {
    return {
        groups: state.db.memberships
    };
};

export default connect(mapStateToProps)(GroupMemberships);
