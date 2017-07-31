import React, {Component} from 'react';
import {connect} from 'react-redux';

import DisplayGroupList from './DisplayGroupList';
import {dbManager} from '../store';


class GroupMemberships extends Component {
    render() {
            return (
                <div>
                    <DisplayGroupList groups={this.props.groups} />
                </div>
            );
    }

    componentWillMount() {
        // Because if the user changed groups, then memberships need to be updated
        // Easier to do here than each time groups are updated
        dbManager.syncMemberships();
    }
}

const mapStateToProps = state => {
    return {
        groups: state.db.memberships
    };
};

export default connect(mapStateToProps)(GroupMemberships);
