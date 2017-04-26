import React, {Component} from 'react';

import {connect} from 'react-redux';
import GlobalRightsEditor from './GlobalRightsEditor';

import {addGlobalRight, removeGlobalRight} from '../actions/db';

class GlobalRights extends Component {
    render() {
        if (!this.props.globalRights) return null;
        return (
            <div>
                <h3>Global rights</h3>
                <GlobalRightsEditor globalRights={this.props.globalRights} addRight={this.props.addGlobalRight} removeRight={this.props.removeGlobalRight} />
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        globalRights: state.db.globalRights
    };
};

export default connect(mapStateToProps, {addGlobalRight, removeGlobalRight})(GlobalRights);
