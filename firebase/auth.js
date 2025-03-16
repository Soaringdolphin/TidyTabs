import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

// Initialize auth with AsyncStorage persistence
const app = getApp();
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Sign up with email and password
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Update email (requires recent authentication)
export const updateUserEmail = async (newEmail, currentPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { error: 'No user is currently signed in' };
    }

    // Re-authenticate the user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update the email
    await updateEmail(user, newEmail);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}; 