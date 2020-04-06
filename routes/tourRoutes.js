const express = require('express');
const router = express.Router();
const reviewRouter = require('./reviewRoutes.js');

const {
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getAlltours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getToursWithin,
  getDistances
} = require('./../controllers/tourController.js');

const {
  protect,
  restrictTo
} = require('./../controllers/authController.js');

// router.param('id', checkID)

router.use('/:tourId/reviews', reviewRouter)

//Aggregation routes
router.route('/tour-stats').get(getTourStats);
router.route('/mounthly-plan/:year').get(
  protect,
  restrictTo('admin', 'lead-guide', 'guide'),
  getMonthlyPlan
);

router.route('/top-5-cheap').get(aliasTopTours, getAlltours);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin); //params
// router.route('/tours-within?distance=233&enter=53.547497,9.976759&unit=miles'); //query
// router.route('/tours-within/233/center/53.547497,9.976759/unit/miles'); //params

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.route('/')
  .get(getAlltours)
  .post(
    protect,
    restrictTo('admin', 'lead-guide'),
    createTour
  );

router.route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    updateTour
  )
  .delete(
    protect,
    restrictTo('admin', 'lead-guide'),
    deleteTour
  );

module.exports = router;