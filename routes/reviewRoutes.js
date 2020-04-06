const express = require('express');
const router = express.Router({ mergeParams: true});

const { getAllReviews, getReview, createReview, deleteReview, updateReview, setTourUserIds } = require('./../controllers/reviewController.js');
const { protect, restrictTo } = require('./../controllers/authController.js');

router.use(protect);
router.route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router.route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;