const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: './config.env'});

const app = require('./app.js');

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(con => {
  // console.log(con.connections);
  console.log("DB connections is successfull");
})


const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}...`)
})