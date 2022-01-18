const express = require('express');
const router = express.Router();

const {login, register, changeRole} = require('../../controllers/auth');
const auth = require('../../middleware/auth');
const {checkRole, ROLES} = require('../../middleware/role');

router.post('/login', login);

router.post('/register', register);

router.put('/changeRole/:id', auth, checkRole(ROLES.Admin), changeRole);

module.exports = router;
