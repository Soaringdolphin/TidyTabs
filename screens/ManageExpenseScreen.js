import React, { useState, useContext, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { updateExpense, deleteExpense } from "../firebase/firestoreFunctions";
import { ThemeContext, Colors } from "../ThemeContext";
import { CustomButton, CustomInput, BottomButton } from "../components";
import { useAuth } from "../AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AlertHelper } from "../utils/AlertHelper";

export default function ManageExpenseScreen({ route, navigation }) {
  const { expense, groupId, members } = route.params;
  const [description, setDescription] = useState(expense.description || "");
  const [amount, setAmount] = useState(expense.amount ? expense.amount.toString() : "");
  const [payer, setPayer] = useState(expense.payer || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { user } = useAuth();

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

  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    // Validate description
    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length > 100) {
      newErrors.description = "Description must be less than 100 characters";
    }
    
    // Validate amount
    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        newErrors.amount = "Amount must be a valid number";
      } else if (parsedAmount <= 0) {
        newErrors.amount = "Amount must be greater than zero";
      } else if (parsedAmount > 1000000) {
        newErrors.amount = "Amount is too large";
      }
    }
    
    // Validate payer
    if (!payer) {
      newErrors.payer = "Please select who paid";
    } else if (!members.includes(payer)) {
      newErrors.payer = "Selected payer is not a member of this group";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [description, amount, payer, members]);

  const handleDescriptionChange = useCallback((text) => {
    setDescription(text);
    if (errors.description) {
      setErrors(prev => ({...prev, description: null}));
    }
  }, [errors.description]);

  const handleAmountChange = useCallback((text) => {
    // Only allow numbers and a single decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = filtered.split('.');
    const formatted = parts.length > 1 
      ? parts[0] + '.' + parts.slice(1).join('')
      : filtered;
    
    setAmount(formatted);
    if (errors.amount) {
      setErrors(prev => ({...prev, amount: null}));
    }
  }, [errors.amount]);

  const handlePayerChange = useCallback((selectedPayer) => {
    setPayer(selectedPayer);
    setDropdownOpen(false);
    if (errors.payer) {
      setErrors(prev => ({...prev, payer: null}));
    }
  }, [errors.payer]);

  const handleUpdateExpense = useCallback(async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    if (!user) {
      AlertHelper.showError("You must be logged in to update an expense");
      return;
    }
    
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const expenseData = {
        id: expense.id,
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        payer: payer.trim(),
      };

      await updateExpense(expenseData, user.uid);
      AlertHelper.showSuccess(
        "Expense updated successfully",
        () => navigation.goBack()
      );
    } catch (error) {
      AlertHelper.showError(error.message || "Failed to update expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [expense.id, groupId, description, amount, payer, validateInputs, navigation, user, isLoading]);

  const handleDeleteExpense = useCallback(async () => {
    if (isDeleting) return; // Prevent multiple clicks
    
    AlertHelper.showDestructiveConfirmation(
      "Delete Expense",
      "Are you sure you want to delete this expense? This action cannot be undone.",
      async () => {
        try {
          setIsDeleting(true);
          await deleteExpense(expense.id, groupId, user.uid);
          AlertHelper.showSuccess(
            "Expense deleted successfully",
            () => navigation.goBack()
          );
        } catch (error) {
          AlertHelper.showError(error.message || "Failed to delete expense. Please try again.");
          setIsDeleting(false); // Reset deleting state if there's an error
        }
      },
      // If canceled, reset the deleting state
      () => {
        setIsDeleting(false);
      }
    );
  }, [expense.id, groupId, navigation, user, isDeleting]);

  // Custom dropdown component
  const renderDropdown = () => {
    return (
      <View style={styles.dropdownContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Who Paid?</Text>
        
        <TouchableOpacity 
          style={[
            styles.dropdownButton, 
            { 
              backgroundColor: theme === 'dark' ? colors.card : '#fff',
              borderColor: errors.payer ? colors.danger : colors.border 
            }
          ]}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Text style={[
            styles.dropdownButtonText, 
            { 
              color: payer ? colors.text : colors.subText
            }
          ]}>
            {payer || "Select Payer"}
          </Text>
          <Ionicons 
            name={dropdownOpen ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={colors.subText} 
          />
        </TouchableOpacity>
        
        {dropdownOpen && (
          <View style={[
            styles.dropdownList, 
            { 
              backgroundColor: theme === 'dark' ? colors.card : '#fff',
              borderColor: colors.border 
            }
          ]}>
            {members.map((member, index) => (
              <TouchableOpacity
                key={index.toString()}
                style={[
                  styles.dropdownItem,
                  payer === member && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handlePayerChange(member)}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                  {member}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {errors.payer && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors.payer}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <CustomInput
            label="Expense Description"
            value={description}
            onChangeText={handleDescriptionChange}
            placeholder="E.g. Dinner, Groceries"
            error={errors.description}
            accessibilityLabel="Expense description"
          />

          <CustomInput
            label="Amount"
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="Enter amount"
            keyboardType="numeric"
            error={errors.amount}
            accessibilityLabel="Expense amount"
          />

          {renderDropdown()}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <BottomButton
          title="Update Expense"
          onPress={handleUpdateExpense}
          isLoading={isLoading}
          disabled={isLoading || isDeleting}
          backgroundColor={colors.primary}
        />
      </View>
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
  scrollContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
}); 