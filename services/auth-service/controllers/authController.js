const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign({ id }, secret, { expiresIn });
};

exports.register = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required.' 
      });
    }

    email = String(email).toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email.' 
      });
    }

    const user = await User.create({ email, password });

    return res.status(201).json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
      message: 'Registration successful'
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ 
      message: 'Server error during registration.' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required.' 
      });
    }

    email = String(email).toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password.' 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password.' 
      });
    }

    return res.status(200).json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      message: 'Server error during login.' 
    });
  }
};