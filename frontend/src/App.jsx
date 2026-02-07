// src/App.jsx  — with basic nav
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AlumniDirectory from './pages/AlumniDirectory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AlumniDirectory />} />
        <Route path="/alumni" element={<AlumniDirectory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
