import type { ReactNode } from 'react';

export function TableContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="min-w-full inline-block align-middle px-4 sm:px-0">{children}</div>
    </div>
  );
}
