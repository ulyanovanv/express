const AppError = require('./../utils/appError.js');

// invalida param in url
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

// duplicate fields
const handleDuplicateFieldsDB = err => {
  const [key, value] = Object.entries(err.keyValue)[0];
  const message = `Duplicate ${key} field value ${value}. Please use another value.`;
  return new AppError(message, 400);
}

// fileds validation failed
const handleValidationDB = err => {
  const errors = Object.values(err.errors).map(obj => obj.message);
  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
}

const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
}

const prodError = (err, res) => {
  //operational, trusted errors
  console.log(err.isOperational)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
      status: err.status
    });
    //programming or other unknown errors, do not leak details on client
  } else {
    console.log('error', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    })
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    devError(err, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = {...err};
    console.log(err)

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationDB(error);

    prodError(error, res);
  }
}