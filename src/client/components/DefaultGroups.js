import React, {Component} from 'react'

import {connect} from 'react-redux';
import DefaultGroupsEditor from './DefaultGroupsEditor';

import {fetchDefaultGroups, addDefaultGroup, removeDefaultGroup} from '../actions/db';

class DefaultGroups extends Component {
    render() {
        if(!this.props.defaultGroups) return null;
        return (
            <div>
                <h3>Default groups</h3>
                <DefaultGroupsEditor defaultGroups={this.props.defaultGroups} addGroup={this.props.addDefaultGroup} removeGroup={this.props.removeDefaultGroup}/>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        defaultGroups: state.db.defaultGroups
    }
};

export default connect(mapStateToProps, {addDefaultGroup, removeDefaultGroup})(DefaultGroups);