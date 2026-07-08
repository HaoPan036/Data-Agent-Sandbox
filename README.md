# Data Agent Sandbox

## What This Project Is

Data Agent Sandbox is a public, runnable simulation of an AI assisted analysis governance platform. It demonstrates how a small BI data agent turns natural language business questions into deterministic intent routing, validated SQL, local execution results, charts, trace timelines, warnings, guardrail decisions, and grounded answers.

This project uses synthetic or public data only. It does not contain internal company data, code, prompts, schemas, screenshots, business metrics, roadmap details, or proprietary workflows.

## Why It Exists

The project answers a simple question: can a small BI data-agent workflow be made observable, testable, governed, and portfolio-safe? The first versions avoid LLM API keys and external services so the core product shape can be inspected locally.

## What Works Today

- Vite, React, TypeScript, Vitest, Recharts, and AlaSQL setup.
- Public platform shell with left navigation, recent sessions, available topics, top actions, topic detail pages, contents rail, sample question chips, and bottom composer.
- Portfolio-ready UI polish with a compact hero, lifecycle preview, topic health metadata, and execution coverage labels.
- Deterministic execution for 5 Retail Growth Demo questions and 5 Experiment Metrics Demo questions.
- Local SQL validation and AlaSQL execution against synthetic browser tables.
- Result panels with grounded answer, selected intent, selected metrics, selected tables, generated SQL, validation checks, result rows, chart preview, trace timeline, warnings, guardrail decision, and suggested follow-ups.
- Guardrails that block sensitive customer export or user-level record requests before SQL generation.
- Evaluation Dashboard with versioned deterministic testsets, real AgentRun execution, pass or fail scoring, failure reasons, trace inspection, failure mode summaries, and local Bad Case Review Queue.
- Screenshot Showcase route for portfolio-ready agent, guardrail, and evaluation frames.
- Synthetic ecommerce, traffic, campaign, product, masked customer, refund, and experiment event tables.
- Semantic schema metadata, metric catalog, topic catalog, and lightweight knowledge base.
- Deterministic local test coverage for data, topics, schema, metrics, knowledge entries, SQL generation, SQL validation, SQL execution, agent runs, and pages.

## What This Stage Adds

This stage adds the deterministic execution chain:

- Question to topic context, intent classification, metric selection, SQL generation, SQL validation, local SQL execution, chart-ready data, trace timeline, grounded answer, warnings, and guardrail decision.
- Retail Growth Demo support for total revenue, refund-rate comparison, weekly revenue trend, revenue-drop diagnostic, and campaign C001 review.
- Experiment Metrics Demo support for GMV and active users trend, regional funnel conversion, checkout abandonment by variant, revenue per session by variant, and latest-week completeness.
- Governance support for blocking sensitive export and unsafe customer-record prompts.
- Knowledge Base Demo remains metadata-only; retrieval execution is planned for a later stage.

## Demo first Overview

The Overview page now exposes a one click deterministic demo. Supported questions run through the real agent path, including intent routing, SQL generation, validation, local execution, trace logging, warnings, and grounded answers.

## Evaluation Dashboard

The Evaluation Dashboard runs versioned testsets through the real deterministic agent. Each case produces an AgentRun, deterministic pass or fail scoring, failure reasons, trace inspection, and optional local bad case review. No LLM judge is called in this version.

## Screenshot Showcase

The app includes a `/showcase` route for portfolio screenshots. The agent, guardrail, and evaluation views are generated from real deterministic execution and evaluation runs. Use `capture=true` to hide nonessential UI.

## Public Platform Layout

The layout is an original public portfolio version inspired by common analytics platform patterns: left sidebar, recent sessions, available topics, main content area, topic information card, summary, data source overview, glossary preview, contents rail, sample question chips, and composer.

## Visual Product Shell Status

The current version implements the public product shell, synthetic topic layer, semantic model, metric catalog, knowledge base, deterministic SQL execution, validation, traces, charts, answers, and guardrails. The demo does not fake SQL, traces, charts, answers, or evaluation output.

