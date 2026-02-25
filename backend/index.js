require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app  = express();

const corsOptions = {
  origin: [ 'http://localhost:5173','http://localhost:3000',],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(express.json());
app.use(cors(corsOptions));

const alumniRouter = require('./alumni');
const authRouter = require('./auth');

app.use('/alumni', alumniRouter);
app.use('/auth', authRouter);

const PORT  = 5000;

app.listen(PORT , ()=>{
    const hasEmailConfig = process.env.EMAIL_USER && 
                          process.env.EMAIL_USER !== 'your-email@gmail.com' &&
                          process.env.EMAIL_PASS &&
                          process.env.EMAIL_PASS !== 'your-app-password';
    
    // Intentionally minimal logging; errors are handled in individual modules
});



