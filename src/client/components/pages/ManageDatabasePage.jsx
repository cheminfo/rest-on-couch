import Allowed from '../Allowed';
import DatabaseAdministration from '../DatabaseAdministration';

export default function ManageDatabasePage(props) {
  return (
    <Allowed allowed={props.userRights.includes('admin')}>
      <DatabaseAdministration isAdmin={props.userRights.includes('admin')} />
    </Allowed>
  );
}
