import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './Database/dbConfig.js'

import authRoutes from './Routes/authRoute.js';
import questionRoutes from './Routes/questionRoute.js';
import examRoutes from './Routes/examRoute.js';
import resultRoutes from './Routes/resultRoute.js';
import proctoringRoutes from './Routes/proctoringRoute.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

connectDB();

app.get("/", (req, res) => {
    res.status(200).send("Welcome to Online Assessment Platform Backend");
});

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/proctoring', proctoringRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const port = process.env.PORT || 5000;

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
});
