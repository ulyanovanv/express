const jwt = require('jsonwebtoken');
const util = require('util');
const crypto = require('crypto');

const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const sendEmail = require('./../utils/email.js');

//helper
const signToken = id => {
  return jwt.sign({ id: id}, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

// MIDDLEWARE
//protect middleware
const protect = catchAsync(async(req, res, next) => {
  let token;

  // 1. get Token and check it exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please, log in to get access to this page.'), 401);
  }

  // 2. verification of token
  const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_TOKEN);

  // 3. check if the user exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user belogning to this token does not exist'), 401)
  }

  // 4. check if user changed password after JWT was issued
  if(freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.'), 401)
  }

  //access it granted
  req.user = freshUser;
  next();
});

//check for authorized roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have a permission to perform this action'), 403);
    }

    next(); //alowed
  }
};


//CONTROLLERS
const signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); //not secure
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
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

  // 3. If everything ok, send token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  })
});

const forgotPassword = catchAsync(async(req, res, next) => {
  // 1. get user on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
     return next(new AppError('There is no user with email address', 404));
  }

  // 2.Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. send the token to user
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your 
  new password and passwordConfirm to: ${resetURL}.\nIf you  didnot forgot your password,
  please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password rewset token(valid for 10 minutes)",
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email'
    })
  } catch(err) {
    user.passwordResetToken = undefined;
    user.passwordResetexpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!'), 500)
  }
})

const resetPassword = catchAsync(async(req, res, next) => {
  // 1. Get user by reset token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetexpires: {
      $gt: Date.now()
    }
  });

  // 2. If token is not expired and there is a user, set a new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetexpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property for the user (middleware is used)
  // 4. Log the user in, send JWT
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  })
});

module.exports = { signup, login, protect, restrictTo, forgotPassword, resetPassword };