/**
 * @fileoverview Defines the contact form POST route with layered middleware.
 *
 * This route handles incoming contact form submissions using:
 * - contactLimiter: to rate limit requests and prevent abuse
 * - validateContactForm: to check honeypot, timestamp, and field validity
 * - handleContact: to process valid submissions and return a success response
 *
 * @module routes/contactRoutes
 */

const express = require("express");
const { validateContactForm } = require("../middleware/validation");
const { contactLimiter } = require("../middleware/rateLimiter");
const { handleContact } = require("../controllers/contactController");

/**
 * Create a new Express router instance.
 * @type {express.Router}
 */
const router = express.Router();

/**
 * POST /api/contact
 *
 * Applies middleware in the following order:
 * 1. contactLimiter — protects against request flooding (rate limiting)
 * 2. validateContactForm — validates input fields, timestamp, and honeypot
 * 3. handleContact — logs and returns a success response
 */
router.post("/", contactLimiter, validateContactForm, handleContact);

/**
 * Export the router for integration with the main application.
 */
module.exports = router;
