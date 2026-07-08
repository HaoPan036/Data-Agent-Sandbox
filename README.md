# Data Agent Sandbox

## What This Project Is

Data Agent Sandbox is a public, runnable simulation of an AI assisted analysis governance platform. It demonstrates how a data agent platform can organize topics, semantic models, metric catalogs, knowledge base entries, sample questions, governance state, and later deterministic agent workflows.

This project uses synthetic or public data only. It does not contain internal company data, code, prompts, schemas, screenshots, business metrics, roadmap details, or proprietary workflows.

## Why It Exists

The project answers a simple question: can a small BI data-agent workflow be made observable, testable, governed, and portfolio-safe? The first versions avoid LLM API keys and external services so the core product shape can be inspected locally.

## What Works Today

- Vite, React, TypeScript, Vitest, Recharts, and AlaSQL setup.
- Public platform shell with left navigation, recent sessions, available topics, top actions, topic detail pages, contents rail, sample question chips, and bottom composer.
- Synthetic ecommerce, traffic, campaign, product, masked customer, refund, and experiment event tables.
- Semantic schema metadata, metric catalog, topic catalog, and lightweight knowledge base.
- Deterministic local test coverage for data, topics, schema, metrics, knowledge entries, and pages.

## What This Stage Adds

This stage adds the first public product shell and data foundation:

- Multi-table synthetic ecommerce data over 186 days.
- A known revenue drop period, refund spike period, and incomplete latest week scenario.
- Schema metadata with grain, date columns, allowed joins, sensitive columns, and sample questions.
- A governed metric catalog with formulas, source tables, required columns, dimensions, caveats, and sensitivity levels.
- Public knowledge base entries for definitions, caveats, baselines, causal caution, and sensitive data policy.
- Three demo topics with data sources, glossary items, sample questions, and recent sessions.

## Public Platform Layout

The layout is an original public portfolio version inspired by common analytics platform patterns: left sidebar, recent sessions, available topics, main content area, topic information card, summary, data source overview, glossary preview, contents rail, sample question chips, and composer.

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

## Why Execution Is Not Implemented Yet

This stage intentionally focuses on the topic platform shell and semantic foundation. Clicking a sample question or Run updates local UI state and shows: `Agent execution will be implemented in the next stage.` It does not fake SQL, answers, charts, or final analysis for topic questions.

## Next Stage: Deterministic Agent Workflows

The next stage can connect selected topic questions to deterministic routing, SQL generation, SQL validation, local execution, trace review, evaluation, and editable reports.

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

- Connect topic sample questions to deterministic agent workflows.
- Expand SQL validation and sensitive-data guardrails.
- Add trace review and evaluation views to the new shell.
- Add report export and editable review states.
- Add optional LLM integration only behind explicit API-key configuration.

# Data Agent Sandbox 中文说明

## 项目简介

Data Agent Sandbox 是一个公开可运行的 AI 辅助分析治理平台模拟项目。它展示数据 Agent 平台如何组织 Topic、语义模型、指标目录、知识库、示例问题、治理状态，以及后续的确定性 Agent 工作流。

本项目只使用合成数据或公开数据，不包含任何内部公司数据、代码、提示词、schema、截图、业务指标、路线图细节或专有工作流。

## 为什么要做

这个项目回答一个问题：一个小型 BI 数据 Agent 工作流能否做到可观察、可测试、可治理，并且适合公开作品集展示？前几个版本不依赖 LLM API key 或外部服务，便于在本地检查产品形态。

## 当前可运行能力

- Vite、React、TypeScript、Vitest、Recharts 和 AlaSQL 基础工程。
- 公共版平台外壳：左侧导航、最近会话、可用 Topics、顶部操作、Topic 详情页、右侧目录、示例问题 chips、底部输入框。
- 合成订单、流量、活动、商品、脱敏客户、退款、实验事件数据表。
- 语义 schema、指标目录、Topic 目录和轻量知识库。
- 针对数据、Topic、schema、指标、知识库和页面的本地测试。

## 本阶段新增内容

本阶段新增第一版公共产品外壳与数据基础：

- 覆盖 186 天的多表合成电商数据。
- 已知收入下跌区间、退款峰值区间和最新周不完整场景。
- 包含粒度、默认日期列、允许 join、敏感字段和示例问题的 schema 元数据。
- 包含公式、来源表、必需字段、维度、注意事项和敏感等级的指标目录。
- 关于指标定义、实验对比、活动基线、最新周完整性、因果表述谨慎、敏感数据政策和歧义处理的公共知识库。
- 三个演示 Topic，并包含数据源、术语表、示例问题和最近会话。

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

## 为什么本阶段还不执行查询

本阶段刻意聚焦 Topic 平台外壳和语义基础。点击示例问题或 Run 只会更新本地 UI 状态，并显示：`Agent execution will be implemented in the next stage.` 本阶段不会为 Topic 问题伪造 SQL、答案、图表或最终分析。

## 下一阶段：确定性 Agent 工作流

下一阶段可以把选中的 Topic 问题连接到确定性路由、SQL 生成、SQL 校验、本地执行、trace review、evaluation 和可编辑报告。

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

- 将 Topic 示例问题连接到确定性 Agent 工作流。
- 扩展 SQL 校验和敏感数据 guardrails。
- 在新 shell 中增加 trace review 和 evaluation 视图。
- 增加报告导出和可编辑 review 状态。
- 仅在用户显式配置 API key 后增加可选 LLM 集成。

