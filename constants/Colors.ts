const tintColorLight = '#2F7AA9';
const tintColorDark = '#FFFFFF';

export const Palette = {
  primary: '#2F7AA9', // Bleu principal
  primaryLight: '#4EA5C6', 
  secondary: '#A1262A', // Rouge principal
  secondaryLight: '#A87C7B', 
  secondaryAlt: '#B5DCEA',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#A1262A', // Use the branding red for danger/accent
  slate: {
    50: '#F8F9FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
    900: '#1E1E1A', // Noir / Gris foncé
    950: '#121210',
  }
};

export default {
  light: {
    text: '#1E1E1A',
    background: '#F8F9FA',
    tint: tintColorLight,
    tabIconDefault: '#ADB5BD',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E9ECEF',
    notification: '#A1262A',
  },
  dark: {
    text: '#F8F9FA',
    background: '#1E1E1A',
    tint: '#FFFFFF',
    tabIconDefault: '#6C757D',
    tabIconSelected: '#FFFFFF',
    card: '#212529',
    border: '#343A40',
    notification: '#A1262A',
  },
};
