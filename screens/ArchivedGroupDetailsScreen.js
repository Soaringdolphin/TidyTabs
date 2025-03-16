import React, { useEffect, useState, useContext, useCallback, memo, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { getGroupExpenses, deleteGroup } from "../firebase/firestoreFunctions";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { ThemeContext, Colors } from "../ThemeContext";
import { useAuth } from "../AuthContext";
import { useArchivedGroups } from "../ArchivedGroupsContext";
import { Ionicons } from "@expo/vector-icons";
import { AlertHelper } from "../utils/AlertHelper";

// Memoized expense item component (read-only)
const ExpenseItem = memo(({ item, colors }) => (
  <View 
    style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    accessibilityLabel={`Expense: ${item.description}, Amount: $${item.amount ? item.amount.toFixed(2) : "0.00"}, Paid by ${item.payer}`}
  >
    <View>
      <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
      <Text style={[styles.expensePayer, { color: colors.subText }]}>Paid by {item.payer}</Text>
    </View>
    <Text style={[styles.expenseAmount, { color: colors.success }]}>
      {"$" + (item.amount ? item.amount.toFixed(2) : "0.00")}
    </Text>
  </View>
));

export default function ArchivedGroupDetailsScreen({ route, navigation }) {
  const { groupId = "", groupName = "Unnamed Group", members = [] } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { user } = useAuth();
  const { unarchiveGroup } = useArchivedGroups();
  const isFocused = useIsFocused();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Animation value for fade in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch expenses when screen is focused
  useEffect(() => {
    if (isFocused && groupId) {
      // Start fade in animation
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      
      fetchExpenses();
    }
    
    return () => {
      // Reset animation when screen loses focus
      fadeAnim.setValue(0);
    };
  }, [isFocused, groupId, fadeAnim]);

  // Explicitly show the tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // Get the parent navigator (Tab Navigator) and show its tab bar
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'none', // Hide tab bar on archived group details screen
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        });
      }
    }, [navigation, colors])
  );

  // Function to fetch expenses
  const fetchExpenses = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const expensesData = await getGroupExpenses(groupId);
      setExpenses(expensesData || []);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  // Handle restoring the group
  const handleRestoreGroup = () => {
    AlertHelper.showConfirmation(
      "Restore Group",
      "Are you sure you want to restore this group to your active groups?",
      () => {
        // Animate out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          unarchiveGroup(groupId);
          AlertHelper.showSuccess(
            "Group has been restored to your active groups.",
            () => navigation.goBack()
          );
        });
      }
    );
  };
  
  // Handle deleting the group
  const handleDeleteGroup = () => {
    AlertHelper.showDestructiveConfirmation(
      "Delete Group",
      "Are you sure you want to permanently delete this group? This action cannot be undone.",
      async () => {
        try {
          setIsDeleting(true);
          
          // Animate out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start(async () => {
            try {
              await deleteGroup(groupId, user.uid);
              unarchiveGroup(groupId); // Remove from archived list
              AlertHelper.showSuccess(
                "Group has been permanently deleted.",
                () => navigation.goBack()
              );
            } catch (error) {
              AlertHelper.showError("Failed to delete group. Please try again.");
              setIsDeleting(false);
            }
          });
        } catch (error) {
          AlertHelper.showError("Failed to delete group. Please try again.");
          setIsDeleting(false);
        }
      }
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          opacity: fadeAnim 
        }
      ]}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "members" && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveTab("members")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "members" ? colors.primary : colors.subText }
            ]}
          >
            Members
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "expenses" && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveTab("expenses")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "expenses" ? colors.primary : colors.subText }
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
      </View>

      {/* Archive Status Banner */}
      <View style={[styles.archivedBanner, { backgroundColor: colors.warning + '20' }]}>
        <Ionicons name="archive" size={18} color={colors.warning} style={styles.bannerIcon} />
        <Text style={[styles.archivedText, { color: colors.warning }]}>
          This group is archived
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning }]}
          onPress={handleRestoreGroup}
          disabled={isDeleting}
        >
          <Ionicons name="refresh-outline" size={16} color="white" style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>
            Restore Group
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger }]}
          onPress={handleDeleteGroup}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={16} color="white" style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>
            Delete Group
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "members" && (
        <View style={styles.contentContainer}>
          {members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                No members in this group
              </Text>
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={({ item }) => (
                <View style={[styles.memberItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{item}</Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          )}
        </View>
      )}

      {activeTab === "expenses" && (
        <View style={styles.contentContainer}>
          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                No expenses in this group
              </Text>
            </View>
          ) : (
            <FlatList
              data={expenses}
              renderItem={({ item }) => <ExpenseItem item={item} colors={colors} />}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  archivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerIcon: {
    marginRight: 8,
  },
  archivedText: {
    fontWeight: "600",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  memberItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberName: {
    fontSize: 16,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
  },
  expensePayer: {
    fontSize: 14,
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
}); 