import React from "react";

export default function ResultsTable({ results, onEdit, hasSearched }) {
  
  if (!hasSearched) return null;

 
  if (!results?.length) {
    return (
      <div className="text-center py-5">
        <div className="mb-2 fs-5 fw-semibold text-muted">No results found</div>
        <div className="small text-secondary">Try adjusting your filters and search again.</div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th className="small">Roll</th>
            <th>Name</th>
            <th className="small">Dept</th>
            
            <th className="small">Year</th>
           
            
            <th className="small">Company</th>
            <th className="small">Designation</th>
            <th className="small">Email</th>
            <th className="small">Phone</th>
             <th className="small">Address</th>
            <th className="text-end small">Action</th>
          </tr>
        </thead>

        <tbody>
          {results.map((item, index) => (
            <tr key={item.roll || item.email || item.phone || item.name || index}>
              <td className="small fw-semibold">{item.roll || "not available"}</td>
              <td className="fw-semibold">{item.name || "not available"}</td>
              <td className="small">{item.dept || "not available"}</td>
              
              <td className="small">{item.year || "not available"}</td>
             
              
              <td className="small">{item.company || "not available"}</td>
              <td className="small">{item.designation || "not available"}</td>
              <td className="small text-truncate" style={{ maxWidth: "160px" }}>
                {item.email || "not available"}
              </td>
              <td className="small">{item.phone || "not available"}</td>
             <td className="small">{item.address || "not available"}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-primary px-3 rounded-pill"
                  onClick={() => onEdit(item)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
