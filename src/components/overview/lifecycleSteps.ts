export const lifecycleSteps = [
  ["Question", "Business prompt."],
  ["Topic", "Governed scope."],
  ["Metric", "Known definition."],
  ["SQL Plan", "Planned query."],
  ["Validation", "Read-only guardrails."],
  ["Trace", "Decision path."],
  ["Evaluation", "Expected behavior."],
  ["Report", "Reviewable output."]
] as const;

export const agentLifecycleStepLabels = lifecycleSteps.map(([title]) => title);
