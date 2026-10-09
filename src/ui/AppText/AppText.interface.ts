import { TextProps } from 'react-native';

export interface AppTextProps extends TextProps {
  variant?: 'title' | 'heading' | 'body' | 'supporting';
  secondary?: boolean;
}
