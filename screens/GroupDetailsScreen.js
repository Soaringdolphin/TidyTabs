import React, { useEffect, useState, useContext, useCallback, memo, useMemo } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { getGroupExpenses, calculateExpenseSplit, deleteGroup, deleteExpense, updateGroupMembers } from "../firebase/firestoreFunctions";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { ThemeContext, Colors } from "../ThemeContext";
import { useAuth } from "../AuthContext";
import { useArchivedGroups } from "../ArchivedGroupsContext";
import { Ionicons } from "@expo/vector-icons";
import { AlertHelper } from "../utils/AlertHelper";

// Memoized expense item component
const ExpenseItem = memo(({ item, onDelete, colors, onPress }) => (
  <TouchableOpacity 
    style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    accessibilityLabel={`Expense: ${item.description}, Amount: $${item.amount ? item.amount.toFixed(2) : "0.00"}, Paid by ${item.payer}`}
    onPress={() => onPress(item)}
  >
    <View style={styles.expenseContent}>
      <View>
        <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
        <Text style={[styles.expensePayer, { color: colors.subText }]}>Paid by {item.payer}</Text>
      </View>
      <View style={styles.expenseRightContent}>
        <Text style={[styles.expenseAmount, { color: colors.success }]}>
          ${item.amount ? parseFloat(item.amount).toFixed(2) : "0.00"}
        </Text>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={() => onDelete(item.id)}
          accessibilityLabel={`Delete expense: ${item.description}`}
          accessibilityHint="Deletes this expense from the group"
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
));

// Memoized transaction item component
const TransactionItem = memo(({ transaction, colors }) => {
  // Safely parse and format the amount
  const amount = transaction.amount !== undefined ? 
    (typeof transaction.amount === 'string' ? 
      parseFloat(transaction.amount) : 
      Number(transaction.amount)) : 
    0;
  
  const formattedAmount = !isNaN(amount) ? amount.toFixed(2) : "0.00";
  
  return (
    <View 
      key={transaction.from + transaction.to} 
      style={[styles.memberItem, { borderBottomColor: colors.border }]}
      accessibilityLabel={`${transaction.from} owes ${transaction.to} $${formattedAmount}`}
      accessibilityRole="text"
    >
      <Text style={[styles.memberName, { color: colors.text }]}>
        {transaction.from} owes {transaction.to} <Text style={styles.amountText}>${formattedAmount}</Text>
      </Text>
    </View>
  );
});

