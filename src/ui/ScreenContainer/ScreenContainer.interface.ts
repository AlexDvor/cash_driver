import React from 'react';
import type { ScrollView, View } from 'react-native';

export interface ScreenContainerProps extends React.PropsWithChildren {
  // Native stack headers already consume the top inset; tabs hide their header.
  hasHeader?: boolean;
  scrollRef?: React.Ref<React.ComponentRef<typeof ScrollView>>;
  contentRef?: React.Ref<React.ComponentRef<typeof View>>;
  onInteraction?: () => void;
  keyboardInset?: number;
  onContentSizeChange?: () => void;
}
