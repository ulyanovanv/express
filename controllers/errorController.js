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

// fields validation failed
const handleValidationDB = err => {
  const errors = Object.values(err.errors).map(obj => obj.message);
  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
}

//JWT error
const handleJWTError = () => new AppError('Invalid token. Please, login again', 401);

//JWT expired error
const handleJWTExpiredError = () => new AppError('Your token is expired. Please login again.', 401);

const devError = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    })
  }
}

const prodError = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    //operational, trusted errors
    if (err.isOperational) {
      res.status(err.statusCode).json({
        message: err.message,
        status: err.status
      });
      //programming or other unknown errors, do not leak details on client
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      })
    }
  } else {
    // RENDERED WEBSITE
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      })
      //programming or other unknown errors, do not leak details on client
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later'
      })
    }
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    devError(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    const error = Object.assign({}, err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    prodError(error, req, res);
  }
}