import React from 'react';

import { connect } from 'react-redux';
import DefaultGroupsEditor from './DefaultGroupsEditor';

import { addDefaultGroup, removeDefaultGroup } from '../actions/db';

function DefaultGroups(props) {
  if (!props.defaultGroups) return null;
  return (
    <div>
      <h3>Default groups</h3>
      <DefaultGroupsEditor
        defaultGroups={props.defaultGroups}
        addGroup={props.addDefaultGroup}
        removeGroup={props.removeDefaultGroup}
      />
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    defaultGroups: state.db.defaultGroups
  };
};

export default connect(mapStateToProps, {
  addDefaultGroup,
  removeDefaultGroup
})(DefaultGroups);
