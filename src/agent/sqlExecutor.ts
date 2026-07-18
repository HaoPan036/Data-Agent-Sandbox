import alasql from "alasql";
import { syntheticEcommerce, syntheticOrders } from "../data/syntheticEcommerce.js";
import { getMonthBucket, getWeekBucket } from "./dateUtils.js";
import { hasValidationErrors, validateSql } from "./sqlValidator.js";
import type {
  AgentSqlStatement,
  AgentValidationResult,
  ExecutionResult,
  QueryRow,
  ValidationResult
} from "./types.js";

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
    elapsedMs,
    isEmpty: queryRows.length === 0
  };
}

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

type AgentSqlDatabase = InstanceType<typeof alasql.Database>;

function registerTable(database: AgentSqlDatabase, tableName: string, rows: QueryRow[]) {
  database.tables[tableName] = {
    data: rows.map((row) => ({ ...row }))
  };
}

export function buildExecutableTables() {
  return {
    orders: syntheticEcommerce.orders.map((row) => ({
      ...row,
      order_week: getWeekBucket(row.order_date),
      order_month: getMonthBucket(row.order_date)
    })),
    traffic: syntheticEcommerce.traffic.map((row) => ({
      ...row,
      date_week: getWeekBucket(row.date),
      date_month: getMonthBucket(row.date)
    })),
    campaigns: syntheticEcommerce.campaigns.map((row) => ({ ...row })),
    products: syntheticEcommerce.products.map((row) => ({ ...row })),
    customers_masked: syntheticEcommerce.customers_masked.map((row) => ({ ...row })),
    refunds: syntheticEcommerce.refunds.map((row) => ({
      ...row,
      refund_week: getWeekBucket(row.refund_date),
      refund_month: getMonthBucket(row.refund_date)
    })),
    experiment_events: syntheticEcommerce.experiment_events.map((row) => ({
      ...row,
      event_week: getWeekBucket(row.event_date),
      event_month: getMonthBucket(row.event_date)
    }))
  };
}

export function registerSyntheticTables(database: AgentSqlDatabase) {
  const tables = buildExecutableTables();

  for (const [tableName, rows] of Object.entries(tables)) {
    registerTable(database, tableName, rows as QueryRow[]);
  }
}

export function executeAgentSql(
  statements: AgentSqlStatement[],
  validationResults: AgentValidationResult[]
): ExecutionResult[] {
  if (statements.length === 0 || hasValidationErrors(validationResults)) {
    return [];
  }

  const database = new alasql.Database();

  try {
    registerSyntheticTables(database);

    return statements.map((statement) => {
      const startedAt = now();

      try {
        const rows = database.exec<QueryRow[]>(statement.sql) ?? [];
        const elapsedMs = Math.round((now() - startedAt) * 100) / 100;
        const columns = rows[0] ? Object.keys(rows[0]) : [];

        return {
          columns,
          rows,
          rowCount: rows.length,
          elapsedMs,
          isEmpty: rows.length === 0
        };
      } catch (error) {
        const elapsedMs = Math.round((now() - startedAt) * 100) / 100;

        return {
          columns: [],
          rows: [],
          rowCount: 0,
          elapsedMs,
          isEmpty: true,
          error: error instanceof Error ? error.message : "Unknown SQL execution error"
        };
      }
    });
  } finally {
    delete alasql.databases[database.databaseid];
  }
}
