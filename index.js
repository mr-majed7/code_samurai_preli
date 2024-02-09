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
        // dropBooksCollection();
    } )
    .catch(err => console.error('Could not connect to MongoDB...'));

//DROP DATABASE
// const dropBooksCollection = async () => {
//     try {
//       await mongoose.connection.collection('books').drop();
//       console.log('The "Books" collection has been dropped successfully.');
//     } catch (error) {
//       console.error('Error dropping "Books" collection:', error);
//     }
//   };
  

    
//ROUTES
app.use('/', routers);

//Users 
app.use("/users", userRouter)

//Stations 
app.use("/stations", stationRouter)

//HANDLER ERRORS
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Listening on port: ${port}...`);
});
