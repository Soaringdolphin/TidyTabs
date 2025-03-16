import React, { useState, useEffect, useRef } from 'react';
import ThemedAlert from './ThemedAlert';

const AlertProvider = () => {
  const [alert, setAlert] = useState(null);
  
  // Set up global reference to this component
  useEffect(() => {
    global.alertRef = {
      setAlert: (alertData) => {
        setAlert(alertData);
      }
    };
    
    return () => {
      global.alertRef = null;
    };
  }, []);
  
  if (!alert) return null;
  
  return (
    <ThemedAlert
      visible={alert.visible}
      title={alert.title}
      message={alert.message}
      buttons={alert.buttons}
      type={alert.type}
      onDismiss={() => {
        if (alert.dismiss) {
          alert.dismiss();
        } else {
          setAlert(null);
        }
      }}
    />
  );
};

export default AlertProvider; 