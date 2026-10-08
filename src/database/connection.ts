import { open } from '@op-engineering/op-sqlite';
import { migrateDatabase } from './migrations';
import { SqlConnection } from './sqlite';
import { serializeConnection } from './serializedConnection';

export function createDatabaseManager(openConnection: () => SqlConnection) {
  let initialization: Promise<SqlConnection> | undefined;
  return {
    initialize(): Promise<SqlConnection> {
      if (!initialization) {
        initialization = (async () => {
          const connection = serializeConnection(openConnection());
          try {
            await migrateDatabase(connection);
            return connection;
          } catch (error) {
            connection.close();
            throw error;
          }
        })().catch(error => {
          initialization = undefined;
          throw error;
        });
      }
      return initialization;
    },
  };
}

export const databaseManager = createDatabaseManager(() =>
  open({ name: 'cash-driver.sqlite' }),
);
