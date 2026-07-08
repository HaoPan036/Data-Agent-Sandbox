import type { AgentTraceStep } from "../../agent/types";

interface ShowcaseTraceRailProps {
  steps: AgentTraceStep[];
  title?: string;
}

export function ShowcaseTraceRail({ steps, title = "Trace Rail" }: ShowcaseTraceRailProps) {
  return (
    <section className="showcase-card showcase-trace-card">
      <div className="showcase-card__heading">
        <h2>{title}</h2>
        <span>{steps.length} steps</span>
      </div>
      <ol className="showcase-trace-rail">
        {steps.map((step) => (
          <li className={`showcase-trace-rail__item showcase-trace-rail__item--${step.status}`} key={step.id}>
            <span>{step.id}</span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.status}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
