const express = require("express");
const passport = require("passport");
const router = express.Router();

const {
  login,
  register,
  changeRole,
  forgotPassword,
  resetPassword,
  changePassword,
  googleCallback,
  facebookCallback,
} = require("../../controllers/auth");
const auth = require("../../middleware/auth");
const { checkRole, ROLES } = require("../../middleware/role");

router.post("/login", login);

router.post("/register", register);

router.put("/changeRole/:id", auth, checkRole(ROLES.Admin), changeRole);

router.post("/forgot", forgotPassword);

router.post("/reset/:token", resetPassword);

router.post("/reset", auth, changePassword);

router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
    accessType: "offline",
    approvalPrompt: "force",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    session: false,
  }),
  googleCallback
);

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    session: false,
    scope: ["public_profile", "email"],
  })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/",
    session: false,
  }),
  facebookCallback
);

module.exports = router;
