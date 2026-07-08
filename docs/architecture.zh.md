# 系统架构

Data Agent Sandbox 是一个纯浏览器的公开 AI 辅助分析治理平台模拟项目。当前阶段聚焦产品外壳、Topic 层、语义模型、指标目录、知识库和合成数据基础。

## UI Shell

React 外壳包含：

- 左侧边栏：应用名称、最近会话、可用 Topics、禁用的新建 Topic 按钮和演示用户区域。
- 顶部栏：当前页面标题和占位操作。
- Overview 页面：hero 区域、平台能力卡片和 Topic 卡片。
- Topic 详情页：信息、摘要、数据源、术语表、示例问题、右侧目录和底部输入框。

当前输入框还不执行分析，只保存本地问题状态，并显示下一阶段实现执行的提示。

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

## 未来 Agent 执行层

下一阶段可以把选中的 Topic 问题连接到意图路由、SQL 生成、SQL 校验、本地执行、trace、evaluation 和可编辑报告。当前阶段刻意避免在新 Topic UI 中伪造 SQL 或最终答案。

