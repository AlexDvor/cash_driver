import type { usePaymentForm } from '../../hooks/transactions/usePaymentForm';
import type { Platform } from '../../features/transactions/types';
import type { useHomePaymentScroll } from '../../hooks/transactions/useHomePaymentScroll';

export interface PaymentFormProps {
  form: ReturnType<typeof usePaymentForm>;
  platformOptions: readonly Platform[];
  preferenceSaving?: boolean;
  title?: string;
  confirmLabel: string;
  mode?: 'create' | 'edit';
  entryNavigation?: ReturnType<typeof useHomePaymentScroll>;
}
