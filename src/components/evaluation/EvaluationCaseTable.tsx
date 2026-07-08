import type { EvaluationCaseResult } from "../../evaluation/evaluationTypes";

interface EvaluationCaseTableProps {
  caseResults: EvaluationCaseResult[];
  onSelectCase: (caseResult: EvaluationCaseResult) => void;
}

function statusLabel(status: EvaluationCaseResult["status"]) {
  return status.replaceAll("_", " ");
}

function statusTone(status: EvaluationCaseResult["status"]) {
  if (status === "passed" || status === "blocked_expected") {
    return "green";
  }

  if (status === "needs_review") {
    return "amber";
  }

  return "red";
}

function compactReasons(reasons: string[]) {
  if (reasons.length === 0) {
    return "None";
  }

  const text = reasons.join(" ");

  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

export function EvaluationCaseTable({ caseResults, onSelectCase }: EvaluationCaseTableProps) {
  return (
    <section className="evaluation-panel">
      <h2>Case Results</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Case id</th>
              <th>Question</th>
              <th>Expected intent</th>
              <th>Actual intent</th>
              <th>Status</th>
              <th>Failure mode</th>
              <th>Failure reasons</th>
              <th>View trace</th>
            </tr>
          </thead>
          <tbody>
            {caseResults.map((caseResult) => (
              <tr key={caseResult.caseId}>
                <td>{caseResult.caseId}</td>
                <td>{caseResult.userQuestion}</td>
                <td>{caseResult.expected.intent}</td>
                <td>{caseResult.actual.intent}</td>
                <td>
                  <span className={`case-status-chip case-status-chip--${statusTone(caseResult.status)}`}>
                    {statusLabel(caseResult.status)}
                  </span>
                </td>
                <td>{caseResult.failureMode}</td>
                <td className="case-reason-cell">{compactReasons(caseResult.failureReasons)}</td>
                <td>
                  <button className="button button--secondary" onClick={() => onSelectCase(caseResult)} type="button">
                    View trace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
