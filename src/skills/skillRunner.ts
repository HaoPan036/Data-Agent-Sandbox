import { runEvaluationSuite } from "../evaluation/evaluator";
import { skillCatalog } from "./skillCatalog";
import type { SkillRunResult } from "./skillTypes";

export function runSkill(skillId: string): SkillRunResult {
  const skill = skillCatalog.find((candidate) => candidate.id === skillId);

  if (!skill) {
    return {
      skillId,
      status: "skipped",
      message: "Unknown skill."
    };
  }

  if (skill.status === "planned") {
    return {
      skillId,
      status: "skipped",
      message: "This skill is documented for the roadmap but is not active yet."
    };
  }

  if (skill.id === "evaluation") {
    const summary = runEvaluationSuite();

    return {
      skillId,
      status: "completed",
      message: `Evaluation completed: ${summary.passed}/${summary.total} cases passed.`
    };
  }

  return {
    skillId,
    status: "completed",
    message: `${skill.name} is available in the deterministic demo workflow.`
  };
}

