import { db } from "./firebaseConfig";
import { collection, doc, deleteDoc, addDoc, query, getDocs, serverTimestamp, where, getDoc, updateDoc, arrayUnion, orderBy, setDoc } from "firebase/firestore";

// Simple in-memory cache
const cache = {
  groups: {
    data: {},
    timestamp: {},
    expiryTime: 60000, // 1 minute cache
  },
  expenses: {
    data: {},
    timestamp: {},
    expiryTime: 30000, // 30 seconds cache
  }
};

/**
 * Creates a new group with the given name and members
 * @param {string} groupName - The name of the group
 * @param {Array<string>} members - Array of member names
 * @param {string} userId - The ID of the user creating the group
 * @returns {Promise<string|null>} - The ID of the created group or null if error
 */
export const createGroup = async (groupName, members, userId) => {
  if (!userId) {
    return null;
  }

  try {
    // Create the group data - don't add userId to members as it's just a name list
    const groupData = {
      name: groupName,
      members: members || [],
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Create the group document
    const groupRef = await addDoc(collection(db, 'groups'), groupData);
    const groupId = groupRef.id;
    
    // Check if user document exists
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user document with the new group ID
      await updateDoc(userRef, {
        groups: arrayUnion(groupId),
      });
    } else {
      // Create new user document with the group ID
      await setDoc(userRef, {
        groups: [groupId],
        createdAt: serverTimestamp(),
      });
    }
    
    return groupId;
  } catch (error) {
    return null;
  }
};

/**
 * Fetches all expense groups from Firestore with caching
 * @param {string} userId - The ID of the user whose groups to fetch
 * @returns {Promise<Array|[]>} - Array of group objects or empty array if error
 */
export const getGroups = async (userId) => {
  if (!userId) {
    return [];
  }

  try {
    // Query groups directly where the user is the creator
    const groupsQuery = query(
      collection(db, "groups"),
      where("createdBy", "==", userId)
    );
    
    const groupsSnapshot = await getDocs(groupsQuery);
    const groups = [];
    
    groupsSnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    
    return groups;
  } catch (error) {
    return [];
  }
};

/**
 * Fetches expenses for a specific group with caching
 * @param {string} groupId - The ID of the group
 * @returns {Promise<Array|[]>} - Array of expense objects or empty array if error
 */
export const getGroupExpenses = async (groupId) => {
  if (!groupId) {
    return [];
  }

  try {
    // Simple query without orderBy to avoid index requirements
    const expensesQuery = query(
      collection(db, "expenses"),
      where("groupId", "==", groupId)
    );
    
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle date conversion safely
      let createdAt = new Date();
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          // Firestore Timestamp
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          // JavaScript Date
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'string') {
          // ISO string
          createdAt = new Date(data.createdAt);
        }
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        // Ensure amount is a number
        amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0
      };
    });
    
    // Sort expenses by date client-side instead of using orderBy
    expenses.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
};

/**
 * Adds a new expense to Firestore
 * @param {Object} expenseData - The expense data object
 * @param {string} userId - The ID of the user adding the expense
 * @returns {Promise<string|null>} - The ID of the created expense or null if error
 */
export const addExpense = async (expenseData, userId) => {
  if (!expenseData || !expenseData.groupId) {
    throw new Error("Invalid expense data provided");
  }

  if (!userId) {
    throw new Error("User ID is required to add an expense");
  }

  try {
    const expenseRef = await addDoc(collection(db, "expenses"), {
      ...expenseData,
      userId,
      createdAt: serverTimestamp(),
    });
    
    // Invalidate expenses cache for this group
    if (cache.expenses.data[expenseData.groupId]) {
      cache.expenses.data[expenseData.groupId] = null;
    }
    
    return expenseRef.id;
  } catch (error) {
    throw new Error(`Failed to add expense: ${error.message}`);
  }
};

/**
 * Calculates how expenses should be split among group members
 * @param {Array} expenses - Array of expense objects
 * @param {Array<string>} members - Array of member names
 * @returns {Array} - Array of transaction objects
 */
