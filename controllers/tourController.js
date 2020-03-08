const mongoose = require('mongoose');
const Tour = require('./../models/TourModel.js');
const APIFeatures = require('./../utils/apiFeatures.js');

const aliasTopTours = (req, res, next) => {
  // const query = Tour
  //   .limit(5)
  //   .sort('-ratingsAverage price');

  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,duration';
  next();
}

const getAlltours = async (req, res) => {
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
}

const getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({ _id: req.params.id })

    res.status(200).json({
      status: "success",
      data: {
        tour
      }
    })
  } catch(e) {
    res.status(404).json({
      status: 'fail',
      message: e
    })
  }
}

const createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    })
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
}

const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    res.status(200).json({
      status: "success",
      data: {
        tour
      }
    })
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
}

const deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id)

    res.status(204).json({
      status: "success",
      data: null
    })
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
}

const getTourStats = async (req, res) => {
  try {
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
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
}

const getMonthlyPlan = async (req, res) => {
  try {
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
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    })
  }
}

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