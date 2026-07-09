import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { skillCatalog } from "../skills/skillCatalog";
import type { Topic } from "../topics/topicTypes";

interface OverviewPageProps {
  onOpenEvaluation: () => void;
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  topics: Topic[];
}

type MarketTab = "topics" | "skills";
type TopicFilter = "all" | "live" | "knowledge";

const repoUrl = "https://github.com/HaoPan036/Data-Agent-Sandbox";

function HeroVisual() {
  return (
    <svg role="img" aria-label="A natural-language question flowing into validated SQL and a live chart" viewBox="0 0 560 380">
      <defs>
        <linearGradient id="heroAccent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* Dashboard window */}
      <g>
        <rect x="176" y="60" width="344" height="252" rx="18" fill="#ffffff" stroke="#e7ecf4" />
        <circle cx="198" cy="82" r="4" fill="#cbd5e1" />
        <circle cx="212" cy="82" r="4" fill="#dbeafe" />
        <circle cx="226" cy="82" r="4" fill="#ede9fe" />
        {/* KPI tiles */}
        <rect x="196" y="102" width="92" height="42" rx="9" fill="#f5f8fc" />
        <rect x="296" y="102" width="92" height="42" rx="9" fill="#f5f8fc" />
        <rect x="396" y="102" width="104" height="42" rx="9" fill="#f5f8fc" />
        <rect x="206" y="112" width="42" height="7" rx="3.5" fill="#c7d2e6" />
        <rect x="206" y="125" width="60" height="9" rx="4.5" fill="url(#heroAccent)" />
        <rect x="306" y="112" width="42" height="7" rx="3.5" fill="#c7d2e6" />
        <rect x="306" y="125" width="52" height="9" rx="4.5" fill="#16a34a" />
        <rect x="406" y="112" width="48" height="7" rx="3.5" fill="#c7d2e6" />
        <rect x="406" y="125" width="66" height="9" rx="4.5" fill="#7c3aed" />
        {/* Bars */}
        <rect x="204" y="240" width="26" height="46" rx="5" fill="#dbeafe" />
        <rect x="244" y="216" width="26" height="70" rx="5" fill="#bfd3fb" />
        <rect x="284" y="196" width="26" height="90" rx="5" fill="url(#heroAccent)" />
        <rect x="324" y="228" width="26" height="58" rx="5" fill="#bfd3fb" />
        <rect x="364" y="204" width="26" height="82" rx="5" fill="#dbeafe" />
        {/* Line overlay */}
        <polyline
          points="217,236 257,214 297,192 337,220 377,200 460,176"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="460" cy="176" r="4.5" fill="#7c3aed" />
      </g>

      {/* Prompt / chat bubble */}
      <g>
        <rect x="40" y="150" width="212" height="150" rx="16" fill="#ffffff" stroke="#e7ecf4" />
        <circle cx="70" cy="182" r="14" fill="url(#heroAccent)" />
        <path d="M64 183 l4 4 l8 -9" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="94" y="174" width="128" height="8" rx="4" fill="#e2e8f0" />
        <rect x="94" y="188" width="96" height="8" rx="4" fill="#eef2f7" />
        <rect x="64" y="216" width="164" height="9" rx="4.5" fill="#0f172a" opacity="0.82" />
        <rect x="64" y="234" width="120" height="9" rx="4.5" fill="#94a3b8" />
        <rect x="150" y="262" width="78" height="24" rx="12" fill="url(#heroAccent)" />
        <path d="M167 274 h20 m0 0 l-6 -5 m6 5 l-6 5" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Floating pills */}
      <g>
        <rect x="300" y="40" width="104" height="30" rx="15" fill="#0f172a" />
        <text x="318" y="60" fontFamily="ui-monospace, monospace" fontSize="13" fill="#7dd3fc" fontWeight="600">SELECT</text>
        <rect x="416" y="46" width="96" height="30" rx="15" fill="#e6f7ee" stroke="#bbf7d0" />
        <path d="M430 61 l4 4 l8 -9" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="446" y="65" fontFamily="Inter, system-ui, sans-serif" fontSize="12" fill="#166534" fontWeight="700">Valid</text>
      </g>

      {/* Sparkles */}
      <path d="M132 96 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" fill="#c4b5fd" />
      <path d="M498 300 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 z" fill="#93c5fd" />
    </svg>
  );
}

const featureCards = [
  {
    key: "agent",
    icon: "chart",
    tone: "blue" as const,
    title: "Agent run",
    body: "Validated read-only SQL, local execution, and the right chart — picked automatically.",
    cta: "See a run",
    href: "/showcase?view=agent"
  },
  {
    key: "guardrail",
    icon: "shield",
    tone: "violet" as const,
    title: "Guardrails",
    body: "Sensitive asks are blocked or downgraded to safe aggregates — every single time.",
    cta: "See a block",
    href: "/showcase?view=guardrail"
  },
  {
    key: "evaluation",
    icon: "check",
    tone: "green" as const,
    title: "Evaluation",
    body: "Versioned regression testsets score intent, validation, and row counts on every change.",
    cta: "Open dashboard",
    href: undefined
  }
];

