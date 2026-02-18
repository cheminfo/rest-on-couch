import { useState } from 'react';
import { match } from 'ts-pattern';

import EnterTextField from './EnterTextField';
import GroupDataElement from './GroupDataElement';
import ResponsiveTable from './responsive_table.tsx';

type EditableValue = number | 'all-except-first' | 'none' | 'all';

interface GroupDataEditorProps {
  data: string[];
  type: string;
  addValue: (value: string) => void;
  removeValue: (value: string) => void;
  canAdd?: boolean;
  editable?: EditableValue;
  limit?: number;
  lightTable?: boolean;
}

export default function GroupDataEditor(props: GroupDataEditorProps) {
  const {
    canAdd = true,
    editable = 'all',
    type,
    data,
    addValue,
    limit = Infinity,
    removeValue,
    lightTable,
  } = props;

  const [showAll, setShowAll] = useState(false);

  const slicedData = showAll ? data : data.slice(0, limit);
  return (
    <>
      <ResponsiveTable lightTable={lightTable}>
        <thead>
          <tr>
            <th colSpan={2}>
              {type}
              {type !== 'rights' && ' (email address)'}
            </th>
          </tr>
        </thead>
        <tbody>
          {slicedData.map((value, i) => (
            <GroupDataElement
              key={value}
              value={value}
              removeValue={removeValue}
              editable={isEditable(editable, i)}
            />
          ))}
          {canAdd ? (
            <tr>
              <td>
                <EnterTextField
                  datalist={
                    type === 'rights'
                      ? [
                          'read',
                          'write',
                          'create',
                          'delete',
                          'readGroup',
                          'writeGroup',
                          'createGroup',
                          'readImport',
                          'owner',
                          'addAttachment',
                        ]
                      : undefined
                  }
                  onSubmit={addValue}
                />
              </td>
              <td />
            </tr>
          ) : null}
        </tbody>
      </ResponsiveTable>
      {limit < data.length ? (
        <button
          onClick={() => (showAll ? setShowAll(false) : setShowAll(true))}
          type="button"
          className="btn btn-fill"
        >
          {showAll ? 'Show less' : `Show ${data.length - limit} more`}
        </button>
      ) : null}
    </>
  );
}

function isEditable(type: EditableValue, idx: number) {
  if (typeof type === 'number') {
    return idx < type;
  }
  return match(type)
    .with('all-except-first', () => idx !== 0)
    .with('none', () => false)
    .with('all', () => true)
    .exhaustive();
}
