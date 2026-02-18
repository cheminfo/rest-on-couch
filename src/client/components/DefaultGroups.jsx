import { connect } from 'react-redux';

import { addDefaultGroup, removeDefaultGroup } from '../actions/db';

import DefaultGroupsEditor from './default_groups_editor.tsx';

function DefaultGroupsImpl(props) {
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
    defaultGroups: state.db.defaultGroups,
  };
};

const DefaultGroups = connect(mapStateToProps, {
  addDefaultGroup,
  removeDefaultGroup,
})(DefaultGroupsImpl);

export default DefaultGroups;
