import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';

// Create the Authentication Context
export const AuthContext = createContext({
  user: null,
  userProfile: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
          } else {
            // Create a new user profile
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            };
            
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (email, password, displayName) => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const newProfile = {
        displayName: displayName || email.split('@')[0],
        email: email,
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to register. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to logout. Please try again.' 
      };
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send password reset email. Please try again.' 
      };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        ...profileData,
        updatedAt: new Date(),
      }, { merge: true });
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...profileData,
        updatedAt: new Date(),
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile. Please try again.' 
      };
    }
  };

  // Context value
  const value = {
    user,
    userProfile,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 