import type { Topic } from "../../topics/topicTypes";
import { Button } from "../ui/Button";

interface GlossaryPreviewProps {
  topic: Topic;
}

export function GlossaryPreview({ topic }: GlossaryPreviewProps) {
  return (
    <section className="panel" id="glossary">
      <div className="panel__heading">
        <h2>Glossary Preview</h2>
        <span className="big-number">{topic.glossary.length}</span>
      </div>
      <div className="glossary-list">
        {topic.glossary.slice(0, 8).map((item) => (
          <article key={item.term}>
            <h3>{item.term}</h3>
            <p>{item.definition}</p>
          </article>
        ))}
      </div>
      <Button disabled variant="ghost">
        View all glossary terms · coming soon
      </Button>
    </section>
  );
}
