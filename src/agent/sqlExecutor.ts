import alasql from "alasql";
import { syntheticOrders } from "../data/syntheticEcommerce";
import { validateSql } from "./sqlValidator";
import type { ExecutionResult, QueryRow, ValidationResult } from "./types";

export function executeSql(
  sql: string,
  rows = syntheticOrders,
  existingValidation?: ValidationResult
): ExecutionResult {
  const validation = existingValidation ?? validateSql(sql);

  if (!validation.isValid) {
    throw new Error(
      `SQL validation failed: ${validation.issues
        .map((issue) => issue.message)
        .join(" ")}`
    );
  }

  const startedAt = performance.now();
  const queryRows = alasql(validation.normalizedSql, [rows]) as QueryRow[];
  const elapsedMs = Math.round((performance.now() - startedAt) * 100) / 100;
  const columns = queryRows[0] ? Object.keys(queryRows[0]) : [];

  return {
    columns,
    rows: queryRows,
    rowCount: queryRows.length,
    elapsedMs
  };
}

