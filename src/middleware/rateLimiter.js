// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

/**
 * Rate limiting middleware for contact form submissions.
 * Limits to 5 requests per minute per IP to prevent abuse.
 *
 * @type {function} Express middleware
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many contact form submissions. Please try again later.",
});

module.exports = { contactLimiter };
