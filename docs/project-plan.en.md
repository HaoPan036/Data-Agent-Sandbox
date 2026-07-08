# Project Plan

## Completed

- Created a Vite React TypeScript app.
- Added synthetic ecommerce, traffic, campaign, product, masked customer, refund, and experiment data.
- Added topic catalog, semantic schema metadata, metric catalog, and knowledge base.
- Built the public platform shell with overview, topic detail pages, sidebar, recent sessions, topic cards, contents rail, sample questions, and composer.
- Completed UI polish for portfolio review with design tokens, compact hero, lifecycle preview, refined cards, topic health metadata, and execution coverage copy.
- Wired deterministic execution for Retail Growth Demo and Experiment Metrics Demo sample questions.
- Added intent routing, SQL generation, SQL validation, AlaSQL execution, trace steps, chart specs, grounded answers, warnings, and guardrail decisions.
- Added UI panels for generated SQL, validation checks, result rows, chart preview, trace timeline, warnings, guardrail decision, and suggested follow-ups.
- Implemented the demo first Overview with one click deterministic quick runs.
- Added tests for data, semantic metadata, topics, pages, SQL generation, SQL validation, SQL execution, agent runs, and documentation coverage.

## Current Boundary

- The app executes supported Retail Growth Demo and Experiment Metrics Demo questions locally.
- Knowledge Base Demo remains metadata-only until retrieval execution is added.
- The UI does not fake SQL, traces, charts, answers, or evaluation results.

## Next Stage: Evaluation Dashboard And Bad Case Review

- Add an evaluation dashboard for supported questions.
- Add bad-case review with expected intent, SQL, answer, and warning checks.
- Add editable report review states and export.
- Strengthen SQL parsing and validation edge cases.

## Later Versions

- Add more public or synthetic datasets.
- Add more business-question templates.
- Strengthen SQL parsing and validation.
- Export reports.
- Add optional LLM support behind explicit user configuration.
