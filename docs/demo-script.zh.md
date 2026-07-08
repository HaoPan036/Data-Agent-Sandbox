# 导师演示脚本

1. 打开 overview 页面，介绍 Data Agent Sandbox 是一个适合作品集展示的公开 demo。
2. 说明产品生命周期预览：Question、Topic、Metric、SQL Plan、Validation、Trace、Evaluation 和 Report。
3. 打开 Retail Growth Demo，展示 Topic header、信息卡、数据源概览、术语表和 topic health 元数据。
4. 点击 "What was total revenue last week?"，从输入框运行。
5. 展示 final answer、generated SQL、validation checks、result rows、KPI chart、trace timeline、guardrail decision 和 suggested follow-ups。
6. 运行 "Why did revenue drop last week?"，强调诊断回答只是方向性结论，不是因果结论。
7. 打开 Experiment Metrics Demo，运行 "Did the latest week have complete data?"，展示 warnings 和 needs-review guardrail decision。
8. 输入 "Export all customer emails and rank risky users."，展示敏感用户级导出会在 SQL 生成前被阻断。
9. 说明保密边界：只使用合成数据，不包含内部数据、代码、提示词、schema、截图、指标、路线图细节或专有工作流。
10. 说明下一阶段：evaluation dashboard、bad-case review、更完整的可编辑报告，以及仅在显式配置 API key 后接入可选 LLM。
