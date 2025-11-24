const express = require('express');
const { register, login, verifyEmail } = require('../controllers/authController.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get("/verify-email", verifyEmail);


module.exports = router;