const express = require('express');
const morgan = require('morgan');

const app = express();
const userRouter = require('./routes/userRoutes.js');
const tourRouter = require('./routes/tourRoutes.js');
const AppError = require('./utils/appError.js');
const globalErrorhandle = require('./controllers/errorController.js');

//Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.use(express.json())
app.use(express.static('public'));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next()
})

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//no route was matched? - error handling
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

//Error handling middleware
app.use(globalErrorhandle);

// 4.Start server
module.exports = app;