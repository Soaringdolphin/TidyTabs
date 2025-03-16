/**
 * Calculate the total sum of all expenses
 * @param {Array} expenses - Array of expense objects with amount property
 * @returns {number} - Total sum of all expenses
 */
export const calculateTotalExpense = (expenses) => {
  if (!expenses || !Array.isArray(expenses)) {
    return 0;
  }
  
  return expenses.reduce((total, expense) => {
    return total + (parseFloat(expense.amount) || 0);
  }, 0);
};

/**
 * Calculate the amount each person should pay when splitting equally
 * @param {number} totalAmount - The total amount to be split
 * @param {number} numberOfPeople - Number of people to split between
 * @returns {number} - Amount per person
 */
export const calculateSplitAmount = (totalAmount, numberOfPeople) => {
  if (!numberOfPeople || numberOfPeople <= 0) {
    throw new Error('Number of people must be greater than zero');
  }
  
 