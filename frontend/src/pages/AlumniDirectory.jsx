
import React, { useState } from "react";
import { searchAlumni, saveAlumni } from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import SearchForm from "../components/SearchForm";
import ResultsTable from "../components/ResultsTable";
import AlumniModal from "../components/AlumniModal";
import ExcelUpload from "../components/ExcelUpload";
import UserManagement from "../components/UserManagement";

export default function AlumniDirectory({ user, onLogout }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchFilters, setLastSearchFilters] = useState(null);
  const [clearFormTrigger, setClearFormTrigger] = useState(0);
  const [restoreFormTrigger, setRestoreFormTrigger] = useState(0);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
  const normalizePhone = (value = "") => String(value || "").replace(/\D/g, "");
  const getMatchScore = (candidate, query) => {
    if (!query) return 0;
    if (!candidate) return 0;
    if (candidate.startsWith(query)) return 3;
    if (candidate.includes(query)) return 1;
    return 0;
  };

  const applySmartSort = (filters, data) => {
    const emailQuery = normalizeEmail(filters?.email || "");
    const phoneQuery = normalizePhone(filters?.phone || "");

    if (!emailQuery && !phoneQuery) return data;

    return data
      .map((item, idx) => {
        const emailScore = getMatchScore(
          normalizeEmail(item.email || ""),
          emailQuery
        );
        const phoneScore = getMatchScore(
          normalizePhone(item.phone || ""),
          phoneQuery
        );

        return {
          item,
          idx,
          score: Math.max(emailScore, phoneScore) + emailScore + phoneScore,
        };
      })
      .sort((a, b) => b.score - a.score || a.idx - b.idx)
      .map((entry) => entry.item);
  };

  const handleSearch = async (filters, skipEmptyCheck = false) => {
    
    if (!skipEmptyCheck) {
      const hasData = Object.values(filters).some(val => val && String(val).trim() !== '');
      if (!hasData) {
        setHasSearched(false);
        setResults([]);
        setErrorMsg("");
        return;
      }
    }

    setHasSearched(true);
    setLoading(true);
    setErrorMsg("");
    setResults([]);

    try {
      const response = await searchAlumni(filters);

      let alumniData = response;

      
      if (response && typeof response === "object" && !Array.isArray(response)) {
        if (response.success === false) {
          setErrorMsg(response.message || "No records found");
          setResults([]);
          return;
        }
        alumniData = response.data || [];
      }

      const normalized = Array.isArray(alumniData) ? alumniData : [];
      setResults(applySmartSort(filters, normalized));
      
      
      setLastSearchFilters(filters);
      setClearFormTrigger(prev => prev + 1);
    } catch (err) {
      setErrorMsg(err.message || "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (lastSearchFilters) {
      setRestoreFormTrigger(prev => prev + 1);
    }
  };

  const handleSave = async (data) => {
    try {
      await saveAlumni(data);

      
      setResults((prev) => {
        const normalizeKey = (value = "") => String(value || "").trim().toLowerCase();
        const getIdentity = (item) =>
          normalizeKey(item.roll) ||
          normalizeEmail(item.email) ||
          normalizePhone(item.phone) ||
          normalizeKey(item.name);

        const targetKey = getIdentity(data);
        if (!targetKey) {
          return [{ ...data }, ...prev];
        }
        const exists = prev.some((item) => getIdentity(item) === targetKey);

        if (exists) {
          return prev.map((item) =>
            getIdentity(item) === targetKey ? { ...item, ...data } : item
          );
        } else {
          return [{ ...data }, ...prev];
        }
      });

      setModalOpen(false);
      setSelectedAlumni(null);
      setErrorMsg("");
    } catch (err) {
      alert(err.message || "Save failed. Please try again.");
    }
  };

  const visibleResults = results.slice(0, rowsPerPage);

  return (
    <>
      <div className="app-shell">
        <main className="container content" style={{ maxWidth: "1100px" }}>
          <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
            <div>
              <h4 className="mb-0 fw-bold">Alumni Directory</h4>
              {user && (
                <small className="text-muted">
                  Welcome, {user.name} 
                  {user.role === 'admin' && <span className="badge bg-danger ms-2">Admin</span>}
                </small>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center">
              {user?.role === 'admin' && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowUserManagement(true)}
                >
                  Manage Users
                </button>
              )}
              <button
                className="btn btn-outline-primary btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#excelUploadModal"
              >
                Import Excel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedAlumni(null);
                  setModalOpen(true);
                }}
              >
                Add New
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="panel panel--search mb-4">
            <div className="section-title">Search Filters</div>
            <SearchForm 
              onSearch={handleSearch} 
              onReset={handleReset} 
              loading={loading} 
              clearTrigger={clearFormTrigger}
              restoreTrigger={restoreFormTrigger}
              restoreData={lastSearchFilters}
            />
          </div>

          {hasSearched && (
            <>
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
            </>
          )}
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

      {/* ✅ User Management Modal (Admin only) */}
      {user?.role === 'admin' && (
        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </>
  );
}
