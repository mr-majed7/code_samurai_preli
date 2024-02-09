//EXTERNAL IMPORTS
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

//INTERNAL IMPORTS
const {notFoundHandler,errorHandler} = require('./middlewares/errorHandler');
const routers = require('./routes/routers');
const userRouter = require("./routes/userRouter")
const stationRouter = require("./routes/stationRouter")

const app = express();
dotenv.config();

//JSON PARSER
app.use(express.json());
//URL ENCODED PARSER
app.use(express.urlencoded({extended: true}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() =>{
        console.log('Connected to MongoDB...');
        dropCollection();
    } )
    .catch(err => console.error('Could not connect to MongoDB...'));

//DROP DATABASE
const dropCollection = async () => {
    try {
      await mongoose.connection.collection('users').drop();
      await mongoose.connection.collection('stations').drop();
      await mongoose.connection.collection('trains').drop();
    } catch (error) {
      console.error(error);
    }
  };
  

    
//ROUTES
app.use('/api', routers);

//Users 
app.use("/api/users", userRouter)

//Stations 
app.use("/api/stations", stationRouter)

//HANDLER ERRORS
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Listening on port: ${port}...`);
});
