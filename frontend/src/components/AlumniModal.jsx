import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

export default function AlumniModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    id: '', roll: '', name: '', phone: '', email: '', dept: '',
    year: '', address: '', company: '', location: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        id: '', roll: '', name: '', phone: '', email: '', dept: '',
        year: '', address: '', company: '', location: ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
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
              <Form.Control name="dept" value={form.dept} onChange={handleChange} />
            </Col>
            <Col md={6}>
              <Form.Label>Year</Form.Label>
              <Form.Control name="year" type="number" value={form.year} onChange={handleChange} />
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