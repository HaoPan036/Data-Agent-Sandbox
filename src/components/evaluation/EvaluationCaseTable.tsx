import type { EvaluationCaseResult } from "../../evaluation/evaluationTypes";

interface EvaluationCaseTableProps {
  caseResults: EvaluationCaseResult[];
  onSelectCase: (caseResult: EvaluationCaseResult) => void;
}

function statusLabel(status: EvaluationCaseResult["status"]) {
  return status.replaceAll("_", " ");
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
                <td>{statusLabel(caseResult.status)}</td>
                <td>{caseResult.failureMode}</td>
                <td>{caseResult.failureReasons.join(" ") || "None"}</td>
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
