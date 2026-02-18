import { useCallback, useId, useState } from 'react';

export default function EnterTextField(props) {
  const [value, setValue] = useState('');
  const listId = useId();
  const { onSubmit } = props;

  const handleSubmit = useCallback(
    (fieldValue) => {
      if (!fieldValue) return;
      onSubmit(fieldValue).then(() => {
        setValue('');
      });
    },
    [onSubmit],
  );
  return (
    <div>
      {props.label ? <label>{props.label}</label> : null}
      <input
        type="text"
        list={listId}
        placeholder="Type and press enter to add..."
        className="form-control"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleSubmit(value);
          }
        }}
      />
      <input
        type="button"
        className="d-none"
        onClick={() => handleSubmit(value)}
      />
      {props.datalist && (
        <datalist id={listId}>
          {props.datalist.map((element) => (
            <option key={element} value={element} />
          ))}
        </datalist>
      )}
    </div>
  );
}
