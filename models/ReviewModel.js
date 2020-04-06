const mongoose = require('mongoose');
const Tour = require('./TourModel.js');
const User = require('./UserModel.js');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    reqiured: [true, 'Review text is required']
  },
  rating: {
    type: Number,
    min: [1, 'Min value is 1'],
    max: [5, 'Max value is 5']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to user']
  }
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//statis method on Schema object
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { "tour": tourId }
    },
    {
      $group: {
        _id: '$tour',
        avrRating: { $avg: "$rating" },
        nRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avrRating
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

//indexing
reviewSchema.index({ tour: 1, user: 1 }, { unique: 1 });

// Document Middleware
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
})

// Query Middleware
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select:'name photo'
  });
  next();
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.rev = await this.findOne(); // access to the current docuemnt
  console.log(this.rev)

  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // this.rev = await this.findOne(); // does not work hier, query has already executed
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
});

const reviewModel = mongoose.model('Review', reviewSchema);

module.exports =  reviewModel;