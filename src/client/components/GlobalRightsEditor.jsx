import PropTypes from 'prop-types';

import { globalRightTypes } from '../constants';

import GroupDataEditor from './group_data_editor.tsx';
import { Fragment } from 'react';

const GlobalRightsEditor = ({ globalRights, addRight, removeRight }) => (
  <div>
    <div className="content">
      <div className="container-fluid row">
        {globalRightTypes.map((right, idx) => {
          return (
            <Fragment key={right}>
              <div className="col-md-6">
                <GroupDataEditor
                  type={right}
                  data={globalRights[right] || []}
                  addValue={(value) => addRight(right, value)}
                  removeValue={(value) => removeRight(right, value)}
                  lightTable
                />
              </div>
              {idx % 2 === 1 ? <div className="clearfix" /> : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  </div>
);

GlobalRightsEditor.propTypes = {
  globalRights: PropTypes.object.isRequired,
  addRight: PropTypes.func.isRequired,
  removeRight: PropTypes.func.isRequired,
};

export default GlobalRightsEditor;
