import React from 'react';
import { CollapsibleContent } from '../CollapsibleContent/CollapsibleContent';
import type { CollapsibleTipContentProps } from './CollapsibleTipContent.interface';

export function CollapsibleTipContent(props: CollapsibleTipContentProps) {
  return <CollapsibleContent {...props} testID="tip-section-content" />;
}
