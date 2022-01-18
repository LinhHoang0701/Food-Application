const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const login = async (req, res) => {
  try {
    const {email, password} = req.body;

    if (!email) {
      return res.status(400).json({error: 'You must enter an email address.'});
    }

    if (!password) {
      return res.status(400).json({error: 'You must enter a password.'});
    }

    const user = await User.findOne({email});
    if (!user) {
      return res
        .status(400)
        .send({error: 'No user found for this email address.'});
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Password Incorrect',
      });
    }

    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
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
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

const register = async (req, res) => {
  try {
    const {email, firstName, lastName, password} = req.body;

    if (!email) {
      return res.status(400).json({error: 'You must enter an email address.'});
    }

    if (!firstName || !lastName) {
      return res.status(400).json({error: 'You must enter your full name.'});
    }

    if (!password) {
      return res.status(400).json({error: 'You must enter a password.'});
    }

    const existingUser = await User.findOne({email});

    if (existingUser) {
      return res
        .status(400)
        .json({error: 'That email address is already in use.'});
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
      expiresIn: '7d',
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
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

const changeRole = async (req, res) => {
  try {
    const admin = 'ROLE_ADMIN';

    const user = await User.findById(req.params.id);
    const query = {_id: user._id};

    const userDoc = await User.findOneAndUpdate(
      query,
      {role: admin},
      {
        new: true,
      },
    );

    res.status(201).json(userDoc);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

module.exports = {login, register, changeRole};
