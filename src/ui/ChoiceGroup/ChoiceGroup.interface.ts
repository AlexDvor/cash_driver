export interface ChoiceGroupProps<Value extends string> {
  appearance?: 'chips' | 'segmented';
  columns?: 2 | 4;
  disabled?: boolean;
  label: string;
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}
