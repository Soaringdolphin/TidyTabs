import React, { useContext, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext, Colors } from "../ThemeContext";
import { useAuth } from "../AuthContext";
import { resetPassword } from "../firebase/auth";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useArchivedGroups } from "../ArchivedGroupsContext";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { user, logout, updateEmail } = useAuth();
  const navigation = useNavigation();
  const { archivedGroups } = useArchivedGroups();
  
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Function to format date in "Month Day, Year" format
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !currentPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updateEmail(newEmail, currentPassword);
      if (error) {
        Alert.alert("Error", error);
      } else {
        Alert.alert("Success", "Email updated successfully");
        setEmailModalVisible(false);
        setNewEmail('');
        setCurrentPassword('');
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "No user email found. Please try logging in again.");
      return;
    }

    try {
      setIsResetting(true);
      await resetPassword(user.email);
      Alert.alert(
        "Success", 
        "Password reset email sent. Please check your inbox."
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // Explicitly show the tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // Get the parent navigator (Tab Navigator) and show its tab bar
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        });
      }
    }, [navigation, colors])
  );

  const navigateToArchivedGroups = () => {
    navigation.navigate("ArchivedGroups");
  };

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Section */}
      <View style={[styles.profileSection, { borderColor: colors.border }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.emailText, { color: colors.text }]}>
              {user?.email || 'No email'}
            </Text>
            <Text style={[styles.memberText, { color: colors.subText }]}>
              Member since {user?.metadata?.creationTime 
                ? formatDate(user.metadata.creationTime)
                : 'Unknown'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.settingItem, { borderColor: colors.border }]}
          onPress={navigateToProfile}
          accessibilityLabel="Profile"
          accessibilityHint="Navigate to edit your profile"
        >
          <View style={styles.settingContent}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderColor: colors.border }]}
          onPress={() => setEmailModalVisible(true)}
          accessibilityLabel="Change email"
          accessibilityHint="Change your account email"
        >
          <View style={styles.settingContent}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Change Email
            </Text>
          </View>
          {isLoading ? (
            <Text style={{ color: colors.subText }}>Updating...</Text>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderColor: colors.border }]}
          onPress={handleResetPassword}
          accessibilityLabel="Reset password"
          accessibilityHint="Send a password reset email"
        >
          <View style={styles.settingContent}>
            <Ionicons name="key-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Reset Password
            </Text>
          </View>
          {isResetting ? (
            <Text style={{ color: colors.subText }}>Sending...</Text>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          )}
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App</Text>
        
        {/* Theme Toggle - Now a clickable card that shows current mode */}
        <TouchableOpacity
          style={[styles.settingItem, { borderColor: colors.border }]}
          onPress={toggleTheme}
          accessibilityLabel={`${theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}`}
          accessibilityHint="Toggle between light and dark theme"
        >
          <View style={styles.settingContent}>
            <Ionicons
              name={theme === "dark" ? "moon" : "sunny"}
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.settingText, { color: colors.text }]}>
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.subText }]}>
            {theme === "dark" ? "On" : "Off"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.settingItem, { borderColor: colors.border }]}
          onPress={navigateToArchivedGroups}
          accessibilityLabel="View archived groups"
          accessibilityHint="Navigate to see your archived groups"
        >
          <View style={styles.settingContent}>
            <Ionicons name="archive-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Archived Groups
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subText} />
        </TouchableOpacity>
      </View>
      
      {/* Logout Button at the bottom */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.danger + '15' }]}
        onPress={handleLogout}
        accessibilityLabel="Logout"
        accessibilityHint="Log out of your account"
      >
        <Ionicons name="log-out-outline" size={24} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>
          Logout
        </Text>
      </TouchableOpacity>

      {/* Email Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Email</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.subText }]}>
              Enter your new email address and current password
            </Text>
            
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border, 
                color: colors.text,
                backgroundColor: colors.card
              }]}
              placeholder="New Email Address"
              placeholderTextColor={colors.subText}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border, 
                color: colors.text,
                backgroundColor: colors.card
              }]}
              placeholder="Current Password"
              placeholderTextColor={colors.subText}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleChangeEmail}
              disabled={isLoading}
            >
              <Text style={styles.modalButtonText}>
                {isLoading ? "Updating..." : "Update Email"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberText: {
    fontSize: 14,
  },
  settingsSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 40,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    marginBottom: 20,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
