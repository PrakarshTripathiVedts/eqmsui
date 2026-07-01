import { Link } from "react-router-dom";
import Navbar from "../navbar/navbar";
import Datatable from "../datatable/datatable";
import { useEffect, useState, useMemo } from "react";
import { getFormDetailsList } from "../../services/admin.service";
import { FaEdit, FaSignInAlt, FaDownload, FaCheck, FaTimes, FaFilter, FaTimes as FaClear, FaEye } from "react-icons/fa";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import GatePassAddEdit from "./gatepassAddEdit";
import {
  getGatepassList,
  getGatepassInHistory,
  submitGatepassInAction,
  updateGatepassInRemarks
} from "../../services/gatepass.service";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import useGatepassAttachment from "./useGatepassAttachment";

const FORM_URL = "gatepassentry";

const STATUS_LABEL = { O: "OUT", I: "IN", P: "Partially In" };

// ── All unique categories your data might contain ──────────────────────────
const CATEGORY_OPTIONS = ["All", "RMGP", "TSGP", "NRMGP", "NRMGP-C"];

const GatePassEntry = () => {
  const [gatepassList, setGatepassList] = useState([]);
  const [rawData, setRawData] = useState([]); // unfiltered source
  const [status, setStatus] = useState('');
  const [gatepassId, setGatepassId] = useState('');

  const defaultToDate = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterFromDate, setFilterFromDate] = useState(defaultFromDate);
  const [filterToDate, setFilterToDate] = useState(defaultToDate);

  // ── Modal states ───────────────────────────────────────────────────────────
  const [showInModal, setShowInModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [inItemStatus, setInItemStatus] = useState('I');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInId, setEditingInId] = useState(null);
  const [inlineRemarks, setInlineRemarks] = useState('');
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { openAttachment, loading: attachmentLoading } = useGatepassAttachment();

  const [permissions, setPermissions] = useState({
    forView: false, forAdd: false, forEdit: false, forDelete: false,
  });

  useEffect(() => {
    const roleId = localStorage.getItem("roleId");
    const loadPermissions = async () => {
      try {
        const details = await getFormDetailsList(roleId);
        const detailArray = Array.isArray(details) ? details : details?.data ?? [];
        const match = detailArray.find(d => d.formUrl?.toLowerCase() === FORM_URL.toLowerCase());
        if (match) {
          setPermissions({
            forView: match.forView === true || match.forView === 1 || match.forView === "Y",
            forAdd: match.forAdd === true || match.forAdd === 1 || match.forAdd === "Y",
            forEdit: match.forEdit === true || match.forEdit === 1 || match.forEdit === "Y",
            forDelete: match.forDelete === true || match.forDelete === 1 || match.forDelete === "Y",
          });
        }
      } catch (err) { console.error("Failed to load permissions", err); }
    };
    loadPermissions();
  }, []);

  useEffect(() => {
    if (permissions.forView) fetchGatepassList();
  }, [permissions.forView]);

  const fetchGatepassList = async () => {
    try {
      const data = await getGatepassList();
      if (Array.isArray(data) && data.length > 0) {
        setRawData(data);
      } else {
        setRawData([]);
        setGatepassList([]);
      }
    } catch (err) { console.error("Failed to fetch gatepass list:", err); }
  };

  // ── Apply filters whenever rawData or filter values change ─────────────────
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const matchCategory =
        filterCategory === "All" || item.category === filterCategory;

      const itemDate = item.outDate ? new Date(item.outDate) : null;
      const matchFrom = !filterFromDate || (itemDate && itemDate >= filterFromDate);
      const matchTo = !filterToDate || (itemDate && itemDate <= filterToDate);

      return matchCategory && matchFrom && matchTo;
    });
  }, [rawData, filterCategory, filterFromDate, filterToDate]);

  // ── Re-build table rows whenever filteredData changes ─────────────────────
  useEffect(() => {
    setTableData(filteredData);
  }, [filteredData, permissions.forEdit]);

  const clearFilters = () => {
    setFilterCategory("All");
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    setFilterFromDate(fromDate);
    setFilterToDate(toDate);
  };

  const isFiltered = (() => {
    const defaultTo = new Date(); defaultTo.setHours(0, 0, 0, 0);
    const defaultFrom = new Date(); defaultFrom.setDate(defaultFrom.getDate() - 30); defaultFrom.setHours(0, 0, 0, 0);
    const currentFrom = filterFromDate ? new Date(filterFromDate) : null; currentFrom?.setHours(0, 0, 0, 0);
    const currentTo = filterToDate ? new Date(filterToDate) : null; currentTo?.setHours(0, 0, 0, 0);

    return (
      filterCategory !== "All" ||
      currentFrom?.getTime() !== defaultFrom.getTime() ||
      currentTo?.getTime() !== defaultTo.getTime()
    );
  })();

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = val => val ? format(new Date(val), "dd-MM-yyyy HH:mm") : '-';
  const fmtDateOnly = val => val ? format(new Date(val), "dd-MM-yyyy") : '-';

  const fetchInboundHistory = async (id) => {
    try {
      const history = await getGatepassInHistory(id);
      setHistoryList(history || []);
    } catch (err) { console.error("Failed to fetch inbound history logs", err); }
  };

  const handleOpenInModal = (item) => {
    setGatepassId(item.gatepassId);
    setInItemStatus('I');
    setRemarks('');
    setSelectedFile(null);
    setErrors({});
    setHistoryList([]);
    setEditingInId(null);
    setInlineRemarks('');
    setShowInModal(true);
    fetchInboundHistory(item.gatepassId);
  };

  const handleInSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    if (!remarks?.trim()) validationErrors.remarks = "Remarks field is mandatory.";
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    const payload = { itemStatus: inItemStatus, remarks: remarks.trim() };
    try {
      const confirmed = await showConfirmation();
      if (confirmed) {
        setIsSubmitting(true);
        const response = await submitGatepassInAction(gatepassId, payload, selectedFile);
        if (response != null) {
          showAlert("Success", "Inward entry added successfully", "success");
          setRemarks('');
          setSelectedFile(null);
          if (document.getElementById("fileField")) document.getElementById("fileField").value = "";
          fetchGatepassList();
          fetchInboundHistory(gatepassId);
        } else {
          showAlert("Error", "Failed to add entry log. Please try again.", "error");
        }
      }
    } catch (err) {
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleInlineRemarksSubmit = async (gatepassInId) => {
    if (!inlineRemarks?.trim()) { showAlert("Validation Error", "Remarks cannot be empty.", "error"); return; }
    try {
      const confirmed = await showConfirmation();
      if (confirmed) {
        setIsInlineSubmitting(true);
        const response = await updateGatepassInRemarks(gatepassInId, { remarks: inlineRemarks.trim() });
        if (response != null) {
          showAlert("Success", "Remarks updated successfully", "success");
          setEditingInId(null); setInlineRemarks('');
          fetchInboundHistory(gatepassId);
        } else {
          showAlert("Error", "Failed to update remarks. Please try again.", "error");
        }
      }
    } catch (err) {
      showAlert("Error", "Something went wrong updating transaction parameters.", "error");
    } finally { setIsInlineSubmitting(false); }
  };

  const startInlineEdit = (hist) => { setEditingInId(hist.gatepassInId); setInlineRemarks(hist.remarks ?? ''); };
  const cancelInlineEdit = () => { setEditingInId(null); setInlineRemarks(''); };

  const setTableData = (data) => {
    setGatepassList(
      data.map((item, index) => ({
        sn: index + 1 + '.',
        gatepassNo: item.gatepassNo ?? '-',
        gatepassDate: fmtDateOnly(item.gatepassDate),
        category: item.category ?? '-',
        destination: item.destination ?? '-',
        probableReturnDate: fmtDateOnly(item.probableReturnDate),
        outDate: fmtDateOnly(item.outDate),
        itemStatus: (
          <span className={`badge ${item.itemStatus === 'I' ? 'bg-success' :
            item.itemStatus === 'P' ? 'bg-warning text-dark' : 'bg-danger'
            }`}>
            {STATUS_LABEL[item.itemStatus] ?? item.itemStatus ?? '-'}
          </span>
        ),
        document: item.filename ? (
          <button
            type="button"
            onClick={() => openAttachment(item.gatepassId, item.filename)}
            disabled={attachmentLoading}
            className="btn btn-outline-primary btn-sm px-2 py-0"
            style={{ fontSize: "11px" }}
            title={item.filename}
          >
            <FaDownload size={10} className="me-1" />
            {attachmentLoading ? "Opening…" : "View"}
          </button>
        ) : (
          <span className="text-muted">-</span>
        ),
        action: (
          <div className="d-flex gap-2 justify-content-center">
            {/* Hide both buttons when status is fully IN */}
            {item.itemStatus !== 'I' && (
              <>
                {permissions.forEdit && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => { setGatepassId(item.gatepassId); setStatus('edit'); }}
                    title="Edit Gatepass"
                  >
                    <FaEdit size={14} />
                  </button>
                )}

                {(item.category === 'RMGP' || item.category === 'TSGP') &&
                  (item.itemStatus === 'O' || item.itemStatus === 'P') && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleOpenInModal(item)}
                      title="Inward / Item Return Action"
                    >
                      <FaSignInAlt size={14} /> In
                    </button>
                  )}
              </>
            )}

            {/* Show a closed label when fully IN */}
            {item.itemStatus === 'I' && (
              <span className="badge bg-success px-2 py-1" style={{ fontSize: "11px" }}>
                Closed
              </span>
            )}
          </div>
        ),
      }))
    );
  };

  const baseColumns = [
    { name: "SN", selector: row => row.sn, sortable: true, align: 'text-center' },
    { name: "Gatepass No", selector: row => row.gatepassNo, sortable: true, align: 'text-center' },
    { name: "Gatepass Date", selector: row => row.gatepassDate, sortable: true, align: 'text-center' },
    { name: "Category", selector: row => row.category, sortable: true, align: 'text-center' },
    { name: "Destination", selector: row => row.destination, sortable: true, align: 'text-start' },
    { name: "Probable Return", selector: row => row.probableReturnDate, sortable: true, align: 'text-center' },
    { name: "Out Date", selector: row => row.outDate, sortable: true, align: 'text-center' },
    { name: "Item Status", selector: row => row.itemStatus, sortable: false, align: 'text-center' },
    { name: "Document", selector: row => row.document, sortable: false, align: 'text-center' },
    { name: "Action", selector: row => row.action, align: 'text-center' },
  ];

  if (!permissions.forView) {
    return (
      <div><Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Gate Pass</h3>
            <p className="text-danger mt-3">You do not have permission to view this page.</p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  switch (status) {
    case 'add':
      return <GatePassAddEdit mode="add" setStatus={setStatus} refreshList={fetchGatepassList} />;
    case 'edit':
      return <GatePassAddEdit mode="edit" gatepassId={gatepassId} setStatus={setStatus} refreshList={fetchGatepassList} />;

    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Gate Pass</h3>

              {/* ══════════════════════════════════════════════════
                  FILTER BAR
              ══════════════════════════════════════════════════ */}
              <div
                className="mb-3 p-3 rounded"
                style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d4f0" }}
              >
                <div className="row align-items-end g-3">

                  {/* Category radio buttons */}
                  <div className="col-md-7">
                    <label className="form-label fw-semibold text-start d-block mb-2" style={{ color: "#374151", fontSize: "0.85rem" }}>
                      <FaFilter size={12} className="me-1" style={{ color: "#4f6ef7" }} />
                      Filter by Category
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map(cat => (
                        <label
                          key={cat}
                          className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                          style={{
                            cursor: "pointer",
                            fontSize: "0.83rem",
                            fontWeight: filterCategory === cat ? 600 : 400,
                            border: `1.5px solid ${filterCategory === cat ? "#4f6ef7" : "#c7d4f0"}`,
                            backgroundColor: filterCategory === cat ? "#4f6ef7" : "#fff",
                            color: filterCategory === cat ? "#fff" : "#374151",
                            transition: "all 0.15s ease",
                            userSelect: "none",
                          }}
                        >
                          <input
                            type="radio"
                            name="filterCategory"
                            value={cat}
                            checked={filterCategory === cat}
                            onChange={() => setFilterCategory(cat)}
                            style={{ display: "none" }}
                          />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* From Date */}
                  <div className="col-md-2">
                    <label className="form-label fw-semibold text-start d-block mb-1" style={{ color: "#374151", fontSize: "0.85rem" }}>
                      From Date
                    </label>
                    <DatePicker
                      selected={filterFromDate}
                      onChange={date => {
                        setFilterFromDate(date);
                        // If selected fromDate is after current toDate, push toDate forward
                        if (date && filterToDate && date > filterToDate) {
                          setFilterToDate(date);
                        }
                      }}
                      className="form-control form-control-sm"
                      placeholderText="dd-MM-yyyy"
                      dateFormat="dd-MM-yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      maxDate={filterToDate || new Date()}   // cannot exceed toDate
                      onKeyDown={e => e.preventDefault()}
                      isClearable={false}                    // don't allow clearing default
                    />
                  </div>

                  {/* To Date */}
                  <div className="col-md-2">
                    <label className="form-label fw-semibold text-start d-block mb-1" style={{ color: "#374151", fontSize: "0.85rem" }}>
                      To Date
                    </label>
                    <DatePicker
                      selected={filterToDate}
                      onChange={date => {
                        // Prevent toDate from being less than fromDate
                        if (date && filterFromDate && date < filterFromDate) {
                          return; // silently block — minDate handles UI but this guards programmatic changes
                        }
                        setFilterToDate(date);
                      }}
                      className="form-control form-control-sm"
                      placeholderText="dd-MM-yyyy"
                      dateFormat="dd-MM-yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      minDate={filterFromDate || undefined}  // cannot go below fromDate
                      maxDate={new Date()}                   // cannot exceed today
                      onKeyDown={e => e.preventDefault()}
                      isClearable={false}                    // don't allow clearing default
                    />
                  </div>

                  {/* Clear button */}
                  <div className="col-md-1 d-flex align-items-end">
                    {isFiltered && (
                      <button
                        className="btn btn-sm w-100"
                        onClick={clearFilters}
                        title="Clear all filters"
                        style={{
                          backgroundColor: "#fff",
                          border: "1.5px solid #e53e3e",
                          color: "#e53e3e",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          padding: "5px 8px",
                        }}
                      >
                        <FaClear size={11} className="me-1" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Active filter summary pill */}
                {isFiltered && (
                  <div className="mt-2 text-start">
                    <span style={{ fontSize: "0.78rem", color: "#4f6ef7", fontWeight: 500 }}>
                      Showing {filteredData.length} of {rawData.length} records
                      {filterCategory !== "All" && <> · Category: <strong>{filterCategory}</strong></>}
                      {filterFromDate && <> · From: <strong>{format(filterFromDate, "dd-MM-yyyy")}</strong></>}
                      {filterToDate && <> · To: <strong>{format(filterToDate, "dd-MM-yyyy")}</strong></>}
                    </span>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════
                  TABLE
              ══════════════════════════════════════════════════ */}
              <div id="card-body customized-card">
                <Datatable columns={baseColumns} data={gatepassList} />
              </div>

              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={() => setStatus('add')}>ADD</button>
                )}
                <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              INWARD MODAL  (unchanged from your original)
          ══════════════════════════════════════════════════ */}
          {showInModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content text-start">
                  <div className="modal-header bg-success text-white">
                    <h5 className="modal-title">Gatepass Inward Action (Return Log)</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowInModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleInSubmit} noValidate>
                      <h6 className="fw-bold mb-3 text-success">Create New Return Entry</h6>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold">Select Item Status:</label>
                          <div className="d-flex gap-4 border p-2 rounded bg-white">
                            <div className="form-check">
                              <input className="form-check-input" type="radio" name="modalStatus" id="radioIn"
                                value="I" checked={inItemStatus === 'I'} onChange={e => setInItemStatus(e.target.value)} />
                              <label className="form-check-input-label ps-1 text-success fw-bold" htmlFor="radioIn">IN (Complete Return)</label>
                            </div>
                            <div className="form-check">
                              <input className="form-check-input" type="radio" name="modalStatus" id="radioPartial"
                                value="P" checked={inItemStatus === 'P'} onChange={e => setInItemStatus(e.target.value)} />
                              <label className="form-check-input-label ps-1 text-primary fw-bold" htmlFor="radioPartial">Partially In (Partial Return)</label>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="fileField" className="form-label fw-bold">
                            Attachment File: <span className="text-muted small fw-normal">(Optional)</span>
                          </label>
                          <input id="fileField" type="file" className="form-control"
                            onChange={e => setSelectedFile(e.target.files[0])} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="remarksField" className="form-label fw-bold">
                          Remarks: <span className="text-danger">*</span>
                        </label>
                        <textarea id="remarksField"
                          className={`form-control ${errors.remarks ? 'is-invalid' : ''}`}
                          rows="2" placeholder="Provide details about items returned..."
                          value={remarks}
                          onChange={e => { setRemarks(e.target.value); if (errors.remarks) setErrors(p => ({ ...p, remarks: null })); }}
                        />
                        {errors.remarks && <div className="invalid-feedback fw-bold">{errors.remarks}</div>}
                      </div>
                      <div className="d-flex justify-content-center gap-2 mb-4">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowInModal(false)}>Close</button>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                          {isSubmitting ? "Processing..." : "Submit"}
                        </button>
                      </div>
                    </form>
                    <hr />
                    <h6 className="fw-bold mb-2 text-secondary">Inward Entries History Log</h6>
                    <div className="table-responsive border rounded bg-white p-1" style={{ maxHeight: '280px' }}>
                      <table className="table table-sm table-striped table-hover mb-0 text-center align-middle small">
                        <thead>
                          <tr className="table-dark">
                            <th style={{ width: "5%" }}>SN</th>
                            <th style={{ width: "12%" }}>Status Change</th>
                            <th style={{ width: "30%", textAlign: "left" }}>Remarks</th>
                            <th style={{ width: "23%", textAlign: "left" }}>Updated By</th>
                            <th style={{ width: "15%" }}>Timestamp</th>
                            <th style={{ width: "15%" }}>Document</th>
                            <th style={{ width: "10%" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyList.length === 0 ? (
                            <tr><td colSpan="7" className="text-muted text-center py-3">No transaction returns logged yet.</td></tr>
                          ) : (
                            historyList.map((hist, index) => {
                              const isCurrentRowEditing = editingInId === hist.gatepassInId;
                              return (
                                <tr key={hist.gatepassInId || index}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <span className={`badge ${hist.itemStatus === 'I' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                      {STATUS_LABEL[hist.itemStatus] || hist.itemStatus}
                                    </span>
                                  </td>
                                  <td className="text-start">
                                    {isCurrentRowEditing ? (
                                      <input type="text" className="form-control form-control-sm"
                                        value={inlineRemarks} onChange={e => setInlineRemarks(e.target.value)}
                                        disabled={isInlineSubmitting} />
                                    ) : (
                                      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{hist.remarks}</div>
                                    )}
                                  </td>
                                  <td className="text-start">{hist.empName || 'N/A'}</td>
                                  <td>{fmt(hist.createdDate)}</td>
                                  <td>
                                    {hist.filename ? (
                                      <button
                                        type="button"
                                        onClick={() => openAttachment(hist.gatepassId, hist.filename)}
                                        disabled={attachmentLoading}
                                        className="btn btn-sm px-2 py-0"
                                        style={{
                                          fontSize: "11px",
                                          border: hist.filename?.toLowerCase().endsWith(".pdf")
                                            ? "1px solid #1e3a8a"
                                            : "1px solid #16a34a",
                                          color: hist.filename?.toLowerCase().endsWith(".pdf")
                                            ? "#1e3a8a"
                                            : "#16a34a",
                                          background: "#fff",
                                          borderRadius: 5,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                        title={hist.filename}
                                      >
                                        {hist.filename?.toLowerCase().endsWith(".pdf") ? (
                                          <><FaEye size={10} /> {attachmentLoading ? "Opening…" : "View"}</>
                                        ) : (
                                          <><FaDownload size={10} /> {attachmentLoading ? "Downloading…" : "Download"}</>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="text-muted" style={{ fontSize: "11px" }}>—</span>
                                    )}
                                  </td>
                                  <td>
                                    {isCurrentRowEditing ? (
                                      <div className="d-flex gap-1 justify-content-center">
                                        <button className="btn btn-success btn-xs px-1 py-0"
                                          onClick={() => handleInlineRemarksSubmit(hist.gatepassInId)}
                                          disabled={isInlineSubmitting} title="Save Remarks">
                                          <FaCheck size={11} />
                                        </button>
                                        <button className="btn btn-danger btn-xs px-1 py-0"
                                          onClick={cancelInlineEdit} disabled={isInlineSubmitting} title="Cancel">
                                          <FaTimes size={11} />
                                        </button>
                                      </div>
                                    ) : (
                                      permissions.forEdit && (
                                        <button className="btn btn-outline-warning btn-sm py-0 px-2"
                                          onClick={() => startInlineEdit(hist)} title="Edit Remarks Inline">
                                          <FaEdit size={12} /> Edit
                                        </button>
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
  }
};

export default GatePassEntry;