import React from 'react';
import Svg, { Rect, Polyline, Path, Circle, Polygon } from 'react-native-svg';

interface Props {
  size?: number;
  withBadge?: boolean;     // navy rounded-square background
  markColor?: string;      // house outline color
  keyholeColor?: string;   // keyhole color
}

/**
 * RentalMan house-with-keyhole logo (vector, crisp at any size).
 * withBadge=true  → navy rounded square + white house + violet keyhole (app-icon style)
 * withBadge=false → just the white house + violet keyhole, transparent background
 */
export default function Logo({
  size = 48,
  withBadge = true,
  markColor = '#ffffff',
  keyholeColor = '#8b5cf6',
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      {withBadge && <Rect width={36} height={36} rx={9} fill="#1B2B4E" />}
      <Polyline
        points="6.3,14.4 18,6.3 29.7,14.4"
        fill="none" stroke={markColor} strokeWidth={2.2}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M24 10.6 V7" fill="none" stroke={markColor} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M9 13.6 V29.2 H27 V13.6" fill="none" stroke={markColor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={18} cy={18} r={3} fill={keyholeColor} />
      <Polygon points="16.65,19 19.35,19 21,25.3 15,25.3" fill={keyholeColor} />
    </Svg>
  );
}
