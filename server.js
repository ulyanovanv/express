const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: './config.env'});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION. Shutting down...");
  process.exit(1);
})

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

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}...`)
})

//handle crash in async code - connection to DB
process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log("UNHANLDED REJECTION. Shutting down...");
  server.close(() => {
    process.exit(1);
  })
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated!');
  })
})