/**
 * @fileoverview Controller for handling contact form submissions.
 *
 * This function receives validated form data from the frontend and returns
 * a success response. Currently logs submitted data to the console for testing.
 *
 */

/**
 * Processes a validated contact form submission.
 * Logs submitted form data to the console and sends a success response to the client.
 * This function can be extended in the future to store data, send notifications, or integrate with third-party services.
 * 
 * @param {Object} req - Express request object containing form data
 * @param {Object} req.body - The parsed request body containing form fields
 * @param {string} req.body.first_name - User's first name
 * @param {string} req.body.last_name - User's last name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.message - User's message content
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status message
 */
const handleContact = (req, res) => {
  // Extract form data from the request body
  const { first_name, last_name, email, message } = req.body;

  // Log the submission for demonstration purposes
  console.log("New contact submission:");
  console.log({
    first_name,
    last_name,
    email,
    message,
  });

  /**
   * Send success response to the client
   * Status 200 indicates successful processing of the submission
   */
  res.status(200).json({
    message: "Thank you for contacting us! Your message has been received.",
  });
};

// Export controller functions for use in route definitions
module.exports = { handleContact };