import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class GroupCreator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
    };
  }

  render() {
    const { createGroup, error } = this.props;
    return (
      <div className="card">
        <div className="header">
          <h4 className="title">Create new group</h4>
        </div>
        <div className="content">
          <form>
            <input
              type="text"
              className="form-control"
              onChange={(event) => {
                this.setState({
                  value: event.target.value,
                });
              }}
            />
            <br />
            <input
              type="button"
              className="btn btn-info btn-fill"
              onClick={() => {
                createGroup(this.state.value);
              }}
              value="Create normal group"
            />
            &nbsp;
            <input
              type="button"
              className="btn btn-secondary btn-fill"
              onClick={() => createGroup(this.state.value, 'ldap')}
              value="Create LDAP group"
            />
          </form>
          {error ? (
            <div style={{ marginTop: 20 }} className="alert alert-danger">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

GroupCreator.propTypes = {
  createGroup: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    error: state.db.errors.createGroup,
  };
};

export default connect(mapStateToProps)(GroupCreator);
