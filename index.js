import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './Database/dbConfig.js'


// Dotenv config
dotenv.config();

// Express app initialization
const app = express();


// Middlewares
app.use(cors());
app.use(express.json());

// Database connection
connectDB();


//Default routes
app.get("/", (req, res) => {
    res.status(200).send("Welcome to Online Assessment Platform Backend");
});

//Custom routes





//PORT
const port = process.env.PORT || 5000;


// Server Listening logic
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
});