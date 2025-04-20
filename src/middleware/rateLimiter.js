// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

/**
 * Rate limiting middleware for contact form submissions.
 * Limits to 5 requests per minute per IP to prevent abuse.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  // Return a proper JSON response instead of plain text
  handler: (req, res) => {
    return res.status(429).json({
      message: "Too many contact form submissions. Please try again later."
    });
  }
});

module.exports = { contactLimiter };