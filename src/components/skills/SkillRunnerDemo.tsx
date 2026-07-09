import { useMemo, useState } from "react";
import { defaultDemoQuestion, runDemoSkillPipeline } from "../../skills/skillRunner";
import type { DemoSkillPipelineResult, SkillRunResult } from "../../skills/skillTypes";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

function formatPassRate(passRate: number) {
  return `${Math.round(passRate * 100)}%`;
}

function totalRows(result: DemoSkillPipelineResult) {
  return result.agentRun.executionResult.reduce((sum, execution) => sum + execution.rowCount, 0);
}

function badgeTone(result: SkillRunResult) {
  return result.status === "completed" ? "green" : "neutral";
}

export function SkillRunnerDemo() {
  const [pipeline, setPipeline] = useState<DemoSkillPipelineResult>();
  const [htmlDraft, setHtmlDraft] = useState("");
  const downloadHref = useMemo(
    () => (htmlDraft ? `data:text/html;charset=utf-8,${encodeURIComponent(htmlDraft)}` : ""),
    [htmlDraft]
  );

  function handleRun() {
    const nextPipeline = runDemoSkillPipeline();

    setPipeline(nextPipeline);
    setHtmlDraft(nextPipeline.reportHtml);
  }

  return (
    <section className="skill-runner-demo" aria-labelledby="skill-runner-demo-title">
      <div className="skill-runner-demo__header">
        <div>
          <span className="section-header__eyebrow">Deterministic Demo</span>
          <h2 id="skill-runner-demo-title">Skill Runner Demo</h2>
          <p>{defaultDemoQuestion}</p>
        </div>
        <Button onClick={handleRun} variant="primary">
          Run Demo Skill Pipeline
        </Button>
      </div>

      {pipeline ? (
        <>
          <dl className="skill-runner-kpis" aria-label="Skill runner summary">
            <div>
              <dt>Skills</dt>
              <dd>
                {pipeline.completedSkills}/{pipeline.totalReadySkills}
              </dd>
            </div>
            <div>
              <dt>Rows</dt>
              <dd>{totalRows(pipeline)}</dd>
            </div>
            <div>
              <dt>Evaluation</dt>
              <dd>{formatPassRate(pipeline.evaluation.passRate)}</dd>
            </div>
            <div>
              <dt>Report</dt>
              <dd>{Math.round(htmlDraft.length / 1024)} KB</dd>
            </div>
          </dl>

          <div className="skill-runner-layout">
            <div className="skill-runner-timeline" aria-label="Skill run timeline">
              {pipeline.skillRuns.map((result) => (
                <article className="skill-runner-step" key={result.skillId}>
                  <div className="skill-runner-step__top">
                    <h3>{result.skillName}</h3>
                    <Badge tone={badgeTone(result)}>{result.status}</Badge>
                  </div>
                  <p>{result.message}</p>
                  {result.metrics.length > 0 ? (
                    <dl>
                      {result.metrics.map((metric) => (
                        <div key={metric.label}>
                          <dt>{metric.label}</dt>
                          <dd>{metric.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="report-workbench">
              <div className="report-workbench__header">
                <div>
                  <h3>Generated HTML Report</h3>
                  <p>{pipeline.reportDownloadFileName}</p>
                </div>
                <a
                  className="button button--secondary"
                  download={pipeline.reportDownloadFileName}
                  href={downloadHref}
                >
                  Download HTML
                </a>
              </div>
              <label className="report-workbench__editor">
                <span>Editable report draft</span>
                <textarea
                  aria-label="Editable HTML report draft"
                  onChange={(event) => setHtmlDraft(event.target.value)}
                  value={htmlDraft}
                />
              </label>
              <iframe
                className="report-workbench__preview"
                sandbox=""
                srcDoc={htmlDraft}
                title="Generated HTML report preview"
              />
            </div>
          </div>
        </>
      ) : (
        <p className="skill-runner-demo__empty">
          Run the pipeline to produce SQL, execution rows, trace output, evaluation results, and an editable report.
        </p>
      )}
    </section>
  );
}
