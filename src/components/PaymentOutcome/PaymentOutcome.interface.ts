import type { Ref, ComponentRef } from 'react';
import type { View, LayoutChangeEvent } from 'react-native';
import type { PaymentFormProps } from '../PaymentForm/PaymentForm.interface';
export interface PaymentOutcomeProps
  extends Pick<
    PaymentFormProps,
    'form' | 'confirmLabel' | 'mode' | 'preferenceSaving' | 'entryNavigation'
  > {
  outcomeRef?: Ref<ComponentRef<typeof View>>;
  onLayout?: (event: LayoutChangeEvent) => void;
}
