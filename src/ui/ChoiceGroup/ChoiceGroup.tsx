import { choiceLayout } from '../../constants/theme/layout';
import React, { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { sizing, spacing, typography } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './ChoiceGroup.styles';
import { ChoiceGroupProps } from './ChoiceGroup.interface';
import { SelectionIndicator } from '../SelectionIndicator/SelectionIndicator';

export function ChoiceGroup<Value extends string>({
  layout = 'wrap',
  showSelectionIndicator = false,
  appearance = 'chips',
  columns,
  iconLayout = 'stacked',
  headingVariant = 'heading',
  disabled = false,
  label,
  options,
  value,
  onChange,
}: ChoiceGroupProps<Value>) {
  const { colors } = useAppTheme();
  const { fontScale = 1 } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(0);
  const singleRow = layout === 'single-row';
  const Container = singleRow ? ScrollView : View;
  const minimumWidths = options.map(option =>
    Math.max(
      sizing.touchTarget,
      // Reserve full labels at the current font scale; scroll rather than shrink.
      option.label.length *
        typography.body *
        choiceLayout.labelCharacterWidthFactor *
        fontScale +
        spacing.sm,
      option.icon && showSelectionIndicator ? sizing.icon * 3 + spacing.sm : 0,
    ),
  );
  const spareWidth = Math.max(
    0,
    availableWidth -
      spacing.sm * (options.length - 1) -
      minimumWidths.reduce((sum, width) => sum + width, 0),
  );
  // Keep the longest word readable instead of breaking platform names into letters.
  const longestWord = Math.max(
    0,
    ...options.flatMap(option =>
      option.label.split(/\s+/).map(word => word.length),
    ),
  );
  const minimumFilterWidth = Math.max(
    sizing.touchTarget,
    longestWord * typography.body * choiceLayout.labelCharacterWidthFactor +
      spacing.sm,
  );
  // Reserve space for a brand icon and readable label; stack enlarged controls.
  const columnCount =
    columns === 'filters' &&
    availableWidth >=
      options.length * minimumFilterWidth * fontScale +
        spacing.sm * (options.length - 1)
      ? options.length
      : columns === 'adaptive' || columns === 'filters'
      ? availableWidth >=
        choiceLayout.adaptiveColumnMinimumWidth * fontScale * 2 + spacing.sm
        ? 2
        : 1
      : columns === 'equal'
      ? options.length
      : columns;
  const inlineIcons =
    iconLayout === 'inline' ||
    (iconLayout === 'adaptive' && columnCount !== options.length);
  return (
    <View style={styles.group}>
      <AppText variant={headingVariant} accessibilityRole="header">
        {label}
      </AppText>
      <Container
        style={singleRow ? styles.singleRowViewport : styles.choices}
        {...(singleRow
          ? {
              horizontal: true,
              showsHorizontalScrollIndicator: true,
              contentContainerStyle: styles.singleRow,
            }
          : {})}
        onLayout={
          singleRow || appearance === 'segmented' || columns !== undefined
            ? event => setAvailableWidth(event.nativeEvent.layout.width)
            : undefined
        }
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.choice,
                (columns === 'equal' || columns === 'filters') &&
                  styles.equalChoice,
                !singleRow &&
                  (inlineIcons || showSelectionIndicator) &&
                  styles.inline,
                singleRow && styles.compactChoice,
                singleRow && {
                  width: Math.floor(
                    minimumWidths[index] + spareWidth / options.length,
                  ),
                  flexShrink: 0,
                },
                appearance === 'segmented' && styles.segment,
                appearance === 'segmented' && {
                  // Wrap segments before enlarged labels become narrow columns.
                  minWidth:
                    availableWidth > 0
                      ? Math.min(
                          sizing.touchTarget * 2 * fontScale,
                          availableWidth,
                        )
                      : undefined,
                },
                columnCount !== undefined && {
                  width:
                    availableWidth > 0
                      ? // Rounding down prevents pixel fractions wrapping both columns.
                        Math.floor(
                          (availableWidth - spacing.sm * (columnCount - 1)) /
                            columnCount,
                        )
                      : '100%',
                  flexGrow: 1,
                  flexShrink: 0,
                },
                {
                  backgroundColor: selected ? colors.softGreen : colors.card,
                  borderColor:
                    selected || pressed ? colors.primary : colors.border,
                },
                pressed && appearance === 'segmented' && styles.pressed,
              ]}
            >
              {singleRow && (Boolean(option.icon) || showSelectionIndicator) ? (
                <View
                  style={[
                    styles.decorationRow,
                    Boolean(option.icon) &&
                      showSelectionIndicator &&
                      styles.centeredDecoration,
                  ]}
                >
                  {Boolean(option.icon) && showSelectionIndicator && (
                    <View style={styles.decorationSide} />
                  )}
                  {option.icon}
                  {showSelectionIndicator &&
                    (option.icon ? (
                      <View style={styles.decorationSide}>
                        <SelectionIndicator checked={selected} round />
                      </View>
                    ) : (
                      <SelectionIndicator checked={selected} round />
                    ))}
                </View>
              ) : (
                option.icon
              )}
              <AppText
                style={[
                  styles.label,
                  !singleRow &&
                    (inlineIcons || showSelectionIndicator) &&
                    styles.inlineLabel,
                  selected && styles.selected,
                  {
                    color: selected ? colors.primary : colors.text,
                  },
                ]}
              >
                {option.label}
              </AppText>
              {!singleRow && showSelectionIndicator && (
                <SelectionIndicator checked={selected} round />
              )}
            </Pressable>
          );
        })}
      </Container>
    </View>
  );
}
