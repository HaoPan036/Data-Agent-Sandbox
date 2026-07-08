import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { lifecycleSteps } from "./lifecycleSteps";

export function AgentLifecyclePreview() {
  return (
    <Card className="lifecycle-preview">
      <div className="lifecycle-preview__header">
        <div>
          <p>Agent Lifecycle Preview</p>
          <h3>Execution ready shell</h3>
        </div>
        <Badge tone="violet">Next stage</Badge>
      </div>
      <ol className="lifecycle-steps">
        {lifecycleSteps.map(([title, description], index) => (
          <li key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
