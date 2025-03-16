import React, { createContext, useState } from 'react';

// Define app color themes
export const Colors = {
  light: {
    primary: '#20B2AA', // Light Sea Green
    background: '#E0FFFF', // Light Cyan
    card: '#AFEEEE', // Pale Turquoise
    text: '#4682B4', // Steel Blue
    subText: '#888', // Grey
    border: '#ddd',
    tabBar: '#AFEEEE', // Pale Turquoise for tab bar
    tabBarBorder: '#8FDBDB', // Slightly darker turquoise for border
    success: '#008000', // Green
    danger: '#FF6347', // Tomato
    warning: '#E6A23C', // Softer amber/gold
  },
  dark: {
    primary: '#20B2AA', // Keep the primary color consistent
    background: '#1A2F36', // Dark blue-green
    card: '#2C4A52', // Darker blue-green
    text: '#E0FFFF', // Light Cyan
    subText: '#B0C4DE', // Light Steel Blue
    border: '#3D5A63', // Medium blue-green
    tabBar: '#162A30', // Very dark blue-green
    tabBarBorder: '#2C4A52', // Darker blue-green
    success: '#4CAF50', // Lighter green for better visibility
    danger: '#FF6347', // Keep Tomato for consistency
    warning: '#D4A017', // Darker amber/gold
  }
};

// Create the ThemeContext with a default value
export const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

// Create a ThemeProvider component to wrap the app
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // Set dark mode as default

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const themeContext = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeContext}>
      {typeof children === 'function' ? children(themeContext) : children}
    </ThemeContext.Provider>
  );
} 