## Synthetic Topics

- Retail Growth Demo
- Experiment Metrics Demo
- Knowledge Base Demo

## Semantic Model

The schema layer defines every public synthetic table:

- `orders`
- `traffic`
- `campaigns`
- `products`
- `customers_masked`
- `refunds`
- `experiment_events`

Sensitive fields such as `customer_id` and `is_sensitive_masked` are marked now so later guardrails can block user-level export and unsafe access.

## Metric Catalog

The catalog includes revenue, orders, average order value, refund amount, refund rate, sessions, conversion rate, add-to-cart rate, checkout start rate, campaign spend, revenue per session, GMV, active users, checkout abandonment rate, and payment completion rate.

## Knowledge Base

The knowledge layer stores public, generic entries for metric definitions, experiment comparison, campaign baselines, latest week completeness, causal claim caution, sensitive data policy, and ambiguity handling.

## Deterministic Execution Status

Clicking a supported Retail Growth Demo or Experiment Metrics Demo sample question and then Run executes the deterministic workflow locally. Unsupported questions return suggestions. Sensitive customer export prompts are blocked before SQL generation.

## Next Stage: Skill Runner And HTML Reports

The next stage can expand the deterministic skill runner and HTML report generation flow. Optional LLM integration should remain behind explicit API-key configuration.

## Architecture

More detail is available in [docs/architecture.en.md](docs/architecture.en.md).

