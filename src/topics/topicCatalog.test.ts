import { describe, expect, it } from "vitest";
import { topicCatalog, validTopicSourceTypes } from "./topicCatalog";

describe("topic catalog", () => {
  it("defines complete demo topics", () => {
    expect(topicCatalog).toHaveLength(3);

    for (const topic of topicCatalog) {
      expect(topic.dataSources.length).toBeGreaterThanOrEqual(1);
      expect(topic.glossary.length).toBeGreaterThanOrEqual(8);
      expect(topic.sampleQuestions.length).toBeGreaterThanOrEqual(5);
      expect(topic.sessions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses valid source types", () => {
    for (const topic of topicCatalog) {
      expect(validTopicSourceTypes).toContain(topic.sourceType);

      for (const source of topic.dataSources) {
        expect(validTopicSourceTypes).toContain(source.sourceType);
      }
    }
  });
});

