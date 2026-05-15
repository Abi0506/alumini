
import React, { useState, useCallback, useMemo } from "react";
import { searchAlumni, searchAlumniWithAI, saveAlumni } from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import SearchForm from "../components/SearchForm";
import ResultsTable from "../components/ResultsTable";
import AlumniModal from "../components/AlumniModal";
import ExcelUpload from "../components/ExcelUpload";
import UserManagement from "../components/UserManagement";

export default function AlumniDirectory({ user, onLogout }) {
  const canEdit = user?.role === "admin";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchInsight, setSearchInsight] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchRequest, setLastSearchRequest] = useState(null);
  const [clearFormTrigger, setClearFormTrigger] = useState(0);
  const [restoreFormTrigger, setRestoreFormTrigger] = useState(0);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  const compareValues = (left, right) => {
    const leftValue = left ?? "";
    const rightValue = right ?? "";

    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    const bothNumeric = leftValue !== "" && rightValue !== "" && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber);

    if (bothNumeric) {
      return leftNumber - rightNumber;
    }

    return String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  const sortedResults = useMemo(() => {
    if (!sortConfig.key) return results;

    const sorted = [...results].sort((a, b) => {
      const comparison = compareValues(a?.[sortConfig.key], b?.[sortConfig.key]);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [results, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: "asc" };
    });
  }, []);

  const handleSearch = async (filters, skipEmptyCheck = false) => {
    
    if (!skipEmptyCheck) {
      const hasData = Object.values(filters).some(val => val && String(val).trim() !== '');
      if (!hasData) {
        setHasSearched(false);
        setResults([]);
        setErrorMsg("");
        setSearchInsight(null);
        return;
      }
    }

    setHasSearched(true);
    setLoading(true);
    setErrorMsg("");
    setSearchInsight(null);
    setResults([]);
    setTotalCount(0);
    setCurrentPage(1);

    try {
      const response = await searchAlumni(filters, 1);

      if (response && typeof response === "object" && !Array.isArray(response)) {
        if (response.success === false) {
          setErrorMsg(response.message || "No records found");
          setResults([]);
          return;
        }
        const data = Array.isArray(response.data) ? response.data : [];
        setResults(applySmartSort(filters, data));
        setTotalCount(response.total || data.length);
        setCurrentPage(1);
      } else {
        const data = Array.isArray(response) ? response : [];
        setResults(data);
        setTotalCount(data.length);
      }

      setLastSearchRequest({
        type: "standard",
        filters,
        aiQuery: "",
      });
      setClearFormTrigger(prev => prev + 1);
    } catch (err) {
      setErrorMsg(err.message || "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = async (query) => {
    const trimmedQuery = String(query || "").trim();

    if (!trimmedQuery) {
      setHasSearched(false);
      setResults([]);
      setErrorMsg("");
      setSearchInsight(null);
      return;
    }

    setHasSearched(true);
    setLoading(true);
    setErrorMsg("");
    setSearchInsight(null);
    setResults([]);
    setTotalCount(0);
    setCurrentPage(1);

    try {
      const response = await searchAlumniWithAI(trimmedQuery, 1);
      const data = Array.isArray(response?.data) ? response.data : [];

      if (!response?.success || data.length === 0) {
        setErrorMsg(response?.message || "No records found");
        setResults([]);
        return;
      }

      setResults(data);
      setTotalCount(response.total || data.length);
      setCurrentPage(1);
      setSearchInsight(response.interpretation || null);
      setLastSearchRequest({
        type: "ai",
        filters: null,
        aiQuery: trimmedQuery,
      });
      setClearFormTrigger((prev) => prev + 1);
    } catch (err) {
      setErrorMsg(err.message || "AI search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (lastSearchRequest) {
      setRestoreFormTrigger(prev => prev + 1);
    }
  };

  const handleSave = async (data) => {
    if (!canEdit) {
      setErrorMsg("Only admins can edit alumni records.");
      return;
    }

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

  const hasMore = results.length < totalCount;
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastSearchRequest) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response =
        lastSearchRequest.type === "ai"
          ? await searchAlumniWithAI(lastSearchRequest.aiQuery, nextPage)
          : await searchAlumni(lastSearchRequest.filters, nextPage);
      const newData = Array.isArray(response?.data) ? response.data : [];
      if (newData.length > 0) {
        setResults(prev => [...prev, ...newData]);
        setCurrentPage(nextPage);
        setTotalCount(response.total || totalCount);
      }
    } catch (err) {
      // silently fail on load-more
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastSearchRequest, currentPage, totalCount]);

  const handleDownloadPdf = useCallback(() => {
    if (!sortedResults.length || exportingPdf) return;

    setExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const generatedAt = new Date();

      doc.setFillColor(22, 34, 42);
      doc.rect(0, 0, pageWidth, 86, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Alumni Directory Search Results", 40, 48);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${generatedAt.toLocaleString()}`, 40, 68);

      doc.setTextColor(27, 27, 27);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Total Records: ${sortedResults.length}`, 40, 110);

      if (searchInsight?.summary) {
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        doc.text(`AI Summary: ${searchInsight.summary}`, 40, 128, { maxWidth: pageWidth - 80 });
      }

      const tableStartY = searchInsight?.summary ? 148 : 130;
      const body = sortedResults.map((item) => [
        item.roll || "not available",
        item.name || "not available",
        item.dept || "not available",
        item.year || "not available",
        item.company || "not available",
        item.designation || "not available",
        item.email || "not available",
        item.phone || "not available",
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [["Roll", "Name", "Dept", "Year", "Company", "Designation", "Email", "Phone"]],
        body,
        styles: {
          fontSize: 8,
          cellPadding: 5,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [31, 42, 55],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 100 },
          2: { cellWidth: 60 },
          3: { cellWidth: 45 },
          4: { cellWidth: 95 },
          5: { cellWidth: 95 },
          6: { cellWidth: 130 },
          7: { cellWidth: 85 },
        },
        margin: { left: 24, right: 24, bottom: 28 },
      });

      const timestamp = generatedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-");
      doc.save(`alumni-search-results-${timestamp}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }, [sortedResults, searchInsight, exportingPdf]);

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
              {canEdit && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowUserManagement(true)}
                >
                  Manage Users
                </button>
              )}
              {canEdit && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#excelUploadModal"
                >
                  Import Excel
                </button>
              )}
              {canEdit && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedAlumni(null);
                    setModalOpen(true);
                  }}
                >
                  Add New
                </button>
              )}
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
              onAISearch={handleAISearch}
              onReset={handleReset} 
              loading={loading} 
              clearTrigger={clearFormTrigger}
              restoreTrigger={restoreFormTrigger}
              restoreData={{
                filters: lastSearchRequest?.type === "standard" ? lastSearchRequest.filters : null,
                aiQuery: lastSearchRequest?.type === "ai" ? lastSearchRequest.aiQuery : "",
              }}
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
                      {results.length} / {totalCount}
                    </span>
                  )}
                </h5>
                {results.length > 0 && (
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf}
                  >
                    {exportingPdf ? "Preparing PDF..." : "Download PDF"}
                  </button>
                )}
              </div>

              {searchInsight?.summary && (
                <div className="alert alert-info rounded-4 ai-search-summary" role="status">
                  <strong>AI interpretation:</strong> {searchInsight.summary}
                </div>
              )}

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
                    results={sortedResults}
                    hasSearched={hasSearched}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    canEdit={canEdit}
                    onEdit={(item) => {
                      if (!canEdit) return;
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
      {canEdit && (
        <AlumniModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialData={selectedAlumni}
        />
      )}

      {/* ✅ User Management Modal (Admin only) */}
      {canEdit && (
        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </>
  );
}
