const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const toursSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour name is required'],
    unique: true,
    trim: true,
    maxlength: [40, 'Tour name must not exceed 40 characters length'],
    minlength: [10, 'Tour name must not be less then 10 characters length']
  },
  slug: String,
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating cannot be less 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required']
  },
  priceDiscount: {
    type: Number,
    validate: {
      // only on creation of new document
      validator: function(val) {
        return val < this.price
      },
      message: 'Discout price ({VALUE}) should be less then usual price'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Tour duration is required']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'Tour maxGroupSize is required']
  },
  difficulty: {
    type: String,
    required: [true, 'Tour difficulty is required'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Only easy, medium or difficult'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'Tour summary is required']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'Tour imageCover is required']
  },
  images: [String],
  createdAt: {
    type: Date,
    // select: false,
    default: Date.now()
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  }
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

toursSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
})

// DOCUMENT MIDDLEWARE - runs before .save() and  .create()
toursSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE - runs on query instance
toursSchema.pre(/^find/, function(next) {
  this.find({secretTour: { $ne: true} });
  this.start = Date.now();
  next();
});

toursSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
})

// AGRREGATION MIDDLEWARE - runs on current aggregation object
toursSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: {secretTour: { $ne: true} }});

  console.log(this.pipeline());
  next();
})

const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;

// const testTout = new Tour({
//   name: 'The park Camper',
//   rating: 4.6,
//   price: 345
// });
