import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Logo from './Logo';
import { fonts } from '../theme';

const NAVY = '#1B2B4E';

/**
 * Branded launch screen. Seamlessly continues from the native splash
 * (same navy background + white house mark), animates the wordmark in,
 * holds briefly, then fades out to reveal the app.
 */
export default function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordShift = useRef(new Animated.Value(10)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(180),
          Animated.parallel([
            Animated.timing(wordOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.timing(wordShift, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(850),
      Animated.timing(screenOpacity, { toValue: 0, duration: 420, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onDone());
  }, [logoScale, wordOpacity, wordShift, screenOpacity, onDone]);

  return (
    <Animated.View style={[styles.wrap, { opacity: screenOpacity }]} pointerEvents="none">
      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <Logo size={92} withBadge={false} />
      </Animated.View>
      <Animated.Text style={[styles.name, { opacity: wordOpacity, transform: [{ translateY: wordShift }] }]}>
        RentalMan
      </Animated.Text>
      <Animated.Text style={[styles.tag, { opacity: wordOpacity, transform: [{ translateY: wordShift }] }]}>
        Property management, simplified
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 30, fontFamily: fonts.extrabold, marginTop: 22, letterSpacing: -0.5 },
  tag:  { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: fonts.regular, marginTop: 7 },
});
