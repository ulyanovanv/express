const express = require('express');
const router = express.Router();

const {
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getAlltours,
  getTour,
  createTour,
  updateTour,
  deleteTour
} = require('./../controllers/tourController.js');

const { protect, restrictTo } = require('./../controllers/authController.js');

// router.param('id', checkID)

router.route('/top-5-cheap')
  .get(aliasTopTours, getAlltours);

router.route('/tour-stats')
  .get(getTourStats);

router.route('/mounthly-plan/:year')
  .get(getMonthlyPlan);

router.route('/')
  .get(protect, getAlltours)
  .post(createTour);
// .post(checkForReuqestBody, createTour);

router.route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(
    protect,
    restrictTo('admin', 'lead-guide'),
    deleteTour
  );

module.exports = router;