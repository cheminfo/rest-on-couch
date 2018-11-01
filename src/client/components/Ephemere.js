import React, { Component } from 'react';

class Ephemere extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: true
    };
  }

  componentDidMount() {
    this.setTimer();
    this.makeVisible();
  }

  componentDidUpdate() {
    this.clearTimer();
    this.setTimer();
    this.makeVisible();
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  makeVisible() {
    if (this.timeout) {
      this.setState({ visible: true });
    }
  }
  clearTimer() {
    clearTimeout(this.timeout);
    this.timeout = null;
  }
  setTimer() {
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.setState({ visible: false });
      }, this.props.timeout || 3000);
    }
  }

  render() {
    return (
      <div style={{ display: this.state.visible ? 'block' : 'none' }}>
        {this.props.children}
      </div>
    );
  }
}

export default Ephemere;
