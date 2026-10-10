import { SqlConnection, SqlExecutor, SqlValue } from '../../database/sqlite';
import { CashTransaction } from './types';
import { decodeTransaction } from './transactionDecoder';
import { createTransactionReadRepository } from './transactionReadRepository';

async function readOne(
  executor: SqlExecutor,
  id: string,
): Promise<CashTransaction | null> {
  const result = await executor.execute(
    'SELECT * FROM transactions WHERE id = ?',
    [id],
  );
  return result.rows[0] ? decodeTransaction(result.rows[0]) : null;
}

function values(record: CashTransaction): SqlValue[] {
  return [
    record.id,
    record.platform,
    record.fareAmountCents,
    record.cashReceivedCents,
    record.changeGivenCents,
    record.tipCents,
    record.netCashCents,
    record.createdAt,
    record.updatedAt,
  ];
}

export function createTransactionRepository(db: SqlConnection) {
  const { invalidate, ...reads } = createTransactionReadRepository(db);
  return {
    ...reads,
    get: (id: string) => readOne(db, id),
    async list(): Promise<CashTransaction[]> {
      const result = await db.execute(
        'SELECT * FROM transactions ORDER BY created_at DESC, id DESC',
      );
      return result.rows.map(decodeTransaction);
    },
    async create(
      record: CashTransaction,
    ): Promise<{ record: CashTransaction; inserted: boolean }> {
      let inserted = false;
      let saved: CashTransaction | null = null;
      await db.transaction(async tx => {
        const existing = await readOne(tx, record.id);
        if (existing) {
          // Never overwrite a prior commit on retry, or accept a different draft
          // under an already committed ID as though it had just been saved.
          if (
            existing.platform !== record.platform ||
            existing.fareAmountCents !== record.fareAmountCents ||
            existing.cashReceivedCents !== record.cashReceivedCents ||
            existing.tipCents !== record.tipCents
          ) {
            throw new Error(
              'Pending ID already belongs to a different operation',
            );
          }
          saved = existing;
          return;
        }
        await tx.execute(
          'INSERT INTO transactions (id, platform, fare_amount_cents, cash_received_cents, change_given_cents, tip_cents, net_cash_cents, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          values(record),
        );
        saved = await readOne(tx, record.id);
        inserted = true;
      });
      if (!saved) {
        throw new Error('Committed transaction could not be read');
      }
      if (inserted) {
        invalidate(saved);
      }
      return { record: saved, inserted };
    },
    async edit(record: CashTransaction): Promise<CashTransaction> {
      let saved: CashTransaction | null = null;
      await db.transaction(async tx => {
        if (!(await readOne(tx, record.id))) {
          throw new Error('Transaction not found');
        }
        await tx.execute(
          'UPDATE transactions SET platform = ?, fare_amount_cents = ?, cash_received_cents = ?, change_given_cents = ?, tip_cents = ?, net_cash_cents = ?, updated_at = ? WHERE id = ?',
          [
            record.platform,
            record.fareAmountCents,
            record.cashReceivedCents,
            record.changeGivenCents,
            record.tipCents,
            record.netCashCents,
            record.updatedAt,
            record.id,
          ],
        );
        saved = await readOne(tx, record.id);
      });
      if (!saved) {
        throw new Error('Updated transaction could not be read');
      }
      invalidate(saved);
      return saved;
    },
    async remove(id: string): Promise<boolean> {
      let removed = false;
      await db.transaction(async tx => {
        removed =
          (await tx.execute('DELETE FROM transactions WHERE id = ?', [id]))
            .rowsAffected > 0;
      });
      if (removed) {
        invalidate();
      }
      return removed;
    },
    async removeAll(): Promise<boolean> {
      let removed = false;
      await db.transaction(async tx => {
        removed =
          (await tx.execute('DELETE FROM transactions')).rowsAffected > 0;
      });
      if (removed) {
        invalidate();
      }
      return removed;
    },
  };
}

export type TransactionRepository = ReturnType<
  typeof createTransactionRepository
>;
