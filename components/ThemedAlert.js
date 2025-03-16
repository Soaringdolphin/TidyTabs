import React, { useState, useEffect, useContext } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions
} from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ThemedAlert = ({ 
  visible, 
  title, 
  message, 
  buttons = [], 
  onDismiss,
  type = 'default' // 'default', 'success', 'error', 'destructive'
}) => {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Get icon based on alert type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={32} color={colors.success} />;
      case 'error':
        return <Ionicons name="alert-circle" size={32} color={colors.danger} />;
      case 'destructive':
        return <Ionicons name="warning" size={32} color={colors.danger} />;
      default:
        return <Ionicons name="information-circle" size={32} color={colors.primary} />;
    }
  };

  // Get title color based on alert type
  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
      case 'destructive':
        return colors.danger;
      default:
        return colors.text;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.centeredView}>
        <Animated.View 
          style={[
            styles.overlay,
            { 
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              opacity: fadeAnim 
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.modalView,
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <Text style={[styles.title, { color: getTitleColor() }]}>
            {title}
          </Text>
          
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
          
          <View style={[
            styles.buttonContainer, 
            buttons.length > 2 ? styles.buttonStackedContainer : {}
          ]}>
            {buttons.map((button, index) => {
              // Determine button style based on button.style
              let buttonStyle = [styles.button];
              let textStyle = [styles.buttonText];
              
              if (button.style === 'cancel') {
                buttonStyle.push(styles.cancelButton);
                buttonStyle.push({ backgroundColor: theme === 'dark' ? '#333' : '#eee' });
                textStyle.push({ color: colors.text });
              } else if (button.style === 'destructive') {
                buttonStyle.push(styles.destructiveButton);
                buttonStyle.push({ backgroundColor: colors.danger });
                textStyle.push({ color: '#fff' });
              } else {
                // Default button
                buttonStyle.push({ backgroundColor: colors.primary });
                textStyle.push({ color: '#fff' });
              }
              
              // Add margin between buttons
              if (index < buttons.length - 1 && buttons.length <= 2) {
                buttonStyle.push({ marginRight: 8 });
              }
              
              if (buttons.length > 2 && index < buttons.length - 1) {
                buttonStyle.push({ marginBottom: 8 });
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={buttonStyle}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    if (!button.preventDismiss) onDismiss();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={textStyle}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalView: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  buttonStackedContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  destructiveButton: {},
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ThemedAlert; 