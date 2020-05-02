const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser =require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const userRouter = require('./routes/userRoutes.js');
const tourRouter = require('./routes/tourRoutes.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const AppError = require('./utils/appError.js');
const globalErrorhandle = require('./controllers/errorController.js');
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARE

//implement cors
app.use(cors());

app.options('*', cors());

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
// Set security HTTP headers
app.use(helmet());

// Limit requests from the same IP address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 *1000,
  message: 'too many from this Ip, please try again in an hour'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({
  limit: '10kb'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10kb'
}));
app.use(cookieParser());

// Data sanitization againt NoSQL injection
app.use(mongoSanitize()); //looks at req.body, req.query and req.params -> filter out all $ and dots

// Data sanitization againt XSS
app.use(xss()); //cleans all input fcode from malicious html code with JS code

// prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsAverage',
    'ratingsQuantity',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

app.use(compression()); //compress the responses - html or json

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//no route was matched? - error handling
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

//Error handling middleware
app.use(globalErrorhandle);

// 4.Start server
module.exports = app;