// src/routers/contactRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const { validateContactForm } = require("../middleware/validation");
const { handleContact } = require("../controllers/contactController");

const router = express.Router();

// Rate limiting: max 5 submissions per IP per minute
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many contact form submissions. Please try again later.",
});

// POST /api/contact
router.post("/", contactLimiter, validateContactForm, handleContact);

module.exports = router;
