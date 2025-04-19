/**
 * @fileoverview Validation middleware for contact form submissions.
 *
 * Provides layered security for incoming form data using:
 * - Honeypot field detection
 * - Time-based submission validation
 * - Field-level input validation and sanitization
 *
 * Ensures bot protection, input integrity, and consistent formatting.
 */

const { body, validationResult } = require("express-validator");

/**
 * Time constraints for detecting bot-like behavior in form submissions.
 * @constant {number} MIN_TIME_MS - Minimum time (3s) to consider form as human-submitted.
 * @constant {number} MAX_TIME_MS - Maximum time (1hr) to prevent replay attacks.
 */
const MIN_TIME_MS = 3000;     // 3 seconds
const MAX_TIME_MS = 3600000;   // 1 hour

/**
 * Validation middleware chain for contact form submissions.
 * Each rule ensures the integrity, validity, and security of incoming data.
 * @type {Array<function>}
 */
const validateContactForm = [
  // Honeypot: detects bots that fill hidden fields
  body("honeypot").custom((value) => {
    if (value) throw new Error("Bot detected via honeypot field.");
    return true;
  }),

  // Timestamp check: blocks forms submitted too quickly or too late
  body("form_timestamp").custom((value) => {
    const submittedAt = parseInt(value, 10);
    const now = Date.now();

    if (!submittedAt || isNaN(submittedAt)) {
      throw new Error("Missing or invalid timestamp.");
    }

    if (now - submittedAt < MIN_TIME_MS) {
      throw new Error("Form submitted too quickly. Possible bot.");
    }

    if (now - submittedAt > MAX_TIME_MS) {
      throw new Error("Form expired. Please refresh the page and try again.");
    }

    return true;
  }),

  // First name validation: allows letters, spaces, hyphens, apostrophes, periods
  body("first_name")
    .trim()
    .notEmpty().withMessage("First name is required.")
    .isLength({ max: 50 }).withMessage("First name cannot exceed 50 characters.")
    .matches(/^[A-Za-z\s\-'.]+$/).withMessage("First name contains invalid characters."),

  // Last name validation: follows same rules as first name
  body("last_name")
    .trim()
    .notEmpty().withMessage("Last name is required.")
    .isLength({ max: 50 }).withMessage("Last name cannot exceed 50 characters.")
    .matches(/^[A-Za-z\s\-'.]+$/).withMessage("Last name contains invalid characters."),

  // Email validation: ensures format, normalizes, and limits length
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please enter a valid email address.")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Email is too long."),

  // Message validation: ensures length boundaries and non-empty
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required.")
    .isLength({ min: 5 }).withMessage("Message must be at least 5 characters.")
    .isLength({ max: 2000 }).withMessage("Message cannot exceed 2000 characters."),

  /**
   * Final middleware to check for validation errors.
   * If errors exist, responds with 400 and an array of error messages.
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express middleware continuation function
   */
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateContactForm };
