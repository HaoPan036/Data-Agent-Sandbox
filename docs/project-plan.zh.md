# 项目计划

## 目标

构建一个公开的 BI 数据 Agent Sandbox，证明自然语言问题可以在不需要 LLM API key 的情况下，转换为经过校验的 SQL、合成数据执行结果、图表、Trace、评估结果和可编辑报告。

## 已实现

- 基于 React、Vite、TypeScript、Recharts、Vitest 和 AlaSQL 的应用。
- 确定性合成电商与实验数据、Topic 目录、语义 Schema、指标目录和公开知识条目。
- Retail Growth Demo 和 Experiment Metrics Demo 共十个准备好的可执行问题。
- 共享确定性 `runAgent` 核心，覆盖意图路由、指标和表选择、SQL 生成、校验、隔离的 AlaSQL 执行、图表、回答、Trace、Warnings 和 Guardrails。
- Node/Vercel `POST /api/runs` 接口，支持 Zod 请求校验、服务端 Run ID、错误清理和 NDJSON v1 流式传输。
- Vite Dev 和 Preview 使用同一个 API Handler Adapter。
- 浏览器会严格校验传输协议和最终结果完整性，校验通过后才展示运行完成。
- Overview Quick Demo、Topic 执行、Agent Showcase 和 Guardrail Showcase 已接入 API。
- 浏览器端 Evaluation Dashboard，包含版本化确定性测试集、评分、Trace Review、失败汇总和本地 Bad Case Review Queue。
- 浏览器端 Skill Runner，包含确定性执行、评估摘要，以及沙箱化、可编辑、可下载的 HTML 报告。
- 进程内契约测试会让生产客户端模块和 Parser 直接经过真实 API Handler，但不会启动浏览器或 HTTP Server；CI 会自动执行安装、类型检查、测试、Lint 和构建。
- 公开 Vercel 部署，以及 Agent、Guardrail、Evaluation 的直接演示地址。

## 当前边界

- 交互式运行会经过真实 Serverless API，并在合成数据上真正执行 AlaSQL；不会人为等待来制造过程感，也不会返回预先写好的结果。
- Evaluation 和 Skills 仍在浏览器中执行 `runAgent` 和 AlaSQL。
- Knowledge Base Demo 只展示元数据。
- 当前没有 LLM Provider、鉴权、持久化数据库、运行历史、外部数仓、上传流程或第三方数据/模型 API。
- 客户端取消不能抢占已经开始的同步服务端计算。
- 浏览器端 AlaSQL 仍依赖动态编译，因此严格 CSP 当前处于 Report-Only；其他已配置安全响应头会强制执行。

## 下一步

1. 将 Evaluation 和 Skills 执行放到服务端 API 后，再正式强制启用严格 CSP。
2. 增加持久化运行历史、评估产物和报告版本。
3. 增加生产级鉴权、分布式限流和可观测性。
4. 将较长运行改为异步、可抢占执行，实现真正取消。
5. 按路由和功能拆分前端 Bundle。

## 后续选项

- 在确定性请求、SQL 校验、响应、Trace 和评估契约之后接入可选 LLM Provider，同时保持无 Key 确定性路径始终可运行。
- 增加更多合成或公开数据集和问题模板。
- 只增加面向公开数据集的 Connector；本 Sandbox 始终只使用合成数据或公开数据。
