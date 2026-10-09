export interface MoneyInputProps {
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (raw: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}
