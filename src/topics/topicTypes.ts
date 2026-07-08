export type TopicAccessLevel = "Public Demo" | "Portfolio Demo";
export type TopicSourceType = "Synthetic Tables" | "Markdown Knowledge" | "CSV Demo";
export type TopicStatus = "Active" | "Draft";

export interface TopicOwnership {
  ownerName: string;
  ownerEmail: string;
}

export interface TopicDataSource {
  id: string;
  name: string;
  sourceType: TopicSourceType;
  tableName?: string;
  description: string;
  freshness: string;
  rowCountLabel: string;
}

export interface TopicGlossaryItem {
  term: string;
  definition: string;
  metricId?: string;
  tableName?: string;
}

export interface TopicSession {
  id: string;
  title: string;
  createdAt: string;
  status: "Draft" | "Reviewed" | "Evaluated";
}

export interface TopicGovernanceStatus {
  sqlValidation: "Ready" | "Planned";
  sensitiveDataPolicy: "Ready" | "Planned";
  evaluation: "Ready" | "Planned";
  reportReview: "Ready" | "Planned";
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  owner: TopicOwnership;
  accessLevel: TopicAccessLevel;
  sourceType: TopicSourceType;
  createdAt: string;
  updatedAt: string;
  status: TopicStatus;
  tags: string[];
  dataSources: TopicDataSource[];
  glossary: TopicGlossaryItem[];
  sampleQuestions: string[];
  sessions: TopicSession[];
  governanceStatus: TopicGovernanceStatus;
}

