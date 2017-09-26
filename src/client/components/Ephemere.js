import React, {Component} from 'react';

class Ephemere extends Component {
    render() {
        return (
            <div ref="ephemere">
                {this.props.children}
            </div>
        );
    }

    componentWillMount() {
        this.setTimer();
    }

    componentDidMount() {
        this.makeVisible();
    }

    componentDidUpdate() {
        this.makeVisible();
    }

    componentWillUpdate() {
        this.clearTimer();
        this.setTimer();
    }

    componentWillUnmount() {
        this.clearTimer();
    }
    makeVisible() {
        if (this.timeout) {
            if (this.refs.ephemere) {
                this.refs.ephemere.style.display = 'block';
            }
        }
    }
    clearTimer() {
        clearTimeout(this.timeout);
        this.timeout = null;
    }
    setTimer() {
        if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.refs.ephemere.style.display = 'none';
            }, this.props.timeout || 3000);
        }
    }
}

export default Ephemere;
