const handleContact = (req, res) => {
    const { first_name, last_name, email, message } = req.body;
  
    console.log("📬 New contact submission:");
    console.log({
      first_name,
      last_name,
      email,
      message,
    });
  
    res.status(200).json({
      message: "Thank you for contacting us! Your message has been received.",
    });
  };
  
  module.exports = { handleContact };
  