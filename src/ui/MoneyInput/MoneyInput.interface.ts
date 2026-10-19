import type { Ref, ComponentRef } from 'react';
import type { LayoutChangeEvent, TextInput, View } from 'react-native';

export interface MoneyInputProps {
  showCurrency?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
  groupRef?: Ref<ComponentRef<typeof View>>;
  label: string;
  hideLabel?: boolean;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (raw: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}
