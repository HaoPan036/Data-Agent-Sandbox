import type { AgentRun } from "../agent/types";

export type SkillStatus = "ready" | "planned";
export type SkillRunStatus = "completed" | "skipped";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  status: SkillStatus;
  input: string;
  output: string;
}

export interface SkillRunMetric {
  label: string;
  value: string | number;
}

export interface SkillRunArtifact {
  kind: "agent-run" | "evaluation-summary" | "html-report";
  title: string;
  content: string;
  downloadFileName?: string;
}

export interface SkillRunResult {
  skillId: string;
  skillName: string;
  status: SkillRunStatus;
  message: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  metrics: SkillRunMetric[];
  artifact?: SkillRunArtifact;
}

export interface DemoSkillPipelineResult {
  question: string;
  topicId: string;
  generatedAt: string;
  agentRun: AgentRun;
  reportHtml: string;
  reportDownloadFileName: string;
  evaluation: {
    total: number;
    passed: number;
    passRate: number;
  };
  completedSkills: number;
  totalReadySkills: number;
  skillRuns: SkillRunResult[];
}
