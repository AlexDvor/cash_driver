import { SqlConnection } from './sqlite';

// OP-SQLite queues transactions, but ordinary execute calls can otherwise read
// uncommitted values on the same connection. Queue both at our public boundary.
export function serializeConnection(connection: SqlConnection): SqlConnection {
  let queue: Promise<void> = Promise.resolve();
  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work);
    queue = result.then(
      () => {},
      () => {},
    );
    return result;
  }
  return {
    execute: (sql, parameters) =>
      enqueue(() => connection.execute(sql, parameters)),
    transaction: work => enqueue(() => connection.transaction(work)),
    close: () => connection.close(),
  };
}
