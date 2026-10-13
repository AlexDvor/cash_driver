import type { ReactNode } from 'react';

export interface ChoiceGroupProps<Value extends string> {
  appearance?: 'chips' | 'segmented';
  columns?: 1 | 2 | 4 | 'adaptive' | 'equal';
  iconLayout?: 'stacked' | 'inline';
  disabled?: boolean;
  label: string;
  options: { value: Value; label: string; icon?: ReactNode }[];
  value: Value;
  onChange: (value: Value) => void;
}
