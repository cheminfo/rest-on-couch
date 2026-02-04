import { useCallback, useState } from 'react';
import { connect } from 'react-redux';

function GroupCreatorImpl(props) {
  const [value, setValue] = useState('');
  const { createGroup, error } = props;

  const handleCreateGroup = useCallback(
    (groupName) => {
      if (!groupName) return;
      createGroup(groupName).then(({ action }) => {
        if (!action.payload.error) {
          setValue('');
        }
      });
    },
    [createGroup],
  );
  return (
    <div className="card">
      <div className="header">
        <h4 className="title">Create new group</h4>
      </div>
      <div className="content">
        <input
          type="text"
          value={value}
          className="form-control"
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleCreateGroup(value);
            }
          }}
        />
        <br />
        <input
          type="submit"
          className="btn btn-info btn-fill"
          onClick={() => {
            handleCreateGroup(value);
          }}
          value="Create group"
        />
        {error ? (
          <div style={{ marginTop: 20 }} className="alert alert-danger">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    error: state.db.errors.createGroup,
  };
};

const GroupCreator = connect(mapStateToProps)(GroupCreatorImpl);

export default GroupCreator;
