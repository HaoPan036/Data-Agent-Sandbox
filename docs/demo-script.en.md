# Public Demo Script

## 1. Prove the Agent Run

1. Open [BI Data Agent Sandbox](https://data-agent-sandbox.vercel.app/).
2. Select **Open Agent Showcase**, or open `/showcase?view=agent` directly.
3. Point out the real input question, server-generated Run ID, `ndjson-v1` transport, event progress, generated SQL, validation, returned rows, chart, grounded answer, and trace.
4. Explain that the browser called `POST /api/runs`; the Vercel Node function ran the deterministic agent and AlaSQL over synthetic data, then streamed NDJSON events back.
5. Do not describe the timing as an animation. No artificial waiting is inserted; the visible duration is measured from the actual request and computation.

## 2. Run a Prepared Topic Question

1. Return to Overview and open **Retail Growth Demo**.
2. Select **Which product category had the highest refund rate last month?** and run it.
3. Inspect the execution progress, selected intent and metrics, read-only SQL, validation checks, result rows, chart, warnings, and trace.
4. Run **Why did revenue drop last week?** to show a multi-part diagnostic result.
5. Mention that Retail and Experiment are executable; Knowledge Base Demo is metadata-only today.

## 3. Prove the Guardrail

1. Open `/showcase?view=guardrail`.
2. Show the sensitive user-level export question.
3. Confirm the run is blocked before SQL, result rows, or chart artifacts are produced.
4. Explain that the UI only labels this safely blocked after validating both the terminal status and the absence of execution artifacts.

## 4. Show Evaluation and Reports

1. Open Evaluation and select a versioned testset.
2. Run or inspect the deterministic scores, pass rate, failure modes, and a case trace.
3. Explain that Evaluation currently runs the same `runAgent` core in the browser and does not call an LLM judge.
4. Return to Overview, open the Skills tab, and run **Demo Skill Pipeline**.
5. Show the skill timeline, evaluation summary, editable sandboxed report preview, and HTML download.
6. Explain that Evaluation results, review-queue state, report edits, and run history are not persisted yet.

## 5. State the Boundary

Use this exact statement:

> This project uses synthetic or public data only. It does not contain internal company data, code, prompts, schemas, screenshots, business metrics, roadmap details, or proprietary workflows.

Also state that no LLM key, login, external warehouse, or third-party data/model API is needed for this version.

## Capture Links

- Agent: `https://data-agent-sandbox.vercel.app/showcase?view=agent&capture=true`
- Guardrail: `https://data-agent-sandbox.vercel.app/showcase?view=guardrail&capture=true`
- Evaluation: `https://data-agent-sandbox.vercel.app/showcase?view=evaluation&capture=true`
