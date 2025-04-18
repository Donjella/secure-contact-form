const { body, validationResult } = require("express-validator");

const MIN_TIME_MS = 3000; // 3 seconds minimum

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

    return true;
  }),

  // First name
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required."),

  // Last name
  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required."),

  // Email
  body("email")
    .isEmail()
    .withMessage("Valid email is required."),

  // Message
  body("message")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters."),

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
