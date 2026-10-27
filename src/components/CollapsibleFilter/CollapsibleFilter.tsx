import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { CollapsibleContent } from '../CollapsibleContent/CollapsibleContent';
import type { CollapsibleFilterProps } from './CollapsibleFilter.interface';
import { styles } from './CollapsibleFilter.styles';

export function CollapsibleFilter({
  label,
  value,
  expanded,
  onToggle,
  testID,
  children,
}: CollapsibleFilterProps) {
  const { colors } = useAppTheme();
  return (
    <Card depth style={styles.card}>
      <Pressable
        testID={`${testID}-toggle`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value }}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.text}>
          <AppText style={styles.label}>{label}</AppText>
          <AppText variant="supporting" secondary>
            {value}
          </AppText>
        </View>
        <View
          style={styles.circle}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View
            style={[styles.circleFill, { backgroundColor: colors.primary }]}
          />
          <View
            style={[
              styles.chevron,
              {
                borderColor: colors.text,
                transform: [{ rotate: expanded ? '225deg' : '45deg' }],
              },
            ]}
          />
        </View>
      </Pressable>
      <CollapsibleContent
        expanded={expanded}
        resetCount={0}
        testID={`${testID}-content`}
      >
        <View style={styles.content}>{children}</View>
      </CollapsibleContent>
    </Card>
  );
}
