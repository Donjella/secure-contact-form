// Set timestamp when page loads
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('form_timestamp').value = Date.now();
  });
  
  // Handle form submission
  document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const responseMessage = document.getElementById('responseMessage');
    responseMessage.innerHTML = 'Sending message...';
    responseMessage.className = '';
    
    try {
      const formData = new FormData(this);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.errors ? result.errors[0].msg : 'Something went wrong');
      }
      
      // Success
      responseMessage.innerHTML = 'Thank you! Your message has been sent successfully.';
      responseMessage.className = 'success';
      this.reset();
      document.getElementById('form_timestamp').value = Date.now(); // Reset timestamp
      
    } catch (error) {
      // Error
      responseMessage.innerHTML = `Error: ${error.message}`;
      responseMessage.className = 'error';
    }
  });