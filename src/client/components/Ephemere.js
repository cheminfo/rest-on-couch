import React, { Component } from 'react';

class Ephemere extends Component {
  componentWillMount() {
    this.setTimer();
  }

  componentDidMount() {
    this.makeVisible();
  }

  componentWillUpdate() {
    this.clearTimer();
    this.setTimer();
  }

  componentDidUpdate() {
    this.makeVisible();
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

  render() {
    return <div ref="ephemere">{this.props.children}</div>;
  }
}

export default Ephemere;
