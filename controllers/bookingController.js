const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/TourModel.js');
const User = require('./../models/UserModel.js');
const Booking = require('./../models/BookingModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const { getAll, getOne, createOne, deleteOne, updateOne } = require('./handlerFactory.js');

const getAllBookings = getAll(Booking);
const getBooking = getOne(Booking);
const createBooking= createOne(Booking);
const updateBooking= updateOne(Booking);
const deleteBooking= deleteOne(Booking);

const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2) Create a checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`, //very unsecure
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}.jpg`],
        amount: tour.price * 100,
        currency: 'eur',
        quantity: 1
      }
    ]
  })

  // 3) Create session as a response
  res.status(200).json({
    status: 'success',
    session: session
  })
});

// const createBookingCheckout =  catchAsync(async (req, res, next) => {
//   // This is only temporary, because insecure, everyone can make bookings withut paying
//   const {tour, user, price} = req.query;
//
//   if (!tour && !tour && !price) return next();
//
//   await Booking.create({
//     tour,
//     user,
//     price
//   });
//
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({email: session.customer_email})).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({
    tour,
    user,
    price
  });
};

const webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
    res.status(200).json({received: true});
    next();
  }
}

module.exports = {
  getCheckoutSession,
  createBookingCheckout,
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  webhookCheckout
}