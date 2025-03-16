import React, { useState, useContext, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { ThemeContext, Colors } from "../ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { AlertHelper } from "../utils/AlertHelper";
import { updateGroupMembers, updateGroup } from "../firebase/firestoreFunctions";

export default function ManageMembersScreen({ route, navigation }) {
  const { members, groupId, groupName } = route.params;
  const [groupMembers, setGroupMembers] = useState(members);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [newMember, setNewMember] = useState("");
  const [newGroupName, setNewGroupName] = useState(groupName || "");
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const [isSaving, setIsSaving] = useState(false);

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

  const renameMember = (index) => {
    setEditingMemberIndex(index);
    setEditingMemberName(groupMembers[index]);
  };

  const saveRenamedMember = () => {
    if (editingMemberName.trim() !== "") {
      const updatedMembers = [...groupMembers];
      updatedMembers[editingMemberIndex] = editingMemberName.trim();
      setGroupMembers(updatedMembers);
      setEditingMemberIndex(null);
      setEditingMemberName("");
    }
  };

  const removeMember = (index) => {
    AlertHelper.showConfirmation(
      "Remove Member",
      "Are you sure you want to remove this member?",
      async () => {
        try {
          // Create a new array without the member at the specified index
          const updatedMembers = groupMembers.filter((_, i) => i !== index);
          
          // Update the UI immediately for better user experience
          setGroupMembers(updatedMembers);
          
          // Update in Firebase
          const success = await updateGroup(groupId, newGroupName, updatedMembers);
          
          if (success) {
            AlertHelper.showSuccess("Member removed successfully");
          } else {
            // If the update failed, revert the UI change
            AlertHelper.showError("Failed to remove member. Please try again.");
            setGroupMembers(groupMembers);
          }
        } catch (error) {
          // If there was an error, revert the UI change
          AlertHelper.showError("An error occurred while removing the member");
          setGroupMembers(groupMembers);
        }
      }
    );
  };

  const addMember = () => {
    if (newMember.trim() !== "") {
      setGroupMembers([...groupMembers, newMember.trim()]);
      setNewMember("");
    }
  };

  const saveChanges = async () => {
    if (!newGroupName.trim()) {
      AlertHelper.showError("Group name cannot be empty");
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await updateGroup(groupId, newGroupName.trim(), groupMembers);
      
      if (success) {
        AlertHelper.showSuccess("Group updated successfully!");
        // Navigate back to GroupDetails using the correct navigation path
        navigation.navigate('Home', { 
          screen: 'GroupDetails',
          params: {
            groupId, 
            groupName: newGroupName.trim(), 
            members: groupMembers,
            refresh: Date.now()
          }
        });
      } else {
        AlertHelper.showError("Failed to update group. Please try again.");
      }
    } catch (error) {
      AlertHelper.showError("An error occurred while updating the group");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <View style={styles.groupNameSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Group Name</Text>
            <TextInput 
              style={[styles.groupNameInput, { 
                backgroundColor: theme === 'dark' ? colors.card : '#fff',
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter group name"
              placeholderTextColor={theme === 'dark' ? colors.subText : '#ccc'}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
          </View>
          
          <View style={styles.addMemberSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Add New Member</Text>
            
            <View style={styles.addMemberContainer}>
              <TextInput 
                style={[styles.memberInput, { 
                  backgroundColor: theme === 'dark' ? colors.card : '#fff',
                  borderColor: colors.border,
                  color: colors.text
                }]}
                placeholder="Enter member name"
                placeholderTextColor={theme === 'dark' ? colors.subText : '#ccc'}
                value={newMember}
                onChangeText={setNewMember}
              />
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={addMember}
                disabled={!newMember.trim()}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.membersSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Current Members</Text>
            
            {groupMembers.length > 0 ? (
              <FlatList
                data={groupMembers}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={[styles.memberCard, { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border,
                    shadowColor: theme === 'dark' ? '#000' : '#888',
                  }]}>
                    {editingMemberIndex === index ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={[styles.editInput, { 
                            backgroundColor: theme === 'dark' ? colors.background : '#fff',
                            borderColor: colors.border,
                            color: colors.text
                          }]}
                          value={editingMemberName}
                          onChangeText={setEditingMemberName}
                          autoFocus
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity 
                            style={[styles.editButton, { backgroundColor: colors.danger }]}
                            onPress={() => setEditingMemberIndex(null)}
                          >
                            <Text style={styles.editButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.editButton, { backgroundColor: colors.primary }]}
                            onPress={saveRenamedMember}
                          >
                            <Text style={styles.editButtonText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.memberInfo}>
                          <Ionicons name="person" size={24} color={colors.primary} style={styles.memberIcon} />
                          <Text style={[styles.memberName, { color: colors.text }]}>{item}</Text>
                        </View>
                        <View style={styles.memberActions}>
                          <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => renameMember(index)}
                          >
                            <Ionicons name="create-outline" size={16} color="white" />
                            <Text style={styles.actionButtonText}>Rename</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: colors.danger }]}
                            onPress={() => removeMember(index)}
                          >
                            <Ionicons name="trash-outline" size={16} color="white" />
                            <Text style={styles.actionButtonText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
                scrollEnabled={false}
                nestedScrollEnabled={true}
              />
            ) : (
              <View style={styles.emptyMembersContainer}>
                <Text style={[styles.emptyText, { color: colors.subText }]}>
                  No members in this group. Add members above.
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: colors.primary,
                opacity: isSaving ? 0.7 : 1 
              }
            ]}
            onPress={saveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  groupNameSection: {
    marginBottom: 20,
  },
  groupNameInput: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addMemberSection: {
    marginBottom: 20,
  },
  membersSection: {
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  addMemberContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  memberInput: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  addButton: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  memberCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  memberIcon: {
    marginRight: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "500",
  },
  memberActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  editContainer: {
    width: "100%",
  },
  editInput: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyMembersContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
