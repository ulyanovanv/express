const mongoose = require('mongoose');

const toursSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour name is required'],
    unique: true
  },
  rating: {
    type: Number,
    default: 4.5
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required']
  }
})
const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;

// const testTout = new Tour({
//   name: 'The park Camper',
//   rating: 4.6,
//   price: 345
// });
//
//
// testTout.save().then(doc => {
//   console.log(doc)
// }).catch(e => {
//   console.log(e.message, "erro")
// })