import type { usePaymentForm } from '../../hooks/transactions/usePaymentForm';

export interface PaymentFormProps {
  form: ReturnType<typeof usePaymentForm>;
  preferenceSaving?: boolean;
  title: string;
  confirmLabel: string;
  mode?: 'create' | 'edit';
}
