import DisplayRightList from './DisplayRightList';

const DisplayGroup = (props) => {
  return (
    <div>
      <h4>{props.group.name}</h4>
      <DisplayRightList rights={props.group.rights} />
    </div>
  );
};

export default DisplayGroup;
