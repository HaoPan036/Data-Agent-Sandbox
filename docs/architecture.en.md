# Architecture

Data Agent Sandbox is a browser-only public simulation of an AI assisted analysis governance platform. The current stage focuses on the product shell, topic layer, semantic model, metric catalog, knowledge base, and synthetic data foundation.

## UI Shell

The React shell includes:

- Left sidebar with app identity, recent sessions, available topics, disabled new topic action, and demo user area.
- Top bar with page title and placeholder actions.
- Overview page with hero area, platform cards, and topic cards.
- Topic detail page with information, summary, data sources, glossary, sample questions, right contents panel, and bottom composer.

The composer does not execute analysis yet. It stores local question state and shows a next-stage message.

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

## Future Agent Execution Layer

The next deterministic layer can connect selected topic questions to intent routing, SQL generation, SQL validation, local execution, traces, evaluation, and editable reports. This stage intentionally avoids fake SQL or fake final answers in the new topic UI.

