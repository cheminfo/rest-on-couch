const badgeTypes = {
  create: 'success',
  read: 'info',
  write: 'warning',
  delete: 'danger',
};

export default function DisplayRight(props) {
  const badgeType = badgeTypes[props.right] || 'secondary';
  return (
    <span style={props.style} className={`badge bg-${badgeType}`}>
      {` ${props.right} `}
    </span>
  );
}
