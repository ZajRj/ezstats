import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export default function Text({ style, ...props }: TextProps) {
  // Flatten the style array to easily inspect its properties
  const flatStyle = StyleSheet.flatten(style) || {};
  const weight = flatStyle.fontWeight;
  
  // Map font weights to our custom Inter font families
  let fontFamily = 'Inter_400Regular';
  if (weight === 'bold' || weight === '700' || weight === '800' || weight === '900') {
    fontFamily = 'Inter_700Bold';
  } else if (weight === '600' || weight === '500') {
    fontFamily = 'Inter_600SemiBold';
  }

  // Pass the fontFamily first so it can be overridden if explicitly set in `style`
  return <RNText {...props} style={[{ fontFamily }, style]} />;
}
