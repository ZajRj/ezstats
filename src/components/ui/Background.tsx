import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function Background() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={width} height={height} style={{ position: 'absolute' }}>
        <Defs>
          <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1.5" fill={colors.primary} opacity={0.10} />
          </Pattern>
          <RadialGradient id="cyanBlob" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#A5E7E2" stopOpacity="0.25" />
            <Stop offset="30%" stopColor="#A5E7E2" stopOpacity="0.10" />
            <Stop offset="70%" stopColor="#A5E7E2" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        
        <Rect width={width} height={height} fill="url(#dots)" />
        <Rect x={-width * 0.2} y={height * 0.5} width={width * 1.2} height={width * 1.2} fill="url(#cyanBlob)" />
      </Svg>
    </View>
  );
}
