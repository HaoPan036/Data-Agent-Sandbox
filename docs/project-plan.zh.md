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
- 增加数据、语义元数据、Topic、页面、SQL 生成、SQL 校验、SQL 执行、agent run 和文档覆盖测试。

## 当前边界

- 当前应用会在本地执行已支持的 Retail Growth Demo 和 Experiment Metrics Demo 问题。
- Knowledge Base Demo 在接入检索执行前仍是 metadata-only。
- UI 不伪造 SQL、Trace、图表、回答或评测结果。

## 下一阶段：评测看板和 bad case review

- 增加支持问题的 evaluation dashboard。
- 增加 bad-case review，覆盖 expected intent、SQL、answer 和 warning checks。
- 增加可编辑报告 review 状态和导出。
- 强化 SQL 解析与校验边界场景。

## 后续版本

- 增加更多公开或合成数据集。
- 增加更多业务问题模板。
- 强化 SQL 解析与校验。
- 支持报告导出。
- 在用户显式配置后增加可选 LLM 支持。
