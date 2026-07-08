export type SkillStatus = "ready" | "planned";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  status: SkillStatus;
  input: string;
  output: string;
}

export interface SkillRunResult {
  skillId: string;
  status: "completed" | "skipped";
  message: string;
}

