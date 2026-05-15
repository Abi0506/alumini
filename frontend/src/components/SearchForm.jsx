import React, { useState, useEffect } from 'react';
import { getDepartments } from '../api/api';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function SearchForm({ onSearch, onAISearch, onReset, loading, clearTrigger, restoreTrigger, restoreData }) {
  const [formData, setFormData] = useState({
    roll: '',
    name: '',
    phone: '',
    email: '',
    dept: '',
    designation: '',
    year: '',
    address: '',
    company: '',
  });
  const [aiQuery, setAiQuery] = useState('');

  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState('');

  
  useEffect(() => {
    if (clearTrigger > 0) {
      setFormData({
        roll: '', name: '', phone: '', email: '', dept: '',
        designation: '', year: '', address: '', company: ''
      });
      setAiQuery('');
    }
  }, [clearTrigger]);

  
  useEffect(() => {
    if (restoreTrigger > 0 && restoreData) {
      setFormData({
        roll: restoreData.filters?.roll || '',
        name: restoreData.filters?.name || '',
        phone: restoreData.filters?.phone || '',
        email: restoreData.filters?.email || '',
        dept: restoreData.filters?.dept || '',
        designation: restoreData.filters?.designation || '',
        year: restoreData.filters?.year || '',
        address: restoreData.filters?.address || '',
        company: restoreData.filters?.company || ''
      });
      setAiQuery(restoreData.aiQuery || '');
    }
  }, [restoreTrigger, restoreData]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data || []);
      } catch (err) {
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

  const handleAISubmit = (e) => {
    e.preventDefault();
    if (!onAISearch) return;
    onAISearch(aiQuery);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      setFormData({
        roll: '', name: '', phone: '', email: '', dept: '',
        designation: '', year: '', address: '', company: ''
      });
      setAiQuery('');
    }
  };

  return (
    <div className="search-form">
      <form onSubmit={handleAISubmit} className="mb-4">
        <div className="ai-search-box">
          <label htmlFor="aiQuery" className="form-label fw-bold">AI Search</label>
          <textarea
            id="aiQuery"
            className="form-control"
            rows="3"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="e.g. I want people who are working in software companies, or I need general managers in Chennai"
          />
          <div className="small text-secondary mt-2">
            Use plain English. The AI will look at company, designation, location, and only use department when you explicitly ask for it.
          </div>
          <div className="d-flex gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !aiQuery.trim()}
            >
              {loading ? 'Searching...' : 'Search With AI'}
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

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-12">
            <div className="section-subtitle">Or use structured filters</div>
          </div>

          {/* === Roll - Prominent section === */}
          <div className="col-12 mb-3 border-bottom pb-3">
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
                <option value="">Select Department</option>
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
            <label htmlFor="designation" className="form-label fw-bold">Designation</label>
            <input
              id="designation"
              type="text"
              className="form-control"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
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

          <div className="col-md-12">
            <label htmlFor="address" className="form-label fw-bold">Address</label>
            <input
              id="address"
              type="text"
              className="form-control"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Type a city, street, or area"
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
    </div>
  );
}
