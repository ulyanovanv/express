const express = require('express');
const router = express.Router();

const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('./../controllers/userController.js')
const { signup, login } = require('./../controllers/authController.js');

router.post('/signup', signup)
router.post('/login', login)

router.route('/')
  .get(getAllUsers)
  .post(createUser)

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router;