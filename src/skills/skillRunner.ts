import { runAgent } from "../agent/runAgent";
import { runEvaluationSuite } from "../evaluation/evaluator";
import { createAgentRunHtmlReport } from "../reporting/htmlReport";
import { skillCatalog } from "./skillCatalog";
import type { DemoSkillPipelineResult, SkillRunArtifact, SkillRunMetric, SkillRunResult } from "./skillTypes";

export const defaultDemoQuestion = "Which product category had the highest refund rate last month?";
export const defaultDemoTopicId = "retail-growth-demo";

interface DemoSkillPipelineOptions {
  question?: string;
  topicId?: string;
  runId?: string;
  createdAt?: string;
}

interface TimedValue<T> {
  value: T;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

function nowMs() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function measure<T>(createValue: () => T): TimedValue<T> {
  const startedAt = new Date().toISOString();
  const startedMs = nowMs();
  const value = createValue();
  const durationMs = Math.round((nowMs() - startedMs) * 100) / 100;
  const completedAt = new Date().toISOString();

  return {
    value,
    startedAt,
    completedAt,
    durationMs
  };
}

function skillName(skillId: string) {
  return skillCatalog.find((skill) => skill.id === skillId)?.name ?? skillId;
}

function completedSkillRun(
  skillId: string,
  message: string,
  metrics: SkillRunMetric[],
  timing: Pick<TimedValue<unknown>, "startedAt" | "completedAt" | "durationMs">,
  artifact?: SkillRunArtifact
): SkillRunResult {
  return {
    skillId,
    skillName: skillName(skillId),
    status: "completed",
    message,
    startedAt: timing.startedAt,
    completedAt: timing.completedAt,
    durationMs: timing.durationMs,
    metrics,
    artifact
  };
}

function skippedSkillRun(skillId: string, message: string): SkillRunResult {
  const timestamp = new Date().toISOString();

  return {
    skillId,
    skillName: skillName(skillId),
    status: "skipped",
    message,
    startedAt: timestamp,
    completedAt: timestamp,
    durationMs: 0,
    metrics: []
  };
}

function formatPassRate(passRate: number) {
  return `${Math.round(passRate * 100)}%`;
}

function totalRows(result: DemoSkillPipelineResult["agentRun"]) {
  return result.executionResult.reduce((sum, execution) => sum + execution.rowCount, 0);
}

export function runDemoSkillPipeline(
  options: DemoSkillPipelineOptions = {}
): DemoSkillPipelineResult {
  const question = options.question ?? defaultDemoQuestion;
  const topicId = options.topicId ?? defaultDemoTopicId;
  const generatedAt = new Date().toISOString();
  const agentRun = measure(() =>
    runAgent(question, topicId, {
      runId: options.runId ?? "skill-runner-demo",
      createdAt: options.createdAt
    })
  );
  const evaluation = measure(() => runEvaluationSuite());
  const report = measure(() => createAgentRunHtmlReport(agentRun.value));
  const reportDownloadFileName = "bi-data-agent-demo-report.html";
  const validationPassed = agentRun.value.validationResults.filter((result) => result.passed).length;
  const rowCount = totalRows(agentRun.value);
  const totalReadySkills = skillCatalog.filter((skill) => skill.status === "ready").length;
  const skillRuns: SkillRunResult[] = [
    completedSkillRun(
      "intent-routing",
      `Routed the question to ${agentRun.value.intent.replaceAll("_", " ")}.`,
      [
        { label: "Intent", value: agentRun.value.intent.replaceAll("_", " ") },
        { label: "Trace steps", value: agentRun.value.traceSteps.length }
      ],
      agentRun
    ),
    completedSkillRun(
      "sql-generation",
      `Generated ${agentRun.value.generatedSql.length} deterministic SQL statement(s).`,
      [
        { label: "Statements", value: agentRun.value.generatedSql.length },
        { label: "Tables", value: agentRun.value.selectedTables.join(", ") || "none" }
      ],
      agentRun,
      {
        kind: "agent-run",
        title: "Generated SQL",
        content: agentRun.value.generatedSql.map((statement) => statement.sql).join("\n\n")
      }
    ),
    completedSkillRun(
      "sql-validation",
      `Validated ${validationPassed}/${agentRun.value.validationResults.length} SQL checks.`,
      [
        { label: "Passed checks", value: validationPassed },
        { label: "Guardrail", value: agentRun.value.guardrailDecision }
      ],
      agentRun
    ),
    completedSkillRun(
      "browser-sql-execution",
      `Executed validated SQL locally against synthetic browser tables and returned ${rowCount} row(s).`,
      [
        { label: "Rows", value: rowCount },
        { label: "Execution blocks", value: agentRun.value.executionResult.length }
      ],
      agentRun
    ),
    completedSkillRun(
      "evaluation",
      `Evaluation completed: ${evaluation.value.passed}/${evaluation.value.total} cases passed.`,
      [
        { label: "Cases", value: evaluation.value.total },
        { label: "Pass rate", value: formatPassRate(evaluation.value.passRate) }
      ],
      evaluation,
      {
        kind: "evaluation-summary",
        title: "Evaluation Summary",
        content: `${evaluation.value.passed}/${evaluation.value.total} cases passed (${formatPassRate(
          evaluation.value.passRate
        )}).`
      }
    ),
    completedSkillRun(
      "reporting",
      "Generated an editable HTML report draft from the same agent run.",
      [
        { label: "HTML bytes", value: report.value.length },
        { label: "Download", value: reportDownloadFileName }
      ],
      report,
      {
        kind: "html-report",
        title: "Editable HTML Report",
        content: report.value,
        downloadFileName: reportDownloadFileName
      }
    ),
    skippedSkillRun("optional-llm", "Optional LLM integration is planned and not required for this demo.")
  ];

  return {
    question,
    topicId,
    generatedAt,
    agentRun: agentRun.value,
    reportHtml: report.value,
    reportDownloadFileName,
    evaluation: {
      total: evaluation.value.total,
      passed: evaluation.value.passed,
      passRate: evaluation.value.passRate
    },
    completedSkills: skillRuns.filter((run) => run.status === "completed").length,
    totalReadySkills,
    skillRuns
  };
}

export function runSkill(skillId: string): SkillRunResult {
  const skill = skillCatalog.find((candidate) => candidate.id === skillId);

  if (!skill) {
    return skippedSkillRun(skillId, "Unknown skill.");
  }

  if (skill.status === "planned") {
    return skippedSkillRun(
      skillId,
      "This skill is documented for the roadmap but is not active yet."
    );
  }

  return (
    runDemoSkillPipeline().skillRuns.find((result) => result.skillId === skillId) ??
    skippedSkillRun(skillId, "Skill result was not produced by the demo pipeline.")
  );
}
