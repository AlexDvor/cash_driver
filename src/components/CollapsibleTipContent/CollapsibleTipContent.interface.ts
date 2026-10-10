import type { ReactNode } from 'react';

export interface CollapsibleTipContentProps {
  expanded: boolean;
  resetCount: number;
  children: ReactNode;
}
