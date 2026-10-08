import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { databaseManager } from '../database/connection';
import { createPreferencesRepository } from '../features/settings/preferencesRepository';
import { createPreferencesService } from '../features/settings/preferencesService';
import { createTransactionRepository } from '../features/transactions/transactionRepository';
import { createTransactionService } from '../features/transactions/transactionService';
import { createChangeNotifier } from './changeNotifier';

const changes = createChangeNotifier();
async function openPersistence() {
  const db = await databaseManager.initialize();
  return {
    changes,
    preferences: createPreferencesService(
      createPreferencesRepository(db),
      changes,
    ),
    transactions: createTransactionService(
      createTransactionRepository(db),
      changes,
      uuid,
      () => new Date(),
    ),
  };
}
export type Persistence = Awaited<ReturnType<typeof openPersistence>>;
let initialization: Promise<Persistence> | undefined;
export function initializePersistence(): Promise<Persistence> {
  if (!initialization) {
    initialization = openPersistence().catch(error => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}
