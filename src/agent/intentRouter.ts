import type { AgentIntent, QuestionIntent, SupportedIntentId } from "./types";

interface IntentRule {
  id: SupportedIntentId;
  label: string;
  keywords: string[];
}

const intentRules: IntentRule[] = [
  {
    id: "regional_revenue",
    label: "Revenue by region",
    keywords: ["region", "regional", "geo", "market", "where", "location"]
  },
  {
    id: "top_categories",
    label: "Top categories by revenue",
    keywords: ["category", "categories", "product", "products", "top", "rank"]
  },
  {
    id: "profit_by_channel",
    label: "Profit by channel",
    keywords: ["profit", "margin", "channel", "paid", "organic", "email"]
  },
  {
    id: "monthly_revenue_trend",
    label: "Monthly revenue trend",
    keywords: ["month", "monthly", "trend", "time", "over time", "revenue", "sales"]
  }
];

export const DEFAULT_DEMO_QUESTION =
  "How did monthly revenue trend in the first half of 2026?";

export function normalizeQuestion(question: string) {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

export function routeIntent(question: string): QuestionIntent {
  const normalizedQuestion = normalizeQuestion(question || DEFAULT_DEMO_QUESTION);
  const ranked = intentRules
    .map((rule) => {
      const matchedKeywords = rule.keywords.filter((keyword) =>
        normalizedQuestion.includes(keyword)
      );

      return {
        rule,
        matchedKeywords,
        score: matchedKeywords.length
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const selected =
    best && best.score > 0
      ? best
      : {
          rule: intentRules.find(
            (rule) => rule.id === "monthly_revenue_trend"
          ) as IntentRule,
          matchedKeywords: [],
          score: 0
        };

  return {
    id: selected.rule.id,
    label: selected.rule.label,
    confidence: selected.score === 0 ? 0.58 : Math.min(0.95, 0.64 + selected.score * 0.08),
    matchedKeywords: selected.matchedKeywords,
    normalizedQuestion
  };
}

export interface AgentIntentRoute {
  intent: AgentIntent;
  confidence: number;
  matchedRules: string[];
  normalizedQuestion: string;
}

function hasAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

export function classifyIntent(question: string): AgentIntentRoute {
  const normalizedQuestion = normalizeQuestion(question);
  const matchedRules: string[] = [];

  if (
    hasAny(normalizedQuestion, [
      "export all",
      "customer email",
      "customer emails",
      "rank risky",
      "risky users",
      "ignore previous rules",
      "select all customer",
      "all customer records",
      "customer records",
      "personal data",
      "user-level"
    ])
  ) {
    matchedRules.push("sensitive-user-level-request");

    return {
      intent: "governance_sensitive_request",
      confidence: 0.98,
      matchedRules,
      normalizedQuestion
    };
  }

  if (hasAny(normalizedQuestion, ["complete data", "completeness", "latest week complete"])) {
    matchedRules.push("latest-week-completeness");

    return {
      intent: "data_completeness_check",
      confidence: 0.94,
      matchedRules,
      normalizedQuestion
    };
  }

  if (hasAny(normalizedQuestion, ["campaign", "c001", "performance review"])) {
    matchedRules.push("campaign-review");

    return {
      intent: "campaign_review",
      confidence: 0.94,
      matchedRules,
      normalizedQuestion
    };
  }

  if (
    hasAny(normalizedQuestion, [
      "experiment",
      "variant",
      "variants",
      "checkout abandonment",
      "revenue per session",
      "funnel conversion"
    ])
  ) {
    matchedRules.push("experiment-analysis");

    return {
      intent: "experiment_analysis",
      confidence: 0.92,
      matchedRules,
      normalizedQuestion
    };
  }

  if (hasAny(normalizedQuestion, ["why", "drop", "decline", "driver", "diagnostic"])) {
    matchedRules.push("diagnostic");

    return {
      intent: "diagnostic_analysis",
      confidence: 0.9,
      matchedRules,
      normalizedQuestion
    };
  }

  if (
    hasAny(normalizedQuestion, [
      "trend",
      "trends",
      "daily",
      "weekly",
      "over the last",
      "last 30 days",
      "last 8 weeks"
    ])
  ) {
    matchedRules.push("trend");

    return {
      intent: "trend_analysis",
      confidence: 0.9,
      matchedRules,
      normalizedQuestion
    };
  }

  if (hasAny(normalizedQuestion, ["highest", "compare", "comparison", "which product category"])) {
    matchedRules.push("comparison");

    return {
      intent: "metric_comparison",
      confidence: 0.88,
      matchedRules,
      normalizedQuestion
    };
  }

  if (hasAny(normalizedQuestion, ["total revenue", "what was", "last week"])) {
    matchedRules.push("metric-lookup");

    return {
      intent: "metric_lookup",
      confidence: 0.86,
      matchedRules,
      normalizedQuestion
    };
  }

  return {
    intent: "unknown",
    confidence: 0.2,
    matchedRules,
    normalizedQuestion
  };
}
