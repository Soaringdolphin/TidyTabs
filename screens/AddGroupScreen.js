import React, { useState, useCallback, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createGroup } from "../firebase/firestoreFunctions";
import { ThemeContext, Colors } from "../ThemeContext";
import { useAuth } from "../AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { AlertHelper } from "../utils/AlertHelper";
import { BottomButton, CustomInput } from "../components";
import { BackHandler } from "react-native";

export default function AddGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      // Reset state when screen is focused
      setGroupName("");
      setMembers([]);
      setNewMember("");
      setEditingMemberIndex(null);
      setEditingMemberName("");
      
      // Hide bottom tab bar when this screen is focused
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

      // Handle hardware back button
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.navigate('Home');
          return true; // Prevent default behavior
        }
      );
      
      return () => {
        // Clean up the event listener
        backHandler.remove();
      };
    }, [navigation, colors])
  );

  const addMember = () => {
    if (newMember.trim() !== "") {
      setMembers([...members, newMember.trim()]);
      setNewMember("");
    }
  };

  const removeMember = (index) => {
    AlertHelper.showConfirmation(
      "Remove Member",
      "Are you sure you want to remove this member?",
      () => {
        setMembers(members.filter((_, i) => i !== index));
      }
    );
  };

  const renameMember = (index) => {
    setEditingMemberIndex(index);
    setEditingMemberName(members[index]);
  };

  const saveRenamedMember = () => {
    if (editingMemberName.trim() !== "") {
      const updatedMembers = [...members];
      updatedMembers[editingMemberIndex] = editingMemberName.trim();
      setMembers(updatedMembers);
      setEditingMemberIndex(null);
      setEditingMemberName("");
    }
  };

  const handleCreateGroup = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    if (!user) {
      AlertHelper.showError("You must be logged in to create a group");
      return;
    }
    
    if (groupName.trim() === "") {
      AlertHelper.showError("Please enter a group name");
      return;
    }

    if (members.length === 0) {
      AlertHelper.showError("Please add at least one member");
      return;
    }

    setIsLoading(true);
    try {
      const groupId = await createGroup(groupName.trim(), members, user.uid);
      
      if (groupId) {
        AlertHelper.showSuccess(
          "Group created successfully!",
          () => {
            // Navigate to GroupDetails using the correct navigation path
            navigation.navigate('Home', {
              screen: 'GroupDetails',
              params: {
                groupId: groupId,
                groupName: groupName.trim(),
                members,
                refresh: Date.now()
              }
            });
          }
        );
      } else {
        AlertHelper.showError("Failed to create group. Please try again.");
      }
    } catch (error) {
      AlertHelper.showError(error.message || "Failed to create group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <CustomInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter group name"
          />

          <View style={styles.membersSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Members</Text>
            
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

            {members.length > 0 ? (
              <FlatList
                data={members}
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
                  No members added yet. Add members to your group.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomButton
        title="Create Group"
        onPress={handleCreateGroup}
        isLoading={isLoading}
        disabled={isLoading}
        backgroundColor={colors.primary}
      />
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  membersSection: {
    marginTop: 20,
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
});
