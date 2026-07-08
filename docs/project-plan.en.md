# Project Plan

## Completed

- Created a Vite React TypeScript app.
- Added synthetic ecommerce, traffic, campaign, product, masked customer, refund, and experiment data.
- Added topic catalog, semantic schema metadata, metric catalog, and knowledge base.
- Built the public platform shell with overview, topic detail pages, sidebar, recent sessions, topic cards, contents rail, sample questions, and composer.
- Completed UI polish for portfolio review with design tokens, compact hero, lifecycle preview, refined cards, topic health metadata, and clearer next-stage copy.
- Added tests for data, semantic metadata, topics, pages, non-execution behavior, and documentation coverage.

## Current Boundary

- The app is an execution-ready shell.
- Topic question execution is intentionally not wired yet.
- The UI does not fake SQL, traces, charts, answers, or evaluation results.

## Next Stage: Deterministic Execution Workflows

- Route selected sample questions to deterministic intents.
- Generate SQL plans from topic and metric metadata.
- Validate SQL with read-only and sensitive-data guardrails.
- Execute safe SQL locally against synthetic data.
- Record trace events for debugging and review.
- Add deterministic evaluation checks.
- Produce grounded answer drafts and editable reports.

## Later Versions

- Add more public or synthetic datasets.
- Add more business-question templates.
- Strengthen SQL parsing and validation.
- Export reports.
- Add optional LLM support behind explicit user configuration.

