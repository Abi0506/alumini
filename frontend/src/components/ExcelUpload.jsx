import React, { useState } from 'react';
import { importExcel } from '../api/api';

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const requiredColumns = [
    { name: 'roll', description: 'Roll Number', essential: true },
    { name: 'name', description: 'Full Name', essential: true },
    { name: 'dept', description: 'Department', essential: true },
    { name: 'year', description: 'Graduation Year (as number)', essential: true },
    { name: 'id', description: 'Alumni ID', essential: false },
    { name: 'phone', description: 'Phone Number', essential: false },
    { name: 'email', description: 'Email Address', essential: false },
    { name: 'company', description: 'Current Company', essential: false },
    { name: 'location', description: 'Current Location/City', essential: false },
    { name: 'address', description: 'Address', essential: false }
  ];

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await importExcel(file);
      setStatus({
        type: 'success',
        message: `Imported ${result.inserted || 0}, Updated ${result.updated || 0}`
      });
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <>
      {showInstructions && (
        <div className="alert alert-info mb-4" role="alert">
          <h6 className="alert-heading fw-bold mb-3">Excel Column Header Names</h6>
          <p className="small mb-3">Essential columns: <strong>roll, name, dept, year</strong>. Other fields are optional. (case-insensitive)</p>
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0">
              <thead className="table-light">
                <tr>
                  <th className="small">Column Name</th>
                  <th className="small">Description</th>
                </tr>
              </thead>
              <tbody>
                {requiredColumns.map((col) => (
                  <tr key={col.name} style={{backgroundColor: col.essential ? '#e8f4f8' : 'transparent'}}>
                    <td className="small fw-semibold">
                      {col.name}
                      {col.essential && <span className="badge bg-info ms-2">Essential</span>}
                    </td>
                    <td className="small">{col.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mt-3"
            onClick={() => setShowInstructions(false)}
          >
            Hide Instructions
          </button>
        </div>
      )}

      <div className="mb-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          className="form-control form-control-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <small className="text-muted d-block mt-2">
          {showInstructions ? 'Select an Excel file matching the columns shown above.' : 'Column headers: id, name, dept, year, phone, email, company, location, address'}
        </small>
      </div>

      {!showInstructions && (
        <button
          type="button"
          className="btn btn-sm btn-outline-info w-100 mb-3"
          onClick={() => setShowInstructions(true)}
        >
          Show Column Instructions
        </button>
      )}

      <button
        className="btn btn-outline-success w-100"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Excel'}
      </button>

      {status && (
        <div className={`alert alert-${status.type} mt-3 small`}>
          {status.message}
        </div>
      )}
    </>
  );
}