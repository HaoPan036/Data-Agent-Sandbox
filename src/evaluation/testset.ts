import type { SupportedIntentId } from "../agent/types";

export interface EvaluationCase {
  id: string;
  question: string;
  expectedIntent: SupportedIntentId;
  minRows: number;
}

export const evaluationTestset: EvaluationCase[] = [
  {
    id: "eval-monthly-revenue",
    question: "Show monthly revenue trend for 2026.",
    expectedIntent: "monthly_revenue_trend",
    minRows: 6
  },
  {
    id: "eval-region-revenue",
    question: "Which region generated the most revenue?",
    expectedIntent: "regional_revenue",
    minRows: 4
  },
  {
    id: "eval-category-ranking",
    question: "Rank top product categories by revenue.",
    expectedIntent: "top_categories",
    minRows: 4
  },
  {
    id: "eval-channel-profit",
    question: "Compare profit by channel.",
    expectedIntent: "profit_by_channel",
    minRows: 4
  }
];

