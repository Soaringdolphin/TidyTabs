import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import Constants from "expo-constants";

// ✅ Use process.env if you're on Expo Router or Expo SDK 49+
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ Prevent multiple Firebase instances
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Add a simple test to check Firestore connection
const testFirestoreConnection = async () => {
  try {
    const settings = db.settings;
    return true;
  } catch (error) {
    console.error('Error testing Firestore connection:', error);
    return false;
  }
};

testFirestoreConnection();
