import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

function EditableTextField(props) {
  const { label, value, onSubmit } = props;
  const [editedValue, setEditedValue] = useState(value || '');
  const [isEdited, setIsEdited] = useState(false);

  // The input is only mounted while editing, so this runs once per edit session.
  const inputRef = useCallback((node) => {
    if (!node) return;
    node.focus();
    node.select();
  }, []);

  function handleChange(event) {
    setEditedValue(event.target.value);
  }

  function handleSubmit() {
    if (editedValue === '') return;
    onSubmit(editedValue);
    setIsEdited(false);
  }

  function handleKeyDown(event) {
    // For some reason escape key is not handled by key press
    if (event.key === 'Escape') {
      cancelEdit();
    }
  }

  function handleKeyPress(event) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    handleSubmit();
  }

  function cancelEdit() {
    setIsEdited(false);
    setEditedValue(value);
  }

  function makeEditable() {
    setIsEdited(true);
  }

  return (
    <form>
      <label>{label}</label>
      {isEdited ? (
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          value={editedValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyDown}
          onBlur={cancelEdit}
        />
      ) : (
        <div>
          {value || (
            <span style={{ color: 'grey', fontStyle: 'italic' }}>
              (no value)
            </span>
          )}
          &nbsp;&nbsp;
          <a onClick={makeEditable} style={{ cursor: 'pointer' }}>
            <i className="fa fa-edit" />
          </a>
        </div>
      )}
    </form>
  );
}

EditableTextField.propTypes = {
  label: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default EditableTextField;
