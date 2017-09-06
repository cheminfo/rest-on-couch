import React, {PropTypes} from 'react';

class EditableTextField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editedValue: props.value || '',
            isEdited: false,
            focus: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleChange(event) {
        this.setState({
            editedValue: event.target.value,
            focus: false
        });
    }

    handleSubmit() {
        if (this.isEmpty()) return;
        this.props.onSubmit(this.state.editedValue);
        this.setState({
            isEdited: false,
            focus: false
        })
    }

    handleKeyDown(event) {
        // For some reason escape key is not handled by key press
        if(event.key === 'Escape') {
            this.cancelEdit();
        }
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSubmit();
        }
    }

    cancelEdit() {
        this.setState({
            isEdited: false,
            editedValue: this.props.value,
            focus: false
        });
    }

    makeEditable() {
        // this.refs.textInput.focus();
        this.setState({
            isEdited: true,
            focus: true
        });
    }

    isEmpty() {
        return this.state.editedValue === '';
    }

    componentDidUpdate() {
        if(this.state.focus) {
            this.refs.textInput.focus();
            this.refs.textInput.select();
        }
    }

    render() {
        const {label, value} = this.props;
        return (
            <form>
                <label>{label}</label>
                {this.state.isEdited ?
                    <input
                        ref="textInput"
                        type="text"
                        className="form-control"
                        value={this.state.editedValue}
                        onChange={this.handleChange}
                        onKeyPress={this.handleKeyPress}
                        onKeyDown={this.handleKeyDown.bind(this)}
                        onBlur={this.cancelEdit.bind(this)}
                    />
                    : (
                        <div>
                            {value ? value : <span style={{color: 'grey', fontStyle: 'italic'}}>(no value)</span>} &nbsp; &nbsp;
                            <a onClick={() => this.makeEditable()} style={{cursor: 'pointer'}} className="">
                                <i className="fa fa-edit"/>
                            </a>
                        </div>
                    )
                }

            </form>
        );
    }
}

EditableTextField.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    value: PropTypes.string
};

export default EditableTextField;
