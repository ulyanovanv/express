const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');

const TourModel = require("./../../models/TourModel.js");

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(con => {
  console.log("DB connections is successfull");
})

// READ JSON FILE
const fileContent = fs.readFileSync('dev-data/data/tours-simple.json', 'utf-8')
const data = JSON.parse(fileContent);

//IMPORT DATA
const importData = async () => {
  try {
    await TourModel.create(data)
    console.log("data loaded!")
  } catch(err) {
    console.log(err)
  }
}

//DELETE PREVIOUS DATA
const deleteData = async () => {
  try {
    await TourModel.deleteMany()
    console.log("data deleted!")
  } catch(err) {
    console.log(err)
  }
}

// console.log(process.argv)

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData()
}

process.exit();