const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Always lowercase the email before save (extra safety)
userSchema.pre('save', async function (next) {
  if (this.isModified('email') && typeof this.email === 'string') {
    this.email = this.email.toLowerCase().trim();
  }

  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Match password and transparently migrate any legacy plaintext passwords.
 * If the stored `this.password` is not a bcrypt hash, we do a direct comparison.
 * On success, immediately rehash and save so future logins use bcrypt.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  const stored = this.password || '';

  const isBcryptHash = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
  if (isBcryptHash) {
    return bcrypt.compare(enteredPassword, stored);
  }

  // Legacy plaintext password path
  const ok = enteredPassword === stored;
  if (ok) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(enteredPassword, salt);
    try {
      await this.save(); // migrate silently
    } catch (_) {
      // ignore migration failure; user is still logged in
    }
  }
  return ok;
};

module.exports = mongoose.model('User', userSchema);
