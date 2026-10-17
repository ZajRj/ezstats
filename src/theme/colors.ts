export const lightTheme = {
  primary: '#0B3B60', // dark blue for tabs and primary buttons
  primaryLight: '#D4E8FC', // light blue for some icons/backgrounds
  background: '#F7F9FC', // app background
  card: '#FFFFFF', // card background
  surface: '#F1F5F9', // recessed surface: inputs, segmented tracks, chips
  text: '#1A202C', // main text
  textSecondary: '#4A5568', // secondary text
  border: '#E2E8F0', // border color
  success: '#065F35', // dark green for target card
  successLight: '#A7F3D0', // light green for icons
  danger: '#B91C1C', // destructive actions and errors
  dangerLight: '#FEE2E2', // destructive button background
  progressBg: '#E2E8F0', // progress bar track
  progressFill: '#0B3B60', // dark blue progress
  progressFillLight: '#6CB5F9', // light blue progress
  tabInactive: '#718096', // inactive tab icon and label
  rowAlt: '#F7FAFD', // zebra stripe for table rows
  highlight: '#EAF3FD', // row/column crosshair in tables
};

// Aliasing the active theme so we don't break existing imports
// Later we can introduce a ThemeProvider context here.
export const colors = lightTheme;