export const calculateExpenseSplit = (expenses, members) => {
  if (!expenses || expenses.length === 0 || !members || members.length === 0) return [];

  const validMembers = members.filter(member => member && member.trim() !== "");
  if (validMembers.length === 0) return [];

  // Step 1: Calculate total spent by each person
  let totalSpent = {};
  validMembers.forEach(member => {
    totalSpent[member] = 0;
  });

  // Add up all expenses by payer
  expenses.forEach(expense => {
    const { payer, amount } = expense;
    if (!payer || !validMembers.includes(payer) || !amount) return;
    totalSpent[payer] = (totalSpent[payer] || 0) + Number(amount);
  });

  // Step 2: Calculate the total and fair share per person
  const totalExpenses = Object.values(totalSpent).reduce((sum, amount) => sum + amount, 0);
  const fairSharePerPerson = totalExpenses / validMembers.length;

  // Step 3: Calculate how much each person owes or is owed
  let balances = {};
  validMembers.forEach(member => {
    balances[member] = totalSpent[member] - fairSharePerPerson;
  });

  // Step 4: Create transactions with minimal number of payments
  let transactions = [];
  let creditors = [];
  let debtors = [];

  Object.keys(balances).forEach(member => {
    if (balances[member] > 0) {
      creditors.push({ name: member, balance: balances[member] });
    } else if (balances[member] < 0) {
      debtors.push({ name: member, balance: balances[member] });
    }
  });

  // Sort by amount (descending for creditors, ascending for debtors)
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  while (creditors.length > 0 && debtors.length > 0) {
    let creditor = creditors[0];
    let debtor = debtors[0];

    let amount = Math.min(creditor.balance, -debtor.balance);
    
    // Round to 2 decimal places to avoid floating point issues
    amount = Math.round(amount * 100) / 100;

    if (amount > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount.toFixed(2)
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount;

    if (Math.abs(creditor.balance) < 0.01) {
      creditors.shift();
    }

    if (Math.abs(debtor.balance) < 0.01) {
      debtors.shift();
    }
  }

  return transactions;
};

/**
 * Deletes a group and all its associated expenses
 * @param {string} groupId - The ID of the group to delete
 * @param {string} userId - The ID of the user deleting the group
 * @returns {Promise<boolean>} - True if successful, false if error
 */
export const deleteGroup = async (groupId, userId) => {
  if (!groupId || !userId) {
    return false;
  }

  try {
    // Verify the user owns this group
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return false;
    }
    
    // Check if the user created this group
    if (groupDoc.data().createdBy !== userId) {
      return false;
    }
    
    // Delete all expenses linked to this group first
    const expensesQuery = query(collection(db, "expenses"), where("groupId", "==", groupId));
    const expensesSnapshot = await getDocs(expensesQuery);

    const deletePromises = expensesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Now delete the group itself
    await deleteDoc(doc(db, "groups", groupId));
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Deletes an expense and returns updated expenses list
 * @param {string} expenseId - The ID of the expense to delete
 * @param {string} groupId - The ID of the group the expense belongs to
 * @param {string} userId - The ID of the user deleting the expense
 * @returns {Promise<Array|boolean>} - Updated expenses array or false if error
 */
export const deleteExpense = async (expenseId, groupId, userId) => {
  if (!expenseId || !groupId) {
    throw new Error("Invalid IDs provided to deleteExpense");
  }

  if (!userId) {
    throw new Error("User ID is required to delete an expense");
  }

  try {
    // Verify the user owns this expense or the group
    const expenseRef = doc(db, "expenses", expenseId);
    const expenseDoc = await getDoc(expenseRef);
    
    if (!expenseDoc.exists()) {
      throw new Error("Expense not found");
    }
    
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists() || (expenseDoc.data().userId !== userId && groupDoc.data().userId !== userId)) {
      throw new Error("User does not have permission to delete this expense");
    }
    
    await deleteDoc(expenseRef);
    
    // Invalidate expenses cache for this group
    if (cache.expenses.data[groupId]) {
      delete cache.expenses.data[groupId];
      delete cache.expenses.timestamp[groupId];
    }
    
    // Fetch updated expenses list
    const updatedExpenses = await getGroupExpenses(groupId);
    return updatedExpenses;
  } catch (error) {
    throw new Error(`Error deleting expense: ${error.message}`);
  }
};

/**
 * Updates an existing expense in Firestore
 * @param {Object} expenseData - The updated expense data object with id
 * @param {string} userId - The ID of the user updating the expense
 * @returns {Promise<boolean>} - True if successful, false if error
 */
export const updateExpense = async (expenseData, userId) => {
  if (!expenseData || !expenseData.id || !expenseData.groupId) {
    throw new Error("Invalid expense data provided");
  }

  if (!userId) {
    throw new Error("User ID is required to update an expense");
  }

  try {
    // Verify the user owns this expense or the group
    const expenseRef = doc(db, "expenses", expenseData.id);
    const expenseDoc = await getDoc(expenseRef);
    
    if (!expenseDoc.exists()) {
      throw new Error("Expense not found");
    }
    
    const groupRef = doc(db, "groups", expenseData.groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }
    
    // Check if user has permission (either created the expense or owns the group)
    const expenseData_old = expenseDoc.data();
    if (expenseData_old.userId !== userId && groupDoc.data().createdBy !== userId) {
      throw new Error("You don't have permission to update this expense");
    }
    
    // Update the expense
    await updateDoc(expenseRef, {
      description: expenseData.description,
      amount: expenseData.amount,
      payer: expenseData.payer,
      updatedAt: serverTimestamp(),
    });
    
    // Invalidate expenses cache for this group
    if (cache.expenses.data[expenseData.groupId]) {
      delete cache.expenses.data[expenseData.groupId];
      delete cache.expenses.timestamp[expenseData.groupId];
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }
};

/**
 * Updates the members of a group in Firestore
 * @param {string} groupId - The ID of the group to update
 * @param {Array<string>} members - The new list of members
 * @returns {Promise<boolean>} - True if successful, false if error
 */
export const updateGroupMembers = async (groupId, members) => {
  if (!groupId) {
    return false;
  }

  try {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return false;
    }
    
    // Update the members array and updatedAt timestamp
    await updateDoc(groupRef, {
      members: members,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating group members:", error);
    return false;
  }
};

/**
 * Updates a group's name and members in Firestore
 * @param {string} groupId - The ID of the group to update
 * @param {string} groupName - The new name for the group
 * @param {Array<string>} members - The new list of members
 * @returns {Promise<boolean>} - True if successful, false if error
 */
export const updateGroup = async (groupId, groupName, members) => {
  if (!groupId) {
    return false;
  }

  try {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return false;
    }
    
    // Update the group name, members array and updatedAt timestamp
    await updateDoc(groupRef, {
      name: groupName,
      members: members,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating group:", error);
    return false;
  }
};

/**
 * Deletes a user account and all associated data (groups, expenses)
 * @param {string} userId - The ID of the user to delete
 * @returns {Promise<void>}
 */
export const deleteUserAccount = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // 1. Get all groups owned by the user
    const groupsQuery = query(
      collection(db, "groups"),
      where("createdBy", "==", userId)
    );
    const groupsSnapshot = await getDocs(groupsQuery);
    const groupIds = [];

    // 2. Delete all expenses for each group
    for (const groupDoc of groupsSnapshot.docs) {
      const groupId = groupDoc.id;
      groupIds.push(groupId);

      // Get all expenses for this group
      const expensesQuery = query(
        collection(db, "expenses"),
        where("groupId", "==", groupId)
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      // Delete each expense
      const expenseDeletePromises = expensesSnapshot.docs.map(expenseDoc => 
        deleteDoc(doc(db, "expenses", expenseDoc.id))
      );
      await Promise.all(expenseDeletePromises);
    }

    // 3. Delete all groups owned by the user
    const groupDeletePromises = groupIds.map(groupId => 
      deleteDoc(doc(db, "groups", groupId))
    );
    await Promise.all(groupDeletePromises);

    // 4. Delete the user document
    await deleteDoc(doc(db, "users", userId));

    // 5. Clear any cached data
    if (cache.groups.data[userId]) {
      delete cache.groups.data[userId];
      delete cache.groups.timestamp[userId];
    }

    groupIds.forEach(groupId => {
      if (cache.expenses.data[groupId]) {
        delete cache.expenses.data[groupId];
        delete cache.expenses.timestamp[groupId];
      }
    });

    return true;
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
};


