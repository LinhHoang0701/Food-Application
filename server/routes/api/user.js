const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const {searchUser, currentUser, editUser} = require('../../controllers/user');

router.get('/search', auth, role.checkRole(role.ROLES.Admin), searchUser);
router.get('/', auth, currentUser);
router.put('/', auth, editUser);

module.exports = router;
