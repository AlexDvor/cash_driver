import { useCallback, useRef } from 'react';
import { Persistence } from '../../app/persistence';
import { confirmationHaptics } from '../../features/settings/confirmationHaptics';
import {
  PendingOperation,
  TransactionInput,
} from '../../features/transactions/transactionService';

export function useCreatePayment(
  services: Persistence,
  hapticsEnabled: boolean,
) {
  const latestHapticsEnabled = useRef(hapticsEnabled);
  latestHapticsEnabled.current = hapticsEnabled;
  const pending = useRef<{
    operation: PendingOperation;
    input: TransactionInput;
  } | null>(null);

  return useCallback(
    async (input: TransactionInput) => {
      const previous = pending.current;
      if (
        !previous ||
        previous.input.platform !== input.platform ||
        previous.input.fareAmountCents !== input.fareAmountCents ||
        previous.input.cashReceivedCents !== input.cashReceivedCents ||
        previous.input.changeAsTip !== input.changeAsTip
      ) {
        pending.current = {
          operation: services.transactions.newPendingOperation(),
          input: { ...input },
        };
      }
      const operation = pending.current?.operation;
      if (!operation) {
        throw new Error('Missing pending operation');
      }
      const saved = await services.transactions.save(operation, input);
      pending.current = null;
      confirmationHaptics(latestHapticsEnabled.current);
      return saved;
    },
    [services],
  );
}
