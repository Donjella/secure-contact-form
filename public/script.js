/**
 * @fileoverview Client-side validation and form handling for the secure contact form.
 *
 * This script implements the front-end portion of a multi-layered defense strategy
 * against spam and form abuse. It works in conjunction with the Express.js backend,
 * which handles additional validation through honeypot fields, rate limiting, and
 * other middleware protections.
 *
 * Features:
 * - Real-time validation with field-specific rules
 * - Dynamic error messaging and inline feedback
 * - Timestamp setting for time-based bot detection
 * - Asynchronous form submission via Fetch API
 * - Mapping of server-side errors to client-side display
 *
 * Note: Honeypot and rate limiting are implemented in middleware/validation.js
 * and routes/contactRoutes.js on the server.
 */


document.addEventListener("DOMContentLoaded", () => {
  /**
   * Sets a timestamp when the page loads to implement time-based bot detection
   * This helps identify submissions that occur too quickly to be from a human user
   */
  document.getElementById("form_timestamp").value = Date.now();

  /** @type {HTMLFormElement} */
  const form = document.getElementById("contactForm");

  /** @type {HTMLOutputElement} */
  const responseDiv = document.getElementById("responseMessage");

  /** @type {NodeListOf<HTMLInputElement|HTMLTextAreaElement>} */
  const inputs = form.querySelectorAll("input[required], textarea[required]");


  /**
   * Adds error message elements and event listeners to each required form field
   * This enables real-time validation and immediate user feedback
   */
  inputs.forEach(input => {
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
     * Clears errors when user starts typing, improving user experience
     * @listens input
     */
    input.addEventListener("input", () => {
      input.classList.remove("error-field");
      document.getElementById(`${input.id}-error`).textContent = "";
      updateFormStatus();
    });
  });

  /**
   * Validates an individual form field based on field-specific rules
   * @param {HTMLElement} field - The input field to validate
   * @returns {boolean} - True if validation passes, false otherwise
   */
  function validateField(field) {
    const errorSpan = document.getElementById(`${field.id}-error`);

    // Reset previous errors
    field.classList.remove("error-field");
    errorSpan.textContent = "";

    // Check if empty
    if (!field.value.trim()) {
      field.classList.add("error-field");
      errorSpan.textContent = `${getFieldLabel(field)} is required.`;
      return false;
    }

    /**
     * Field-specific validation rules
     * Each field type has custom validation requirements
     */
    if (field.id === "first_name" || field.id === "last_name") {
      const nameRegex = /^[A-Za-z\s\-'.]+$/;
      if (!nameRegex.test(field.value.trim())) {
        field.classList.add("error-field");
        errorSpan.textContent = `${getFieldLabel(field)} can only contain letters, spaces, hyphens, apostrophes, and periods.`;
        return false;
      }
    }

    if (field.id === "email" && !isValidEmail(field.value)) {
      field.classList.add("error-field");
      errorSpan.textContent = "Please enter a valid email address.";
      return false;
    }

    if (field.id === "message" && field.value.trim().length < 10) {
      field.classList.add("error-field");
      errorSpan.textContent = "Message must be at least 10 characters.";
      return false;
    }

    return true;
  }

  /**
   * Updates the general form status message based on validation errors
   * Provides a unified error message when any field has validation issues
   */
  function updateFormStatus() {
    const hasErrors = form.querySelectorAll('.error-field').length > 0;

    if (hasErrors) {
      responseDiv.textContent = "Oops! Please correct the highlighted fields in red before submitting.";
      responseDiv.className = "error";
    } else {
      responseDiv.textContent = "";
      responseDiv.className = "";
    }
  }

  /**
   * Retrieves the appropriate label text for a form field
   * Used to create more user-friendly error messages
   * @param {HTMLElement} field - The input field
   * @returns {string} - The label text or formatted field ID
   */
  function getFieldLabel(field) {
    const labelElement = document.querySelector(`label[for="${field.id}"]`);
    return labelElement ? labelElement.textContent : field.id.replace('_', ' ');
  }

  /**
   * Validates email format using regular expression
   * @param {string} email - The email address to validate
   * @returns {boolean} - True if email format is valid, false otherwise
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Handles form submission with client-side validation and server communication
   * Implements asynchronous form submission using Fetch API
   * @listens submit
   * @async
   */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    /**
     * Validate all fields before submission
     * This ensures complete client-side validation before sending to server
     */
    let isValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    // Update general error message
    updateFormStatus();

    if (!isValid) {
      responseDiv.textContent = "Oops! Please correct the highlighted fields in red before submitting.";
      responseDiv.className = "error";
      return; // Stop submission if validation fails
    }

    // Show loading state for better user experience
    responseDiv.textContent = "Sending message...";
    responseDiv.className = "info";

    /**
     * Prepare form data for submission
     * Converts FormData to a plain object for JSON serialization
     */
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
        /**
         * Handle server validation errors
         * Maps server errors back to specific form fields for user feedback
         */
        if (result.errors && result.errors.length > 0) {
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

          responseDiv.textContent = "Oops! Please correct the highlighted fields in red before submitting.";
          responseDiv.className = "error";
        } else {
          throw new Error(result.message || "Something went wrong");
        }
      } else {
        /**
         * Handle successful submission
         * Resets form and shows success message
         */
        responseDiv.textContent = result.message || "Message sent successfully!";
        responseDiv.className = "success";
        form.reset();

        // Reset timestamp for potential future submissions
        document.getElementById("form_timestamp").value = Date.now();
      }
    } catch (error) {
      /**
       * Handle network or other unexpected errors
       * Provides user-friendly error feedback
       */
      responseDiv.textContent = error.message || "Something went wrong. Please try again.";
      responseDiv.className = "error";
    }
  });
});