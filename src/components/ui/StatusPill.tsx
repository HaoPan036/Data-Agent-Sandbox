interface StatusPillProps {
  children: string;
  tone?: "ready" | "planned" | "draft" | "reviewed" | "evaluated" | "neutral";
}

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}

