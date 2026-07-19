# 公开演示脚本

## 1. 证明 Agent 确实在运行

1. 打开 [BI Data Agent Sandbox](https://data-agent-sandbox.vercel.app/)。
2. 点击 **Open Agent Showcase**，或直接打开 `/showcase?view=agent`。
3. 展示真实输入问题、服务端生成的 Run ID、`ndjson-v1` Transport、事件进度、生成的 SQL、校验、结果行、图表、回答和 Trace。
4. 说明浏览器调用了 `POST /api/runs`；Vercel Node Function 在合成数据上运行确定性 Agent 和 AlaSQL，再把 NDJSON 事件流返回给浏览器。
5. 不要把时间描述成动画效果。项目不会人为等待来制造过程感，界面时长来自真实请求和计算。

## 2. 运行准备好的 Topic 问题

1. 回到 Overview，打开 **Retail Growth Demo**。
2. 选择 **Which product category had the highest refund rate last month?** 并运行。
3. 查看执行进度、Intent 和指标选择、只读 SQL、校验项、结果行、图表、Warnings 和 Trace。
4. 再运行 **Why did revenue drop last week?**，展示多部分诊断结果。
5. 说明 Retail 和 Experiment 可以执行；Knowledge Base Demo 当前只展示元数据。

## 3. 证明 Guardrail 生效

1. 打开 `/showcase?view=guardrail`。
2. 展示要求导出用户级敏感数据的问题。
3. 确认运行在生成 SQL、结果行或图表前被阻断。
4. 说明只有终态 Status 与无执行产物两项都通过校验后，UI 才会标记为安全阻断。

## 4. 展示 Evaluation 和报告

1. 打开 Evaluation 并选择一个版本化测试集。
2. 运行或查看确定性评分、Pass Rate、Failure Modes 和单个 Case Trace。
3. 说明 Evaluation 当前在浏览器中运行同一套 `runAgent` 核心，不调用 LLM Judge。
4. 回到 Overview，打开 Skills Tab，运行 **Demo Skill Pipeline**。
5. 展示 Skill Timeline、Evaluation Summary、可编辑的沙箱报告预览和 HTML 下载。
6. 说明 Evaluation 结果、Review Queue 状态、报告编辑和运行历史目前都不会持久化。

## 5. 说明项目边界

使用这句话：

> 本项目只使用合成数据或公开数据。项目不包含任何公司内部数据、代码、提示词、Schema、截图、业务指标、路线图细节或专有工作流。

同时说明本版本不需要 LLM key、登录、外部数仓或第三方数据/模型 API。

## 截图地址

- Agent：`https://data-agent-sandbox.vercel.app/showcase?view=agent&capture=true`
- Guardrail：`https://data-agent-sandbox.vercel.app/showcase?view=guardrail&capture=true`
- Evaluation：`https://data-agent-sandbox.vercel.app/showcase?view=evaluation&capture=true`
