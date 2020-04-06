const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe
} = require('./../controllers/userController.js');
const {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword
} = require('./../controllers/authController.js');

router.post('/signup', signup)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

// all routes after this point are protected
router.use(protect);
router.patch('/updateMyPassword', updatePassword)
router.get('/me', getMe, getUser);
router.patch('/updateMe', updateMe)
router.delete('/deleteMe', deleteMe)

// all routes  after this point are authorized only to admin
router.use(restrictTo('admin'))
router.route('/')
  .get(getAllUsers)
  .post(createUser)

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router;