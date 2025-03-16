import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

/**
 * A reusable bottom button component that appears fixed at the bottom of the screen
 * @param {Object} props - Component props
 * @param {string} props.title - The text to display on the button
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {boolean} props.isLoading - Whether to show a loading indicator
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.backgroundColor - Background color for the button
 * @param {Object} props.style - Additional styles to apply to the button (optional)
 * @param {Object} props.textStyle - Additional styles to apply to the button text (optional)
 */
const BottomButton = ({ 
  title, 
  onPress, 
  isLoading = false, 
  disabled = false,
  backgroundColor = '#20B2AA',
  style, 
  textStyle 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor },
        (isLoading || disabled) && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#20B2AA',
    padding: 16,
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default BottomButton; 