## How To Run Locally

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run test
npm run build
```

## Confidentiality Boundary

This project uses synthetic or public data only. It does not contain internal company data, code, prompts, schemas, screenshots, business metrics, roadmap details, or proprietary workflows.

## Roadmap

- Expand deterministic Skill Runner coverage.
- Add HTML report generation and editable report workflows.
- Strengthen SQL parsing and validation edge cases.
- Add optional LLM integration only behind explicit API-key configuration.

# Data Agent Sandbox 中文说明

## 项目简介

Data Agent Sandbox 是一个公开可运行的 AI 辅助分析治理平台模拟项目。它展示一个小型 BI Data Agent 如何把自然语言业务问题转换为确定性 intent、经过校验的 SQL、本地执行结果、图表、trace、warning、guardrail decision 和有依据的回答。

本项目只使用合成数据或公开数据，不包含任何内部公司数据、代码、提示词、schema、截图、业务指标、路线图细节或专有工作流。

## 为什么要做

这个项目回答一个问题：一个小型 BI 数据 Agent 工作流能否做到可观察、可测试、可治理，并且适合公开作品集展示？前几个版本不依赖 LLM API key 或外部服务，便于在本地检查产品形态。

## 当前可运行能力

- Vite、React、TypeScript、Vitest、Recharts 和 AlaSQL 基础工程。
- 公共版平台外壳：左侧导航、最近会话、可用 Topics、顶部操作、Topic 详情页、右侧目录、示例问题 chips、底部输入框。
- Retail Growth Demo 的 5 个问题和 Experiment Metrics Demo 的 5 个问题已经接入确定性执行。
- 在浏览器内使用 AlaSQL 对合成表进行本地 SQL 校验和执行。
- 结果面板展示 final answer、intent、指标、数据表、SQL、validation、结果行、chart、trace、warning、guardrail decision 和 follow-up。
- 对导出客户邮箱、选择所有客户记录等敏感请求，会在 SQL 生成前阻断。
- 评估面板支持版本化确定性测试集、真实 AgentRun 执行、pass 或 fail 评分、失败原因、Trace 检查、failure mode 汇总和本地 Bad Case Review Queue。
- 新增作品集截图页面，提供 agent、guardrail 和 evaluation 三个截图视图。
- 合成订单、流量、活动、商品、脱敏客户、退款、实验事件数据表。
- 语义 schema、指标目录、Topic 目录和轻量知识库。
- 针对数据、Topic、schema、指标、知识库、SQL 生成、SQL 校验、SQL 执行、agent run 和页面的本地测试。

## 本阶段新增内容

本阶段新增确定性执行链路：

- question 到 topic context、intent classification、metric selection、SQL generation、SQL validation、本地 SQL execution、chart-ready data、trace timeline、grounded answer、warnings 和 guardrail decision。
- Retail Growth Demo 支持总收入、退款率对比、周收入趋势、收入下跌诊断和 C001 活动复盘。
- Experiment Metrics Demo 支持 GMV/active users 趋势、区域漏斗转化、变体 checkout abandonment、变体 revenue per session 和最新周完整性检查。
- Governance 支持阻断敏感导出和不安全的客户记录请求。
- Knowledge Base Demo 当前仍是 metadata-only，知识检索执行会在后续阶段接入。

## Demo 优先的首页

首页现在提供一键运行的确定性 demo。支持的问题会走真实 agent 链路，包括意图识别、SQL 生成、SQL 校验、本地执行、Trace、warnings 和基于结果的回答。

## 评估面板

评估面板会把版本化测试集跑过真实的确定性 agent。每个 case 都会生成 AgentRun、确定性 pass 或 fail、失败原因、Trace 检查和本地 Bad Case Review。本版本不调用 LLM judge。

## 作品集截图页面

项目新增 `/showcase` 路由，用于作品集截图。Agent、Guardrail 和 Evaluation 视图都来自真实的确定性执行和评估结果。使用 `capture=true` 可以隐藏非必要 UI。

## 公共版平台布局

该布局是原创的公开作品集版本，只借鉴常见分析平台模式：左侧边栏、最近会话、可用 Topics、主内容区、Topic 信息卡、摘要、数据源概览、术语预览、右侧目录、示例问题 chips 和输入框。

## 合成 Topics

- Retail Growth Demo
- Experiment Metrics Demo
- Knowledge Base Demo

## 语义模型

schema 层定义了所有公开合成数据表：

- `orders`
- `traffic`
- `campaigns`
- `products`
- `customers_masked`
- `refunds`
- `experiment_events`

`customer_id` 和 `is_sensitive_masked` 等敏感字段已经被标记，便于后续 guardrails 阻止用户级导出和不安全访问。

## 指标目录

指标目录包含 revenue、orders、average order value、refund amount、refund rate、sessions、conversion rate、add-to-cart rate、checkout start rate、campaign spend、revenue per session、GMV、active users、checkout abandonment rate 和 payment completion rate。

## 知识库

知识层保存公开、通用的指标定义、实验对比、活动基线、最新周完整性、因果表述谨慎、敏感数据政策和歧义处理说明。

## 确定性执行状态

点击 Retail Growth Demo 或 Experiment Metrics Demo 的已支持示例问题，再点击 Run，会在本地执行确定性工作流。暂不支持的问题会返回建议问题。敏感客户导出请求会在 SQL 生成前被阻断。

## 下一阶段：Skill Runner 和 HTML Reports

下一阶段可以扩展确定性的 Skill Runner 和 HTML Report 生成流程。可选 LLM 集成仍应放在用户显式配置 API key 之后。

## 视觉产品外壳状态

当前版本实现了公共版产品外壳、合成 Topic 层、语义模型、指标目录、知识库、确定性 SQL 执行、校验、trace、图表、回答和 guardrails。Demo 不伪造 SQL、trace、图表、回答或评测结果。

## 系统架构

更多细节见 [docs/architecture.zh.md](docs/architecture.zh.md)。

## 本地运行

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run typecheck
npm run test
npm run build
```

## 保密边界

本项目只使用合成数据或公开数据，不包含任何内部公司数据、代码、提示词、schema、截图、业务指标、路线图细节或专有工作流。

English boundary statement: This project uses synthetic or public data only. It does not contain internal company data, code, prompts, schemas, screenshots, business metrics, roadmap details, or proprietary workflows.

## 路线图

- 扩展确定性 Skill Runner 覆盖范围。
- 增加 HTML report 生成和可编辑报告流程。
- 强化 SQL 解析与校验边界场景。
- 仅在用户显式配置 API key 后增加可选 LLM 集成。
