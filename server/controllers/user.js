const User = require('../models/user');
const bcrypt = require('bcryptjs');

const searchUser = async (req, res) => {
  try {
    const {search} = req.query;

    const regex = new RegExp(search, 'i');

    const users = await User.find(
      {
        $or: [
          {firstName: {$regex: regex}},
          {lastName: {$regex: regex}},
          {email: {$regex: regex}},
        ],
      },
      {password: 0},
    );

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

const currentUser = async (req, res) => {
  try {
    const user = req.user?._id;
    const userDoc = await User.findById(user, {password: 0});

    res.status(200).json({
      user: userDoc,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

const editUser = async (req, res) => {
  try {
    const user = req.user._id;
    const update = req.body.profile;
    const query = {_id: user};

    const userDoc = await User.findOneAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: 'Your profile is successfully updated!',
      user: userDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

const reset = async (req, res) => {
  try {
    const {password, confirmPassword} = req.body;
    const email = req.user.email;

    if (!email) {
      return res.status(401).send('Unauthenticated');
    }

    if (!password) {
      return res.status(400).json({error: 'You must enter a password.'});
    }

    const existingUser = await User.findOne({email});
    if (!existingUser) {
      return res
        .status(400)
        .json({error: 'That email address is already in use.'});
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({error: 'Please enter your correct old password.'});
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(confirmPassword, salt);
    existingUser.password = hash;
    existingUser.save();

    res.status(200).json({
      success: true,
      message:
        'Password changed successfully. Please login with your new password.',
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
};

module.exports = {searchUser, currentUser, editUser, reset};
