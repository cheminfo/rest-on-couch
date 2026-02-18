const badgeTypes = {
  create: 'success',
  read: 'info',
  write: 'warning',
  delete: 'danger',
};

const DisplayRight = (props) => {
  const badgeType = badgeTypes[props.right] || 'secondary';
  return (
    <span style={props.style} className={`badge bg-${badgeType}`}>
      {` ${props.right} `}
    </span>
  );
};

export default DisplayRight;
