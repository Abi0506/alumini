import React, { useState } from 'react';
import { importExcel } from '../api/api';

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

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
      <div className="mb-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          className="form-control form-control-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <small className="text-muted">
          Excel file must have headers: id, name, dept, year, etc.
        </small>
      </div>

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