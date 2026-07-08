import { AgentRunShowcase } from "../components/showcase/AgentRunShowcase";
import { EvaluationShowcase } from "../components/showcase/EvaluationShowcase";
import { GuardrailShowcase } from "../components/showcase/GuardrailShowcase";
import { ShowcaseShell } from "../components/showcase/ShowcaseShell";

type ShowcaseView = "agent" | "guardrail" | "evaluation";

function parseView(value: string | null): ShowcaseView {
  if (value === "guardrail" || value === "evaluation") {
    return value;
  }

  return "agent";
}

export function ShowcasePage() {
  const params = new URLSearchParams(window.location.search);
  const view = parseView(params.get("view"));
  const capture = params.get("capture") === "true";

  return (
    <ShowcaseShell capture={capture} view={view}>
      {view === "guardrail" ? (
        <GuardrailShowcase />
      ) : view === "evaluation" ? (
        <EvaluationShowcase />
      ) : (
        <AgentRunShowcase />
      )}
    </ShowcaseShell>
  );
}
