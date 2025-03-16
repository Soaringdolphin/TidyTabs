import React, { useState, useContext, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { addExpense } from "../firebase/firestoreFunctions";
import { ThemeContext, Colors } from "../ThemeContext";
import { CustomInput, BottomButton } from "../components";
import { useAuth } from "../AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AlertHelper } from "../utils/AlertHelper";

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members } = route.params;
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // Memoize validation function to prevent unnecessary recalculations
  const validateInputs = useCallback(() => {
    let newErrors = {};
    let isValid = true;

    // Validate description
    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    // Validate amount
    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
      isValid = false;
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
      isValid = false;
    }

    // Validate payer
    if (!payer.trim()) {
      newErrors.payer = "Please select who paid";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [description, amount, payer]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleDescriptionChange = useCallback((text) => {
    setDescription(text);
    if (errors.description) {
      setErrors(prev => ({...prev, description: null}));
    }
  }, [errors.description]);

  const handleAmountChange = useCallback((text) => {
    setAmount(text);
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

  const handleAddExpense = useCallback(async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    if (!user) {
      AlertHelper.showError("You must be logged in to add an expense");
      return;
    }
    
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const expenseData = {
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        payer: payer.trim(),
        createdAt: new Date(),
      };

      const expenseId = await addExpense(expenseData, user.uid);
      
      if (expenseId) {
        AlertHelper.showSuccess(
          "Expense added successfully!",
          () => navigation.goBack()
        );
      } else {
        AlertHelper.showError("Failed to add expense. Please try again.");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      AlertHelper.showError(
        "Failed to add expense. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [groupId, description, amount, payer, validateInputs, navigation, user, isLoading]);

  const renderDropdown = () => {
    if (!dropdownOpen) return null;
    
    return (
      <View style={[styles.dropdown, { 
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: theme === 'dark' ? '#000' : '#888',
      }]}>
        {members.map((member, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dropdownItem, 
              payer === member && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => handlePayerChange(member)}
          >
            <Text style={{ color: colors.text }}>{member}</Text>
            {payer === member && (
              <Ionicons name="checkmark" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
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
            leftIcon={
              <Text style={{ color: colors.text, marginRight: 5, fontSize: 16 }}>$</Text>
            }
          />

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Who Paid?</Text>
            <TouchableOpacity
              style={[
                styles.payerSelector,
                { 
                  backgroundColor: theme === 'dark' ? colors.card : '#fff',
                  borderColor: errors.payer ? colors.danger : colors.border 
                }
              ]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={{ color: payer ? colors.text : colors.subText }}>
                {payer || "Select Payer"}
              </Text>
              <Ionicons 
                name={dropdownOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.subText} 
              />
            </TouchableOpacity>
            {errors.payer && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.payer}
              </Text>
            )}
            {renderDropdown()}
          </View>
        </View>
      </ScrollView>

      <BottomButton
        title="Add Expense"
        onPress={handleAddExpense}
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  payerSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 50,
  },
  dropdown: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
});
