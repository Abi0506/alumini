const express = require('express');
const cors = require('cors');
const app  = express();

const corsOptions = {
  origin: [ 'http://localhost:5173','http://localhost:3000',],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(express.json());
app.use(cors(corsOptions));
const alumniRouter = require('./alumni');

app.use('/alumni', alumniRouter);
const PORT  = 8000;

app.listen(PORT , ()=>{
    console.log(`Server runnning at http://localhost:${PORT}`);
});



