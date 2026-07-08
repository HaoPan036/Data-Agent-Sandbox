interface ShowcaseCaptureNavProps {
  activeView: "agent" | "guardrail" | "evaluation";
}

const links = [
  ["agent", "Agent Run"],
  ["guardrail", "Guardrail"],
  ["evaluation", "Evaluation"]
] as const;

export function ShowcaseCaptureNav({ activeView }: ShowcaseCaptureNavProps) {
  return (
    <nav className="showcase-capture-nav" aria-label="Showcase views">
      <a href="/">Overview</a>
      {links.map(([view, label]) => (
        <a
          aria-current={activeView === view ? "page" : undefined}
          href={`/showcase?view=${view}`}
          key={view}
        >
          {label}
        </a>
      ))}
      <a href={`/showcase?view=${activeView}&capture=true`}>Capture</a>
    </nav>
  );
}
