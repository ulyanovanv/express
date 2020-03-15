const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');

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

module.exports = { getAllUsers, createUser, getUser, updateUser, deleteUser }