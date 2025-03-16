import React from 'react';
import { Alert, Platform } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';

// Global state to track current alert
let currentAlert = null;
let isAlertVisible = false;

/**
 * Standardized alert helper for consistent alert styling across the app
 */
export const AlertHelper = {
  /**
   * Show a success alert
   * @param {string} message - The success message to display
   * @param {Function} onOk - Optional callback when OK is pressed
   */
  showSuccess: (message, onOk = null) => {
    if (isAlertVisible) {
      // If an alert is already visible, dismiss it first
      if (currentAlert) {
        currentAlert.dismiss();
      }
    }

    isAlertVisible = true;
    
    // Create alert component
    const alertComponent = {
      visible: true,
      title: "Success",
      message,
      type: "success",
      buttons: [
        {
          text: "OK",
          onPress: onOk,
          style: "default"
        }
      ],
      dismiss: () => {
        isAlertVisible = false;
        if (global.alertRef) {
          global.alertRef.setAlert(null);
        }
      }
    };
    
    currentAlert = alertComponent;
    
    // Set the alert in the global alert ref
    if (global.alertRef) {
      global.alertRef.setAlert(alertComponent);
    } else {
      // Fallback to standard Alert if ThemedAlert is not available
      Alert.alert(
        "Success",
        message,
        [
          {
            text: "OK",
            onPress: onOk,
            style: "default"
          }
        ],
        { cancelable: false }
      );
    }
  },

  /**
   * Show an error alert
   * @param {string} message - The error message to display
   * @param {Function} onOk - Optional callback when OK is pressed
   */
  showError: (message, onOk = null) => {
    if (isAlertVisible) {
      // If an alert is already visible, dismiss it first
      if (currentAlert) {
        currentAlert.dismiss();
      }
    }

    isAlertVisible = true;
    
    // Create alert component
    const alertComponent = {
      visible: true,
      title: "Error",
      message,
      type: "error",
      buttons: [
        {
          text: "OK",
          onPress: onOk,
          style: "default"
        }
      ],
      dismiss: () => {
        isAlertVisible = false;
        if (global.alertRef) {
          global.alertRef.setAlert(null);
        }
      }
    };
    
    currentAlert = alertComponent;
    
    // Set the alert in the global alert ref
    if (global.alertRef) {
      global.alertRef.setAlert(alertComponent);
    } else {
      // Fallback to standard Alert if ThemedAlert is not available
      Alert.alert(
        "Error",
        message,
        [
          {
            text: "OK",
            onPress: onOk,
            style: "default"
          }
        ],
        { cancelable: false }
      );
    }
  },

  /**
   * Show a confirmation alert with Yes/No options
   * @param {string} title - The title of the confirmation
   * @param {string} message - The confirmation message
   * @param {Function} onYes - Callback when Yes is pressed
   * @param {Function} onNo - Optional callback when No is pressed
   */
  showConfirmation: (title, message, onYes, onNo = null) => {
    if (isAlertVisible) {
      // If an alert is already visible, dismiss it first
      if (currentAlert) {
        currentAlert.dismiss();
      }
    }

    isAlertVisible = true;
    
    // Create alert component
    const alertComponent = {
      visible: true,
      title,
      message,
      type: "default",
      buttons: [
        {
          text: "No",
          onPress: onNo,
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: onYes,
          style: "default"
        }
      ],
      dismiss: () => {
        isAlertVisible = false;
        if (global.alertRef) {
          global.alertRef.setAlert(null);
        }
      }
    };
    
    currentAlert = alertComponent;
    
    // Set the alert in the global alert ref
    if (global.alertRef) {
      global.alertRef.setAlert(alertComponent);
    } else {
      // Fallback to standard Alert if ThemedAlert is not available
      Alert.alert(
        title,
        message,
        [
          {
            text: "No",
            onPress: onNo,
            style: "cancel"
          },
          {
            text: "Yes",
            onPress: onYes,
            style: "default"
          }
        ],
        { cancelable: false }
      );
    }
  },

  /**
   * Show a destructive confirmation alert (for delete operations)
   * @param {string} title - The title of the confirmation
   * @param {string} message - The confirmation message
   * @param {Function} onConfirm - Callback when confirmed
   * @param {Function} onCancel - Optional callback when canceled
   * @param {string} confirmText - Text for the confirm button (default: "Delete")
   */
  showDestructiveConfirmation: (title, message, onConfirm, onCancel = null, confirmText = "Delete") => {
    if (isAlertVisible) {
      // If an alert is already visible, dismiss it first
      if (currentAlert) {
        currentAlert.dismiss();
      }
    }

    isAlertVisible = true;
    
    // Create alert component
    const alertComponent = {
      visible: true,
      title,
      message,
      type: "destructive",
      buttons: [
        {
          text: "Cancel",
          onPress: onCancel,
          style: "cancel"
        },
        {
          text: confirmText,
          onPress: onConfirm,
          style: "destructive"
        }
      ],
      dismiss: () => {
        isAlertVisible = false;
        if (global.alertRef) {
          global.alertRef.setAlert(null);
        }
      }
    };
    
    currentAlert = alertComponent;
    
    // Set the alert in the global alert ref
    if (global.alertRef) {
      global.alertRef.setAlert(alertComponent);
    } else {
      // Fallback to standard Alert if ThemedAlert is not available
      Alert.alert(
        title,
        message,
        [
          {
            text: "Cancel",
            onPress: onCancel,
            style: "cancel"
          },
          {
            text: confirmText,
            onPress: onConfirm,
            style: "destructive"
          }
        ],
        { cancelable: false }
      );
    }
  }
}; 