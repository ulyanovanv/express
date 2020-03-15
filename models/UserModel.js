const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
  }
});

UserSchema.pre('save', async function(next) {
  // if password was modified, go to next middleware
  if (!this.isModified('password')) return next();

  //create a hash for passord and store it
  this.password = await bcrypt.hash(this.password, 12);
  //Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

UserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;