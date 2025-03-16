import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { CustomButton, CustomInput, Card } from '../components';
import { useFocusEffect } from '@react-navigation/native';
import { deleteUserAccount } from '../firebase/firestoreFunctions';
import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Ionicons } from "@expo/vector-icons";
import { AlertHelper } from "../utils/AlertHelper";

export default function ProfileScreen({ navigation }) {
  const { userProfile, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errors, setErrors] = useState({});
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const auth = getAuth();
  
  // State for password confirmation modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [isConfirmingPassword, setIsConfirmingPassword] = useState(false);

  // Hide bottom tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // Get the parent navigator (Tab Navigator) and hide its tab bar
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { 
            display: 'none',
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        });
      }
      
      // No cleanup function - we don't restore the tab bar when leaving
      // Other screens will explicitly set their own tab bar visibility
    }, [navigation, colors])
  );

  // Function to format date in "Month Day, Year" format
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "Not available";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSaveProfile = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    if (!displayName.trim()) {
      setErrors({ displayName: 'Name is required' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile({ displayName });
      if (result.success) {
        AlertHelper.showSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        AlertHelper.showError(result.error);
      }
    } catch (error) {
      AlertHelper.showError('An unexpected error occurred. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    
    AlertHelper.showConfirmation(
      'Logout',
      'Are you sure you want to logout?',
      async () => {
        try {
          const result = await logout();
          if (!result.success) {
            AlertHelper.showError(result.error);
          }
        } finally {
          setIsLoggingOut(false);
        }
      },
      // If canceled, reset the loading state
      () => {
        setIsLoggingOut(false);
      }
    );
  };

  const handleDeleteAccount = () => {
    if (isDeleting) return; // Prevent multiple clicks
    
    setIsDeleting(true);
    
    AlertHelper.showDestructiveConfirmation(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will delete all your groups and expenses.',
      () => {
        setPasswordModalVisible(true);
        setPassword('');
        setPasswordError(null);
      },
      // If canceled, reset the loading state
      () => {
        setIsDeleting(false);
      }
    );
  };

  const handleConfirmPassword = async () => {
    if (isConfirmingPassword) return; // Prevent multiple clicks
    
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setIsConfirmingPassword(true);
    setPasswordModalVisible(false);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user data from Firestore (groups, expenses, etc.)
      await deleteUserAccount(user.uid);

      // Delete the user account from Firebase Authentication
      await deleteUser(user);

      AlertHelper.showSuccess(
        'Your account has been successfully deleted',
        () => navigation.navigate('Login')
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      AlertHelper.showError(
        error.message || 'Failed to delete account. Please try again.'
      );
      setIsDeleting(false);
    } finally {
      setIsConfirmingPassword(false);
      setPassword('');
    }
  };

  const handleCancelPasswordModal = () => {
    setPasswordModalVisible(false);
    setIsDeleting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Your Profile</Text>
        </View>

        <Card>
          <View style={styles.profileInfo}>
            <Text style={[styles.label, { color: colors.subText }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {userProfile?.email || 'Not available'}
            </Text>
          </View>

          {isEditing ? (
            <CustomInput
              label="Display Name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) setErrors({ ...errors, displayName: null });
              }}
              placeholder="Enter your name"
              error={errors.displayName}
              accessibilityLabel="Display name input"
            />
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.label, { color: colors.subText }]}>Display Name</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {userProfile?.displayName || 'Not set'}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={[styles.label, { color: colors.subText }]}>Account Created</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {userProfile?.createdAt
                ? formatDate(userProfile.createdAt)
                : 'Not available'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <CustomButton
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  isLoading={isLoading}
                  disabled={isLoading}
                  accessibilityLabel="Save profile changes"
                />
                <View style={styles.buttonSpacer} />
                <CustomButton
                  title="Cancel"
                  type="secondary"
                  onPress={() => {
                    setDisplayName(userProfile?.displayName || '');
                    setIsEditing(false);
                    setErrors({});
                  }}
                  disabled={isLoading}
                  accessibilityLabel="Cancel editing"
                />
              </>
            ) : (
              <CustomButton
                title="Edit Profile"
                onPress={() => setIsEditing(true)}
                disabled={isLoading || isDeleting || isLoggingOut}
                accessibilityLabel="Edit profile"
              />
            )}
          </View>
        </Card>

        <View style={styles.logoutContainer}>
          <CustomButton
            title="Logout"
            type="danger"
            onPress={handleLogout}
            isLoading={isLoggingOut}
            disabled={isLoggingOut || isDeleting || isLoading}
            accessibilityLabel="Logout"
          />
          <View style={styles.buttonSpacer} />
          <CustomButton
            title="Delete Account"
            type="danger"
            onPress={handleDeleteAccount}
            isLoading={isDeleting}
            disabled={isDeleting || isLoggingOut || isLoading}
            accessibilityLabel="Delete account"
          />
        </View>
      </ScrollView>

      {/* Password Confirmation Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={32} color={colors.danger} />
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.danger }]}>
              Confirm Password
            </Text>
            
            <Text style={[styles.modalText, { color: colors.text }]}>
              Please enter your password to confirm account deletion
            </Text>
            
            <CustomInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Enter your password"
              secureTextEntry
              error={passwordError}
              accessibilityLabel="Password confirmation input"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.cancelButton, 
                  { 
                    backgroundColor: theme === 'dark' ? '#333' : '#eee',
                    borderColor: colors.border,
                  },
                  isConfirmingPassword && styles.disabledButton
                ]}
                onPress={handleCancelPasswordModal}
                disabled={isConfirmingPassword}
              >
                <Text style={[
                  styles.buttonText, 
                  { color: colors.text },
                  isConfirmingPassword && styles.disabledButtonText
                ]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.deleteButton, 
                  { backgroundColor: colors.danger },
                  isConfirmingPassword && styles.disabledButton
                ]}
                onPress={handleConfirmPassword}
                disabled={isConfirmingPassword}
              >
                <Text style={[
                  styles.buttonText, 
                  { color: '#fff' },
                  isConfirmingPassword && styles.disabledButtonText
                ]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  buttonSpacer: {
    height: 10,
  },
  logoutContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
}); 