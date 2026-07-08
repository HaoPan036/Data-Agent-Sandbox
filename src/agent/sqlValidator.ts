import { schemaColumnNames } from "./schema";
import type { ValidationIssue, ValidationResult } from "./types";

const blockedTerms = [
  "alter",
  "attach",
  "create",
  "delete",
  "drop",
  "exec",
  "insert",
  "merge",
  "replace",
  "truncate",
  "update"
];

const allowedSqlWords = new Set([
  "as",
  "asc",
  "by",
  "count",
  "desc",
  "from",
  "group",
  "limit",
  "order",
  "select",
  "sum",
  "where"
]);

export function normalizeSql(sql: string) {
  return sql.trim().replace(/;\s*$/, "");
}

function collectAliases(sql: string) {
  return Array.from(sql.matchAll(/\bas\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)).map(
    (match) => match[1]
  );
}

function findUnknownIdentifiers(sql: string) {
  const aliases = collectAliases(sql);
  const allowedIdentifiers = new Set([
    ...schemaColumnNames,
    ...aliases,
    "orders"
  ]);

  return Array.from(sql.matchAll(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g))
    .map((match) => match[0])
    .filter((identifier) => {
      const lowerIdentifier = identifier.toLowerCase();
      return (
        !allowedSqlWords.has(lowerIdentifier) &&
        !allowedIdentifiers.has(identifier)
      );
    });
}

export function validateSql(sql: string): ValidationResult {
  const normalizedSql = normalizeSql(sql);
  const lowerSql = normalizedSql.toLowerCase();
  const issues: ValidationIssue[] = [];

  if (!lowerSql.startsWith("select ")) {
    issues.push({
      code: "ONLY_SELECT_ALLOWED",
      message: "Only SELECT statements are allowed in this browser sandbox.",
      severity: "error"
    });
  }

  if (!/\bfrom\s+\?/i.test(normalizedSql)) {
    issues.push({
      code: "MUST_USE_BOUND_DATASET",
      message: "Queries must read from the bound synthetic dataset marker: FROM ?.",
      severity: "error"
    });
  }

  const blockedTerm = blockedTerms.find((term) =>
    new RegExp(`\\b${term}\\b`, "i").test(normalizedSql)
  );

  if (blockedTerm) {
    issues.push({
      code: "BLOCKED_SQL_TERM",
      message: `Blocked SQL term detected: ${blockedTerm}.`,
      severity: "error"
    });
  }

  if (/--|\/\*/.test(normalizedSql)) {
    issues.push({
      code: "COMMENTS_BLOCKED",
      message: "SQL comments are blocked for the first deterministic sandbox.",
      severity: "error"
    });
  }

  if (normalizedSql.includes(";")) {
    issues.push({
      code: "MULTI_STATEMENT_BLOCKED",
      message: "Multiple SQL statements are not allowed.",
      severity: "error"
    });
  }

  const unknownIdentifiers = Array.from(new Set(findUnknownIdentifiers(normalizedSql)));

  if (unknownIdentifiers.length > 0) {
    issues.push({
      code: "UNKNOWN_IDENTIFIER",
      message: `Unknown identifiers found: ${unknownIdentifiers.join(", ")}.`,
      severity: "error"
    });
  }

  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
    normalizedSql
  };
}

