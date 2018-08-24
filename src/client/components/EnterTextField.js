import React from 'react';
import PropTypes from 'prop-types';

class EnterTextField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value || ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  handleSubmit() {
    if (this.isEmpty()) return;
    this.props.onSubmit(this.state.value);
    this.setState({
      value: ''
    });
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  isEmpty() {
    return this.state.value === '';
  }

  render() {
    const { label } = this.props;
    return (
      <form>
        <label>{label}</label>
        <input
          type="text"
          className="form-control"
          value={this.state.value}
          onChange={this.handleChange}
          onKeyPress={this.handleKeyPress}
        />
      </form>
    );
  }
}

EnterTextField.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

export default EnterTextField;
