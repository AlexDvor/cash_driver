import type { MiniBarChartProps } from '../../ui/MiniBarChart/MiniBarChart';

export type SummaryIconName = 'car' | 'gift' | 'average';

export interface SummaryChartData extends MiniBarChartProps {
  // True while the first daily read is pending: keeps the chart's height.
  loading?: boolean;
}

export interface RetainedCashCardProps {
  label: string;
  amount: string;
  countLabel: string;
  chart?: SummaryChartData | null;
  // When given, the hero amount counts up to this value (formatted by `formatAmount`).
  amountCents?: number | null;
  formatAmount?: (cents: number) => string;
}

export interface SummaryMetricProps {
  label: string;
  amount: string;
  testID: string;
  icon?: SummaryIconName;
  accent?: boolean;
}

export interface SummaryStatCardsProps {
  fareLabel: string;
  fareAmount: string;
  tipLabel: string;
  tipAmount: string;
}
