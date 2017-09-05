import React, {PropTypes} from 'react';

class EditableTextField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editedValue: props.value || '',
            isEdited: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleChange(event) {
        this.setState({
            editedValue: event.target.value
        });
    }

    handleSubmit() {
        if (this.isEmpty()) return;
        this.props.onSubmit(this.state.editedValue);
        this.setState({
            isEdited: false
        })
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSubmit();
        }
    }

    makeEditable() {
        this.setState({
            isEdited: true
        });
    }

    isEmpty() {
        return this.state.editedValue === '';
    }

    render() {
        const {label, value} = this.props;
        return (
            <form>
                <label>{label}</label>
                {this.state.isEdited ?
                    <input
                        type="text"
                        className="form-control"
                        value={this.state.editedValue}
                        onChange={this.handleChange}
                        onKeyPress={this.handleKeyPress}
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
