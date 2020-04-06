const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');

const TourModel = require("./../../models/TourModel.js");
const UserModel = require("./../../models/UserModel.js");
const ReviewModel = require("./../../models/ReviewModel.js");

dotenv.config({path: './config.env'});
// READ JSON FILE
const tours = fs.readFileSync('dev-data/data/tours.json', 'utf-8')
const users = fs.readFileSync('dev-data/data/users.json', 'utf-8')
const reviews = fs.readFileSync('dev-data/data/reviews.json', 'utf-8')

//IMPORT DATA
const importData = async () => {
  try {
    await TourModel.create(JSON.parse(tours))
    await UserModel.create(JSON.parse(users), { validateBeforeSave: false})
    await ReviewModel.create(JSON.parse(reviews))
    console.log("data loaded!")
  } catch(err) {
    console.log(err.message)
  }
}

//DELETE PREVIOUS DATA
const deleteData = async () => {
  console.log('delete called')
  try {
    await TourModel.deleteMany()
    await UserModel.deleteMany()
    await ReviewModel.deleteMany()
    console.log("data deleted!")
  } catch(err) {
    console.log(err.message)
  }
}

try {
  const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

  mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  }).then(con => {
    console.log("DB connections is successfull");
    if (process.argv[2] === '--import') {
      importData();
    } else if (process.argv[2] === '--delete') {
      deleteData();
    }
  })
} catch (e) {
  console.log(e)
}

// process.exit();