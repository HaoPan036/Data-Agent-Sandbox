import { AgentLifecyclePreview } from "../components/overview/AgentLifecyclePreview";
import { CapabilityCard } from "../components/overview/CapabilityCard";
import { ProofStrip } from "../components/overview/ProofStrip";
import { TopicShowcaseCard } from "../components/overview/TopicShowcaseCard";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/SectionHeader";
import type { Topic } from "../topics/topicTypes";

interface OverviewPageProps {
  onOpenTopic: (topicId: string) => void;
  topics: Topic[];
}

const platformCards = [
  {
    title: "Connect Synthetic Data",
    description:
      "Browser safe ecommerce, traffic, campaign, refund, and experiment tables.",
    status: "Implemented"
  },
  {
    title: "Build Topic Knowledge",
    description:
      "Metric definitions, glossary terms, caveats, and governance notes by topic.",
    status: "Implemented"
  },
  {
    title: "Prepare Governed Analysis",
    description:
      "Trace ready workflows for validated SQL, evaluation, human review, and reports.",
    status: "Next stage"
  }
] as const;

export function OverviewPage({ onOpenTopic, topics }: OverviewPageProps) {
  return (
    <div className="page-stack">
      <section className="overview-hero">
        <div className="overview-hero__copy">
          <p className="eyebrow">Public Data Agent Lab</p>
          <h2>Build observable and testable data agents</h2>
          <p>
            A portfolio safe sandbox for Topic setup, semantic models, metric
            catalogs, governed analysis design, trace review, evaluation, and reports.
          </p>
          <div className="hero-actions">
            <Button onClick={() => onOpenTopic(topics[0]?.id ?? "")} variant="primary">
              Explore Demo Topics
            </Button>
            <Button
              onClick={() => document.getElementById("proof-strip")?.scrollIntoView()}
              variant="secondary"
            >
              View Architecture
            </Button>
          </div>
          <p className="hero-note">
            Synthetic data only. No internal data, code, prompts, schemas, screenshots,
            or proprietary workflows.
          </p>
        </div>
        <AgentLifecyclePreview />
      </section>

      <section className="platform-card-grid" aria-label="Platform capabilities">
        {platformCards.map((card) => (
          <CapabilityCard
            description={card.description}
            key={card.title}
            status={card.status}
            title={card.title}
          />
        ))}
      </section>

      <ProofStrip />

      <section>
        <SectionHeader
          subtitle="Public, generic topics for portfolio-safe data-agent workflows."
          title="Demo Topics"
        />
        <div className="topic-card-grid">
          {topics.map((topic) => (
            <TopicShowcaseCard key={topic.id} onOpen={onOpenTopic} topic={topic} />
          ))}
        </div>
      </section>
    </div>
  );
}
