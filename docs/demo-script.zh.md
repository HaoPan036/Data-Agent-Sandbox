# 导师演示脚本

1. 打开 Overview。
2. 用 refund rate 问题运行 Quick Demo。
3. 展示 answer、SQL preview、row count 和 trace count。
4. 运行 revenue drop 问题。
5. 运行 sensitive export request。
6. 解释 blocked governance decision。
7. 打开 Evaluation。
8. 选择 Core Regression Testset。
9. 运行 Evaluation。
10. 展示 pass rate 和 failure mode distribution。
11. 打开一个 case trace。
12. 把一个 failed case 加入 Bad Case Review Queue。
13. 说明 bad cases 如何变成 regression tests。
14. 打开完整 Retail Growth Demo 页面查看详细 trace。
15. 回到 Overview 并打开 Skill Hub。
16. 运行 Demo Skill Pipeline。
17. 展示完成的 skill timeline、evaluation summary、可编辑 HTML report preview 和 Download HTML。
18. 说明保密边界：只使用合成数据，不包含内部数据、代码、提示词、schema、截图、指标、路线图细节或专有工作流。
19. 说明下一阶段：更丰富的报告模板、更多公开或合成数据、更强 SQL 校验，以及仅在显式配置 API key 后接入可选 LLM。

## 截图流程

1. 打开 `/showcase?view=agent&capture=true`。
2. 截取成功 agent run。
3. 打开 `/showcase?view=guardrail&capture=true`。
4. 截取被阻断的敏感请求。
5. 打开 `/showcase?view=evaluation&capture=true`。
6. 截取 regression evaluation dashboard。
7. 将这些截图用于个人作品集。
