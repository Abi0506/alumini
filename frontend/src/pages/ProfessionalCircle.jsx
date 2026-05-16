import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { searchProfessional, saveProfessional, searchProfessionalWithAI } from "../api/api";
import ProfessionalModal from "../components/ProfessionalModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProfessionalCircle({ user, onLogout }) {
  const navigate = useNavigate();
  const canEdit = user?.role === "admin";

  const [formData, setFormData] = useState({
    user_id: "",
    company_name: "",
    website: "",
    name: "",
    designation: "",
    email: "",
    phone: "",
    address: "",
  });

  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchInsight, setSearchInsight] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastSearchRequest, setLastSearchRequest] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [aiQuery, setAiQuery] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    document.body.classList.add("main-bg");
    return () => {
      document.body.classList.remove("main-bg");
    };
  }, []);

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
    return [...results].sort((a, b) => {
      const comparison = compareValues(a?.[sortConfig.key], b?.[sortConfig.key]);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [results, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    setHasSearched(true);
    setLoading(true);
    setErrorMsg("");
    setSearchInsight(null);
    setResults([]);
    setTotalCount(0);
    setCurrentPage(1);

    try {
      const response = await searchProfessional(formData, 1);
      if (response?.success === false) {
        setErrorMsg(response.message || "No records found");
        setResults([]);
        return;
      }

      const data = Array.isArray(response?.data) ? response.data : [];
      setResults(data);
      setTotalCount(response.total || data.length);
      setLastSearchRequest({ type: "standard", filters: formData, aiQuery: "" });
    } catch (err) {
      setErrorMsg(err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = String(aiQuery || "").trim();

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
      const response = await searchProfessionalWithAI(trimmedQuery, 1);
      const data = Array.isArray(response?.data) ? response.data : [];

      if (!response?.success || data.length === 0) {
        setErrorMsg(response?.message || "No records found");
        setResults([]);
        return;
      }

      setResults(data);
      setTotalCount(response.total || data.length);
      setSearchInsight(response.interpretation || null);
      setLastSearchRequest({ type: "ai", filters: null, aiQuery: trimmedQuery });
    } catch (err) {
      setErrorMsg(err.message || "AI search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      user_id: "",
      company_name: "",
      website: "",
      name: "",
      designation: "",
      email: "",
      phone: "",
      address: "",
    });
    setResults([]);
    setHasSearched(false);
    setErrorMsg("");
    setSearchInsight(null);
    setTotalCount(0);
    setCurrentPage(1);
    setLastSearchRequest(null);
    setAiQuery("");
  };

  const hasMore = results.length < totalCount;
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastSearchRequest) return;
    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const response =
        lastSearchRequest.type === "ai"
          ? await searchProfessionalWithAI(lastSearchRequest.aiQuery, nextPage)
          : await searchProfessional(lastSearchRequest.filters, nextPage);
      const newData = Array.isArray(response?.data) ? response.data : [];
      if (newData.length > 0) {
        setResults((prev) => [...prev, ...newData]);
        setCurrentPage(nextPage);
        setTotalCount(response.total || totalCount);
      }
    } catch (err) {
      // silent load-more failure
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastSearchRequest, currentPage, totalCount]);

  const handleSave = async (data) => {
    if (!canEdit) {
      setErrorMsg("Only admins can edit professional circle records.");
      return;
    }

    try {
      await saveProfessional(data);
      setModalOpen(false);
      setSelectedRecord(null);
      setErrorMsg("");

      if (hasSearched && lastSearchRequest) {
        const refreshed =
          lastSearchRequest.type === "ai"
            ? await searchProfessionalWithAI(lastSearchRequest.aiQuery, 1)
            : await searchProfessional(lastSearchRequest.filters, 1);
        const refreshedData = Array.isArray(refreshed?.data) ? refreshed.data : [];
        setResults(refreshedData);
        setTotalCount(refreshed.total || refreshedData.length);
        setCurrentPage(1);
      }
    } catch (err) {
      alert(err.message || "Save failed. Please try again.");
    }
  };

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
      doc.text("Professional Circle Search Results", 40, 48);

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
        item.user_id || "not available",
        item.company_name || "not available",
        item.website || "not available",
        item.name || "not available",
        item.designation || "not available",
        item.email || "not available",
        item.phone || "not available",
        item.address || "not available",
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [["User ID", "Company", "Website", "Name", "Designation", "Email", "Phone", "Address"]],
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
          0: { cellWidth: 55 },
          1: { cellWidth: 95 },
          2: { cellWidth: 120 },
          3: { cellWidth: 95 },
          4: { cellWidth: 95 },
          5: { cellWidth: 130 },
          6: { cellWidth: 85 },
          7: { cellWidth: 150 },
        },
        margin: { left: 24, right: 24, bottom: 28 },
      });

      const timestamp = generatedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-");
      doc.save(`professional-circle-results-${timestamp}.pdf`);
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
              {user && (
                <div className="welcome-text text-muted">
                  Welcome, {user.name}
                  {user.role === "admin" && <span className="badge bg-danger ms-2">Admin</span>}
                </div>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center">
              {canEdit && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedRecord(null);
                    setModalOpen(true);
                  }}
                >
                  Add New
                </button>
              )}
              <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-center mb-4">
            <div className="btn-group" role="group" aria-label="Directory Mode Switch">
              <input
                type="radio"
                className="btn-check"
                name="directoryMode"
                id="modeAlumini"
                autoComplete="off"
                checked={false}
                onChange={() => navigate("/alumni")}
              />
              <label className="btn btn-outline-primary px-4" htmlFor="modeAlumini">Alumni</label>

              <input
                type="radio"
                className="btn-check"
                name="directoryMode"
                id="modeProfessional"
                autoComplete="off"
                checked
                onChange={() => navigate("/professional")}
              />
              <label className="btn btn-outline-primary px-4" htmlFor="modeProfessional">Professional Circle</label>
            </div>
          </div>

          <div className="panel panel--search mb-4">
            <div className="section-title">Professional Circle Search</div>
            <form onSubmit={handleAISearch} className="mb-4">
              <div className="ai-search-box">
                <label htmlFor="aiQuery" className="form-label fw-bold">AI Search</label>
                <textarea
                  id="aiQuery"
                  className="form-control"
                  rows="3"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="e.g. I need HR managers in Coimbatore or companies offering ERP services"
                />
                <div className="small text-secondary mt-2">
                  Use plain English. The AI will look at company, designation, name, and location.
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button type="submit" className="btn btn-primary" disabled={loading || !aiQuery.trim()}>
                    {loading ? "Searching..." : "Search With AI"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </div>
            </form>

            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-12 mb-3 border-bottom pb-3">
                  <label htmlFor="user_id" className="form-label fw-bold">User ID</label>
                  <input
                    id="user_id"
                    type="number"
                    className="form-control form-control-lg"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    placeholder="e.g. 4001"
                  />
                </div>

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
                  <label htmlFor="company_name" className="form-label fw-bold">Company Name</label>
                  <input
                    id="company_name"
                    type="text"
                    className="form-control"
                    name="company_name"
                    value={formData.company_name}
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
                  <label htmlFor="website" className="form-label fw-bold">Website</label>
                  <input
                    id="website"
                    type="text"
                    className="form-control"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
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
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </form>
          </div>

          {hasSearched && (
            <>
              {errorMsg && (
                <div className="alert alert-danger alert-dismissible fade show rounded-4" role="alert">
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
                {canEdit && results.length > 0 && (
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

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      {[
                        { key: "user_id", label: "User ID" },
                        { key: "company_name", label: "Company" },
                        { key: "website", label: "Website" },
                        { key: "name", label: "Name" },
                        { key: "designation", label: "Designation" },
                        { key: "email", label: "Email" },
                        { key: "phone", label: "Phone" },
                        { key: "address", label: "Address" },
                      ].map((column) => {
                        const isActive = sortConfig?.key === column.key;
                        const directionClass = !isActive
                          ? "is-neutral"
                          : sortConfig.direction === "asc"
                          ? "is-asc"
                          : "is-desc";

                        return (
                          <th key={column.key} className="small">
                            <button
                              type="button"
                              className="table-sort-btn"
                              onClick={() => handleSort(column.key)}
                              aria-label={`Sort by ${column.label} ${isActive ? sortConfig.direction : "ascending"}`}
                            >
                              <span>{column.label}</span>
                              <span className={`table-sort-btn__icon ${directionClass}`} aria-hidden="true" />
                            </button>
                          </th>
                        );
                      })}
                      {canEdit && <th className="text-end small">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((item, index) => (
                      <tr key={item.user_id || item.email || item.phone || index}>
                        <td className="small fw-semibold">{item.user_id || "not available"}</td>
                        <td className="small">{item.company_name || "not available"}</td>
                        <td className="small text-truncate" style={{ maxWidth: "160px" }}>
                          {item.website || "not available"}
                        </td>
                        <td className="fw-semibold">{item.name || "not available"}</td>
                        <td className="small">{item.designation || "not available"}</td>
                        <td className="small text-truncate" style={{ maxWidth: "160px" }}>
                          {item.email || "not available"}
                        </td>
                        <td className="small">{item.phone || "not available"}</td>
                        <td className="small">{item.address || "not available"}</td>
                        {canEdit && (
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-primary px-3 rounded-pill"
                              onClick={() => {
                                setSelectedRecord(item);
                                setModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="text-center py-3">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ProfessionalModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={handleSave}
        initialData={selectedRecord}
      />
    </>
  );
}
