# 项目计划

## 已完成

- 创建 Vite React TypeScript 应用。
- 增加合成订单、流量、活动、商品、脱敏客户、退款和实验数据。
- 增加 Topic 目录、语义 schema 元数据、指标目录和知识库。
- 构建公共版平台外壳，包括 overview、Topic 详情页、侧边栏、最近会话、Topic 卡片、右侧目录、示例问题和输入框。
- 完成适合作品集评审的 UI polish，包括设计 tokens、紧凑 hero、生命周期预览、优化卡片、Topic health 元数据和执行覆盖文案。
- 接入 Retail Growth Demo 和 Experiment Metrics Demo 示例问题的确定性执行。
- 增加 intent routing、SQL generation、SQL validation、AlaSQL execution、trace steps、chart specs、grounded answers、warnings 和 guardrail decisions。
- 增加 SQL、validation checks、结果行、chart preview、trace timeline、warnings、guardrail decision 和 suggested follow-ups 的 UI 面板。
- 实现 demo 优先的 Overview，支持一键运行确定性 quick run。
- 实现 Evaluation Dashboard，包含版本化测试集、真实 AgentRun 执行、确定性评分、Trace review、failure mode 汇总和本地 Bad Case Review Queue。
- 增加数据、语义元数据、Topic、页面、SQL 生成、SQL 校验、SQL 执行、agent run 和文档覆盖测试。

## 当前边界

- 当前应用会在本地执行已支持的 Retail Growth Demo 和 Experiment Metrics Demo 问题。
- Evaluation Dashboard 会通过真实确定性 agent 执行测试集，不伪造评测结果。
- Knowledge Base Demo 在接入检索执行前仍是 metadata-only。
- UI 不伪造 SQL、Trace、图表、回答或评测结果。

## 下一阶段：Skill Runner 和 HTML Reports

- 扩展公开技能的确定性 Skill Runner 覆盖范围。
- 增加 HTML report 生成和可编辑报告流程。
- 强化 SQL 解析与校验边界场景。

## 后续版本

- 增加更多公开或合成数据集。
- 增加更多业务问题模板。
- 强化 SQL 解析与校验。
- 支持报告导出。
- 在用户显式配置后增加可选 LLM 支持。
