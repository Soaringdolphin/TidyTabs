// Import React Native Firebase modules
import firebaseApp from '@react-native-firebase/app';
import firebaseAuth from '@react-native-firebase/auth';
import firebaseFirestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase if not already initialized
let app;
if (!firebaseApp.apps.length) {
  // Firebase will automatically read from google-services.json and GoogleService-Info.plist
  app = firebaseApp.initializeApp({});
} else {
  app = firebaseApp.app();
}

// Get Firestore and Auth instances
export const nativeDb = firebaseFirestore();
export const nativeAuth = firebaseAuth();

// Authentication functions
export const rnSignUp = async (email, password) => {
  try {
    const userCredential = await nativeAuth.createUserWithEmailAndPassword(email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const rnSignIn = async (email, password) => {
  try {
    const userCredential = await nativeAuth.signInWithEmailAndPassword(email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const rnLogOut = async () => {
  try {
    await nativeAuth.signOut();
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const rnResetPassword = async (email) => {
  try {
    await nativeAuth.sendPasswordResetEmail(email);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const rnUpdateUserEmail = async (newEmail, currentPassword) => {
  try {
    const user = nativeAuth.currentUser;
    if (!user) {
      return { error: 'No user is currently signed in' };
    }
    
    // Re-authenticate
    const credential = firebaseAuth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    
    // Update email
    await user.updateEmail(newEmail);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const rnSubscribeToAuthChanges = (callback) => {
  return nativeAuth.onAuthStateChanged(callback);
};

// Test Firebase Native connectivity
export const testNativeFirebaseConnection = async () => {
  try {
    // Simple test to verify Firestore is working
    await nativeDb.collection('test').doc('test').get();
    console.log('Native Firebase connection successful');
    return true;
  } catch (error) {
    console.error('Native Firebase connection error:', error);
    return false;
  }
}; 