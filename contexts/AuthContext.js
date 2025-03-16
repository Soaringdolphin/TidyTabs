import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, signIn, signUp, logOut, resetPassword, subscribeToAuthChanges, updateUserEmail } from '../firebase/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { user, error } = await signIn(email, password);
      if (error) throw new Error(error);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const register = async (email, password) => {
    try {
      const { user, error } = await signUp(email, password);
      if (error) throw new Error(error);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await logOut();
      if (error) throw new Error(error);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { error } = await resetPassword(email);
      if (error) throw new Error(error);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  const updateEmail = async (newEmail, currentPassword) => {
    try {
      const { error } = await updateUserEmail(newEmail, currentPassword);
      if (error) throw new Error(error);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        updateEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 