const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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
const professionalRouter = require('./professional');
const authRouter = require('./auth');

app.use('/alumni', alumniRouter);
app.use('/professional', professionalRouter);
app.use('/auth', authRouter);

const PORT  = process.env.PORT || 5000;

app.listen(PORT , ()=>{
  const hasEmailConfig = process.env.EMAIL_USER && 
              process.env.EMAIL_USER !== 'your-email@gmail.com' &&
              process.env.EMAIL_PASS &&
              process.env.EMAIL_PASS !== 'your-app-password';
    
  console.log(`Server running on port ${PORT}`);
});



