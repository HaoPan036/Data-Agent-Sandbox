import { CompactLifecycleStrip } from "../components/overview/CompactLifecycleStrip";
import { CompactTopicCard } from "../components/overview/CompactTopicCard";
import { QuickDemoRunner } from "../components/overview/QuickDemoRunner";
import { StatusChipGrid } from "../components/overview/StatusChipGrid";
import { Button } from "../components/ui/Button";
import type { Topic } from "../topics/topicTypes";

interface OverviewPageProps {
  onOpenEvaluation: () => void;
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  topics: Topic[];
}

export function OverviewPage({ onOpenEvaluation, onOpenTopic, topics }: OverviewPageProps) {
  const retailTopicId = topics.find((topic) => topic.id === "retail-growth-demo")?.id ?? topics[0]?.id ?? "";

  function runQuickDemo() {
    document.getElementById("quick-demo-run")?.click();
  }

  return (
    <div className="overview-demo-page">
      <section className="overview-demo-hero">
        <div className="overview-demo-hero__copy">
          <p className="eyebrow">LIVE DETERMINISTIC DEMO</p>
          <h2>Run a Governed Data Agent</h2>
          <p>
            Ask a business question, generate validated SQL, execute it on synthetic data, and inspect the trace.
          </p>
          <div className="hero-actions">
            <Button onClick={runQuickDemo} variant="primary">
              Run Quick Demo
            </Button>
            <Button onClick={() => onOpenTopic(retailTopicId)} variant="secondary">
              Open Retail Topic
            </Button>
            <Button
              onClick={() => document.getElementById("agent-lifecycle")?.scrollIntoView()}
              variant="ghost"
            >
              View Architecture
            </Button>
          </div>
          <p className="hero-note">
            Synthetic data only. No internal data, code, prompts, schemas, screenshots, or proprietary workflows.
          </p>
        </div>

        <QuickDemoRunner onOpenTopic={onOpenTopic} />
      </section>

      <section className="overview-compact-section">
        <div className="compact-section-heading">
          <span className="section-header__eyebrow">What works now</span>
          <h2>Live pieces</h2>
          <Button onClick={onOpenEvaluation} variant="secondary">
            Open Evaluation
          </Button>
        </div>
        <StatusChipGrid />
      </section>

      <section className="overview-compact-section" id="agent-lifecycle">
        <div className="compact-section-heading">
          <span className="section-header__eyebrow">Agent lifecycle</span>
          <h2>From question to answer</h2>
        </div>
        <CompactLifecycleStrip />
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
