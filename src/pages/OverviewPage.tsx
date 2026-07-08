import { TopicCard } from "../components/topic/TopicCard";
import type { Topic } from "../topics/topicTypes";

interface OverviewPageProps {
  onOpenTopic: (topicId: string) => void;
  topics: Topic[];
}

const platformCards = [
  {
    title: "Connect Synthetic Data",
    description: "Explore local browser-safe ecommerce, traffic, campaign, refund, and experiment tables."
  },
  {
    title: "Build Topic Knowledge",
    description: "Organize metrics, glossary terms, source notes, caveats, and governance rules by topic."
  },
  {
    title: "Run Governed Analysis",
    description: "Prepare the visible shell for validated SQL, traces, evaluation, and reports in the next stage."
  }
];

export function OverviewPage({ onOpenTopic, topics }: OverviewPageProps) {
  return (
    <div className="page-stack">
      <section className="overview-hero">
        <div>
          <p className="eyebrow">Runnable public simulation</p>
          <h2>Make Data Agents Observable, Testable, and Governed</h2>
          <p>
            A public sandbox for turning business questions into validated SQL, traceable
            analysis, evaluation results, and editable reports.
          </p>
        </div>
      </section>

      <section className="platform-card-grid" aria-label="Platform capabilities">
        {platformCards.map((card) => (
          <article className="panel" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="section-heading">
          <h2>Demo Topics</h2>
          <p>Public, generic topics for portfolio-safe data-agent workflows.</p>
        </div>
        <div className="topic-card-grid">
          {topics.map((topic) => (
            <TopicCard key={topic.id} onOpen={onOpenTopic} topic={topic} />
          ))}
        </div>
      </section>
    </div>
  );
}

