const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('./../controllers/authController.js');
const {
  getCheckoutSession,
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} = require('./../controllers/bookingController.js');

router.use(protect);
router.get('/checkout-session/:tourID', getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'));
router.route('/')
  .get(getAllBookings)
  .post(createBooking);
router.route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

module.exports = router;