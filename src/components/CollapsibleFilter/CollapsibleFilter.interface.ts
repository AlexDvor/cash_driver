import type { ReactNode } from 'react';

export interface CollapsibleFilterProps {
  label: string;
  value: string;
  expanded: boolean;
  onToggle: () => void;
  testID: string;
  children: ReactNode;
}
