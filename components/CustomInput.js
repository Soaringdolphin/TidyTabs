import React, { useContext } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';

/**
 * A custom input component with theming and error handling
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Function to call when text changes
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.keyboardType='default'] - Keyboard type
 * @param {boolean} [props.secureTextEntry=false] - Whether to hide text entry
 * @param {boolean} [props.multiline=false] - Whether input is multiline
 * @param {string} [props.accessibilityLabel] - Accessibility label
 * @param {Object} [props.style] - Additional styles for the input
 * @param {Object} [props.containerStyle] - Additional styles for the container
 */
const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  accessibilityLabel,
  style,
  containerStyle,
  ...rest
}) => {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme === 'dark' ? colors.card : '#fff',
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          multiline && styles.multilineInput,
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme === 'dark' ? colors.subText : '#ccc'}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        accessibilityLabel={accessibilityLabel || label}
        {...rest}
      />
      
      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    height: 40,
  },
  multilineInput: {
    height: 100,
    paddingTop: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default CustomInput; 