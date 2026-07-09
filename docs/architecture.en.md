# Architecture

Data Agent Sandbox is a browser-only public simulation of an AI assisted analysis governance platform. The current stage wires the public product shell into deterministic BI agent execution over synthetic data.

## UI Shell

The React shell includes:

- Left sidebar with app identity, recent sessions, available topics, disabled new topic action, and demo user area.
- Top bar with page title and placeholder actions.
- Overview page with hero area, platform cards, topic cards, and Skill Hub demo pipeline.
- Topic detail page with information, summary, data sources, glossary, sample questions, right contents panel, and bottom composer.
- Evaluation page with versioned testset selector, summary cards, failure mode distribution, case table, trace details, and local bad-case review queue.
- Showcase route with capture-ready agent, guardrail, and evaluation frames generated from real deterministic outputs.

The composer executes supported Retail Growth Demo and Experiment Metrics Demo questions through the deterministic agent runner. Knowledge Base Demo remains metadata-only in this stage.

## Topic Layer

`src/topics/topicCatalog.ts` defines three public topics:

- Retail Growth Demo
- Experiment Metrics Demo
- Knowledge Base Demo

Each topic includes owner, access level, source type, timestamps, tags, data sources, glossary items, sample questions, recent sessions, and governance status.

## Data Layer

`src/data/syntheticEcommerce.ts` generates local synthetic data for:

- `orders`
- `traffic`
- `campaigns`
- `products`
- `customers_masked`
- `refunds`
- `experiment_events`

The data includes at least 180 days, four public regions, four public channels, five public categories, multiple campaigns, two experiments, a revenue drop period, a refund spike period, and an incomplete latest week.

## Metric Layer

`src/agent/metricCatalog.ts` defines metric metadata including formulas, source tables, required columns, allowed dimensions, default time grain, caveats, and sensitivity level. The catalog is tested against schema metadata.

## Knowledge Layer

`src/agent/knowledgeBase.ts` stores public generic knowledge entries for metric definitions, experiment comparison, campaign baselines, latest week completeness, causal claim caution, sensitive data policy, and ambiguity handling.

## Agent Execution Layer

`src/agent/runAgent.ts` orchestrates the deterministic chain:

- `intentRouter.ts` classifies supported questions and sensitive prompts.
- `sqlGenerator.ts` selects metrics, tables, and read-only SQL templates.
- `sqlValidator.ts` checks table and column references, read-only SQL, explicit columns, date filters, and sensitive selections.
- `sqlExecutor.ts` registers synthetic tables in AlaSQL and executes validated statements locally.
- `chartSpec.ts` maps executed rows to chart-ready specs.
- `answerGenerator.ts` writes grounded answers from execution results and warnings.
- `trace.ts` records step-level trace events for review.

The UI displays final answer, intent, selected metrics, selected tables, SQL, validation results, result rows, chart preview, trace timeline, warnings, guardrail decision, and suggested follow-ups.

## Evaluation Layer

`src/evaluation/testset.ts` defines versioned public regression testsets for core agent behavior and governance behavior. `src/evaluation/evaluator.ts` runs every case through the real deterministic `runAgent` path. `src/evaluation/scoringRules.ts` scores each AgentRun with deterministic criteria for intent, metrics, tables, SQL validation, execution, guardrails, warnings, grounded answers, trace completeness, and blocked-request safety.

The dashboard does not call an LLM judge or external API. Bad Case Review Queue state is local UI state only.

## Skill Runner And Reporting Layer

`src/skills/skillRunner.ts` runs the public deterministic skills as one local demo pipeline. It uses the real `runAgent` output, real evaluation summary, and no external APIs.

`src/reporting/htmlReport.ts` creates a self-contained editable HTML report from an AgentRun. The report includes the question, grounded answer, guardrail decision, generated SQL, validation checks, executed result samples, and trace steps.

## Showcase Layer

`/showcase` supports `view=agent`, `view=guardrail`, and `view=evaluation`. The views call real `runAgent` or `runEvaluation` and can hide navigation with `capture=true` for portfolio screenshots.

## Next Layer

The next layer is richer report templates, more public or synthetic datasets, stronger SQL validation edge cases, and optional LLM integration behind explicit API-key configuration.
