import React, {Component, PropTypes} from 'react';

class GroupCreator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ''
        };
    }

    render() {
        const {createGroup} = this.props;
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
                                    value: event.target.value
                                });
                            }}
                        />
                        <br/>
                        <input
                            type="button"
                            className="btn btn-info btn-fill"
                            onClick={() => {createGroup(this.state.value)}}
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
                    {/*<EnterTextField onSubmit={createGroup} />*/}
                </div>
            </div>
        )
    }

}

GroupCreator.propTypes = {
    createGroup: PropTypes.func.isRequired
};

export default GroupCreator;
