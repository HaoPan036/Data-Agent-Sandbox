import type { GuardrailDecision } from "../../agent/types";

interface GuardrailPanelProps {
  decision: GuardrailDecision;
}

const labels: Record<GuardrailDecision, string> = {
  allowed: "Allowed",
  blocked: "Blocked",
  needs_review: "Needs Review"
};

export function GuardrailPanel({ decision }: GuardrailPanelProps) {
  return (
    <div className={`guardrail-panel guardrail-panel--${decision}`}>
      <span>Guardrail Decision</span>
      <strong>{labels[decision]}</strong>
    </div>
  );
}
