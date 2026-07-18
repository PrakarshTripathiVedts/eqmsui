import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom";
import { FaSearch, FaTimes, FaDownload, FaEye, FaFileAlt } from "react-icons/fa";
import { format } from "date-fns";
import { getGatepassList } from "../../services/gatepass.service";
import useGatepassAttachment from "./useGatepassAttachment";

const STATUS_LABEL  = { O: "OUT", I: "IN", P: "Partially In" };
const STATUS_BADGE  = { O: "bg-danger", I: "bg-success", P: "bg-warning text-dark" };
const MIN_CHARS     = 3;

const fmtDate = (val) => (val ? format(new Date(val), "dd-MM-yyyy") : "-");
const isPdf   = (filename) => filename?.toLowerCase().endsWith(".pdf");

// ── component ──────────────────────────────────────────────────────────────
const GatepassSearch = () => {
  const [searchInput, setSearchInput] = useState("");
  const [allData,     setAllData]     = useState([]);   // full list fetched once
  const [results,     setResults]     = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [fetchError,  setFetchError]  = useState("");
  const inputRef = useRef(null);

  const { openAttachment, loading: attachmentLoading } = useGatepassAttachment();

  // ── fetch full list once on mount ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getGatepassList();
        setAllData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load gatepass list:", err);
        setFetchError("Failed to load data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── filter client-side on every keystroke ──────────────────────────────
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setSearchInput(val);
    const query = val.trim().toLowerCase();
    if (query.length < MIN_CHARS) {
      setResults([]);
      return;
    }
    // partial, case-insensitive match
    setResults(
      allData.filter(item =>
        item.gatepassNo?.toLowerCase().includes(query)
      )
    );
  }, [allData]);

  // ── clear handler ──────────────────────────────────────────────────────
  const handleClear = () => {
    setSearchInput("");
    setResults([]);
    inputRef.current?.focus();
  };

  const hasInput    = searchInput.trim().length > 0;
  const belowMin    = searchInput.trim().length > 0 && searchInput.trim().length < MIN_CHARS;
  const showResults = searchInput.trim().length >= MIN_CHARS;

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />

      <div className="card p-2">
        <div className="card-body">

          {/* ── Page Title ─────────────────────────────────────────────── */}
          <h3 className="text-center mb-4" style={{ color: "#1e3a8a", fontWeight: 700, letterSpacing: "0.3px" }}>
            Gatepass Search
          </h3>

          {/* ── Search Bar ─────────────────────────────────────────────── */}
          <div className="mx-auto mb-4" style={{ maxWidth: 560 }}>
            <label
              className="form-label fw-semibold mb-1"
              style={{ fontSize: "0.85rem", color: "#374151" }}
            >
              Gatepass No
            </label>

            <div
              className="input-group shadow-sm"
              style={{ borderRadius: 8, overflow: "hidden" }}
            >
              {/* search icon prefix */}
              <span
                className="input-group-text"
                style={{ background: "#1e3a8a", color: "#fff", border: "none", padding: "0 14px" }}
              >
                {isLoading
                  ? <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  : <FaSearch size={14} />
                }
              </span>

              <input
                ref={inputRef}
                type="text"
                className="form-control"
                placeholder="Type at least 3 characters to search…"
                value={searchInput}
                onChange={handleInputChange}
                style={{
                  border: "1.5px solid #c7d4f0",
                  borderLeft: "none",
                  fontSize: "0.9rem",
                  boxShadow: "none",
                  borderRight: hasInput ? "none" : undefined,
                }}
              />

              {/* clear × — only when there's input */}
              {hasInput && (
                <button
                  className="input-group-text"
                  onClick={handleClear}
                  title="Clear"
                  style={{
                    background: "#f3f4f6",
                    border: "1.5px solid #c7d4f0",
                    borderLeft: "none",
                    borderRadius: "0 8px 8px 0",
                    cursor: "pointer",
                    color: "#9ca3af",
                  }}
                >
                  <FaTimes size={13} />
                </button>
              )}
            </div>

            {/* hint: below 3 chars */}
            {belowMin && (
              <div className="mt-1" style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                Keep typing… {MIN_CHARS - searchInput.trim().length} more character{MIN_CHARS - searchInput.trim().length > 1 ? "s" : ""} needed
              </div>
            )}

            {/* fetch error */}
            {fetchError && (
              <div className="mt-1" style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 500 }}>
                <FaTimes size={10} className="me-1" />{fetchError}
              </div>
            )}
          </div>

          {/* ── Results ────────────────────────────────────────────────── */}
          {!showResults && !isLoading && (
            <div className="mx-auto text-center py-5" style={{ maxWidth: 400, color: "#9ca3af" }}>
              <FaSearch size={36} style={{ opacity: 0.25, marginBottom: 12 }} />
              <p style={{ fontSize: "0.88rem", margin: 0 }}>
                Type a Gatepass No above — results appear automatically after {MIN_CHARS} characters.
              </p>
            </div>
          )}

          {showResults && (
            <>
              {/* result count pill */}
              <div className="mb-2 d-flex align-items-center gap-2">
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: results.length > 0 ? "#1e3a8a" : "#6b7280",
                    background: results.length > 0 ? "#e0e7ff" : "#f3f4f6",
                    borderRadius: 20,
                    padding: "2px 12px",
                    display: "inline-block",
                  }}
                >
                  {results.length === 0
                    ? `No records found for "${searchInput.trim()}"`
                    : `${results.length} record${results.length > 1 ? "s" : ""} found for "${searchInput.trim()}"`}
                </span>
              </div>

              {results.length === 0 ? (
                /* no-results state */
                <div
                  className="text-center py-5 rounded border"
                  style={{ background: "#f9fafb", color: "#6b7280" }}
                >
                  <FaFileAlt size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ fontSize: "0.88rem", margin: 0 }}>
                    No gatepass entries match <strong>{searchInput}</strong>.
                    <br />Try checking the number and searching again.
                  </p>
                </div>
              ) : (
                /* results table */
                <div
                  className="table-responsive border rounded"
                  style={{ maxHeight: 480, overflowY: "auto" }}
                >
                  <table
                    className="table table-sm table-bordered table-hover mb-0 align-middle text-center"
                    style={{ fontSize: "1rem" }}
                  >
                    <thead
                      style={{
                        backgroundColor: "#1e3a8a",
                        color: "#fff",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <tr>
                        <th className="py-2" style={{ width: 40 }}>SN</th>
                        <th>Gatepass No</th>
                        <th>Gatepass Date</th>
                        <th>Category</th>
                        <th>Destination</th>
                        <th>Out Date</th>
                        <th>Probable Return</th>
                        <th>Item Status</th>
                        <th>Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((item, i) => (
                        <tr
                          key={item.gatepassId ?? i}
                          style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f0f4ff" }}
                        >
                          <td>{i + 1}</td>
                          <td className="fw-semibold" style={{ color: "#1e3a8a" }}>
                            {item.gatepassNo ?? "-"}
                          </td>
                          <td>{fmtDate(item.gatepassDate)}</td>
                          <td>{item.category ?? "-"}</td>
                          <td className="text-start">{item.destination ?? "-"}</td>
                          <td>{fmtDate(item.outDate)}</td>
                          <td>{fmtDate(item.probableReturnDate)}</td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[item.itemStatus] ?? "bg-secondary"}`}>
                              {STATUS_LABEL[item.itemStatus] ?? item.itemStatus ?? "-"}
                            </span>
                          </td>

                          {/* ── Document cell ───────────────────────── */}
                          <td>
                            {item.filename ? (
                              <button
                                type="button"
                                className="btn btn-sm px-2 py-0"
                                style={{
                                  fontSize: "11px",
                                  border: isPdf(item.filename)
                                    ? "1px solid #1e3a8a"
                                    : "1px solid #16a34a",
                                  color: isPdf(item.filename) ? "#1e3a8a" : "#16a34a",
                                  background: "#fff",
                                  borderRadius: 5,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                                onClick={() => openAttachment(item.gatepassId, item.filename)}
                                disabled={attachmentLoading}
                                title={item.filename}
                              >
                                {isPdf(item.filename)
                                  ? <><FaEye size={10} /> {attachmentLoading ? "Opening…" : "View"}</>
                                  : <><FaDownload size={10} /> {attachmentLoading ? "Downloading…" : "Download"}</>
                                }
                              </button>
                            ) : (
                              <span className="text-muted" style={{ fontSize: "11px" }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Back ───────────────────────────────────────────────────── */}
          <div className="text-center mt-4">
            <Link className="btn back" to="/dashboard">BACK</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GatepassSearch;