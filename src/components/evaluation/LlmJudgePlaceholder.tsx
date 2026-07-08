export function LlmJudgePlaceholder() {
  return (
    <section className="evaluation-panel llm-placeholder">
      <h2>LLM Judge Placeholder</h2>
      <p>
        LLM judge is not enabled in this version. Current evaluation uses deterministic rules only.
        Future work can add LLM assisted qualitative scoring for answer helpfulness and reasoning quality.
      </p>
    </section>
  );
}
