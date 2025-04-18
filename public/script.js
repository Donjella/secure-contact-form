document.addEventListener("DOMContentLoaded", () => {
    // Set timestamp on page load
    document.getElementById("form_timestamp").value = Date.now();
    
    const form = document.getElementById("contactForm");
    const responseDiv = document.getElementById("responseMessage");
    const inputs = form.querySelectorAll("input[required], textarea[required]");
    
    // Add error message elements after each input
    inputs.forEach(input => {
      const errorSpan = document.createElement("span");
      errorSpan.className = "error-message";
      errorSpan.id = `${input.id}-error`;
      input.parentNode.appendChild(errorSpan);
      
      // Add blur event for real-time validation
      input.addEventListener("blur", () => {
        validateField(input);
        updateFormStatus();
      });
      
      // Add input event to clear errors when user starts typing
      input.addEventListener("input", () => {
        input.classList.remove("error-field");
        document.getElementById(`${input.id}-error`).textContent = "";
        updateFormStatus();
      });
    });
    
    // Validate individual field
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
      
      // Additional validation based on field type
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
    
    // Function to check if any fields have errors and update the general message
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
    
    // Get field label for error messages
    function getFieldLabel(field) {
      const labelElement = document.querySelector(`label[for="${field.id}"]`);
      return labelElement ? labelElement.textContent : field.id.replace('_', ' ');
    }
    
    // Email validation helper
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    
    // Form submission handler
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Validate all fields before submission
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
      
      // Show loading state
      responseDiv.textContent = "Sending message...";
      responseDiv.className = "info";
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        const result = await res.json();
        
        if (!res.ok) {
          // Handle server validation errors
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
          // Success
          responseDiv.textContent = result.message || "Message sent successfully!";
          responseDiv.className = "success";
          form.reset();
          document.getElementById("form_timestamp").value = Date.now();
        }
      } catch (error) {
        responseDiv.textContent = error.message || "Something went wrong. Please try again.";
        responseDiv.className = "error";
      }
    });
  });