function FeatureIcon({ name }: { name: string }) {
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="6" rx="1" />
      <rect x="12.5" y="7" width="3" height="10" rx="1" />
      <rect x="18" y="13" width="3" height="4" rx="1" />
    </svg>
  );
}

export function OverviewPage({ onOpenEvaluation, onOpenTopic, topics }: OverviewPageProps) {
  const [tab, setTab] = useState<MarketTab>("topics");
  const [filter, setFilter] = useState<TopicFilter>("all");

  const firstTopic = topics[0];
  const filteredTopics = topics.filter((topic) => {
    if (filter === "all") {
      return true;
    }

    const isKnowledge = topic.sourceType === "Markdown Knowledge";
    return filter === "knowledge" ? isKnowledge : !isKnowledge;
  });

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero__visual">
          <HeroVisual />
        </div>
        <div className="landing-hero__copy">
          <p className="eyebrow">Data Agent Sandbox</p>
          <h2>
            <span>Ask your data.</span> <em>Get answers you can trust.</em>
          </h2>
          <p className="landing-hero__sub">
            Natural-language BI over synthetic data. Every answer ships with the SQL behind it, a
            live result, and a full trace — no black box.
          </p>
          <div className="landing-hero__actions">
            <a className="button button--primary" href="/showcase?view=agent">
              Open Agent Showcase
            </a>
            <Button onClick={onOpenEvaluation} variant="secondary">
              Open Evaluation
            </Button>
            <a className="button button--ghost" href={repoUrl} rel="noreferrer" target="_blank">
              View GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="landing-feature-grid" aria-label="What the agent does">
        {featureCards.map((card) =>
          card.href ? (
            <a className="landing-feature-card" href={card.href} key={card.key}>
              <span className={`landing-feature-card__icon landing-feature-card__icon--${card.tone}`}>
                <FeatureIcon name={card.icon} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <span className="landing-feature-card__cta">{card.cta} →</span>
            </a>
          ) : (
            <button className="landing-feature-card" key={card.key} onClick={onOpenEvaluation} type="button">
              <span className={`landing-feature-card__icon landing-feature-card__icon--${card.tone}`}>
                <FeatureIcon name={card.icon} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <span className="landing-feature-card__cta">{card.cta} →</span>
            </button>
          )
        )}
      </section>

      {firstTopic ? (
        <div className="landing-cta">
          <span>Need a quick win?</span>
          <button
            onClick={() => onOpenTopic(firstTopic.id, firstTopic.sampleQuestions[0])}
            type="button"
          >
            Run a supported question →
          </button>
        </div>
      ) : null}

      <section className="landing-market" aria-label="Topic market and skill hub">
        <div className="market-tabs" role="tablist">
          <button
            aria-selected={tab === "topics"}
            className={tab === "topics" ? "market-tab market-tab--active" : "market-tab"}
            onClick={() => setTab("topics")}
            role="tab"
            type="button"
          >
            Topic Market
          </button>
          <button
            aria-selected={tab === "skills"}
            className={tab === "skills" ? "market-tab market-tab--active" : "market-tab"}
            onClick={() => setTab("skills")}
            role="tab"
            type="button"
          >
            Skill Hub
          </button>
        </div>

        {tab === "topics" ? (
          <>
            <div className="market-toolbar" role="group" aria-label="Filter topics">
              {(["all", "live", "knowledge"] as TopicFilter[]).map((value) => (
                <button
                  className={filter === value ? "market-chip market-chip--active" : "market-chip"}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {value === "all" ? "All topics" : value === "live" ? "Live SQL" : "Knowledge"}
                </button>
              ))}
            </div>
            <div className="market-grid">
              {filteredTopics.map((topic) => (
                <article className="market-topic-card" key={topic.id}>
                  <div className="market-card__top">
                    <Badge tone={topic.sourceType === "Markdown Knowledge" ? "violet" : "green"}>
                      {topic.sourceType === "Markdown Knowledge" ? "Knowledge" : "Live SQL"}
                    </Badge>
                    <span className="market-tag">Demo</span>
                  </div>
                  <h3>{topic.name}</h3>
                  <p>{topic.description}</p>
                  <button
                    className="market-try"
                    onClick={() => onOpenTopic(topic.id, topic.sampleQuestions[0])}
                    type="button"
                  >
                    Try it now →
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="market-grid">
            {skillCatalog.map((skill) => (
              <article className="market-skill-card" key={skill.id}>
                <div className="market-card__top">
                  <h3>{skill.name}</h3>
                  <Badge tone={skill.status === "ready" ? "green" : "neutral"}>{skill.status}</Badge>
                </div>
                <p>{skill.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="landing-confidentiality">
        <p>Synthetic ecommerce and experiment data only — no internal data, schemas, or workflows.</p>
        <a
          href={`${repoUrl}/blob/main/docs/confidentiality.en.md`}
          rel="noreferrer"
          target="_blank"
        >
          Read confidentiality boundary
        </a>
      </section>
    </div>
  );
}
