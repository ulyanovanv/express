const express = require('express');
const router = express.Router();

// const { getAlltours, getTour, createTour, updateTour, deleteTour, checkID, checkForReuqestBody } = require('./../controllers/tourController.js')
const { getAlltours, getTour, createTour, updateTour, deleteTour } = require('./../controllers/tourController.js')

// router.param('id', checkID)

router.route('/')
  .get(getAlltours)
  .post(createTour);
// .post(checkForReuqestBody, createTour);

router.route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;