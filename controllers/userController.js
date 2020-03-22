const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');

const filterObj = (obj, allowedFiels) => {
  const newObj ={};
  Object.keys(obj).forEach(el => {
    if (allowedFiels.includes(el)) newObj[el] = obj[el];
  })

  return newObj;
}

const getAllUsers = catchAsync(async(req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    status: "success",
    results: users.length,
    requetsedAt: req.requestTime,
    data: {
      users: users
    }
  })
});

//user itself
const updateMe = catchAsync(async(req, res, next) => {
  // 1.Create a error if user tries to change password
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
  }

  // 2. Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, ['name', 'email']);

  // 3.Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runVAlidators: true});

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})

const deleteMe = catchAsync(async(req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status:'success',
    data: null
  })
})

//for adminisrators
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  })
}


const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  })
}


const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  })
}


const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  })
}

module.exports = { getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe }