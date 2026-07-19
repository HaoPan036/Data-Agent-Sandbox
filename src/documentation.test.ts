// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(`${process.cwd()}/${path}`, "utf8");

const readme = readProjectFile("README.md");
const architectureEn = readProjectFile("docs/architecture.en.md");
const architectureZh = readProjectFile("docs/architecture.zh.md");
const documentationCorpus = [
  readme,
  architectureEn,
  architectureZh,
  readProjectFile("docs/confidentiality.en.md"),
  readProjectFile("docs/confidentiality.zh.md"),
  readProjectFile("docs/demo-script.en.md"),
  readProjectFile("docs/demo-script.zh.md"),
  readProjectFile("docs/project-plan.en.md"),
  readProjectFile("docs/project-plan.zh.md")
].join("\n");

const confidentialityStatement =
  "This project uses synthetic or public data only. It does not contain internal company data, code, prompts, schemas, screenshots, business metrics, roadmap details, or proprietary workflows.";
const confidentialityStatementZh =
  "本项目只使用合成数据或公开数据。项目不包含任何公司内部数据、代码、提示词、Schema、截图、业务指标、路线图细节或专有工作流。";

describe("documentation contract", () => {
  it("keeps the required English and Chinese README sections", () => {
    for (const heading of [
      "# BI Data Agent Sandbox",
      "## What This Project Is",
      "## Why It Exists",
      "## What Works Today",
      "## Architecture",
      "## How to Run Locally",
      "## Confidentiality Boundary",
      "## Roadmap",
      "## 项目简介",
      "## 为什么要做",
      "## 当前可运行能力",
      "## 系统架构",
      "## 本地运行",
      "## 保密边界",
      "## 路线图"
    ]) {
      expect(readme).toContain(heading);
    }
  });

  it("preserves the bilingual confidentiality boundary", () => {
    expect(readme).toContain(confidentialityStatement);
    expect(readme).toContain(confidentialityStatementZh);
  });

  it("documents the API transport, in-process contract test, and execution placement", () => {
    expect(readme).toContain("POST /api/runs");
    expect(readme).toContain("ndjson-v1");
    expect(readme).toContain("an in-process contract test");
    expect(readme).toContain("进程内契约测试");
    expect(architectureEn).toContain(
      "| Topic, Quick Demo, Agent Showcase, Guardrail Showcase | Node/Vercel `/api/runs`; Vite adapter locally | None |"
    );
    expect(architectureEn).toContain(
      "| Evaluation Dashboard and Evaluation Showcase | Browser `runAgent` + AlaSQL | Results and review queue remain in browser state |"
    );
    expect(architectureZh).toContain(
      "| Topic、Quick Demo、Agent Showcase、Guardrail Showcase | Node/Vercel `/api/runs`；本地使用 Vite Adapter | 无 |"
    );
    expect(architectureZh).toContain(
      "| Evaluation Dashboard 和 Evaluation Showcase | 浏览器 `runAgent` + AlaSQL | 结果和 Review Queue 只保存在浏览器状态 |"
    );
  });

  it("documents the transient in-memory database boundary in both languages", () => {
    expect(architectureEn).toContain("persistent database or separate database service");
    expect(architectureEn).toContain("short-lived, isolated in-memory AlaSQL database");
    expect(architectureZh).toContain("持久化数据库或独立数据库服务");
    expect(architectureZh).toContain("短生命周期、相互隔离的内存 AlaSQL 数据库");
  });

  it("rejects paired stale English and Chinese claims without banning truthful boundary text", () => {
    const staleClaimPairs = [
      ["live execution process with a short staged delay", "带短暂分阶段延迟的 live execution process"],
      ["executes the deterministic workflow locally", "会在本地执行确定性工作流"],
      ["real browser client through the real API handler", "真实浏览器客户端经过真实 API Handler"],
      ["public or user-provided connectors", "公开或用户自行提供的 Connector"],
      [
        "public or user-provided, explicitly authorized connectors",
        "公开或用户自行提供并明确授权的 Connector"
      ],
      [
        "`metricCatalog.ts`, `schema.ts`, and `knowledgeBase.ts` provide the public semantic context",
        "`metricCatalog.ts`、`schema.ts` 和 `knowledgeBase.ts` 提供公开语义上下文"
      ]
    ] as const;

    for (const [englishClaim, chineseClaim] of staleClaimPairs) {
      expect(documentationCorpus).not.toContain(englishClaim);
      expect(documentationCorpus).not.toContain(chineseClaim);
    }
  });
});
