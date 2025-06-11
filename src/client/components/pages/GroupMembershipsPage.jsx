import { Component } from 'react';
import { connect } from 'react-redux';

import { dbManager } from '../../store';
import DisplayGroupList from '../DisplayGroupList';

class GroupMembershipsImpl extends Component {
  componentDidMount() {
    // Because if the user changed groups, then memberships need to be updated
    // Easier to do here than each time groups are updated
    dbManager.syncMemberships();
  }

  render() {
    return (
      <div>
        <DisplayGroupList groups={this.props.groups} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    groups: state.db.memberships,
  };
};

const GroupMembershipsPage = connect(mapStateToProps)(GroupMembershipsImpl);

export default GroupMembershipsPage;
