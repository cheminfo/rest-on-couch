import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

interface CheckboxFieldProps {
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => Promise<unknown>;
}

export default function CheckboxField(props: CheckboxFieldProps) {
  const { label, description, isChecked, onChange } = props;
  const id = useId();
  const [isLoading, setIsLoading] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setIsLoading(true);
    try {
      await onChange(event.target.checked);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div>
        <input
          id={id}
          type="checkbox"
          className="form-check-input me-2"
          checked={isChecked}
          disabled={isLoading}
          onChange={(event) => void handleChange(event)}
        />
        {description}
      </div>
    </>
  );
}
