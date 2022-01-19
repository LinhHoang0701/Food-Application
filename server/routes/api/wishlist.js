const express = require("express");
const router = express.Router();

// Bring in Models & Helpers
const auth = require("../../middleware/auth");
const { getAllWishlist, addWishlist } = require("../../controllers/wishlist");

router.post("/", auth, addWishlist);

// fetch wishlist api
router.get("/", auth, getAllWishlist);

module.exports = router;
