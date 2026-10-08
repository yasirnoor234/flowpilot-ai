import * as React from 'react';

function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200/70 ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
