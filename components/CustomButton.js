import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';

/**
 * A custom button component with theming support
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {string} [props.type='primary'] - Button type (primary, secondary, danger)
 * @param {boolean} [props.isLoading=false] - Whether to show loading indicator
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {string} [props.accessibilityLabel] - Accessibility label for screen readers
 * @param {string} [props.accessibilityHint] - Accessibility hint for screen readers
 * @param {Object} [props.style] - Additional styles for the button
 * @param {Object} [props.textStyle] - Additional styles for the button text
 */
const CustomButton = ({
  title,
  onPress,
  type = 'primary',
  isLoading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}) => {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  
  // Determine button colors based on type
  let backgroundColor;
  let textColor = '#fff';
  
  switch (type) {
    case 'secondary':
      backgroundColor = theme === 'dark' ? colors.card : '#f0f0f0';
      textColor = colors.text;
      break;
    case 'danger':
      backgroundColor = colors.danger;
      break;
    case 'primary':
    default:
      backgroundColor = colors.primary;
      break;
  }
  
  // Apply disabled styling if needed
  if (disabled) {
    backgroundColor = theme === 'dark' ? '#555' : '#ccc';
    textColor = theme === 'dark' ? '#888' : '#888';
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CustomButton; 