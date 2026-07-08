import { CompactTopicCard } from "../components/overview/CompactTopicCard";
import { QuickDemoRunner } from "../components/overview/QuickDemoRunner";
import { Button } from "../components/ui/Button";
import type { Topic } from "../topics/topicTypes";

interface OverviewPageProps {
  onOpenEvaluation: () => void;
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  topics: Topic[];
}

export function OverviewPage({ onOpenEvaluation, onOpenTopic, topics }: OverviewPageProps) {
  return (
    <div className="overview-demo-page">
      <section className="overview-demo-hero">
        <div className="overview-demo-hero__copy">
          <p className="eyebrow">DATA AGENT SANDBOX</p>
          <h2>Run the Agent</h2>
          <p>A public demo for validated SQL, local execution, trace review, and regression evaluation.</p>
          <div className="hero-actions">
            <a className="button button--primary" href="/showcase?view=agent">
              Open Agent Showcase
            </a>
            <Button onClick={onOpenEvaluation} variant="secondary">
              Open Evaluation
            </Button>
            <a
              className="button button--ghost"
              href="https://github.com/HaoPan036/Data-Agent-Sandbox"
              rel="noreferrer"
              target="_blank"
            >
              View GitHub
            </a>
          </div>
          <div className="overview-screenshot-links">
            <a href="/showcase?view=agent&capture=true">Agent screenshot</a>
            <a href="/showcase?view=guardrail&capture=true">Guardrail screenshot</a>
            <a href="/showcase?view=evaluation&capture=true">Evaluation screenshot</a>
          </div>
          <p className="hero-note">
            Synthetic data only. No internal data, code, prompts, schemas, screenshots, or proprietary workflows.
          </p>
        </div>

        <QuickDemoRunner onOpenTopic={onOpenTopic} />
      </section>

      <section className="overview-compact-section">
        <div className="compact-section-heading">
          <span className="section-header__eyebrow">Screenshot views</span>
          <h2>Three review-ready frames</h2>
        </div>
        <div className="overview-showcase-link-grid">
          <a href="/showcase?view=agent">Agent Run</a>
          <a href="/showcase?view=guardrail">Guardrail</a>
          <a href="/showcase?view=evaluation">Evaluation</a>
        </div>
      </section>

      <section className="overview-compact-section">
        <div className="compact-section-heading">
          <span className="section-header__eyebrow">Demo topics</span>
          <h2>Open a working topic</h2>
        </div>
        <div className="compact-topic-grid">
          {topics.map((topic) => (
            <CompactTopicCard
              key={topic.id}
              onOpen={onOpenTopic}
              onRunSample={onOpenTopic}
              topic={topic}
            />
          ))}
        </div>
      </section>

      <section className="confidentiality-note">
        <p>This sandbox uses synthetic ecommerce and experiment data only.</p>
        <a
          href="https://github.com/HaoPan036/Data-Agent-Sandbox/blob/main/docs/confidentiality.en.md"
          rel="noreferrer"
          target="_blank"
        >
          Read confidentiality boundary
        </a>
      </section>
    </div>
  );
}
