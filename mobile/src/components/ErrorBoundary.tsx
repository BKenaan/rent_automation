import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, fonts, radius, spacing } from '../theme';

interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: typeof error?.message === 'string' ? error.message : 'An unexpected error occurred.' };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.message}</Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset} activeOpacity={0.8}>
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap:    { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  icon:    { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.redDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  iconText:{ color: colors.red, fontSize: 28, fontFamily: fonts.bold },
  title:   { fontSize: font.xl, color: colors.text, fontFamily: fonts.bold, marginBottom: spacing.sm },
  msg:     { fontSize: font.sm, color: colors.text2, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },
  btn:     { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  btnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: font.md },
});
