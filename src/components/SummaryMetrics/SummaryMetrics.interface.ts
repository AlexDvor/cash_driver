import { SummaryIconName } from '../SummaryIcon/SummaryIcon';

export interface RetainedCashCardProps {
  loading?: boolean;
  label: string;
  amount: string;
  countLabel: string;
}

export interface SummaryMetricProps {
  loading?: boolean;
  label: string;
  amount: string;
  testID: string;
  icon?: Exclude<SummaryIconName, 'coins'>;
}

export interface SummaryStatCardsProps {
  loading?: boolean;
  fareLabel: string;
  fareAmount: string;
  tipLabel: string;
  tipAmount: string;
}
