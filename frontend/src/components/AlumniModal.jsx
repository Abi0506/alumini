import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { getDepartments } from '../api/api';

export default function AlumniModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    roll: '', name: '', phone: '', email: '', dept: '', designation: '',
    year: '', address: '', company: ''
  });
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setConfirmText('');
    } else {
      setForm({
        roll: '', name: '', phone: '', email: '', dept: '', designation: '',
        year: '', address: '', company: ''
      });
      setCustomDept('');
      setShowCustomDept(false);
      setConfirmText('');
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getDepartments();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        setDeptError('Could not load departments');
      } finally {
        setDeptLoading(false);
      }
    };

    fetchDepts();
  }, []);

  useEffect(() => {
    if (!initialData?.dept) {
      setCustomDept('');
      setShowCustomDept(false);
      return;
    }

    const exists = departments.some((dep) => dep.dept_name === initialData.dept);
    if (!exists) {
      setCustomDept(initialData.dept);
      setShowCustomDept(true);
    } else {
      setShowCustomDept(false);
    }
  }, [initialData, departments]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const isEdit = Boolean(initialData);
  const isConfirmed = !isEdit || (confirmText || '').trim().toUpperCase() === 'UPDATE';

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isConfirmed) {
      // prevent accidental submits when edit confirmation not provided
      alert('Please type UPDATE to confirm changes before saving.');
      return;
    }

    const deptValue = customDept?.trim() || form.dept?.trim() || '';
    onSave({
      ...form,
      dept: deptValue
    });
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{initialData ? 'Edit Alumni' : 'Add New Alumni'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Roll Number <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                name="roll" 
                value={form.roll} 
                onChange={handleChange}
                required
                placeholder="e.g. 88XX88"
              />
            </Col>
            <Col md={6}>
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control name="name" value={form.name} onChange={handleChange} required />
            </Col>

            <Col md={6}>
              <Form.Label>Department</Form.Label>
              {deptLoading ? (
                <div className="form-control text-muted">Loading departments...</div>
              ) : deptError ? (
                <div className="alert alert-warning small py-2 mb-0">{deptError}</div>
              ) : (
                <Form.Select
                  name="dept"
                  value={customDept ? '__custom__' : form.dept || ''}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomDept('');
                      setShowCustomDept(true);
                      setForm({ ...form, dept: '' });
                      return;
                    }
                    setCustomDept('');
                    setShowCustomDept(false);
                    setForm({ ...form, dept: e.target.value });
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.dept_name}>
                      {dep.dept_name}
                    </option>
                  ))}
                  <option value="__custom__">Add new department...</option>
                </Form.Select>
              )}
              {showCustomDept && (
                <Form.Control
                  className="mt-2"
                  placeholder="Type new department"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                />
              )}
            </Col>
            <Col md={6}>
              <Form.Label>Year</Form.Label>
              <Form.Control name="year" type="number" value={form.year} onChange={handleChange} />
            </Col>

            <Col md={6}>
              <Form.Label>Designation</Form.Label>
              <Form.Control name="designation" type="text" value={form.designation} onChange={handleChange} placeholder="e.g. Software Engineer" />
            </Col>

            <Col md={6}>
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" type="text" value={form.email} onChange={handleChange} />
            </Col>
            <Col md={6}>
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" type="tel" value={form.phone} onChange={handleChange} />
            </Col>

            <Col md={12}>
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </Col>

            <Col md={6}>
              <Form.Label>Company</Form.Label>
              <Form.Control name="company" value={form.company} onChange={handleChange} />
            </Col>
          </Row>

          {isEdit && (
            <div className="mb-3">
              <Form.Label>Confirm Update</Form.Label>
              <Form.Control
                placeholder="Type UPDATE to confirm changes"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
              <div className="form-text">Type UPDATE (case-insensitive) to enable updating this record.</div>
            </div>
          )}

          <Button variant="primary" type="submit" className="mt-4 w-100" disabled={!isConfirmed}>
            {initialData ? 'Update' : 'Save'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}