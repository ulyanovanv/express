const jwt = require('jsonwebtoken');

const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');

const signToken = id => {
  return jwt.sign({ id: id}, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); //not secure
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  })
});

const login = catchAsync(async(req, res, next) => {
  //1.check if email and password are given
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please, provide email and password!'), 400);
  }

  //2.search for a user by email
  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password'), 401);
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  })
});

module.exports = { signup, login };