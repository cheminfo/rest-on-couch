import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  addValueToGroup,
  createGroup,
  removeGroup,
  removeValueFromGroup,
  setGroupProperties,
} from '../actions/db';

import GroupCreator from './GroupCreator';
import GroupEditor from './GroupEditor';

const GroupsImpl = (props) => {
  const groups = props.userGroups.map((group) => (
    <div className="card" key={group.name}>
      <GroupEditor
        group={group}
        addValueToGroup={props.addValueToGroup}
        removeValueFromGroup={props.removeValueFromGroup}
        removeGroup={props.removeGroup}
        setGroupProperties={props.setGroupProperties}
      />
    </div>
  ));
  return (
    <div>
      {props.hasCreateGroupRight ? (
        <GroupCreator createGroup={props.createGroup} />
      ) : null}
      {groups}
    </div>
  );
};

GroupsImpl.propTypes = {
  userGroups: PropTypes.array.isRequired,
  addValueToGroup: PropTypes.func.isRequired,
  removeValueFromGroup: PropTypes.func.isRequired,
  removeGroup: PropTypes.func.isRequired,
};

const Groups = connect(
  (state) => ({
    userGroups: state.db.userGroups,
    hasCreateGroupRight: state.db.userRights.includes('createGroup'),
  }),
  {
    addValueToGroup,
    removeValueFromGroup,
    createGroup,
    removeGroup,
    setGroupProperties,
  },
)(GroupsImpl);

export default Groups;
