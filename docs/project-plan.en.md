# Project Plan

## Purpose

Build a public BI data-agent sandbox that proves a natural-language question can become validated SQL, executed synthetic-data results, a chart, a trace, an evaluation result, and an editable report without requiring an LLM API key.

## Implemented

- React, Vite, TypeScript, Recharts, Vitest, and AlaSQL application.
- Deterministic synthetic ecommerce and experiment datasets, topic catalog, semantic schema, metric catalog, and public knowledge entries.
- Ten prepared executable questions across Retail Growth Demo and Experiment Metrics Demo.
- Shared deterministic `runAgent` core for intent routing, metric and table selection, SQL generation, validation, isolated AlaSQL execution, charts, grounded answers, traces, warnings, and guardrails.
- Node/Vercel `POST /api/runs` endpoint with Zod request validation, server-generated run IDs, sanitized failures, and NDJSON v1 streaming.
- Vite dev and preview adapter for the same API handler.
- Strict browser protocol and outcome validation before a run is shown as complete.
- Overview Quick Demo, Topic execution, Agent Showcase, and Guardrail Showcase connected to the API.
- Browser-side Evaluation Dashboard with versioned deterministic testsets, scoring, trace review, failure summaries, and a local Bad Case Review Queue.
- Browser-side Skill Runner with deterministic execution, evaluation summary, and sandboxed editable/downloadable HTML reports.
- In-process contract tests that exercise the production client module and parser directly against the real API handler, plus CI for install, typecheck, tests, lint, and build. These tests do not launch a browser or HTTP server.
- Public Vercel deployment and direct showcase URLs for agent, guardrail, and evaluation views.

## Current Boundary

- Interactive runs use a real serverless API and real AlaSQL execution over synthetic data. They do not insert artificial waiting or return a prewritten result.
- Evaluation and Skills still execute `runAgent` and AlaSQL in the browser.
- Knowledge Base Demo is metadata-only.
- No LLM provider, authentication, persistent database, durable history, external warehouse, upload flow, or third-party data/model API exists today.
- Client cancellation cannot preempt synchronous server computation after it starts.
- Strict CSP remains report-only while browser-side AlaSQL requires dynamic compilation; other configured security headers are enforced.

## Next Work

1. Move Evaluation and Skills execution behind the server API, then enforce the strict CSP.
2. Add durable run history, evaluation artifacts, and report versions.
3. Add production authentication, distributed rate limiting, and observability.
4. Make longer runs asynchronous and preemptible for true cancellation.
5. Split the frontend bundle by route and feature.

## Later Options

- Add an optional LLM provider behind the deterministic request, SQL-validation, response, trace, and evaluation contracts. The no-key deterministic path must remain runnable.
- Add more synthetic or public datasets and question templates.
- Add connectors for public datasets only; this sandbox remains synthetic-or-public-data-only.
