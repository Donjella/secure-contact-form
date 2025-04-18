// src/routes/contactRoutes.js
const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.send("Contact route works!");
});

module.exports = router;
