const jwt = require('jsonwebtoken');
const util = require('util');
const crypto = require('crypto');

const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const Email = require('./../utils/email.js');

//helper
const signToken = id => {
  return jwt.sign({ id: id}, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true // we cannot manipulate the cookie in the browser, means no delete or reset
    //receive cookie, store it and send it automatically along with every request
  }

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  //cookie is snet only on encrypted connection - HTTPS

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; //unshow new user password

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user
    }
  })
}

// MIDDLEWARE
//protect middleware
const protect = catchAsync(async(req, res, next) => {
  let token;

  // 1. get Token and check it exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  res.locals.user = freshUser;
  next();
});

// Only for rendered pages, no errors!
const isLoggedIn = async(req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. verification of token
      const decoded = await util.promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_TOKEN);

      // 2. check if the user exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      // 3. check if user changed password after JWT was issued
      if(freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // there is a logged in user
      res.locals.user = freshUser;
      return next();
    } catch(err) {
      return next();
    }
  }

  next();
};

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
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});

const logout = catchAsync(async(req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10*1000),
    httpOnly: true
  })
  res.status(200).json({status: 'success'});
});

// forgot password - to get resetToken if you do not remember yuor password
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
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

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

// pass resetToken to set a new password
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
  createSendToken(user, 200, res);
});

// update password (if not forgotten)
const updatePassword = catchAsync(async(req, res, next) => {
  // 1. get user from collection
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new AppError('user is not found', 400))
  }

  // 2. Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('the current password is incorrect', 401))
  }

  // 3. Update password
  // this.password = signToken(req.body._id)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save()

  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
});

module.exports = { signup, login, protect, restrictTo, forgotPassword, resetPassword, updatePassword, isLoggedIn, logout };