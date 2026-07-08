# Architecture

This sandbox is a browser-only BI data agent demonstration. It uses deterministic workflows first so the result can be tested without an LLM API key.

## Runtime

- Vite serves the React application.
- React renders the workflow UI, charts, traces, evaluation results, skills, and report editor.
- AlaSQL executes SQL locally against an in-memory synthetic ecommerce dataset.
- Recharts renders the result chart.
- Vitest covers routing and workflow behavior.

## Data Flow

1. A user asks a supported natural language BI question.
2. `src/agent/intentRouter.ts` maps the question to a deterministic intent.
3. `src/agent/metricCatalog.ts` and `src/agent/schema.ts` define the semantic surface.
4. `src/agent/sqlGenerator.ts` creates a read-only SQL template.
5. `src/agent/sqlValidator.ts` validates that SQL before execution.
6. `src/agent/sqlExecutor.ts` runs the query with AlaSQL against `src/data/syntheticEcommerce.ts`.
7. `src/agent/trace.ts` records each stage.
8. `src/evaluation/evaluator.ts` checks whether known questions produce expected outcomes.
9. `src/reporting/htmlReport.ts` creates an editable HTML report draft.

## First-Version Boundary

The first version has no backend, no database server, no auth, and no external API dependency. Optional LLM integration can be added later behind explicit configuration.

