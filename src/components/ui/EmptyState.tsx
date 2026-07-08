import type { ReactNode } from "react";

interface EmptyStateProps {
  children?: ReactNode;
  title: string;
}

export function EmptyState({ children, title }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

