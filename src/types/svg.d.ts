declare module '*.svg' {
  import { FC } from 'react';
  import { SvgProps } from 'react-native-svg';
  const SvgComponent: FC<SvgProps>;
  export default SvgComponent;
}
