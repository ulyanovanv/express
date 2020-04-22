const Tour = require('./../models/TourModel.js');
const User = require('./../models/UserModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');

const getOverview = catchAsync(async (req, res, next) => {
  // 1) get all tour data from collection
  const tours = await Tour.find();

  // 2) build template

  // 3) Render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All tours',
    tours
  })
});

const getTour = catchAsync(async (req, res, next) => {
  // 1) get data for requested tour (including reviews and tour guides)
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    select: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name!', 404));
  }

  // 2) Build template

  // 3)Render template using data from step 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  })
});

const login = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});

const getAccount = (req, res) => {
  res.render('account', {
    title: 'Your account'
  })
}

const updateUserData = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  }, {
    new: true,
    runValidators: true
  });

  res.render('account', {
    title: 'Your account',
    user
  })
});

module.exports = { getOverview, getTour, login, getAccount, updateUserData }