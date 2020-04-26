const sharp = require('sharp');
const multer = require('multer');
//if not to set dist, then file will be stored in memory

const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const { getAll, getOne, deleteOne, updateOne } = require('./handlerFactory.js');

// where the images will be stored
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

// multer storage (to memory, to process further resize of image)
const multerStorage = multer.memoryStorage();

//Test if uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


const filterObj = (obj, allowedFiels) => {
  const newObj ={};
  Object.keys(obj).forEach(el => {
    if (allowedFiels.includes(el)) newObj[el] = obj[el];
  })

  return newObj;
}

// get me
const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

//user itself
const updateMe = catchAsync(async(req, res, next) => {
  // 1.Create a error if user tries to change password
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
  }

  // 2. Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, ['name', 'email']);
  if (req.file) filteredBody.photo = req.file.filename;

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
  res.status(501).json({
    status: 'error',
    message: 'Please, use /signup instead'
  })
}

const getAllUsers = getAll(User);
const getUser = getOne(User);
const updateUser = updateOne(User);
const deleteUser = deleteOne(User);

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto
}