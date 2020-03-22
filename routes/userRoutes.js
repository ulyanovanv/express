const express = require('express');
const router = express.Router();

const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('./../controllers/userController.js')
const { signup, login, forgotPassword, resetPassword } = require('./../controllers/authController.js');

router.post('/signup', signup)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.route('/')
  .get(getAllUsers)
  .post(createUser)

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router;