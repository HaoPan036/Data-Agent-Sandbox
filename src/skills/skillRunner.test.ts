import { describe, expect, it } from "vitest";
import { runDemoSkillPipeline, runSkill } from "./skillRunner";

describe("skillRunner", () => {
  it("runs the deterministic demo pipeline through agent, evaluation, and reporting skills", () => {
    const result = runDemoSkillPipeline({
      createdAt: "2026-07-09T00:00:00.000Z",
      runId: "skill-pipeline-test"
    });

    expect(result.agentRun.runId).toBe("skill-pipeline-test");
    expect(result.agentRun.generatedSql[0].sql).toContain("SELECT o.category AS category");
    expect(result.agentRun.executionResult[0].rowCount).toBeGreaterThan(0);
    expect(result.evaluation.total).toBeGreaterThan(0);
    expect(result.evaluation.passed).toBeGreaterThan(0);
    expect(result.completedSkills).toBe(result.totalReadySkills);
    expect(result.reportHtml).toContain("BI Data Agent Report");
    expect(result.reportDownloadFileName).toBe("bi-data-agent-demo-report.html");
    expect(result.skillRuns.map((run) => run.skillId)).toEqual([
      "intent-routing",
      "sql-generation",
      "sql-validation",
      "browser-sql-execution",
      "evaluation",
      "reporting",
      "optional-llm"
    ]);
  });

  it("keeps planned LLM skill skipped while ready skills return concrete results", () => {
    const reporting = runSkill("reporting");
    const optionalLlm = runSkill("optional-llm");

    expect(reporting.status).toBe("completed");
    expect(reporting.artifact?.kind).toBe("html-report");
    expect(reporting.artifact?.content).toContain("BI Data Agent Report");
    expect(optionalLlm.status).toBe("skipped");
    expect(optionalLlm.message).toContain("not active yet");
  });
});
