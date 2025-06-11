const GroupDataElement = ({ value, removeValue, editable }) => (
  <tr>
    <td>{value}</td>
    <td className="td-action">
      {editable ? (
        <button
          type="button"
          className="btn btn-danger btn-simple btn-xs"
          onClick={() => removeValue(value)}
        >
          <i className="fa fa-times" />
        </button>
      ) : null}
    </td>
  </tr>
);

export default GroupDataElement;
