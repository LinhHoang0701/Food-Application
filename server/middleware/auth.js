const passport = require('passport');
require('../config/passport')(passport);

const auth = passport.authenticate('jwt', {session: false});

module.exports = auth;
