import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { clearGroupError, clearGroupSuccess } from '../actions/db';

import EditableTextField from './EditableTextField';
import GroupDataEditor from './GroupDataEditor';

class GroupEditor extends PureComponent {
  render() {
    const {
      group,
      addValueToGroup,
      removeValueFromGroup,
      removeGroup,
      setGroupProperties,
      setLdapGroupProperties,
      syncLdapGroup,
      clearGroupSuccess,
      clearGroupError,
    } = this.props;
    return (
      <div>
        <div className="header">
          <h4 className="title">
            {`${group.name} `}
            {group.groupType === 'ldap' ? (
              <button
                type="button"
                className="btn btn-simple"
                onClick={() => syncLdapGroup(group.name)}
              >
                <i
                  className="fa fa-refresh fa-lg"
                  title="Sync LDAP group now"
                />
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-danger btn-simple btn-s pull-right"
              onClick={() => removeGroup(group.name)}
            >
              REMOVE
            </button>
          </h4>
        </div>
        <div className="content">
          <EditableTextField
            label="Description"
            value={group.description}
            onSubmit={(value) =>
              setGroupProperties(group.name, {
                description: value,
              })
            }
          />
          {group.groupType === 'ldap' ? (
            <div>
              <EditableTextField
                label="DN"
                value={group.DN}
                onSubmit={(value) =>
                  setLdapGroupProperties(group.name, {
                    DN: value,
                  })
                }
              />
              <EditableTextField
                label="Filter"
                value={group.filter}
                onSubmit={(value) =>
                  setLdapGroupProperties(group.name, {
                    filter: value,
                  })
                }
              />
            </div>
          ) : null}
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-4">
                <GroupDataEditor
                  type="owners"
                  editable="all-except-first"
                  owners
                  data={group.$owners}
                  addValue={(value) =>
                    addValueToGroup(group.name, 'owners', value, {
                      success: 'Successfully added owner to group',
                    })
                  }
                  removeValue={(value) =>
                    removeValueFromGroup(group.name, 'owners', value, {
                      success: 'Successfully removed owner from group',
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <GroupDataEditor
                  type="users"
                  editable={group.groupType === 'ldap' ? 'none' : 'all'}
                  canAdd={group.groupType !== 'ldap'}
                  data={group.users}
                  addValue={(value) =>
                    addValueToGroup(group.name, 'users', value, {
                      success: 'Successfully added user to group',
                    })
                  }
                  removeValue={(value) =>
                    removeValueFromGroup(group.name, 'users', value, {
                      success: 'Successfully removed user from group',
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <GroupDataEditor
                  type="rights"
                  data={group.rights}
                  addValue={(value) =>
                    addValueToGroup(group.name, 'rights', value, {
                      success: 'Successfully added right to group',
                    })
                  }
                  removeValue={(value) =>
                    removeValueFromGroup(group.name, 'rights', value, {
                      success: 'Successfully removed right from group',
                    })
                  }
                />
              </div>
            </div>
            {group.success ? (
              <div
                className="alert alert-success"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div>{group.success}</div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => clearGroupSuccess(group.name)}
                >
                  close
                </div>
              </div>
            ) : null}
            {group.error ? (
              <div
                className="alert alert-danger"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div>{group.error}</div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => clearGroupError(group.name)}
                >
                  close
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

GroupEditor.propTypes = {
  group: PropTypes.object.isRequired,
  addValueToGroup: PropTypes.func.isRequired,
  removeGroup: PropTypes.func.isRequired,
  removeValueFromGroup: PropTypes.func.isRequired,
};

export default connect(null, { clearGroupError, clearGroupSuccess })(
  GroupEditor,
);
