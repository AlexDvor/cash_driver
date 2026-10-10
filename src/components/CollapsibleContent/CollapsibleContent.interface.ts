import type { ReactNode } from 'react';

export interface CollapsibleContentProps {
  testID: string;
  expanded: boolean;
  resetCount: number;
  children: ReactNode;
}
