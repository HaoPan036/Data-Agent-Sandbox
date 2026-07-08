# BI Data Agent Sandbox

## What This Project Is

BI Data Agent Sandbox is a public, runnable React and TypeScript demo that shows how a small data agent can turn natural language business questions into deterministic intent routing, validated SQL, executed results, charts, traces, evaluation results, and editable HTML reports.

## Why It Exists

The project answers a simple question: does the data-agent workflow work end to end? The first version avoids API keys and model uncertainty so the core BI flow can be inspected, tested, and improved in public.

## What Works Today

- Browser-only Vite app with React, TypeScript, Recharts, Vitest, and AlaSQL.
- Synthetic ecommerce dataset executed locally in the browser.
- Deterministic intent router for supported BI questions.
- Template SQL generation, SQL validation, SQL execution, charts, traces, evaluation, and editable report drafts.
- No backend, database server, auth, or external runtime API dependency.

## Architecture

The sandbox follows this path:

1. Natural language question.
2. Deterministic intent router.
3. Metric catalog and schema.
4. SQL template generator.
5. Read-only SQL validator.
6. AlaSQL execution against synthetic browser data.
7. Recharts visualization, trace timeline, evaluation suite, and editable HTML report.

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

- Add more synthetic datasets and BI intents.
- Expand the validator with stronger SQL parsing.
- Add richer evaluation scoring and trace exports.
- Add optional LLM integration behind explicit API-key configuration.
- Add report export formats.

# BI Data Agent Sandbox 中文说明

## 项目简介

BI Data Agent Sandbox 是一个公开可运行的 React 与 TypeScript 演示项目，用来展示一个小型数据代理如何把自然语言业务问题转换为确定性的意图识别、经过校验的 SQL、执行结果、图表、追踪记录、评测结果和可编辑 HTML 报告。

## 为什么要做

这个项目首先回答一个问题：这个数据代理流程到底能不能端到端跑通？第一版不依赖 API key，也不依赖大模型的不确定输出，先把核心 BI 工作流做成可检查、可测试、可公开迭代的版本。

## 当前可运行能力

- 基于 Vite、React、TypeScript、Recharts、Vitest 和 AlaSQL 的纯浏览器应用。
- 使用本地合成电商数据，直接在浏览器中执行 SQL。
- 针对受支持的 BI 问题进行确定性意图路由。
- 支持 SQL 模板生成、SQL 校验、SQL 执行、图表、追踪、评测和可编辑报告草稿。
- 第一版没有后端、数据库服务器、登录鉴权或外部运行时 API 依赖。

## 系统架构

当前流程如下：

1. 输入自然语言问题。
2. 确定性意图路由。
3. 指标目录与数据 schema。
4. SQL 模板生成。
5. 只读 SQL 校验。
6. 使用 AlaSQL 在浏览器中查询合成数据。
7. 使用 Recharts、追踪时间线、评测套件和可编辑 HTML 报告展示结果。

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

- 增加更多合成数据集和 BI 意图。
- 使用更强的 SQL 解析方式扩展校验器。
- 增加更完整的评测评分与追踪导出。
- 在显式配置 API key 后增加可选 LLM 集成。
- 增加报告导出格式。

