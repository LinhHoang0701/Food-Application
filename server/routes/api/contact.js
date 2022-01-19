const express = require("express");
const router = express.Router();

const { addContact } = require("../../controllers/contact");

router.post("/add", addContact);

module.exports = router;
