const express = require('express');
const router = express.Router();
const {
  loginHandler,
  registerHandler,
  logoutHandler,
  passwordResetHandler
} = require('../controller/authController');

/**
 * User login
 */
router.post('/login', loginHandler);    

/**
 * User registration
 */
router.post('/register', registerHandler);

/**
 * Logout
 */
router.post('/logout', logoutHandler);

/**
 * Password reset request
 */
router.post('/password-reset', passwordResetHandler);

module.exports = router;
