import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { clearGroupError, clearGroupSuccess } from '../actions/db';

import EditableTextField from './EditableTextField';
import GroupDataEditor from './GroupDataEditor';
import { useState } from 'react';
import { Modal } from './Modal';

function GroupEditorImpl({
  group,
  addValueToGroup,
  removeValueFromGroup,
  removeGroup,
  setGroupProperties,
  clearGroupSuccess,
  clearGroupError,
}) {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const customUsers = group.customUsers || [];
  const users = group.users || [];
  const sortedUsers = Array.from(new Set([...customUsers, ...users]));

  return (
    <div>
      <div className="header">
        <h4 className="title">
          {`${group.name} `}
          <button
            type="button"
            className="btn btn-danger btn-simple btn-s pull-right"
            onClick={() => setIsRemoveModalOpen(true)}
          >
            REMOVE
          </button>
        </h4>
      </div>
      <Modal
        open={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        title={`Remove group "${group.name}"?`}
        body={`Are you sure you want to remove this group? This action affects users' permissions and cannot be undone.`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-fill"
              onClick={() => setIsRemoveModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-fill"
              onClick={() => {
                removeGroup(group.name);
                setIsRemoveModalOpen(false);
              }}
            >
              Remove group
            </button>
          </>
        }
      />
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
        <div>
          <EditableTextField
            label="DN"
            value={group.DN}
            onSubmit={(value) =>
              setGroupProperties(group.name, {
                DN: value,
              })
            }
          />
          <EditableTextField
            label="Filter"
            value={group.filter}
            onSubmit={(value) =>
              setGroupProperties(group.name, {
                filter: value,
              })
            }
          />
        </div>
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
                editable={customUsers.length}
                limit={5}
                canAdd
                data={sortedUsers}
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

GroupEditorImpl.propTypes = {
  group: PropTypes.object.isRequired,
  addValueToGroup: PropTypes.func.isRequired,
  removeGroup: PropTypes.func.isRequired,
  removeValueFromGroup: PropTypes.func.isRequired,
};

const GroupEditor = connect(null, { clearGroupError, clearGroupSuccess })(
  GroupEditorImpl,
);

export default GroupEditor;
