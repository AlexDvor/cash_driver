import React from 'react';

export interface ScreenContainerProps extends React.PropsWithChildren {
  // Native stack headers already consume the top inset; tabs hide their header.
  hasHeader?: boolean;
}
