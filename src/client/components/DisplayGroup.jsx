import DisplayRightList from './DisplayRightList';

export default function DisplayGroup(props) {
  return (
    <div>
      <h4>{props.group.name}</h4>
      <DisplayRightList rights={props.group.rights} />
    </div>
  );
}
