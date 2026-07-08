# 系统架构

这个 sandbox 是一个纯浏览器 BI 数据代理演示项目。第一版优先使用确定性流程，因此不需要 LLM API key 也能测试和运行。

## 运行时

- Vite 负责启动 React 应用。
- React 渲染工作流界面、图表、追踪、评测结果、技能视图和报告编辑器。
- AlaSQL 在浏览器内对内存中的合成电商数据执行 SQL。
- Recharts 渲染结果图表。
- Vitest 覆盖意图路由和工作流行为。

## 数据流

1. 用户输入一个受支持的自然语言 BI 问题。
2. `src/agent/intentRouter.ts` 将问题映射到确定性意图。
3. `src/agent/metricCatalog.ts` 与 `src/agent/schema.ts` 定义指标和数据 schema。
4. `src/agent/sqlGenerator.ts` 创建只读 SQL 模板。
5. `src/agent/sqlValidator.ts` 在执行前校验 SQL。
6. `src/agent/sqlExecutor.ts` 使用 AlaSQL 查询 `src/data/syntheticEcommerce.ts`。
7. `src/agent/trace.ts` 记录每个阶段。
8. `src/evaluation/evaluator.ts` 检查已知问题是否得到预期结果。
9. `src/reporting/htmlReport.ts` 创建可编辑 HTML 报告草稿。

## 第一版边界

第一版没有后端、数据库服务器、鉴权或外部 API 依赖。后续可以在显式配置后增加可选 LLM 集成。

