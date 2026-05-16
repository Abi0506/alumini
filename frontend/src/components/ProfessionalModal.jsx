import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export default function ProfessionalModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    user_id: "",
    company_name: "",
    website: "",
    name: "",
    designation: "",
    email: "",
    phone: "",
    address: "",
  });
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        user_id: initialData.user_id || "",
        company_name: initialData.company_name || "",
        website: initialData.website || "",
        name: initialData.name || "",
        designation: initialData.designation || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
      });
      setConfirmText("");
    } else {
      setForm({
        user_id: "",
        company_name: "",
        website: "",
        name: "",
        designation: "",
        email: "",
        phone: "",
        address: "",
      });
      setConfirmText("");
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isEdit = Boolean(initialData);
  const isConfirmed = !isEdit || (confirmText || "").trim().toUpperCase() === "UPDATE";

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isConfirmed) {
      alert("Please type UPDATE to confirm changes before saving.");
      return;
    }

    onSave({
      user_id: form.user_id || null,
      company_name: form.company_name,
      website: form.website,
      name: form.name,
      designation: form.designation,
      email: form.email,
      phone: form.phone,
      address: form.address,
    });
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {initialData ? "Edit Professional Contact" : "Add Professional Contact"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>User ID</Form.Label>
              <Form.Control
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                disabled={isEdit}
                placeholder={isEdit ? "Auto assigned" : "Auto assigned"}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Col>

            <Col md={6}>
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Website</Form.Label>
              <Form.Control
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </Col>

            <Col md={6}>
              <Form.Label>Designation</Form.Label>
              <Form.Control
                name="designation"
                value={form.designation}
                onChange={handleChange}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
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
            {initialData ? "Update" : "Save"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
