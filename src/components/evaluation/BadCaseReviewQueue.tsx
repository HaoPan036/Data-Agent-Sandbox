import type { EvaluationCaseResult } from "../../evaluation/evaluationTypes";

interface BadCaseReviewQueueProps {
  items: EvaluationCaseResult[];
  onMarkReviewed: (caseId: string) => void;
  onRemove: (caseId: string) => void;
}

function suggestedFix(caseResult: EvaluationCaseResult) {
  if (caseResult.failureMode === "sensitive_request_not_blocked") {
    return "Strengthen sensitive request routing and guardrail terms.";
  }

  if (caseResult.failureMode === "metric_mismatch") {
    return "Add metric ambiguity handling or a clearer metric template.";
  }

  if (caseResult.failureMode === "ungrounded_answer") {
    return "Align answer text with computed result and empty-result expectations.";
  }

  return "Review intent, SQL, validation, trace, and expected criteria.";
}

export function BadCaseReviewQueue({ items, onMarkReviewed, onRemove }: BadCaseReviewQueueProps) {
  return (
    <section className="evaluation-panel bad-case-queue">
      <h2>Bad Case Review Queue</h2>
      {items.length === 0 ? (
        <p className="muted">No bad cases added yet.</p>
      ) : (
        <div className="bad-case-list">
          {items.map((item) => (
            <article key={item.caseId}>
              <div>
                <strong>{item.caseId}</strong>
                <span>{item.reviewStatus}</span>
              </div>
              <p>{item.userQuestion}</p>
              <dl>
                <div>
                  <dt>Failure mode</dt>
                  <dd>{item.failureMode}</dd>
                </div>
                <div>
                  <dt>Suggested fix</dt>
                  <dd>{suggestedFix(item)}</dd>
                </div>
              </dl>
              <div className="bad-case-actions">
                <button className="button button--secondary" onClick={() => onMarkReviewed(item.caseId)} type="button">
                  Mark reviewed
                </button>
                <button className="button button--ghost" onClick={() => onRemove(item.caseId)} type="button">
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
