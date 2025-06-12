const { functions } = require('firebase-functions');

/**
 * HIPAA-compliant input validation utilities
 * Ensures all PHI inputs are properly validated and sanitized
 */

/**
 * Validate patient ID format
 * @param {string} id - Patient ID to validate
 * @returns {string} - Sanitized patient ID
 * @throws {functions.https.HttpsError} - If validation fails
 */
const validatePatientId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Patient ID is required and must be a string');
  }
  
  // Remove any potentially harmful characters and limit length
  const sanitized = id.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50);
  
  if (!sanitized || sanitized.length < 1) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid patient ID format');
  }
  
  return sanitized;
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {string} - Validated date string
 * @throws {functions.https.HttpsError} - If validation fails
 */
const validateDate = (date) => {
  if (!date || typeof date !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Date is required and must be a string');
  }
  
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new functions.https.HttpsError('invalid-argument', 'Date must be in YYYY-MM-DD format');
  }
  
  // Validate it's a real date
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().split('T')[0] !== date) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid date value');
  }
  
  // Ensure date is not too far in the past or future (reasonable bounds)
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 150, 0, 1); // 150 years ago
  const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years from now
  
  if (parsedDate < minDate || parsedDate > maxDate) {
    throw new functions.https.HttpsError('invalid-argument', 'Date is outside acceptable range');
  }
  
  return date;
};

/**
 * Validate search criteria for patient search
 * @param {object} criteria - Search criteria object
 * @returns {object} - Sanitized search criteria
 * @throws {functions.https.HttpsError} - If validation fails
 */
const validateSearchCriteria = (criteria) => {
  if (!criteria || typeof criteria !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Search criteria is required and must be an object');
  }
  
  const sanitized = {};
  
  // Validate lastName if provided
  if (criteria.lastName) {
    if (typeof criteria.lastName !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Last name must be a string');
    }
    // Remove special characters, allow letters, spaces, hyphens, apostrophes
    sanitized.lastName = criteria.lastName
      .replace(/[^a-zA-Z\s\-']/g, '')
      .substring(0, 100)
      .trim();
      
    if (!sanitized.lastName) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid last name format');
    }
  }
  
  // Validate firstName if provided
  if (criteria.firstName) {
    if (typeof criteria.firstName !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'First name must be a string');
    }
    sanitized.firstName = criteria.firstName
      .replace(/[^a-zA-Z\s\-']/g, '')
      .substring(0, 100)
      .trim();
  }
  
  // Validate dateOfBirth if provided
  if (criteria.dateOfBirth) {
    sanitized.dateOfBirth = validateDate(criteria.dateOfBirth);
  }
  
  // Ensure at least one search criterion is provided
  if (Object.keys(sanitized).length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'At least one valid search criterion must be provided');
  }
  
  return sanitized;
};

/**
 * Validate appointment data
 * @param {object} appointmentData - Appointment data to validate
 * @returns {object} - Sanitized appointment data
 * @throws {functions.https.HttpsError} - If validation fails
 */
const validateAppointmentData = (appointmentData) => {
  if (!appointmentData || typeof appointmentData !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Appointment data is required and must be an object');
  }
  
  const sanitized = {};
  
  // Validate required fields
  if (appointmentData.patientId) {
    sanitized.patientId = validatePatientId(appointmentData.patientId);
  }
  
  if (appointmentData.date) {
    sanitized.date = validateDate(appointmentData.date);
  }
  
  // Validate optional fields
  if (appointmentData.time && typeof appointmentData.time === 'string') {
    // Validate time format HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(appointmentData.time)) {
      sanitized.time = appointmentData.time;
    }
  }
  
  if (appointmentData.type && typeof appointmentData.type === 'string') {
    sanitized.type = appointmentData.type
      .replace(/[^a-zA-Z\s\-]/g, '')
      .substring(0, 100)
      .trim();
  }
  
  return sanitized;
};

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param {string} input - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>\"'&]/g, '') // Remove potential XSS characters
    .replace(/[^\w\s\-@.]/g, '') // Allow only word chars, spaces, hyphens, @ and .
    .substring(0, maxLength)
    .trim();
};

/**
 * Log validation attempt for audit trail
 * @param {string} userId - User ID performing the validation
 * @param {string} operation - Type of validation operation
 * @param {boolean} success - Whether validation succeeded
 */
const logValidationAttempt = (userId, operation, success) => {
  const auditLog = {
    type: 'VALIDATION_ATTEMPT',
    userId: userId || 'anonymous',
    operation,
    success,
    timestamp: new Date().toISOString()
  };
  
  console.log('HIPAA_AUDIT:', JSON.stringify(auditLog));
};

module.exports = {
  validatePatientId,
  validateDate,
  validateSearchCriteria,
  validateAppointmentData,
  sanitizeString,
  logValidationAttempt
}; 