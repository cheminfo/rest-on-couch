import React, {Component} from 'react';

class Ephemere extends Component {
    render() {
        return (
            <div ref="ephemere">
                {this.props.children}
            </div>
        );
    }

    componentWillUpdate() {
        if (this.refs.ephemere) {
            this.refs.ephemere.style.display = 'block';
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    componentDidUpdate() {
        this.timeout = setTimeout(() => {
            this.refs.ephemere.style.display = 'none';
        }, this.props.timeout || 3000);
    }
}

export default Ephemere;
