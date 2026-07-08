import type { QuestionIntent, SupportedIntentId } from "./types";

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

