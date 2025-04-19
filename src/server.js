/**
 * @fileoverview Main server application file for the Secure Contact Form project.
 * Initializes the Express server, loads environment configurations,
 * sets up core middleware, and mounts route handlers.
 */

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

/**
 * Load environment variables from .env file
 * Enables configuration of environment-specific values (e.g. PORT, credentials)
 */
dotenv.config();

/**
 * Create an Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * Middleware for parsing incoming request bodies
 * - express.json(): parses JSON payloads (application/json)
 * - express.urlencoded(): parses URL-encoded form data (application/x-www-form-urlencoded)
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Serve static files from the /public directory
 * Exposes frontend assets (HTML, CSS, JS) to the client
 */
app.use(express.static(path.join(__dirname, "..", "public")));

/**
 * Mount contact form API routes
 * Routes defined in contactRoutes are mounted under /api/contact
 * Includes POST handler with validation and rate limiting
 */
const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contact", contactRoutes);

/**
 * Start the HTTP server
 * Uses PORT from environment or defaults to 3000
 * Logs a confirmation message on successful startup
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
