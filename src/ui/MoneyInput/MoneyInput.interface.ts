import type { Ref, ComponentRef } from 'react';
import type { TextInput } from 'react-native';

export interface MoneyInputProps {
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (raw: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}
