import { useMemo, useState } from "react";
import { DEFAULT_DEMO_QUESTION } from "../agent/intentRouter";
import { runDemoWorkflow } from "../agent/workflows/demoWorkflow";
import { ActionCard } from "../components/ActionCard";
import { ChartPanel } from "../components/ChartPanel";
import { DataTable } from "../components/DataTable";
import { SkillList } from "../components/SkillList";
import { TraceTimeline } from "../components/TraceTimeline";
import { runEvaluationSuite } from "../evaluation/evaluator";
import { formatPercent } from "../utils/format";

type ActiveView = "demo" | "evaluation" | "skills" | "architecture";

export function HomePage() {
  const [activeView, setActiveView] = useState<ActiveView>("demo");
  const [question, setQuestion] = useState(DEFAULT_DEMO_QUESTION);
  const [answer, setAnswer] = useState(() => runDemoWorkflow(DEFAULT_DEMO_QUESTION));
  const [reportDraft, setReportDraft] = useState(answer.reportHtml);
  const evaluation = useMemo(() => runEvaluationSuite(), []);

  function runDemo() {
    const nextAnswer = runDemoWorkflow(question);
    setAnswer(nextAnswer);
    setReportDraft(nextAnswer.reportHtml);
    setActiveView("demo");
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div className="hero-band__content">
          <p className="eyebrow">Public browser-only sandbox</p>
          <h1>BI Data Agent Sandbox</h1>
          <p className="subtitle">
            Natural language to validated SQL, traceable analysis, evaluation, and reports
          </p>
        </div>
      </section>

      <section className="action-grid" aria-label="Sandbox actions">
        <ActionCard
          active={activeView === "demo"}
          description="Run the deterministic question-to-SQL workflow."
          label="Run Demo Question"
          onClick={runDemo}
        />
        <ActionCard
          active={activeView === "evaluation"}
          description="Check whether the supported questions work."
          label="Open Evaluation"
          onClick={() => setActiveView("evaluation")}
        />
        <ActionCard
          active={activeView === "skills"}
          description="Inspect deterministic agent skills."
          label="View Skills"
          onClick={() => setActiveView("skills")}
        />
        <ActionCard
          active={activeView === "architecture"}
          description="Review the browser-only system stages."
          label="View Architecture"
          onClick={() => setActiveView("architecture")}
        />
      </section>

      {activeView === "demo" && (
        <section className="workspace-grid">
          <div className="workspace-grid__main">
            <section className="panel">
              <div className="panel__heading">
                <h2>Question</h2>
                <button className="primary-button" onClick={runDemo} type="button">
                  Run
                </button>
              </div>
              <label className="visually-hidden" htmlFor="business-question">
                Business question
              </label>
              <textarea
                id="business-question"
                onChange={(event) => setQuestion(event.target.value)}
                rows={3}
                value={question}
              />
            </section>

            <section className="panel">
              <div className="panel__heading">
                <h2>{answer.sqlPlan.title}</h2>
                <span className="status status--ready">{answer.intent.label}</span>
              </div>
              <p>{answer.sqlPlan.rationale}</p>
              <pre>{answer.validation.normalizedSql}</pre>
              <ChartPanel data={answer.execution.rows} spec={answer.sqlPlan.chart} />
              <DataTable execution={answer.execution} />
            </section>

            <section className="panel">
              <div className="panel__heading">
                <h2>Editable Report</h2>
                <span className="muted">{reportDraft.length} chars</span>
              </div>
              <textarea
                aria-label="Editable HTML report"
                className="report-editor"
                onChange={(event) => setReportDraft(event.target.value)}
                rows={12}
                value={reportDraft}
              />
              <iframe className="report-preview" srcDoc={reportDraft} title="Report preview" />
            </section>
          </div>

          <aside className="workspace-grid__side">
            <section className="panel">
              <h2>Trace</h2>
              <TraceTimeline trace={answer.trace} />
            </section>

            <section className="panel">
              <h2>Validation</h2>
              <p className="big-number">{answer.validation.isValid ? "Passed" : "Failed"}</p>
              <p className="muted">
                {answer.execution.rowCount} rows in {answer.execution.elapsedMs}ms
              </p>
            </section>
          </aside>
        </section>
      )}

      {activeView === "evaluation" && (
        <section className="panel">
          <div className="panel__heading">
            <h2>Evaluation</h2>
            <span className="big-number">{formatPercent(evaluation.passRate)}</span>
          </div>
          <p>
            {evaluation.passed}/{evaluation.total} deterministic test questions passed.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Question</th>
                  <th>Expected</th>
                  <th>Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.results.map((result) => (
                  <tr key={result.caseId}>
                    <td>{result.caseId}</td>
                    <td>{result.question}</td>
                    <td>{result.expectedIntent}</td>
                    <td>{result.actualIntent}</td>
                    <td>{result.passed ? "Pass" : result.notes.join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeView === "skills" && <SkillList />}

      {activeView === "architecture" && (
        <section className="panel architecture-flow">
          <h2>Architecture</h2>
          <ol>
            <li>Intent router maps the question to a deterministic BI intent.</li>
            <li>Metric catalog and schema define the supported semantic surface.</li>
            <li>SQL generator creates a read-only query template.</li>
            <li>SQL validator blocks unsafe or unknown SQL before execution.</li>
            <li>AlaSQL runs locally against synthetic ecommerce data in the browser.</li>
            <li>Charts, traces, evaluation results, and editable reports are rendered in React.</li>
          </ol>
        </section>
      )}
    </main>
  );
}

