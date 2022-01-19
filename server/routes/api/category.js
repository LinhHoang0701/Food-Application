const express = require("express");
const router = express.Router();

// Bring in Models & Helpers
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const {
  addCategory,
  getListCategory,
  getCategory,
  getCategoryById,
  editCategory,
  editActiveCategory,
  deleteCategory,
} = require("../../controllers/category");

router.post("/add", auth, role.checkRole(role.ROLES.Admin), addCategory);

// fetch store categories api
router.get("/list", getListCategory);

// fetch categories api
router.get("/", getCategory);

// fetch category api
router.get("/:id", getCategoryById);

router.put("/:id", auth, role.checkRole(role.ROLES.Admin), editCategory);

router.put(
  "/:id/active",
  auth,
  role.checkRole(role.ROLES.Admin),
  editActiveCategory
);

router.delete(
  "/delete/:id",
  auth,
  role.checkRole(role.ROLES.Admin),
  deleteCategory
);

module.exports = router;