export default function GroupDetailsScreen({ route, navigation }) {
  const { groupId = "", groupName = "Unnamed Group", members = [] } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [groupMembers, setGroupMembers] = useState(members);
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused();
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { user } = useAuth();
  const { archiveGroup } = useArchivedGroups();

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
      
      return () => {
        // This cleanup function will run when the screen loses focus
        // We don't need to restore the tab bar here as the Home/Settings screens
        // will handle showing it when they gain focus
      };
    }, [navigation, colors])
  );

  // Fetch expenses and calculate splits when screen is focused or members change
  useEffect(() => {
    if (isFocused) {
      const fetchExpenses = async () => {
        setIsLoading(true);
        try {
          const expensesData = await getGroupExpenses(groupId);
          
          if (Array.isArray(expensesData)) {
            setExpenses(expensesData);
            
            // Calculate splits in the next frame to avoid blocking the UI
            requestAnimationFrame(() => {
              const splitData = calculateExpenseSplit(expensesData, groupMembers);
              setTransactions(splitData || []);
              setIsLoading(false);
            });
          } else {
            // Handle case where expensesData is not an array
            setExpenses([]);
            setTransactions([]);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error in fetchExpenses:", error);
          setExpenses([]);
          setTransactions([]);
          setIsLoading(false);
        }
      };

      fetchExpenses();
    }
  }, [isFocused, groupMembers, groupId]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleDeleteExpense = useCallback(async (expenseId) => {
    if (!user) {
      AlertHelper.showError("You must be logged in to delete an expense");
      return;
    }
    
    try {
      const updatedExpenses = await deleteExpense(expenseId, groupId, user.uid);
      if (updatedExpenses) {
        AlertHelper.showSuccess("Expense deleted successfully!");
        setExpenses(updatedExpenses);
        
        // Calculate splits in the next frame
        requestAnimationFrame(() => {
          const splitData = calculateExpenseSplit(updatedExpenses, groupMembers);
          setTransactions(splitData || []);
        });
      } else {
        AlertHelper.showError("Failed to delete expense. Please try again.");
      }
    } catch (error) {
      AlertHelper.showError("An unexpected error occurred.");
    }
  }, [groupId, groupMembers, user]);

  const handleDeleteGroup = useCallback(async () => {
    if (!user) {
      AlertHelper.showError("You must be logged in to delete a group");
      return;
    }
    
    AlertHelper.showDestructiveConfirmation(
      "Delete Group",
      "Are you sure you want to delete this group and all its expenses?",
      async () => {
        try {
          const success = await deleteGroup(groupId, user.uid);
          if (success) {
            AlertHelper.showSuccess("Group deleted successfully!");
            // Navigate back to the home screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } else {
            AlertHelper.showError("Failed to delete group. Please try again.");
          }
        } catch (error) {
          AlertHelper.showError("An error occurred while deleting the group.");
        }
      }
    );
  }, [groupId, navigation, user]);

  const handleArchiveGroup = useCallback(() => {
    AlertHelper.showConfirmation(
      "Archive Group",
      "Are you sure you want to archive this group? It will be moved to your archived groups and can be restored later.",
      () => {
        try {
          // Create a group object with all necessary data
          const groupToArchive = {
            id: groupId,
            name: groupName,
            members: groupMembers
          };
          
          archiveGroup(groupToArchive);
          AlertHelper.showSuccess("Group archived successfully!");
          // Navigate back to the home screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } catch (error) {
          AlertHelper.showError("An error occurred while archiving the group.");
        }
      }
    );
  }, [groupId, groupName, groupMembers, archiveGroup, navigation]);

  // Memoized render functions for FlatList
  const renderExpenseItem = useCallback(({ item }) => (
    <ExpenseItem 
      item={item} 
      colors={colors} 
      onDelete={handleDeleteExpense}
      onPress={(expense) => navigation.navigate("ManageExpense", { 
        expense, 
        groupId, 
        members: groupMembers 
      })}
    />
  ), [colors, handleDeleteExpense, navigation, groupId, groupMembers]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renameMember = (index) => {
    setEditingMemberIndex(index);
    setEditingMemberName(groupMembers[index]);
  };

  const saveRenamedMember = async () => {
    if (editingMemberName.trim() !== "") {
      try {
        // Create updated members array
        const updatedMembers = [...groupMembers];
        updatedMembers[editingMemberIndex] = editingMemberName.trim();
        
        // Update the UI immediately for better user experience
        setGroupMembers(updatedMembers);
        setEditingMemberIndex(null);
        setEditingMemberName("");
        
        // Update in Firebase
        const success = await updateGroupMembers(groupId, updatedMembers);
        
        if (success) {
          // Recalculate splits with the updated member names
          const splitData = calculateExpenseSplit(expenses, updatedMembers);
          setTransactions(splitData || []);
        } else {
          // If the update failed, show an error but don't revert the UI
          // since it's just a name change and not critical
          AlertHelper.showError("Failed to update member name in the database, but it's saved locally.");
        }
      } catch (error) {
        AlertHelper.showError("An error occurred while updating the member name");
      }
    } else {
      // If empty name, just cancel the edit
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
          const success = await updateGroupMembers(groupId, updatedMembers);
          
          if (success) {
            AlertHelper.showSuccess("Member removed successfully");
            
            // Recalculate splits with the updated members
            const splitData = calculateExpenseSplit(expenses, updatedMembers);
            setTransactions(splitData || []);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.groupName, { color: colors.text }]}>{groupName}</Text>
        <Text style={[styles.membersList, { color: colors.subText }]}>
          {groupMembers.join(', ')}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("ManageMembers", { members: groupMembers, groupId, groupName })}
          accessibilityLabel="Manage members"
          accessibilityHint="Navigate to manage group members"
        >
          <Text style={styles.buttonText}>Manage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning }]}
          onPress={handleArchiveGroup}
          accessibilityLabel="Archive group"
          accessibilityHint="Archive this group to access it later"
        >
          <Text style={styles.buttonText}>Archive</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger }]}
          onPress={handleDeleteGroup}
          accessibilityLabel="Delete group"
          accessibilityHint="Permanently delete this group"
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View 
        style={[styles.membersContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
        accessibilityLabel="Who owes what summary"
      >
        <Text style={[styles.membersTitle, { color: colors.text }]}>Who Owes What?</Text>
        <View style={styles.memberList}>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionItem 
                key={transaction.from + transaction.to}
                transaction={transaction} 
                colors={colors} 
              />
            ))
          ) : (
            <Text style={{ color: colors.text }}>No expenses yet.</Text>
          )}
        </View>
      </View>

      <Text style={[styles.expensesTitle, { color: colors.text }]}>Expenses</Text>
      
      <View style={styles.expensesContainer}>
        {expenses.length === 0 ? (
          <Text style={{ color: colors.text }}>No expenses yet.</Text>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={keyExtractor}
            renderItem={renderExpenseItem}
            initialNumToRender={8}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            accessibilityLabel="List of expenses"
          />
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.addExpenseButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("AddExpense", { groupId, members: groupMembers })}
      >
        <Text style={styles.addExpenseButtonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 15,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  membersList: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "white",
  },
  expenseItem: {
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  expenseContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  expenseRightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  expensePayer: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  membersContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 15,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  memberName: {
    fontSize: 14,
    marginBottom: 3,
  },
  amountText: {
    fontWeight: "bold",
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  memberList: {
    marginTop: 5,
  },
  expensesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  expensesContainer: {
    flex: 1,
  },
  addExpenseButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#20B2AA',
    padding: 16,
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  addExpenseButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});