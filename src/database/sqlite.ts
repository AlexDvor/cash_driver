export type SqlValue = string | number | null;
export interface SqlResult {
  rows: Record<string, unknown>[];
  rowsAffected: number;
}
export interface SqlExecutor {
  execute(sql: string, params?: SqlValue[]): Promise<SqlResult>;
}
export interface SqlConnection extends SqlExecutor {
  transaction(work: (transaction: SqlExecutor) => Promise<void>): Promise<void>;
  close(): void;
}
