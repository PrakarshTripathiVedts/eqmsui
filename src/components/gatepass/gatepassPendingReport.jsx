import { useEffect, useState, useMemo } from "react";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom";
import Select from "react-select";
import { format } from "date-fns";
import { FaFilePdf, FaFileExcel, FaFilter, FaTimes, FaHourglassHalf, FaDownload, FaEye } from "react-icons/fa";
import { getGatepassList } from "../../services/gatepass.service";
import { getProjectListService } from "../../services/masterservice";
import useGatepassAttachment from "./useGatepassAttachment";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

// ── constants ──────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "All",  label: "All Categories" },
  { value: "RMGP", label: "RMGP" },
  { value: "TSGP", label: "TSGP" },
];

// Only pending statuses
const PENDING_STATUSES = ["O", "P"];

const STATUS_LABEL = { O: "OUT", P: "Partially In" };
const STATUS_BADGE = { O: "bg-danger", P: "bg-warning text-dark" };

const fmtDate = (val) => (val ? format(new Date(val), "dd-MM-yyyy") : "-");
const isPdf   = (fn)  => fn?.toLowerCase().endsWith(".pdf");

// ── component ──────────────────────────────────────────────────────────────
const GatepassPendingReport = () => {
  const [rawData,        setRawData]        = useState([]);
  const [projectList,    setProjectList]    = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterProject,  setFilterProject]  = useState(null);
  const [isLoading,      setIsLoading]      = useState(false);

  const { openAttachment, loading: attachmentLoading } = useGatepassAttachment();

  // ── load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [gpData, prData] = await Promise.all([
          getGatepassList(),
          getProjectListService(),
        ]);
        // keep only pending statuses at source
        const pending = (Array.isArray(gpData) ? gpData : []).filter(
          (item) => PENDING_STATUSES.includes(item.itemStatus)
        );
        setRawData(pending);
        setProjectList(Array.isArray(prData) ? prData : []);
      } catch (err) {
        console.error("Failed to load pending gatepass data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── filter logic ─────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return rawData.filter((item) => {
      const matchCategory = filterCategory === "All" || item.category === filterCategory;
      const matchProject  = !filterProject  || item.projectId === filterProject.value;
      return matchCategory && matchProject;
    });
  }, [rawData, filterCategory, filterProject]);

  // ── clear filters ────────────────────────────────────────────────────────
  const clearFilters = () => {
    setFilterCategory("All");
    setFilterProject(null);
  };

  const isFiltered = filterCategory !== "All" || filterProject !== null;

  // ── project lookup ────────────────────────────────────────────────────────
  const getProjectName = (projectId) =>
    projectList.find((p) => p.projectId === projectId)?.projectShortName ?? "-";

  // ── shared report meta ───────────────────────────────────────────────────
  const reportMeta = {
    category:     filterCategory !== "All" ? filterCategory : "All Categories",
    project:      filterProject  ? filterProject.label : "All Projects",
    generatedAt:  format(new Date(), "dd-MM-yyyy HH:mm"),
    totalRecords: filteredData.length,
  };

  // ── table columns (used for PDF + Excel) ─────────────────────────────────
  const tableColumns = [
    "SN", "Gatepass No", "Gatepass Date", "Category",
    "Project", "Destination", "Out Date", "Probable Return", "Item Status",
  ];

  const tableRows = filteredData.map((item, idx) => [
    idx + 1,
    item.gatepassNo               ?? "-",
    fmtDate(item.gatepassDate),
    item.category                 ?? "-",
    getProjectName(item.projectId),
    item.destination              ?? "-",
    fmtDate(item.outDate),
    fmtDate(item.probableReturnDate),
    STATUS_LABEL[item.itemStatus] ?? item.itemStatus ?? "-",
  ]);

  // ── PDF export ────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    const doc       = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin    = 14;
    const usableW   = pageWidth - margin * 2;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28); // red-700 — pending = urgency
    doc.text("Gatepass Pending Report", pageWidth / 2, 16, { align: "center" });

    // Sub-header
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Category: ${reportMeta.category}   |   Project: ${reportMeta.project}`,
      pageWidth / 2, 23, { align: "center", maxWidth: usableW }
    );

    // Divider
    doc.setDrawColor(185, 28, 28);
    doc.setLineWidth(0.4);
    doc.line(margin, 27, pageWidth - margin, 27);

    // Meta row
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    // Table
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 36,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        valign: "middle",
        overflow: "linebreak",
        lineColor: [230, 210, 210],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [185, 28, 28],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: {
        0: { halign: "center", cellWidth: 10  },  // SN
        1: { halign: "center", cellWidth: 28  },  // Gatepass No
        2: { halign: "center", cellWidth: 26  },  // Gatepass Date
        3: { halign: "center", cellWidth: 22  },  // Category
        4: { halign: "left",   cellWidth: 54  },  // Project
        5: { halign: "left",   cellWidth: 42  },  // Destination
        6: { halign: "center", cellWidth: 24  },  // Out Date
        7: { halign: "center", cellWidth: 28  },  // Probable Return
        8: { halign: "center", cellWidth: 24  },  // Item Status
        // Total: 10+28+26+22+54+42+24+28+24 = 258 < 269 ✓
      },
      margin: { left: margin, right: margin },
      tableWidth: usableW,
      didDrawPage: (data) => {
        const pageCount  = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerY    = pageHeight - 8;

        doc.setFontSize(7);
        doc.setTextColor(150);

        doc.text("Generated by VEDTS-EQMS", margin, footerY);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2, footerY, { align: "center" }
        );

        const now = new Date();
        doc.text(
          `Generated On: ${now.toDateString()} ${now.toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short",
          })}`,
          pageWidth - margin, footerY, { align: "right" }
        );
      },
    });

    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  // ── Excel export ──────────────────────────────────────────────────────────
  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const titleBlock = [
      ["Gatepass Pending Report"],
      [`Category: ${reportMeta.category}     |     Project: ${reportMeta.project}`],
      [`Total Pending: ${reportMeta.totalRecords}     |     Generated: ${reportMeta.generatedAt}`],
      [],
      tableColumns,
      ...tableRows,
    ];

    const ws       = XLSX.utils.aoa_to_sheet(titleBlock);
    const colCount = tableColumns.length - 1;

    ws["!cols"] = [
      { wch: 5  }, { wch: 16 }, { wch: 14 }, { wch: 12 },
      { wch: 30 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: colCount } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: colCount } },
    ];

    // Header cell styles
    ["A1", "A2", "A3"].forEach((ref, i) => {
      if (!ws[ref]) return;
      ws[ref].s = {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        font: {
          bold: true,
          sz: i === 0 ? 14 : 10,
          color: i === 0 ? { rgb: "B91C1C" } : { rgb: "374151" },
        },
      };
    });

    // Column header row (row index 4)
    tableColumns.forEach((_, colIdx) => {
      const ref = XLSX.utils.encode_cell({ r: 4, c: colIdx });
      if (!ws[ref]) return;
      ws[ref].s = {
        alignment: { horizontal: "center", vertical: "center" },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: "B91C1C" } },
      };
    });

    ws["!rows"] = [
      { hpt: 28 }, { hpt: 18 }, { hpt: 18 },
      { hpt: 6  }, { hpt: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Pending Gatepasses");
    XLSX.writeFile(wb, `Gatepass_Pending_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
  };

  // ── project options ───────────────────────────────────────────────────────
  const projectOptions = [
    { value: null, label: "All Projects" },
    ...projectList.map((p) => ({ value: p.projectId, label: p.projectCode+ " - "+p.projectShortName })),
  ];

  // ── counts for category pills ─────────────────────────────────────────────
  const countFor = (cat) =>
    cat === "All"
      ? rawData.length
      : rawData.filter((i) => i.category === cat).length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />
      <div className="card p-2">
        <div className="card-body">

          {/* ── Page Title ──────────────────────────────────────────────── */}
          <div className="text-center mb-4">
            <h3 style={{ color: "#b91c1c", fontWeight: 700, letterSpacing: "0.3px", marginBottom: 2 }}>
              <FaHourglassHalf size={18} className="me-2" style={{ verticalAlign: -2 }} />
              Gatepass Pending Report
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>
              Showing only <strong>OUT</strong> and <strong>Partially In</strong> records
            </p>
          </div>

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <div
            className="mb-3 p-3 rounded"
            style={{ backgroundColor: "#fff5f5", border: "1px solid #fecaca" }}
          >
            <div className="row align-items-end g-3">

              {/* Category pills */}
              <div className="col-md-12">
                <div className="d-flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = filterCategory === cat.value;
                    const cnt    = countFor(cat.value);
                    return (
                      <label
                        key={cat.value}
                        className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                        style={{
                          cursor: "pointer",
                          fontSize: "0.83rem",
                          fontWeight: active ? 600 : 400,
                          border: `1.5px solid ${active ? "#b91c1c" : "#fca5a5"}`,
                          backgroundColor: active ? "#b91c1c" : "#fff",
                          color: active ? "#fff" : "#374151",
                          transition: "all 0.15s ease",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="radio"
                          name="pendingCategory"
                          value={cat.value}
                          checked={active}
                          onChange={() => setFilterCategory(cat.value)}
                          style={{ display: "none" }}
                        />
                        {cat.label}
                        {/* count badge inside pill */}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: active ? "rgba(255,255,255,0.25)" : "#fee2e2",
                            color: active ? "#fff" : "#b91c1c",
                            borderRadius: 10,
                            padding: "1px 7px",
                            minWidth: 20,
                            textAlign: "center",
                          }}
                        >
                          {cnt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Project dropdown */}
              <div className="col-md-4 text-start" style={{ zIndex: 10, position: "relative" }}>
                <label
                  className="form-label fw-semibold d-block mb-1"
                  style={{ color: "#374151", fontSize: "0.85rem" }}
                >
                  Project
                </label>
                <Select
                  options={projectOptions}
                  value={filterProject || projectOptions[0]}
                  onChange={(opt) => setFilterProject(opt?.value ? opt : null)}
                  placeholder="All Projects"
                  isClearable={false}
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              </div>

              {/* Export buttons */}
              <div className="col-md-5 d-flex align-items-end gap-2">
                <button
                  className="btn btn-sm"
                  onClick={downloadPDF}
                  disabled={filteredData.length === 0 || isLoading}
                  style={{
                    backgroundColor: "#dc2626", color: "#fff",
                    border: "none", fontWeight: 600, fontSize: "0.82rem",
                    borderRadius: "6px", padding: "6px 16px",
                    opacity: filteredData.length === 0 ? 0.5 : 1,
                  }}
                >
                  <FaFilePdf size={13} className="me-1" /> Download PDF
                </button>
                <button
                  className="btn btn-sm"
                  onClick={downloadExcel}
                  disabled={filteredData.length === 0 || isLoading}
                  style={{
                    backgroundColor: "#16a34a", color: "#fff",
                    border: "none", fontWeight: 600, fontSize: "0.82rem",
                    borderRadius: "6px", padding: "6px 16px",
                    opacity: filteredData.length === 0 ? 0.5 : 1,
                  }}
                >
                  <FaFileExcel size={13} className="me-1" /> Download Excel
                </button>
              </div>

              {/* Clear filters */}
              <div className="col-md-3 d-flex align-items-end justify-content-end">
                {isFiltered && (
                  <button
                    className="btn btn-sm"
                    onClick={clearFilters}
                    style={{
                      backgroundColor: "#fff",
                      border: "1.5px solid #b91c1c",
                      color: "#b91c1c",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      borderRadius: "6px",
                      padding: "5px 12px",
                    }}
                  >
                    <FaTimes size={11} className="me-1" /> Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Summary bar */}
            <div className="mt-2 d-flex align-items-center flex-wrap gap-2">
              <span style={{ fontSize: "0.78rem", color: "#b91c1c", fontWeight: 500 }}>
                {isLoading ? "Loading…" : (
                  <>
                    {filteredData.length} pending record{filteredData.length !== 1 ? "s" : ""}
                    {filterCategory !== "All" && <> · <strong>{filterCategory}</strong></>}
                    {filterProject            && <> · <strong>{filterProject.label}</strong></>}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* ── Preview Table ────────────────────────────────────────────── */}
          <div
            className="table-responsive border rounded"
            style={{ maxHeight: 500, overflowY: "auto" }}
          >
            <table
              className="table table-sm table-bordered table-hover mb-0 text-center align-middle"
              style={{ fontSize: "0.83rem" }}
            >
              <thead
                style={{
                  backgroundColor: "#b91c1c",
                  color: "#fff",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                <tr>
                  <th className="py-2">SN</th>
                  <th>Gatepass No</th>
                  <th>Gatepass Date</th>
                  <th>Category</th>
                  <th>Project</th>
                  <th>Destination</th>
                  <th>Out Date</th>
                  <th>Probable Return</th>
                  <th>Item Status</th>
                  <th>Document</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-4 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Loading pending records…
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-5 text-muted">
                      <FaHourglassHalf size={28} style={{ opacity: 0.25, display: "block", margin: "0 auto 8px" }} />
                      No pending gatepass records for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, i) => (
                    <tr
                      key={item.gatepassId ?? i}
                      style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fff5f5" }}
                    >
                      <td>{i + 1}</td>
                      <td className="fw-semibold" style={{ color: "#b91c1c" }}>
                        {item.gatepassNo ?? "-"}
                      </td>
                      <td>{fmtDate(item.gatepassDate)}</td>
                      <td>{item.category ?? "-"}</td>
                      <td className="text-center">{getProjectName(item.projectId)}</td>
                      <td className="text-start">{item.destination ?? "-"}</td>
                      <td>{fmtDate(item.outDate)}</td>
                      <td>{fmtDate(item.probableReturnDate)}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[item.itemStatus] ?? "bg-secondary"}`}>
                          {STATUS_LABEL[item.itemStatus] ?? item.itemStatus ?? "-"}
                        </span>
                      </td>

                      {/* ── Document ── */}
                      <td>
                        {item.filename ? (
                          <button
                            type="button"
                            className="btn btn-sm px-2 py-0"
                            style={{
                              fontSize: "11px",
                              border: isPdf(item.filename) ? "1px solid #1e3a8a" : "1px solid #16a34a",
                              color:  isPdf(item.filename) ? "#1e3a8a"           : "#16a34a",
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Back ────────────────────────────────────────────────────── */}
          <div className="text-center mt-4">
            <Link className="btn back" to="/dashboard">BACK</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GatepassPendingReport;