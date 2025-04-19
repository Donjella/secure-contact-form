/**
 * @fileoverview Client-side validation and form handling for the secure contact form.
 *
 * This script implements the front-end portion of a multi-layered defense strategy
 * against spam and form abuse. It works in conjunction with the Express.js backend,
 * which provides additional security through honeypot fields, rate limiting, and
 * server-side validation middleware.
 *
 * Features:
 * - Real-time validation with field-specific rules and constraints
 * - Dynamic error messaging with inline user feedback
 * - Timestamp generation for time-based bot detection
 * - Asynchronous form submission handling via Fetch API
 * - Detailed mapping of server-side validation errors to form fields
 * - Bot detection response handling
 *
 * Security implementation notes:
 * - Honeypot validation is implemented server-side in middleware/validation.js
 * - Rate limiting protection is configured in routes/contactRoutes.js
 * - Time-based validation uses constraints defined in middleware/validation.js:
 *   - Requires minimum 3 seconds to complete form (detects automated submissions)
 *   - Rejects submissions older than 1 hour (prevents replay attacks)
 * - Timestamp is generated client-side but validated server-side to check if it meets valid time-constraints above
 *
 */

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Sets a timestamp when the page loads to implement time-based bot detection.
   * This helps identify submissions that occur too quickly to be from a human user.
   * The server will validate this timestamp against configurable thresholds.
   */
  document.getElementById("form_timestamp").value = Date.now();

  /** 
   * Reference to the contact form element
   * @type {HTMLFormElement} 
   */
  const form = document.getElementById("contactForm");

  /** 
   * Container for displaying form submission status messages
   * @type {HTMLOutputElement} 
   */
  const responseDiv = document.getElementById("responseMessage");

  /** 
   * Collection of all required form input elements
   * @type {NodeListOf<HTMLInputElement|HTMLTextAreaElement>} 
   */
  const inputs = form.querySelectorAll("input[required], textarea[required]");

  /**
   * Initializes form field validation by creating error message elements
   * and attaching appropriate event listeners to each required field.
   * This enables real-time validation feedback as users interact with the form.
   */
  inputs.forEach(input => {
    // Create error message container for this field
    const errorSpan = document.createElement("span");
    errorSpan.className = "error-message";
    errorSpan.id = `${input.id}-error`;
    input.parentNode.appendChild(errorSpan);

    /**
     * Validates field when user navigates away from it
     * @listens blur
     */
    input.addEventListener("blur", () => {
      validateField(input);
      updateFormStatus();
    });

    /**
     * Clears validation errors when user modifies field content
     * Improves user experience by providing immediate visual feedback
     * @listens input
     */
    input.addEventListener("input", () => {
      input.classList.remove("error-field");
      document.getElementById(`${input.id}-error`).textContent = "";
      updateFormStatus();
    });
  });

  /**
   * Validates an individual form field based on field-specific rules.
   * Applies custom validation logic depending on the field type.
   * 
   * @param {HTMLInputElement|HTMLTextAreaElement} field - The input field to validate
   * @returns {boolean} - True if validation passes, false otherwise
   */
  function validateField(field) {
    const errorSpan = document.getElementById(`${field.id}-error`);

    // Reset previous validation state
    field.classList.remove("error-field");
    errorSpan.textContent = "";

    // Required field validation
    if (!field.value.trim()) {
      field.classList.add("error-field");
      errorSpan.textContent = `${getFieldLabel(field)} is required.`;
      return false;
    }

    // Name field validation - allows letters, spaces, hyphens, apostrophes, periods
    if (field.id === "first_name" || field.id === "last_name") {
      const nameRegex = /^[A-Za-z\s\-'.]+$/;
      if (!nameRegex.test(field.value.trim())) {
        field.classList.add("error-field");
        errorSpan.textContent = `${getFieldLabel(field)} can only contain letters, spaces, hyphens, apostrophes, and periods.`;
        return false;
      }
    }

    // Email validation
    if (field.id === "email" && !isValidEmail(field.value)) {
      field.classList.add("error-field");
      errorSpan.textContent = "Please enter a valid email address.";
      return false;
    }

    // Message length validation - minimum 10 characters required
    if (field.id === "message" && field.value.trim().length < 10) {
      field.classList.add("error-field");
      errorSpan.textContent = "Message must be at least 10 characters.";
      return false;
    }

    return true;
  }

  /**
   * Updates the general form status message based on validation errors.
   * Provides a unified error message when any field has validation issues.
   */
  function updateFormStatus() {
    const hasErrors = form.querySelectorAll('.error-field').length > 0;
    responseDiv.textContent = hasErrors
      ? "Oops! Please correct the highlighted fields in red before submitting."
      : "";
    responseDiv.className = hasErrors ? "error" : "";
  }

  /**
   * Retrieves the appropriate label text for a form field.
   * Used to create more user-friendly error messages that reference field names.
   * 
   * @param {HTMLInputElement|HTMLTextAreaElement} field - The input field
   * @returns {string} - The label text or formatted field ID if label not found
   */
  function getFieldLabel(field) {
    const labelElement = document.querySelector(`label[for="${field.id}"]`);
    return labelElement ? labelElement.textContent : field.id.replace('_', ' ');
  }

  /**
   * Validates email format using regular expression.
   * Implements a basic check for standard email format requirements.
   * 
   * @param {string} email - The email address to validate
   * @returns {boolean} - True if email format is valid, false otherwise
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Handles form submission with client-side validation and server communication.
   * Implements asynchronous form submission using Fetch API with comprehensive
   * error handling for various response scenarios.
   * 
   * @listens submit
   * @async
   */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    let isValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    updateFormStatus();

    // Stop submission if client-side validation fails
    if (!isValid) {
      return;
    }

    // Show submission in progress indicator
    responseDiv.textContent = "Sending message...";
    responseDiv.className = "info";

    // Prepare form data for JSON submission
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      /**
       * Send form data to server endpoint
       * Uses fetch API for asynchronous communication
       */
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle various error scenarios based on server response
        if (result.errors && result.errors.length > 0) {
          // Map server validation errors back to form fields
          result.errors.forEach(error => {
            const fieldName = error.path;
            const field = document.getElementById(fieldName);

            if (field) {
              field.classList.add("error-field");
              const errorSpan = document.getElementById(`${fieldName}-error`);
              if (errorSpan) {
                errorSpan.textContent = error.msg;
              }
            }
          });

          // Check for security-related errors (bot detection)
          const botError = result.errors.find(
            err => err.path === "honeypot" || err.path === "form_timestamp"
          );

          // Show appropriate error message based on error type
          responseDiv.textContent = botError
            ? "Submission blocked: Possible bot detected."
            : "Oops! Please correct the highlighted fields in red before submitting.";
          responseDiv.className = "error";

        } else if (result.message && res.status === 429) {
          // Handle rate limit errors
          responseDiv.textContent = result.message;
          responseDiv.className = "error";

        } else {
          // Handle generic errors
          throw new Error(result.message || "Something went wrong");
        }

      } else {
        // Handle successful submission
        responseDiv.textContent = result.message || "Message sent successfully!";
        responseDiv.className = "success";

        // Reset form state for potential future submissions
        form.reset();
        document.getElementById("form_timestamp").value = Date.now();
      }

    } catch (error) {
      // Handle network or other unexpected errors
      responseDiv.textContent = error.message || "Something went wrong. Please try again.";
      responseDiv.className = "error";
    }
  });
});