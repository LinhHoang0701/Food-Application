const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");
const mail = require("../services/mail");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: "You must enter an email address." });
    }

    if (!password) {
      return res.status(400).json({ error: "You must enter a password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ error: "No user found for this email address." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Password Incorrect",
      });
    }

    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    if (!token) {
      throw new Error();
    }

    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: "You must enter an email address." });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "You must enter your full name." });
    }

    if (!password) {
      return res.status(400).json({ error: "You must enter a password." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "That email address is already in use." });
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName,
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    user.password = hash;
    const registeredUser = await user.save();

    const payload = {
      id: registeredUser.id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: registeredUser.id,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        email: registeredUser.email,
        role: registeredUser.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const changeRole = async (req, res) => {
  try {
    const admin = "ROLE_ADMIN";

    const user = await User.findById(req.params.id);
    const query = { _id: user._id };

    const userDoc = await User.findOneAndUpdate(
      query,
      { role: admin },
      {
        new: true,
      }
    );

    res.status(201).json(userDoc);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: "You must enter an email address." });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res
        .status(400)
        .send({ error: "No user found for this email address." });
    }

    const buffer = crypto.randomBytes(48);
    const resetToken = buffer.toString("hex");

    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 3600000;

    existingUser.save();
    await mail.sendEmail(
      existingUser.email,
      "reset",
      req.headers.host,
      resetToken
    );

    res.status(200).json({
      success: true,
      message: "Please check your email for the link to reset your password.",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "You must enter a password." });
    }

    const resetUser = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!resetUser) {
      return res.status(400).json({
        error:
          "Your token has expired. Please attempt to reset your password again.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    resetUser.password = hash;
    resetUser.resetPasswordToken = undefined;
    resetUser.resetPasswordExpires = undefined;

    resetUser.save();

    await mailgun.sendEmail(resetUser.email, "reset-confirmation");

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please login with your new password.",
    });
  } catch (error) {
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const email = req.user.email;

    if (!email) {
      return res.status(401).send("Unauthenticated");
    }

    if (!password) {
      return res.status(400).json({ error: "You must enter a password." });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: "That email address is already in use." });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ error: "Please enter your correct old password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(confirmPassword, salt);
    existingUser.password = hash;
    existingUser.save();

    await mailgun.sendEmail(existingUser.email, "reset-confirmation");

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please login with your new password.",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const googleCallback = (req, res) => {
  const payload = {
    id: req.user.id,
  };

  jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
    const jwt = `Bearer ${token}`;
    const htmlWithEmbeddedJWT = `
    <html>
      <script>
        // Save JWT to localStorage
        window.localStorage.setItem('token', '${jwt}');
        // Redirect browser to root of application
        window.location.href = '/auth/success';
      </script>
    </html>       
    `;

    res.send(htmlWithEmbeddedJWT);
  });
};

const facebookCallback = (req, res) => {
  const payload = {
    id: req.user.id,
  };

  jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
    const jwt = `Bearer ${token}`;

    const htmlWithEmbeddedJWT = `
    <html>
      <script>
        // Save JWT to localStorage
        window.localStorage.setItem('token', '${jwt}');
        // Redirect browser to root of application
        window.location.href = '/auth/success';
      </script>
    </html>       
    `;

    res.send(htmlWithEmbeddedJWT);
  });
};

module.exports = {
  login,
  register,
  changeRole,
  forgotPassword,
  resetPassword,
  changePassword,
  googleCallback,
  facebookCallback,
};
