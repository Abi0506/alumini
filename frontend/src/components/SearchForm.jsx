// src/components/SearchForm.jsx
import React, { useState, useEffect } from 'react';
import { getDepartments } from '../api/api';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function SearchForm({ onSearch, loading }) {
  const [formData, setFormData] = useState({
    id: '',
    roll: '',
    name: '',
    phone: '',
    email: '',
    dept: '',
    year: '',
    address: '',
    company: '',
    location: ''
  });

  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState('');

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
        setDeptError('Could not load departments');
      } finally {
        setDeptLoading(false);
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleReset = () => {
    setFormData({
      id: '', roll: '', name: '', phone: '', email: '', dept: '',
      year: '', address: '', company: '', location: ''
    });
    onSearch({}); // reset to show all (or do nothing)
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="row g-3">

        {/* === ID & Roll - Prominent section === */}
        <div className="col-12 mb-3 border-bottom pb-3">
        
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="id" className="form-label fw-bold">Alumni ID</label>
              <input
                id="id"
                type="text"
                className="form-control form-control-lg"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="e.g. A0001"
              />
             

            </div>

            <div className="col-md-6">
              <label htmlFor="roll" className="form-label fw-bold">Roll Number</label>
              <input
                id="roll"
                type="text"
                className="form-control form-control-lg"
                name="roll"
                value={formData.roll}
                onChange={handleChange}
                placeholder="e.g. 88XX88"
              />
              
            </div>
          </div>
        </div>

        {/* Other fields */}
        <div className="col-md-12">
          <label htmlFor="name" className="form-label fw-bold">Name</label>
          <input
            id="name"
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
          />
        </div>

        <div className="col-md-12">
          <label htmlFor="dept" className="form-label fw-bold">Department</label>
          {deptLoading ? (
            <div className="form-control text-muted">Loading departments...</div>
          ) : deptError ? (
            <div className="alert alert-warning small py-2 mb-0">{deptError}</div>
          ) : (
            <select
              id="dept"
              className="form-select"
              name="dept"
              value={formData.dept}
              onChange={handleChange}
            >
              <option value="">All Departments</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.dept_name}>
                  {dep.dept_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor="year" className="form-label fw-bold">Year</label>
          <input
            id="year"
            type="number"
            className="form-control"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder="e.g. 1991"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="location" className="form-label fw-bold">Location</label>
          <input
            id="location"
            type="text"
            className="form-control"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Coimbatore"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="company" className="form-label fw-bold">Company</label>
          <input
            id="company"
            type="text"
            className="form-control"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="e.g. Google, TCS"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="email" className="form-label fw-bold">Email</label>
          <input
            id="email"
            type="text"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. example@gmail.com or partial search"
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="phone" className="form-label fw-bold">Phone</label>
          <input
            id="phone"
            type="tel"
            className="form-control"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9999999999"
          />
        </div>

        {/* Buttons */}
        <div className="col-12 d-flex gap-2 mt-4">
          <button
            type="submit"
            className="btn btn-primary flex-grow-1"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search Alumni'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}
