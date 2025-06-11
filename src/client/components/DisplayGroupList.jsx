import DisplayGroup from './DisplayGroup';

const DisplayGroupList = (props) => {
  if (!props.groups) return null;
  if (props.groups.length === 0) {
    return <h3>No group memberships</h3>;
  }
  return (
    <div>
      <h3>List of group memberships</h3>
      {props.groups.map((group) => {
        return <DisplayGroup key={group.name} group={group} />;
      })}
    </div>
  );
};

export default DisplayGroupList;
