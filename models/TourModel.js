const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./UserModel.js');
const Review = require('./ReviewModel.js');

const toursSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour name is required'],
    unique: true,
    // trim: true,
    maxlength: [40, 'Tour name must not exceed 40 characters length'],
    minlength: [10, 'Tour name must not be less then 10 characters length']
  },
  slug: String,
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating cannot be less 1'],
    max: [5, 'Rating cannot exceed 5'],
    set: val => Math.round(val * 10) / 10
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
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
     {
       type: mongoose.Schema.ObjectId,
       ref: "User"
     }
  ]
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexing
toursSchema.index({price: 1, ratingsAverage: -1});
toursSchema.index({slug: 1});
toursSchema.index({startLocation: '2dsphere'});

//virtual populate
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //specify the model to connect to in ReviewModel, the name of the field in other model, where the reference to the current model is stored
  localField: '_id' //how it is called in Tour modal (referenced by id actually)
});

toursSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
})

// DOCUMENT MIDDLEWARE - runs before .save() and  .create()
toursSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embedding guides to tour
toursSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));

  this.guides = await Promise.all(guidesPromises);
  next();
});

// QUERY MIDDLEWARE - runs on query instance
toursSchema.pre(/^find/, function(next) {
  // this.find({secretTour: { $ne: true} });
  this.start = Date.now();
  next();
});

toursSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

toursSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
})

// AGRREGATION MIDDLEWARE - runs on current aggregation object
// toursSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: {secretTour: { $ne: true} }});
//
//   console.log(this.pipeline());
//   next();
// })

const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;
