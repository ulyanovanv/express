const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const app = require('./app.js');

// console.log(process.env)
// console.log(app.get('env'))
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}...`)
})