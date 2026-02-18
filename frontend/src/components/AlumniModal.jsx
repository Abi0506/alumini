import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { getDepartments } from '../api/api';

export default function AlumniModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    id: '', roll: '', name: '', phone: '', email: '', dept: '', designation: '',
    year: '', address: '', company: '', location: ''
  });
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [showCustomDept, setShowCustomDept] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        id: '', roll: '', name: '', phone: '', email: '', dept: '', designation: '',
        year: '', address: '', company: '', location: ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getDepartments();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load departments:', err);
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

  const handleSubmit = (e) => {
    e.preventDefault();
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
              <Form.Label>ID</Form.Label>
              <Form.Control
                name="id"
                value={form.id}
                onChange={handleChange}
                disabled={!!initialData} // prevent changing ID on edit
              />
            </Col>
            <Col md={6}>
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={form.name} onChange={handleChange} />
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
            <Col md={6}>
              <Form.Label>Location</Form.Label>
              <Form.Control name="location" value={form.location} onChange={handleChange} />
            </Col>
          </Row>

          <Button variant="primary" type="submit" className="mt-4 w-100">
            {initialData ? 'Update' : 'Save'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}