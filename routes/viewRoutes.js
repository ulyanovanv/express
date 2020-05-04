const express = require('express');
const router = express.Router();

const { getOverview, getTour, login, getAccount, updateUserData, getMyTours, alerts } = require('./../controllers/viewsController.js');
const { isLoggedIn, protect } = require('./../controllers/authController.js');
// const { createBookingCheckout } = require('./../controllers/bookingController.js');

router.use(alerts);

router.get(
  '/',
  // createBookingCheckout,
  isLoggedIn,
  getOverview
);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, login);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);


// router.post('/submit-user-data', protect, updateUserData)

module.exports = router;