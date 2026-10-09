import { validate as isUuid } from 'uuid';
import { createChangeNotifier } from '../../app/changeNotifier';
import { calculatePayment } from './payment';
import { CashTransaction, PaymentAmounts, Platform } from './types';
import { platforms } from '../../constants/platforms';
import { TransactionRepository } from './transactionRepository';

export interface TransactionInput extends PaymentAmounts {
  platform: Platform;
}
export interface PendingOperation {
  readonly id: string;
}

function recordFor(
  id: string,
  input: TransactionInput,
  now: Date,
): CashTransaction {
  const payment = calculatePayment(input);
  if (
    !isUuid(id) ||
    !platforms.includes(input.platform) ||
    typeof input.changeAsTip !== 'boolean' ||
    payment.status !== 'valid'
  ) {
    throw new Error('Invalid operation input');
  }
  return {
    id,
    platform: input.platform,
    fareAmountCents: input.fareAmountCents,
    cashReceivedCents: input.cashReceivedCents,
    changeGivenCents: payment.changeGivenCents,
    tipCents: payment.tipCents,
    netCashCents: payment.netCashCents,
    createdAt: now.toISOString(),
    updatedAt: null,
  };
}

export function createTransactionService(
  repository: TransactionRepository,
  changes: ReturnType<typeof createChangeNotifier>,
  generateId: () => string,
  now: () => Date,
) {
  const pendingWrites = new Map<
    string,
    { input: TransactionInput; write: Promise<CashTransaction> }
  >();
  return {
    newPendingOperation(): PendingOperation {
      return Object.freeze({ id: generateId() });
    },
    list: repository.list,
    get: repository.get,
    save(
      pending: PendingOperation,
      input: TransactionInput,
    ): Promise<CashTransaction> {
      const existingWrite = pendingWrites.get(pending.id);
      if (existingWrite) {
        if (
          existingWrite.input.platform !== input.platform ||
          existingWrite.input.fareAmountCents !== input.fareAmountCents ||
          existingWrite.input.cashReceivedCents !== input.cashReceivedCents ||
          existingWrite.input.changeAsTip !== input.changeAsTip
        ) {
          return Promise.reject(
            new Error('Pending operation input changed during save'),
          );
        }
        return existingWrite.write;
      }
      const write = (async () => {
        const result = await repository.create(
          recordFor(pending.id, input, now()),
        );
        if (result.inserted) {
          changes.notify('transactions');
        }
        return result.record;
      })();
      pendingWrites.set(pending.id, { input: { ...input }, write });
      write.then(
        () => pendingWrites.delete(pending.id),
        () => pendingWrites.delete(pending.id),
      );
      return write;
    },
    async edit(id: string, input: TransactionInput): Promise<CashTransaction> {
      const record = recordFor(id, input, now());
      record.updatedAt = record.createdAt;
      const saved = await repository.edit(record);
      changes.notify('transactions');
      return saved;
    },
    async remove(id: string): Promise<void> {
      if (await repository.remove(id)) {
        changes.notify('transactions');
      }
    },
    async removeAll(): Promise<void> {
      if (await repository.removeAll()) {
        changes.notify('transactions');
      }
    },
  };
}
