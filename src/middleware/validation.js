const { body, validationResult } = require("express-validator");

const MIN_TIME_MS = 3000; // 3 seconds minimum
const MAX_TIME_MS = 3600000; // 1 hour maximum (prevents old form submissions)

const validateContactForm = [
  // Honeypot
  body("honeypot").custom((value) => {
    if (value) throw new Error("Bot detected via honeypot field.");
    return true;
  }),

  // Time-based check
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

  // First name
  body("first_name")
    .trim()
    .notEmpty().withMessage("First name is required.")
    .isLength({ min: 1 }).withMessage("First name is required.")
    .isLength({ max: 50 }).withMessage("First name cannot exceed 50 characters.")
    .matches(/^[A-Za-z\s\-'.]+$/).withMessage("First name contains invalid characters."),

  // Last name
  body("last_name")
    .trim()
    .notEmpty().withMessage("Last name is required.")
    .isLength({ min: 1 }).withMessage("Last name is required.")
    .isLength({ max: 50 }).withMessage("Last name cannot exceed 50 characters.")
    .matches(/^[A-Za-z\s\-'.]+$/).withMessage("Last name contains invalid characters."),

  // Email
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please enter a valid email address.")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Email is too long."),

  // Message
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required.")
    .isLength({ min: 5 }).withMessage("Message must be at least  characters.")
    .isLength({ max: 2000 }).withMessage("Message cannot exceed 2000 characters."),

  // Final validation check
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateContactForm };