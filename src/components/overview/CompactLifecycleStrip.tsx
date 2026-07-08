const compactSteps = ["Question", "Topic", "Metric", "SQL", "Validate", "Execute", "Trace", "Answer"] as const;

export function CompactLifecycleStrip() {
  return (
    <section className="compact-lifecycle-strip" aria-label="Agent lifecycle">
      {compactSteps.map((step, index) => (
        <span key={step}>
          <small>{String(index + 1).padStart(2, "0")}</small>
          {step}
        </span>
      ))}
    </section>
  );
}
