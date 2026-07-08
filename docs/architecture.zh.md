# 系统架构

Data Agent Sandbox 是一个纯浏览器的公开 AI 辅助分析治理平台模拟项目。当前阶段已经把公共产品外壳接入基于合成数据的确定性 BI Agent 执行链路。

## UI Shell

React 外壳包含：

- 左侧边栏：应用名称、最近会话、可用 Topics、禁用的新建 Topic 按钮和演示用户区域。
- 顶部栏：当前页面标题和占位操作。
- Overview 页面：hero 区域、平台能力卡片和 Topic 卡片。
- Topic 详情页：信息、摘要、数据源、术语表、示例问题、右侧目录和底部输入框。
- Evaluation 页面：版本化测试集选择、summary cards、failure mode distribution、case table、trace details 和本地 bad-case review queue。
- Showcase 路由：提供 agent、guardrail 和 evaluation 的截图视图，全部来自真实确定性输出。

输入框会把已支持的 Retail Growth Demo 和 Experiment Metrics Demo 问题交给确定性 agent runner 执行。Knowledge Base Demo 当前仍是 metadata-only。

## Topic 层

`src/topics/topicCatalog.ts` 定义三个公开 Topic：

- Retail Growth Demo
- Experiment Metrics Demo
- Knowledge Base Demo

每个 Topic 都包含 owner、访问级别、来源类型、时间戳、标签、数据源、术语表、示例问题、最近会话和治理状态。

## 数据层

`src/data/syntheticEcommerce.ts` 在本地生成以下合成数据：

- `orders`
- `traffic`
- `campaigns`
- `products`
- `customers_masked`
- `refunds`
- `experiment_events`

数据包含至少 180 天、4 个公开 region、4 个公开 channel、5 个公开品类、多个活动、两个实验、一个收入下跌区间、一个退款峰值区间和一个最新周不完整场景。

## 指标层

`src/agent/metricCatalog.ts` 定义指标元数据，包括公式、来源表、必需字段、允许维度、默认时间粒度、注意事项和敏感等级。指标目录会通过测试与 schema 元数据进行一致性校验。

## 知识层

`src/agent/knowledgeBase.ts` 保存公开通用知识条目，覆盖指标定义、实验对比、活动基线、最新周完整性、因果表述谨慎、敏感数据政策和歧义处理。

## Agent 执行层

`src/agent/runAgent.ts` 负责编排确定性链路：

- `intentRouter.ts` 对已支持问题和敏感请求做分类。
- `sqlGenerator.ts` 选择指标、表和只读 SQL 模板。
- `sqlValidator.ts` 校验表、字段、只读 SQL、显式字段、日期过滤和敏感字段选择。
- `sqlExecutor.ts` 在 AlaSQL 中注册合成表，并在本地执行已校验 SQL。
- `chartSpec.ts` 把执行结果映射成图表规格。
- `answerGenerator.ts` 基于执行结果和 warnings 生成有依据的回答。
- `trace.ts` 记录可审查的 step-level trace。

UI 会展示 final answer、intent、selected metrics、selected tables、SQL、validation results、result rows、chart preview、trace timeline、warnings、guardrail decision 和 suggested follow-ups。

## 评估层

`src/evaluation/testset.ts` 定义公开的版本化回归测试集，覆盖核心 agent 行为和 governance 行为。`src/evaluation/evaluator.ts` 会把每个 case 跑过真实的确定性 `runAgent` 链路。`src/evaluation/scoringRules.ts` 用确定性规则评分，覆盖 intent、metrics、tables、SQL validation、execution、guardrails、warnings、grounded answers、trace completeness 和 blocked-request safety。

评估面板不会调用 LLM judge 或外部 API。Bad Case Review Queue 只保存在本地 UI state 中。

## 截图层

`/showcase` 支持 `view=agent`、`view=guardrail` 和 `view=evaluation`。这些视图会调用真实的 `runAgent` 或 `runEvaluation`，并可通过 `capture=true` 隐藏导航，方便作品集截图。

## 下一层

下一层是确定性 Skill Runner 覆盖和 HTML report 生成，之后继续扩展可编辑报告，并仅在用户显式配置 API key 后增加可选 LLM 集成。
