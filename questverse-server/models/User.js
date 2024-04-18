//User.js
const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  level: {
    type: Number,
    ref: 'User',
    default: 1 // Start at level 1
  },
  xp: {
    type: Number,
    ref: 'User',
    default: 0 // Start with 0 XP
  }
});

// Pre-save hook to hash password before saving a new user
userSchema.pre('save', async function(next) {
  if (this.isModified('password') || this.isNew) {
    try {
      const hash = await argon2.hash(this.password);
      this.password = hash;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (err) {
    throw new Error('Comparing password failed', err);
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
