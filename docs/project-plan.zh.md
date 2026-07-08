# 项目计划

## 已完成

- 创建 Vite React TypeScript 应用。
- 增加合成订单、流量、活动、商品、脱敏客户、退款和实验数据。
- 增加 Topic 目录、语义 schema 元数据、指标目录和知识库。
- 构建公共版平台外壳，包括 overview、Topic 详情页、侧边栏、最近会话、Topic 卡片、右侧目录、示例问题和输入框。
- 完成适合作品集评审的 UI polish，包括设计 tokens、紧凑 hero、生命周期预览、优化卡片、Topic health 元数据和更明确的下一阶段文案。
- 增加数据、语义元数据、Topic、页面、非执行行为和文档覆盖测试。

## 当前边界

- 当前应用是 execution-ready shell。
- Topic 问题执行刻意还未接入。
- UI 不伪造 SQL、Trace、图表、回答或评测结果。

## 下一阶段：确定性执行工作流

- 将选中的示例问题路由到确定性 intent。
- 基于 Topic 和指标元数据生成 SQL plan。
- 使用只读和敏感数据 guardrails 校验 SQL。
- 对合成数据进行本地安全 SQL 执行。
- 记录 trace events 以支持调试和 review。
- 增加确定性 evaluation checks。
- 生成有依据的回答草稿和可编辑报告。

## 后续版本

- 增加更多公开或合成数据集。
- 增加更多业务问题模板。
- 强化 SQL 解析与校验。
- 支持报告导出。
- 在用户显式配置后增加可选 LLM 支持。

