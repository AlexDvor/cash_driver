import type { ReactNode } from 'react';

export interface ActionButtonProps {
  compact?: boolean;
  renderIcon?: (color: string) => ReactNode;
  depth?: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?:
    | 'primary'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'destructive-outline';
}
