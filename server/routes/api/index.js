const router = require("express").Router();

const authRoutes = require("./auth");
const userRoutes = require("./user");
const productRoutes = require("./product");
const wishlistRoutes = require("./wishlist");
const categoryRoutes = require("./category");
const reviewRoutes = require("./review");
const contact = require("./contact");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/product", productRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/category", categoryRoutes);
router.use("/review", reviewRoutes);
router.use("/contact", contact);

module.exports = router;
