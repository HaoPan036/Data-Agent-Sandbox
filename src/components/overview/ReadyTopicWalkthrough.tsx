import type { Topic } from "../../topics/topicTypes";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface ReadyTopicWalkthroughProps {
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  topic: Topic;
}

const executionSteps = [
  ["Topic context", "Load synthetic tables, glossary, metric catalog, and sample questions."],
  ["Intent routing", "Classify the business question with deterministic rules."],
  ["SQL generation", "Choose metrics and build read-only SQL from a public template."],
  ["Validation", "Check tables, columns, date filters, sensitive fields, and read-only safety."],
  ["Execution", "Execute validated SQL in the serverless Node runtime with AlaSQL against synthetic data."],
  ["Result trace", "Render answer, chart data, warnings, SQL, rows, and trace timeline."]
] as const;

export function ReadyTopicWalkthrough({ onOpenTopic, topic }: ReadyTopicWalkthroughProps) {
  const demoQuestion =
    topic.sampleQuestions.find((question) => question.includes("refund rate")) ??
    topic.sampleQuestions[0];

  return (
    <section className="ready-topic" aria-labelledby="ready-topic-title">
      <div className="ready-topic__copy">
        <div className="ready-topic__heading">
          <Badge tone="green">Ready Topic</Badge>
          <h2 id="ready-topic-title">Start with one prepared BI topic</h2>
        </div>
        <p>
          <strong>{topic.name}</strong> is preloaded with synthetic ecommerce tables, metric
          definitions, sample questions, SQL guardrails, and evaluation cases.
        </p>
        <div className="ready-topic__question">
          <span>Default demo question</span>
          <strong>{demoQuestion}</strong>
        </div>
        <div className="ready-topic__actions">
          <Button onClick={() => onOpenTopic(topic.id, demoQuestion)} variant="primary">
            Open Ready Topic
          </Button>
          <a className="button button--secondary" href="/showcase?view=agent">
            View Executed Showcase
          </a>
        </div>
      </div>

      <div className="ready-topic__process" aria-label="Execution process">
        {executionSteps.map(([title, detail], index) => (
          <article className="ready-topic-step" key={title}>
            <span>{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
