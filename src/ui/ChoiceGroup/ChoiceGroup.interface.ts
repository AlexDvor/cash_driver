import type { ReactNode } from 'react';

export interface ChoiceGroupProps<Value extends string> {
  appearance?: 'chips' | 'segmented';
  columns?: 2 | 4;
  disabled?: boolean;
  label: string;
  options: { value: Value; label: string; icon?: ReactNode }[];
  value: Value;
  onChange: (value: Value) => void;
}
