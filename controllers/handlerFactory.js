const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const APIFeatures = require('./../utils/apiFeatures.js');

const getAll = Model => catchAsync(async (req, res, next) => {
  // to allow for nested GET reviews on tour (hack)
  let filter = {}
  if (req.params.tourId) filter = {tour: req.params.tourId};

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docs = await features.query;

  res.status(200).json({
    status: "success",
    results: docs.length,
    requetsedAt: req.requestTime,
    data: {
      data: docs
    }
  })
})

const getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  let query = Model.findById(req.params.id);
  if (popOptions) query = query.populate(popOptions);
  const doc = await query;

  if (!doc) {
    return next(new AppError(`No tour is available under ${req.params.id} ID`), 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      doc
    }
  })
})

const createOne = Model => catchAsync(async (req, res, next) => {
  const newDoc = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: newDoc
    }
  })
});

const updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!doc) {
    return next(new AppError(`No doc is available under ${req.params.id} ID`), 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      doc
    }
  })
})

const deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError(`No docuemnt is available under ${req.params.id} ID`), 404);
  }

  res.status(204).json({
    status: "success",
    data: null
  })
});

module.exports = { getAll, getOne, createOne, deleteOne, updateOne };