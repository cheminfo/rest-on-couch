import GroupDataEditor from './group_data_editor.tsx';

interface DefaultGroupsDocument {
  anonymous: string[];
  anyuser: string[];
}

interface DefaultGroupsEditorProps {
  defaultGroups: DefaultGroupsDocument;
  addGroup: (group: string, value: string) => void;
  removeGroup: (group: string, value: string) => void;
}

export default function DefaultGroupsEditor(props: DefaultGroupsEditorProps) {
  const { defaultGroups, addGroup, removeGroup } = props;
  return (
    <div>
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <GroupDataEditor
                type="anonymous"
                data={defaultGroups.anonymous}
                addValue={(value) => addGroup('anonymous', value)}
                removeValue={(value) => removeGroup('anonymous', value)}
                lightTable
              />
            </div>
            <div className="col-md-6">
              <GroupDataEditor
                type="anyuser"
                data={defaultGroups.anyuser}
                addValue={(value) => addGroup('anyuser', value)}
                removeValue={(value) => removeGroup('anyuser', value)}
                lightTable
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
