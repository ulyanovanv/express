const mongoose = require('mongoose');
const Tour = require('./../models/TourModel.js');

const getAlltours = async (req, res) => {
  const tours = await Tour.find();

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

module.exports = { getAlltours, getTour, createTour, updateTour, deleteTour }