const proofItems = [
  "Semantic grounding",
  "SQL validation ready",
  "Trace based debugging",
  "Evaluation first design"
] as const;

export function ProofStrip() {
  return (
    <section className="proof-strip" id="proof-strip" aria-label="What this proves">
      {proofItems.map((item) => (
        <div key={item}>
          <span aria-hidden="true" />
          <strong>{item}</strong>
        </div>
      ))}
    </section>
  );
}

