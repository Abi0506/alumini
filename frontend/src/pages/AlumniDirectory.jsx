// src/pages/AlumniDirectory.jsx
import React, { useState } from "react";
import { searchAlumni, saveAlumni } from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import SearchForm from "../components/SearchForm";
import ResultsTable from "../components/ResultsTable";
import AlumniModal from "../components/AlumniModal";
import ExcelUpload from "../components/ExcelUpload";

export default function AlumniDirectory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (filters) => {
    setHasSearched(true);
    setLoading(true);
    setErrorMsg("");
    setResults([]);

    try {
      const response = await searchAlumni(filters);

      let alumniData = response;

      // supports both formats: [] or { success, data }
      if (response && typeof response === "object" && !Array.isArray(response)) {
        if (response.success === false) {
          setErrorMsg(response.message || "No records found");
          setResults([]);
          return;
        }
        alumniData = response.data || [];
      }

      setResults(Array.isArray(alumniData) ? alumniData : []);
    } catch (err) {
      console.error("Search failed:", err);
      setErrorMsg(err.message || "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      await saveAlumni(data);

      // ✅ reflect instantly in UI
      setResults((prev) => {
        const exists = prev.some((item) => item.id === data.id);

        if (exists) {
          return prev.map((item) =>
            item.id === data.id ? { ...item, ...data } : item
          );
        } else {
          return [{ ...data }, ...prev];
        }
      });

      setModalOpen(false);
      setSelectedAlumni(null);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message || "Save failed");
    }
  };

  const visibleResults = results.slice(0, rowsPerPage);

  return (
    <>
      <div className="app-shell">
        <header className="hero">
          <div className="container hero__content">
            <div>
              <span className="hero__eyebrow">Alumni Intelligence</span>
              <h1 className="hero__title">Alumni Directory</h1>
              <p className="hero__subtitle">
                Search, update, and grow your alumni network with a clean
                workflow built for quick lookups and accurate records.
              </p>
            </div>
            <div className="hero__actions">
              <button
                className="btn btn-hero btn-soft"
                data-bs-toggle="modal"
                data-bs-target="#excelUploadModal"
              >
                Import Excel
              </button>
              <button
                className="btn btn-hero btn-accent"
                onClick={() => {
                  setSelectedAlumni(null);
                  setModalOpen(true);
                }}
              >
                Add New
              </button>
            </div>
          </div>
        </header>

        <main className="container content" style={{ maxWidth: "1100px" }}>
          <div className="panel panel--search mb-4">
            <div className="section-title">Search Filters</div>
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>

          <div className="stats-grid mb-4">
            <div className="stat-card">
              <h3>{results.length}</h3>
              <p>Total matches</p>
            </div>
            <div className="stat-card">
              <h3>
                {hasSearched ? visibleResults.length : 0} / {rowsPerPage}
              </h3>
              <p>Showing per page</p>
            </div>
            <div className="stat-card">
              <h3>{loading ? "Searching" : hasSearched ? "Ready" : "Idle"}</h3>
              <p>Search status</p>
            </div>
          </div>

          {errorMsg && (
            <div
              className="alert alert-danger alert-dismissible fade show rounded-4"
              role="alert"
            >
              {errorMsg}
              <button
                type="button"
                className="btn-close"
                onClick={() => setErrorMsg("")}
                aria-label="Close"
              ></button>
            </div>
          )}

          <div className="results-header mb-3">
            <h5 className="mb-0 fw-semibold">
              Results
              {results.length > 0 && (
                <span className="badge-soft ms-2">
                  {visibleResults.length} / {results.length}
                </span>
              )}
            </h5>

            <div className="d-flex align-items-center gap-2">
              <label
                htmlFor="rowsPerPage"
                className="form-label mb-0 small fw-semibold text-muted"
              >
                Show
              </label>

              <select
                id="rowsPerPage"
                className="form-select form-select-sm"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                style={{ width: "90px" }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div
            className="results-panel overflow-auto"
            style={{
              maxHeight: "calc(100vh - 320px)",
              minHeight: "420px",
            }}
          >
            {loading ? (
              <div className="d-flex justify-content-center align-items-center h-100 py-5">
                <div className="text-center">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                  />
                  <p className="text-muted mb-0">Searching...</p>
                </div>
              </div>
            ) : (
              <ResultsTable
                results={visibleResults}
                hasSearched={hasSearched}
                onEdit={(item) => {
                  setSelectedAlumni(item);
                  setModalOpen(true);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* ✅ Excel Upload Modal */}
      <div
        className="modal fade"
        id="excelUploadModal"
        tabIndex="-1"
        aria-labelledby="excelUploadModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header">
              <h5 className="modal-title" id="excelUploadModalLabel">
                Import Alumni from Excel
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <ExcelUpload />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm px-3 rounded-pill"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add/Edit Modal */}
      <AlumniModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={selectedAlumni}
      />
    </>
  );
}
