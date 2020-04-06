const Review = require('./../models/ReviewModel.js');
const { getAll, getOne, deleteOne, updateOne, createOne } = require('./handlerFactory.js');

const setTourUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
}

const getAllReviews = getAll(Review);
const getReview = getOne(Review);
const createReview = createOne(Review);
const updateReview = updateOne(Review);
const deleteReview = deleteOne(Review);

module.exports = { getAllReviews, getReview, createReview, deleteReview, updateReview, setTourUserIds };