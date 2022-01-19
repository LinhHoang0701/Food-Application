const express = require("express");
const router = express.Router();

const Review = require("../../models/review");
const Product = require("../../models/product");
const auth = require("../../middleware/auth");
const {
  addReview,
  getReview,
  getReviewBySlug,
  editReview,
  approveReview,
  rejectReview,
  deleteReview,
} = require("../../controllers/review");

router.post("/add", auth, addReview);

router.get("/", getReview);

router.get("/:slug", getReviewBySlug);

router.put("/:id", editReview);

// approve review
router.put("/approve/:reviewId", auth, approveReview);

// reject review
router.put("/reject/:reviewId", auth, rejectReview);

router.delete("/delete/:id", deleteReview);

module.exports = router;
