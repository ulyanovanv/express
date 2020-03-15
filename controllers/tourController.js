const mongoose = require('mongoose');
const Tour = require('./../models/TourModel.js');
const APIFeatures = require('./../utils/apiFeatures.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');

const aliasTopTours = (req, res, next) => {
  // const query = Tour
  //   .limit(5)
  //   .sort('-ratingsAverage price');

  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,duration';
  next();
}

const getAlltours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: "success",
    results: tours.length,
    requetsedAt: req.requestTime,
    data: {
      tours: tours
    }
  })
})

const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError(`No tour is available under ${req.params.id} ID`), 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  })
})

const createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  })
});


const updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!tour) {
    return next(new AppError(`No tour is available under ${req.params.id} ID`), 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  })

})

const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`No tour is available under ${req.params.id} ID`), 404);
  }

  res.status(204).json({
    status: "success",
    data: null
  })
});

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { "ratingsAverage": { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: null,
        _id: "$difficulty",
        avrRating: { $avg: "$ratingsAverage" },
        avrPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        numRatings: { $sum: "$ratingsQuantity"},
        numTours: { $sum: 1 }
      }
    },
    {
      $sort: { avrPrice: 1 }
    },
    {
      $match: { _id: { $ne: "easy" } }
    }
  ])

  res.status(200).json({
    status: "success",
    data: {
      stats
    }
  })
})

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plans = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        "startDates": {
          $gte: new Date(`${year}-1-1`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tour: { $push: "$name" }
      }
    },
    {
      $addFields: { month: "$_id" }
    },
    {
      $project: { _id: 0 }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plans
    }
  })
})

module.exports = {
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getAlltours,
  getTour,
  createTour,
  updateTour,
  deleteTour
}