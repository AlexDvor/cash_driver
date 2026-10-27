import type { ReactNode } from 'react';

export interface ChoiceGroupProps<Value extends string> {
  compact?: boolean;
  layout?: 'wrap' | 'single-row';
  showSelectionIndicator?: boolean;
  appearance?: 'chips' | 'segmented';
  columns?: 1 | 2 | 4 | 'adaptive' | 'equal' | 'filters';
  iconLayout?: 'stacked' | 'inline' | 'adaptive';
  headingVariant?: 'heading' | 'body';
  disabled?: boolean;
  label: string;
  hideLabel?: boolean;
  options: { value: Value; label: string; icon?: ReactNode }[];
  value: Value;
  onChange: (value: Value) => void;
}
