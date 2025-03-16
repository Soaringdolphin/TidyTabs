import React, { useContext, useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext, Colors } from "../ThemeContext";
import { useArchivedGroups } from "../ArchivedGroupsContext";
import { useFocusEffect } from "@react-navigation/native";
import { deleteGroup } from "../firebase/firestoreFunctions";
import { useAuth } from "../AuthContext";
import { AlertHelper } from "../utils/AlertHelper";

export default function ArchivedGroupsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { archivedGroups, unarchiveGroup } = useArchivedGroups();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Fade in animation when screen loads
  useFocusEffect(
    useCallback(() => {
      // Reset fade value
      fadeAnim.setValue(0);
      
      // Start fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();
      
      // Get the parent navigator (Tab Navigator) and show its tab bar
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'none', // Hide tab bar on archived groups screen
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        });
      }
      
      return () => {
        // Reset animation when screen loses focus
        fadeAnim.setValue(0);
      };
    }, [navigation, colors, fadeAnim])
  );

  // Function to format date in "Month Day, Year" format
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown Date";
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleUnarchive = (group) => {
    AlertHelper.showConfirmation(
      "Restore Group",
      "Are you sure you want to restore this group to your active groups?",
      () => {
        // Set the removing ID to trigger animation
        setRemovingId(group.id);
        
        // Animate the item out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          unarchiveGroup(group.id);
          setRemovingId(null);
          AlertHelper.showSuccess("Group has been restored to your active groups.");
        });
      }
    );
  };

  const handleDeleteGroup = (group) => {
    AlertHelper.showDestructiveConfirmation(
      "Delete Group",
      "Are you sure you want to permanently delete this group? This action cannot be undone.",
      async () => {
        try {
          setLoading(true);
          setRemovingId(group.id);
          
          // Animate the item out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start(async () => {
            try {
              await deleteGroup(group.id, user.uid);
              unarchiveGroup(group.id); // Remove from archived list
              AlertHelper.showSuccess("Group has been permanently deleted.");
            } catch (error) {
              AlertHelper.showError("Failed to delete group. Please try again.");
            } finally {
              setRemovingId(null);
              setLoading(false);
            }
          });
        } catch (error) {
          AlertHelper.showError("Failed to delete group. Please try again.");
          setRemovingId(null);
          setLoading(false);
        }
      }
    );
  };

  const handleViewGroup = (group) => {
    navigation.navigate("ArchivedGroupDetails", { 
      groupId: group.id,
      groupName: group.name,
      members: group.members,
      isArchived: true
    });
  };

  const renderItem = ({ item, index }) => {
    // Calculate member count
    const memberCount = item.members ? item.members.length : 0;
    
    // Calculate item animation delay based on index
    const itemFadeAnim = Animated.multiply(
      fadeAnim,
      Animated.subtract(1, Animated.multiply(0.05, index))
    );
    
    // If this item is being removed, return null
    if (removingId === item.id) {
      return null;
    }
    
    return (
      <Animated.View 
        style={[
          { 
            opacity: itemFadeAnim,
            transform: [{ 
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.groupItem, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            shadowColor: theme === 'dark' ? '#000' : '#888',
          }]}
          onPress={() => handleViewGroup(item)}
          accessibilityLabel={`Archived group ${item.name || "Unnamed Group"}`}
          accessibilityHint="Tap to view archived group details"
        >
          <View style={styles.groupHeader}>
            <Text style={[styles.groupName, { color: colors.text }]}>{item.name || "Unnamed Group"}</Text>
          </View>
          
          <View style={styles.memberCountContainer}>
            <View style={[styles.memberCountBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.memberCountText, { color: colors.primary }]}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>
          
          <View style={styles.groupFooter}>
            <View style={styles.datesContainer}>
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={14} color={colors.subText} style={styles.icon} />
                <Text style={[styles.groupDate, { color: colors.subText }]}>
                  Created: {formatDate(item.createdAt ? new Date(item.createdAt.seconds * 1000) : null)}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <Ionicons name="archive-outline" size={14} color={colors.subText} style={styles.icon} />
                <Text style={[styles.groupDate, { color: colors.subText }]}>
                  Archived: {formatDate(item.archivedAt)}
                </Text>
              </View>
            </View>
            
            <View style={styles.viewDetailsContainer}>
              <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {archivedGroups.length === 0 ? (
        <Animated.View 
          style={[
            styles.emptyContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }
          ]}
        >
          <Ionicons name="archive-outline" size={80} color={colors.primary + '60'} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Groups</Text>
          <Text style={[styles.emptyText, { color: colors.subText }]}>
            Groups you archive will appear here
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={archivedGroups}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  listContent: {
    padding: 16,
  },
  groupItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  memberCountContainer: {
    marginBottom: 12,
  },
  memberCountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  groupInfo: {
    marginBottom: 16,
  },
  datesContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 4,
  },
  groupDate: {
    fontSize: 12,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
}); 