import type { ReactNode } from "react";

interface SectionHeaderProps {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}

export function SectionHeader({ action, eyebrow, subtitle, title }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="section-header__eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  );
}

