import React from 'react';

import Allowed from '../Allowed';
import Groups from '../Groups';

export default function GroupsPage(props) {
  if (!props.hasDb) return <div>Please select a database</div>;
  return (
    <Allowed
      allowed={props.userRights.includes('createGroup') || props.isGroupOwner}
    >
      <Groups />
    </Allowed>
  );
}
