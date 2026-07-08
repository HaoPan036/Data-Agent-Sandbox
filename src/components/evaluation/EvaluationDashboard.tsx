import { useMemo, useState } from "react";
import { runEvaluation } from "../../evaluation/evaluator";
import type { EvaluationCaseResult, EvaluationResult } from "../../evaluation/evaluationTypes";
import { evaluationTestsets } from "../../evaluation/testset";
import { Button } from "../ui/Button";
import { BadCaseReviewQueue } from "./BadCaseReviewQueue";
import { EvaluationCaseDrawer } from "./EvaluationCaseDrawer";
import { EvaluationCaseTable } from "./EvaluationCaseTable";
import { EvaluationSummaryCards } from "./EvaluationSummaryCards";
import { FailureModeChart } from "./FailureModeChart";
import { LlmJudgePlaceholder } from "./LlmJudgePlaceholder";
import { TestsetSelector } from "./TestsetSelector";

export function EvaluationDashboard() {
  const [selectedTestsetId, setSelectedTestsetId] = useState(evaluationTestsets[0].id);
  const [result, setResult] = useState<EvaluationResult>();
  const [selectedCase, setSelectedCase] = useState<EvaluationCaseResult>();
  const [reviewQueue, setReviewQueue] = useState<EvaluationCaseResult[]>([]);
  const selectedTestset = useMemo(
    () => evaluationTestsets.find((testset) => testset.id === selectedTestsetId) ?? evaluationTestsets[0],
    [selectedTestsetId]
  );

  function handleRunEvaluation() {
    const nextResult = runEvaluation(selectedTestsetId);
    setResult(nextResult);
    setSelectedCase(
      nextResult.caseResults.find((caseResult) => caseResult.status === "failed") ??
        nextResult.caseResults.find((caseResult) => caseResult.status === "needs_review") ??
        nextResult.caseResults[0]
    );
  }

  function handleAddToQueue(caseResult: EvaluationCaseResult) {
    if (caseResult.status === "passed" || caseResult.status === "blocked_expected") {
      return;
    }

    setReviewQueue((items) => {
      if (items.some((item) => item.caseId === caseResult.caseId)) {
        return items;
      }

      return [...items, { ...caseResult, reviewStatus: "unreviewed" }];
    });
  }

  function handleMarkReviewed(caseId: string) {
    setReviewQueue((items) =>
      items.map((item) => (item.caseId === caseId ? { ...item, reviewStatus: "reviewed" } : item))
    );
  }

  function handleRemove(caseId: string) {
    setReviewQueue((items) => items.filter((item) => item.caseId !== caseId));
  }

  return (
    <div className="evaluation-dashboard">
      <section className="evaluation-hero">
        <div>
          <p className="eyebrow">Deterministic regression checks</p>
          <h2>Evaluation Dashboard</h2>
          <p>
            Run versioned testsets against the deterministic agent and inspect failures through traces.
          </p>
        </div>
        <div className="evaluation-controls">
          <TestsetSelector
            onChange={(testsetId) => {
              setSelectedTestsetId(testsetId);
              setResult(undefined);
              setSelectedCase(undefined);
            }}
            selectedTestsetId={selectedTestsetId}
            testsets={evaluationTestsets}
          />
          <Button onClick={handleRunEvaluation} variant="primary">
            Run Evaluation
          </Button>
        </div>
      </section>

      <section className="evaluation-panel">
        <h2>{selectedTestset.name}</h2>
        <p>{selectedTestset.description}</p>
        <dl className="evaluation-testset-meta">
          <div>
            <dt>Version</dt>
            <dd>{selectedTestset.version}</dd>
          </div>
          <div>
            <dt>Cases</dt>
            <dd>{selectedTestset.cases.length}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{selectedTestset.createdAt}</dd>
          </div>
        </dl>
      </section>

      {result ? (
        <>
          <EvaluationSummaryCards summary={result.summary} />
          <div className="evaluation-grid">
            <FailureModeChart counts={result.summary.failureModeCounts} />
            <LlmJudgePlaceholder />
          </div>
          <EvaluationCaseTable caseResults={result.caseResults} onSelectCase={setSelectedCase} />
          <div className="evaluation-grid evaluation-grid--details">
            <EvaluationCaseDrawer caseResult={selectedCase} onAddToQueue={handleAddToQueue} />
            <BadCaseReviewQueue
              items={reviewQueue}
              onMarkReviewed={handleMarkReviewed}
              onRemove={handleRemove}
            />
          </div>
        </>
      ) : (
        <>
          <section className="evaluation-panel evaluation-not-run">
            <h2>Not run yet</h2>
            <p>Select a testset version and run evaluation to produce pass or fail results.</p>
          </section>
          <LlmJudgePlaceholder />
        </>
      )}
    </div>
  );
}
