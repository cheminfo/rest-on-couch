import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  lightTable?: boolean;
}

export default function ResponsiveTable(props: ResponsiveTableProps) {
  const { children, lightTable } = props;
  return (
    <div className="table-responsive">
      <table
        className={clsx(
          'table table-borderless border',
          lightTable && 'table-light',
        )}
      >
        {children}
      </table>
    </div>
  );
}
