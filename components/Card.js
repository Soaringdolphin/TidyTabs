import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';

/**
 * A card component with consistent styling and theming
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {Object} [props.style] - Additional styles for the card
 */
const Card = ({ children, style }) => {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default Card; 