const mongoose = require('mongoose');
const Tour = require('./../models/TourModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const { getAll, getOne, createOne, deleteOne, updateOne } = require('./handlerFactory.js');

const aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,duration';
  next();
}

const getAlltours = getAll(Tour);
const getTour = getOne(Tour, { path: 'reviews' });
const createTour = createOne(Tour);
const updateTour = updateOne(Tour);
const deleteTour = deleteOne(Tour);


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

const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');

  // radius of Eatch in miles - 3963,2
  const radius = unit === 'miles' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longtitude in the format lat,lng', 400));
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin:
        {
          $centerSphere: [[lng, lat], radius]
        }
      }
  })

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
});

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'miles' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longtitude in the format lat,lng', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
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
  deleteTour,
  getToursWithin,
  getDistances
}