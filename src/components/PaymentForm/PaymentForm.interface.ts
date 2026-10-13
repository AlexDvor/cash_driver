import type { usePaymentForm } from '../../hooks/transactions/usePaymentForm';
import type { Platform } from '../../features/transactions/types';

export interface PaymentFormProps {
  form: ReturnType<typeof usePaymentForm>;
  platformOptions: readonly Platform[];
  preferenceSaving?: boolean;
  title?: string;
  confirmLabel: string;
  mode?: 'create' | 'edit';
}
