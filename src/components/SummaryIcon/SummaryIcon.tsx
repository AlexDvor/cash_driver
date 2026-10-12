import React from 'react';
import { View } from 'react-native';
import { styles } from './SummaryIcon.styles';

export type SummaryIconName = 'coins' | 'car' | 'gift';

// Decorative outline geometry follows the existing native View icon approach.
export function SummaryIcon({
  name,
  color,
}: {
  name: SummaryIconName;
  color: string;
}) {
  const outline = { borderColor: color };
  return (
    <View
      style={styles.frame}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'coins' ? (
        <>
          {[0, 1, 2].map(index => (
            <View
              key={`tall-${index}`}
              style={[
                styles.coin,
                styles.tallCoin,
                outline,
                { top: 5 + index * 7 },
              ]}
            />
          ))}
          {[0, 1].map(index => (
            <View
              key={`short-${index}`}
              style={[
                styles.coin,
                styles.shortCoin,
                outline,
                { top: 20 + index * 7 },
              ]}
            />
          ))}
        </>
      ) : name === 'car' ? (
        <>
          <View style={[styles.carRoof, outline]} />
          <View style={[styles.carBody, outline]} />
          <View style={[styles.wheel, styles.leftWheel, outline]} />
          <View style={[styles.wheel, styles.rightWheel, outline]} />
          <View
            style={[styles.light, styles.leftLight, { backgroundColor: color }]}
          />
          <View
            style={[
              styles.light,
              styles.rightLight,
              { backgroundColor: color },
            ]}
          />
        </>
      ) : (
        <>
          <View style={[styles.bow, styles.leftBow, outline]} />
          <View style={[styles.bow, styles.rightBow, outline]} />
          <View style={[styles.giftBox, outline]} />
          <View style={[styles.giftLid, outline]} />
          <View style={[styles.ribbon, { backgroundColor: color }]} />
        </>
      )}
    </View>
  );
}
