import { useMemo, useState } from "react";
import { runEvaluation } from "../../evaluation/evaluator";
import type { EvaluationCaseResult } from "../../evaluation/evaluationTypes";
import { evaluationTestsets } from "../../evaluation/testset";
import { FailureModeChart } from "../evaluation/FailureModeChart";
import { LlmJudgePlaceholder } from "../evaluation/LlmJudgePlaceholder";
import { TestsetSelector } from "../evaluation/TestsetSelector";
import { ShowcaseHeader } from "./ShowcaseHeader";
import { ShowcaseMetricCard } from "./ShowcaseMetricCard";
import { ShowcaseTraceRail } from "./ShowcaseTraceRail";

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, style: "percent" }).format(value);
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

export function EvaluationShowcase() {
  const [selectedTestsetId, setSelectedTestsetId] = useState("core-regression");
  const [selectedCaseId, setSelectedCaseId] = useState<string>();
  const result = useMemo(() => runEvaluation(selectedTestsetId), [selectedTestsetId]);
  const selectedCase =
    result.caseResults.find((caseResult) => caseResult.caseId === selectedCaseId) ??
    result.caseResults.find((caseResult) => caseResult.status === "failed") ??
    result.caseResults.find((caseResult) => caseResult.status === "needs_review") ??
    result.caseResults[0];
  const queuedCase =
    result.caseResults.find((caseResult) => caseResult.status === "failed") ??
    result.caseResults.find((caseResult) => caseResult.status === "needs_review");

  return (
    <>
      <ShowcaseHeader
        label="REGRESSION EVALUATION"
        subtitle="Run versioned testsets through the real deterministic agent."
        title="Evaluation Dashboard"
      />
      <section className="showcase-frame showcase-evaluation-grid" aria-label="Evaluation Showcase">
        <div className="showcase-evaluation-main">
          <section className="showcase-card showcase-evaluation-toolbar">
            <TestsetSelector
              onChange={(testsetId) => {
                setSelectedTestsetId(testsetId);
                setSelectedCaseId(undefined);
              }}
              selectedTestsetId={selectedTestsetId}
              testsets={evaluationTestsets}
            />
            <div>
              <span className="showcase-muted">Run id</span>
              <strong>{result.runId}</strong>
            </div>
          </section>

          <div className="showcase-metric-grid showcase-metric-grid--five">
            <ShowcaseMetricCard label="Total cases" value={result.summary.totalCases} />
            <ShowcaseMetricCard label="Pass rate" tone="green" value={formatPercent(result.summary.passRate)} />
            <ShowcaseMetricCard label="Passed" tone="green" value={result.summary.passedCases} />
            <ShowcaseMetricCard label="Failed" tone="red" value={result.summary.failedCases} />
            <ShowcaseMetricCard label="Needs review" tone="amber" value={result.summary.needsReviewCases} />
          </div>

          <div className="showcase-evaluation-middle">
            <FailureModeChart counts={result.summary.failureModeCounts} />
            <section className="showcase-card">
              <h2>Testset Metadata</h2>
              <dl className="showcase-metadata-list">
                <div>
                  <dt>Version</dt>
                  <dd>{result.testsetVersion}</dd>
                </div>
                <div>
                  <dt>Execution</dt>
                  <dd>Real AgentRun per case</dd>
                </div>
                <div>
                  <dt>Scoring</dt>
                  <dd>Deterministic rules</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="showcase-card showcase-case-table-card">
            <div className="showcase-card__heading">
              <h2>Case Results</h2>
              <span>First 8 rows</span>
            </div>
            <div className="showcase-mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Intent</th>
                    <th>Status</th>
                    <th>Failure mode</th>
                    <th>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {result.caseResults.slice(0, 8).map((caseResult) => (
                    <tr key={caseResult.caseId}>
                      <td>{caseResult.caseId}</td>
                      <td>{caseResult.actual.intent}</td>
                      <td>
                        <span className={`showcase-chip showcase-chip--${statusTone(caseResult.status)}`}>
                          {caseResult.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{caseResult.failureMode.replaceAll("_", " ")}</td>
                      <td>
                        <button className="showcase-link-button" onClick={() => setSelectedCaseId(caseResult.caseId)} type="button">
                          View trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="showcase-evaluation-side">
          <section className="showcase-card showcase-case-preview">
            <span>Trace Drawer Preview</span>
            <h2>{selectedCase.caseId}</h2>
            <p>{selectedCase.userQuestion}</p>
            <div className="showcase-chip-row">
              <span className={`showcase-chip showcase-chip--${statusTone(selectedCase.status)}`}>
                {selectedCase.status.replaceAll("_", " ")}
              </span>
              <span className="showcase-chip showcase-chip--violet">{selectedCase.failureMode}</span>
            </div>
          </section>
          <ShowcaseTraceRail steps={selectedCase.agentRun?.traceSteps.slice(0, 6) ?? []} title="Case Trace" />
          <section className="showcase-card showcase-badcase-preview">
            <span>Bad Case Review Queue</span>
            {queuedCase ? (
              <>
                <h2>{queuedCase.caseId}</h2>
                <p>{queuedCase.userQuestion}</p>
                <span className="showcase-chip showcase-chip--amber">unreviewed</span>
              </>
            ) : (
              <p className="showcase-muted">No bad cases in this run.</p>
            )}
          </section>
          <div className="showcase-muted-placeholder">
            <LlmJudgePlaceholder />
          </div>
        </aside>
      </section>
    </>
  );
}
