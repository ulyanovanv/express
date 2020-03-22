const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, //transforms the value to lowercase
    validate: {
      validator: function(val) {
        return validator.isEmail(val);
      },
      message: `Typed email is not an email address`
    }
  },
  role: {
    type: String,
    enum: ['admin', 'guide', 'lead-guide', 'user'],
    default: 'user'
  },
  photo: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please, confirm you password'],
    validate: {
      //this only works on create() and save()
      validator: function(val) {
        return val === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetexpires: {
    type: Date
  }
});

// MIDDLEWARE
UserSchema.pre('save', async function(next) {
  // if password was modified, go to next middleware
  if (!this.isModified('password')) return next();

  //create a hash for passord and store it
  this.password = await bcrypt.hash(this.password, 12);
  //Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});


// METHODS
// on LogIn check if the provided password is equal to given through hash
UserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}

// check if the user changed password
UserSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimeStamp < changedTimeStamp;
  }

  //false means not changed
  return false;
}

// create password reset token
UserSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetexpires = Date.now() + 10*60*1000;

  return resetToken;
}

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;