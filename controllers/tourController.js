const mongoose = require('mongoose');
const sharp = require('sharp');
const multer = require('multer');

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


// multer storage (to memory, to process further resize of image)
const multerStorage = multer.memoryStorage();

//Test if uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const uploadTourImages = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);

const resizeTourImages = catchAsync(async (req, res, next) => {
  if(!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      req.body.images.push(filename);

      await sharp(req.files.images[index].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${filename}`);
    })
  );

  next();
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
  getDistances,
  uploadTourImages,
  resizeTourImages
}