/**
 * Calculate expected total fees for a student based on their type and applicable fees
 * @param {Object} feeStructure - The fee structure object from the server
 * @param {Boolean} isNewStudent - Whether the student is new or returning
 * @returns {Number} Total expected fees
 */
export const calculateExpectedFees = (feeStructure, isNewStudent) => {
  if (!feeStructure) return 0;

  if (isNewStudent) {
    return feeStructure.newStudentTotal || 0;
  } else {
    return feeStructure.returningStudentTotal || 0;
  }
};

/**
 * Calculate fees for a specific student based on student data and fee structure
 * @param {Object} student - Student object with isNewStudent and classLevel properties
 * @param {Object} feeStructure - The fee structure for the term
 * @returns {Number} Total expected fees
 */
export const calculateStudentExpectedFees = (student, feeStructure) => {
  return calculateExpectedFees(feeStructure, student?.isNewStudent);
};

/**
 * Format currency amount to Nigerian Naira format
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₦0';
  return `₦${amount.toLocaleString()}`;
};

/**
 * Calculate payment status based on amount paid vs expected
 * @param {Number} amountPaid - Amount paid
 * @param {Number} expectedAmount - Expected total amount
 * @returns {String} Status: 'Unpaid', 'Partial', or 'Paid'
 */
export const getPaymentStatus = (amountPaid, expectedAmount) => {
  if (!amountPaid || amountPaid === 0) return 'Unpaid';
  if (amountPaid >= expectedAmount) return 'Paid';
  return 'Partial';
};

/**
 * Calculate balance due
 * @param {Number} expectedAmount - Expected total amount
 * @param {Number} amountPaid - Amount paid
 * @returns {Number} Balance remaining
 */
export const calculateBalance = (expectedAmount, amountPaid) => {
  return Math.max(0, expectedAmount - (amountPaid || 0));
};
