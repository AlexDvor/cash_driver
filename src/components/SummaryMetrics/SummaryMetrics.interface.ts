import { SummaryIconName } from '../SummaryIcon/SummaryIcon';

export interface RetainedCashCardProps {
  label: string;
  amount: string;
  countLabel: string;
}

export interface SummaryMetricProps {
  label: string;
  amount: string;
  testID: string;
  icon?: Exclude<SummaryIconName, 'coins'>;
}

export interface SummaryStatCardsProps {
  fareLabel: string;
  fareAmount: string;
  tipLabel: string;
  tipAmount: string;
}
