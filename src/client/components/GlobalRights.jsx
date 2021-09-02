import React from 'react';
import { connect } from 'react-redux';

import { addGlobalRight, removeGlobalRight } from '../actions/db';

import GlobalRightsEditor from './GlobalRightsEditor';

function GlobalRights(props) {
  if (!props.globalRights) return null;
  return (
    <div>
      <h3>Global rights</h3>
      <GlobalRightsEditor
        globalRights={props.globalRights}
        addRight={props.addGlobalRight}
        removeRight={props.removeGlobalRight}
      />
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    globalRights: state.db.globalRights,
  };
};

export default connect(mapStateToProps, { addGlobalRight, removeGlobalRight })(
  GlobalRights,
);
