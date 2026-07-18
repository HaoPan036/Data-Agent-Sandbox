import { schemaByTable, schemaCatalog, schemaColumnNames, sensitiveColumnNames } from "./schema.js";
import type {
  AgentSqlStatement,
  AgentValidationResult,
  ValidationIssue,
  ValidationResult
} from "./types.js";

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
  "and",
  "as",
  "asc",
  "between",
  "by",
  "case",
  "count",
  "desc",
  "distinct",
  "else",
  "end",
  "from",
  "group",
  "is",
  "join",
  "left",
  "limit",
  "null",
  "on",
  "or",
  "order",
  "round",
  "select",
  "sum",
  "then",
  "when",
  "where"
]);

const reservedWords = new Set([
  ...allowedSqlWords,
  "full",
  "having",
  "inner",
  "outer",
  "right"
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

export interface AgentSqlValidationOptions {
  requiresDateFilter?: boolean;
  userQuestion?: string;
}

function stripStringLiterals(sql: string) {
  return sql.replace(/'[^']*'/g, "''");
}

function collectSelectAliases(sql: string) {
  return Array.from(sql.matchAll(/\bas\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)).map(
    (match) => match[1]
  );
}

function collectTableReferences(sql: string) {
  const references: Array<{ tableName: string; alias: string }> = [];

  for (const match of sql.matchAll(
    /\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?/gi
  )) {
    const tableName = match[1];
    const aliasCandidate = match[2];
    const alias =
      aliasCandidate && !reservedWords.has(aliasCandidate.toLowerCase())
        ? aliasCandidate
        : tableName;

    references.push({ tableName, alias });
  }

  return references;
}

function columnsForTable(tableName: string) {
  return new Set(schemaByTable[tableName]?.columns.map((column) => column.name) ?? []);
}

function validateStatement(
  statement: AgentSqlStatement,
  options: AgentSqlValidationOptions
): AgentValidationResult[] {
  const normalizedSql = normalizeSql(statement.sql);
  const lowerSql = normalizedSql.toLowerCase();
  const results: AgentValidationResult[] = [];
  const resultId = (suffix: string) => `${statement.id}:${suffix}`;
  const strippedSql = stripStringLiterals(normalizedSql);
  const tableReferences = collectTableReferences(strippedSql);
  const aliasToTable = new Map<string, string>();
  const selectAliases = collectSelectAliases(strippedSql);

  for (const reference of tableReferences) {
    aliasToTable.set(reference.tableName, reference.tableName);
    aliasToTable.set(reference.alias, reference.tableName);
  }

  const blockedTerm = blockedTerms.find((term) =>
    new RegExp(`\\b${term}\\b`, "i").test(normalizedSql)
  );

  results.push({
    id: resultId("read_only"),
    severity: blockedTerm || !lowerSql.startsWith("select ") ? "error" : "info",
    message:
      blockedTerm || !lowerSql.startsWith("select ")
        ? `Only read-only SELECT statements are allowed. Blocked term: ${blockedTerm ?? "non-select"}.`
        : "SQL is read-only SELECT.",
    passed: !blockedTerm && lowerSql.startsWith("select ")
  });

  const hasMultiStatement = /;\s*\S/.test(normalizedSql) || /--|\/\*/.test(normalizedSql);
  results.push({
    id: resultId("single_statement"),
    severity: hasMultiStatement ? "error" : "info",
    message: hasMultiStatement
      ? "SQL comments or multiple statements are blocked."
      : "SQL contains one statement and no comments.",
    passed: !hasMultiStatement
  });

  const hasSelectStar = /\bselect\s+\*/i.test(normalizedSql) || /\.\*/.test(normalizedSql);
  results.push({
    id: resultId("no_select_star"),
    severity: hasSelectStar ? "error" : "info",
    message: hasSelectStar ? "SELECT * is not allowed." : "SQL selects explicit columns.",
    passed: !hasSelectStar
  });

  const unknownTables = tableReferences
    .map((reference) => reference.tableName)
    .filter((tableName) => !schemaByTable[tableName]);
  results.push({
    id: resultId("known_tables"),
    severity: unknownTables.length > 0 ? "error" : "info",
    message:
      unknownTables.length > 0
        ? `Unknown table references: ${Array.from(new Set(unknownTables)).join(", ")}.`
        : "All referenced tables exist in the synthetic schema.",
    passed: unknownTables.length === 0,
    details: { tables: tableReferences.map((reference) => reference.tableName) }
  });

  const unknownQualifiedColumns: string[] = [];
  for (const match of strippedSql.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g)) {
    const [, alias, column] = match;
    const tableName = aliasToTable.get(alias);

    if (!tableName || !columnsForTable(tableName).has(column)) {
      unknownQualifiedColumns.push(`${alias}.${column}`);
    }
  }

  const allowedBareIdentifiers = new Set([
    ...schemaCatalog.map((schema) => schema.tableName),
    ...tableReferences.flatMap((reference) => [reference.tableName, reference.alias]),
    ...selectAliases,
    ...Array.from(aliasToTable.keys())
  ]);
  const referencedTables = Array.from(new Set(tableReferences.map((reference) => reference.tableName)));
  const referencedColumnNames = new Set(
    referencedTables.flatMap((tableName) => schemaByTable[tableName]?.columns.map((column) => column.name) ?? [])
  );
  const strippedWithoutQualifiedColumns = strippedSql.replace(
    /\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\b/g,
    " "
  );
  const unknownBareIdentifiers = Array.from(
    new Set(
      Array.from(strippedWithoutQualifiedColumns.matchAll(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g))
        .map((match) => match[0])
        .filter((identifier) => {
          const lowerIdentifier = identifier.toLowerCase();

          return (
            !allowedSqlWords.has(lowerIdentifier) &&
            !reservedWords.has(lowerIdentifier) &&
            !allowedBareIdentifiers.has(identifier) &&
            !referencedColumnNames.has(identifier)
          );
        })
    )
  );
  const unknownColumns = [...unknownQualifiedColumns, ...unknownBareIdentifiers];

  results.push({
    id: resultId("known_columns"),
    severity: unknownColumns.length > 0 ? "error" : "info",
    message:
      unknownColumns.length > 0
        ? `Unknown column or identifier references: ${unknownColumns.join(", ")}.`
        : "All referenced columns exist in the selected synthetic tables.",
    passed: unknownColumns.length === 0
  });

  const selectClause = strippedSql.match(/\bselect\b([\s\S]+?)\bfrom\b/i)?.[1] ?? "";
  const sensitiveSelections = sensitiveColumnNames.filter((columnName) =>
    new RegExp(`\\b${columnName}\\b`, "i").test(selectClause)
  );
  const selectsEmail = /\bemail\b/i.test(selectClause);

  results.push({
    id: resultId("sensitive_columns"),
    severity: sensitiveSelections.length > 0 || selectsEmail ? "error" : "info",
    message:
      sensitiveSelections.length > 0 || selectsEmail
        ? `Sensitive direct selections are blocked: ${[...sensitiveSelections, selectsEmail ? "email" : ""]
            .filter(Boolean)
            .join(", ")}.`
        : "SQL does not directly select sensitive user-level fields.",
    passed: sensitiveSelections.length === 0 && !selectsEmail
  });

  const hasDateFilter =
    /\bwhere\b/i.test(strippedSql) &&
    /\b(order_date|date|refund_date|event_date|start_date|end_date)\b/i.test(strippedSql) &&
    /\bbetween\b|>=|<=/i.test(strippedSql);
  results.push({
    id: resultId("date_filter"),
    severity: options.requiresDateFilter && !hasDateFilter ? "error" : "info",
    message:
      options.requiresDateFilter && !hasDateFilter
        ? "Time-based SQL must include an explicit date filter."
        : hasDateFilter
          ? "SQL includes an explicit date filter."
          : "No time filter required for this statement.",
    passed: !options.requiresDateFilter || hasDateFilter
  });

  return results;
}

export function validateAgentSql(
  statements: AgentSqlStatement[],
  options: AgentSqlValidationOptions = {}
): AgentValidationResult[] {
  const userQuestion = options.userQuestion?.toLowerCase() ?? "";
  const requestLooksSensitive =
    /\bexport\b/.test(userQuestion) ||
    /\bcustomer emails?\b/.test(userQuestion) ||
    /\ball customer records\b/.test(userQuestion);

  if (requestLooksSensitive) {
    return [
      {
        id: "request:sensitive_export",
        severity: "error",
        message: "The request asks for user-level export or sensitive customer data and is blocked before SQL execution.",
        passed: false
      }
    ];
  }

  if (statements.length === 0) {
    return [
      {
        id: "request:no_sql",
        severity: "info",
        message: "No SQL was generated for this request.",
        passed: true
      }
    ];
  }

  return statements.flatMap((statement) => validateStatement(statement, options));
}

export function hasValidationErrors(results: AgentValidationResult[]) {
  return results.some((result) => result.severity === "error" && !result.passed);
}
