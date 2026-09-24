import { useEffect } from 'react';
import { connect } from 'react-redux';

import { databaseManager } from '../../store';
import DisplayGroupList from '../DisplayGroupList';

function GroupMembershipsImplementation(props) {
  useEffect(() => {
    databaseManager.syncMemberships();
  }, []);

  return (
    <div>
      <DisplayGroupList groups={props.groups} />
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    groups: state.db.memberships,
  };
};

const GroupMembershipsPage = connect(mapStateToProps)(
  GroupMembershipsImplementation,
);

export default GroupMembershipsPage;
