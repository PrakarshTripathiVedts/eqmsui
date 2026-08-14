import { useEffect, useState, useMemo } from "react";
import Navbar from "../navbar/navbar";
import Select from "react-select";
import { format } from "date-fns";
import { FaFilePdf, FaFileExcel, FaFilter, FaTimes, FaDownload } from "react-icons/fa";
import { getGatepassList } from "../../services/gatepass.service";
import { getProjectListService } from "../../services/masterservice";
import { Link } from "react-router-dom";

// ── Browser-side PDF + Excel (no server needed) ────────────────────────────
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";
import useGatepassAttachment from "./useGatepassAttachment";


const CATEGORY_OPTIONS = [
  { value: "All", label: "All Categories" },
  { value: "RMGP", label: "RMGP" },
  { value: "TSGP", label: "TSGP" },
  { value: "NRMGP", label: "NRMGP" },
  { value: "NRMGP-C", label: "NRMGP-C" },
];

const STATUS_OPTIONS = [
  { value: "All", label: "All" },
  { value: "O", label: "OUT" },
  { value: "I", label: "IN" },
  { value: "P", label: "Partially In" },
];
const STATUS_LABEL = { O: "OUT", I: "IN", P: "Partially In" };

const fmtDate = (val) => (val ? format(new Date(val), "dd-MM-yyyy") : "-");

const GatepassReport = () => {

  const [rawData, setRawData] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterProject, setFilterProject] = useState(null);   // { value, label }
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const { openAttachment, loading: attachmentLoading } = useGatepassAttachment();

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [gpData, prData] = await Promise.all([
          getGatepassList(),
          getProjectListService(),
        ]);
        setRawData(Array.isArray(gpData) ? gpData : []);
        setProjectList(Array.isArray(prData) ? prData : []);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return rawData.filter((item) => {

      const matchCategory =
        filterCategory === "All" ||
        item.category === filterCategory;

      const matchProject =
        !filterProject ||
        item.projectId === filterProject.value;

      const matchStatus =
        filterStatus === "All" ||
        item.itemStatus === filterStatus;

      return (
        matchCategory &&
        matchProject &&
        matchStatus
      );
    });
  }, [rawData, filterCategory, filterProject, filterStatus]);

  // ── Clear filters ──────────────────────────────────────────────────────────
  const clearFilters = () => {
    setFilterCategory("All");
    setFilterProject(null);
    setFilterStatus("All");
  };

  const isFiltered = (
    filterCategory !== "All" ||
    filterProject !== null ||
    filterStatus !== "All"
  );

  // ── Shared report meta ─────────────────────────────────────────────────────
  const reportMeta = {
    category:
      filterCategory !== "All"
        ? filterCategory
        : "All Categories",

    project:
      filterProject
        ? filterProject.label
        : "All Projects",

    status:
      filterStatus === "All"
        ? "All Status"
        : STATUS_LABEL[filterStatus],

    generatedAt: format(new Date(), "dd-MM-yyyy HH:mm"),

    totalRecords: filteredData.length,
  };
  const tableColumns = ["SN", "Gatepass No", "Gatepass Date", "Category", "Project", "Destination", "Out Date", "Probable Return", "Item Status"];

  const reportDisplayColumns = [
    "SN", "Gatepass No", "Gatepass Date", "Category",
    "Project", "Destination", "Out Date", "Probable Return", "Item Status", "Document"
  ];

  const tableRows = filteredData.map((item, idx) => {
    const project = projectList.find(p => p.projectId === item.projectId);

    return [
      idx + 1,
      item.gatepassNo ?? "-",
      fmtDate(item.gatepassDate),
      item.category ?? "-",
      project
        ? `${project.projectCode ?? "-"}${project.projectShortName ? ` (${project.projectShortName})` : ""}`
        : "-",
      item.destination ?? "-",
      fmtDate(item.outDate),
      fmtDate(item.probableReturnDate),
      STATUS_LABEL[item.itemStatus] ?? item.itemStatus ?? "-",
    ];
  });


  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();   // 297mm
    const margin = 14;
    const usableWidth = pageWidth - margin * 2;            // 269mm

    // ── Title ──────────────────────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Gatepass List", pageWidth / 2, 16, { align: "center" });

    // ── Sub-header ─────────────────────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    // Split into two lines if project name is long to avoid overflow
    const subLine1 = `Category: ${reportMeta.category}`;

    const subLine2 = `Project: ${reportMeta.project}   |   Status: ${reportMeta.status}`;
    doc.text(subLine1, pageWidth / 2, 23, { align: "center" });
    doc.text(subLine2, pageWidth / 2, 28, { align: "center", maxWidth: usableWidth });

    // ── Divider ────────────────────────────────────────────────────────────────
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.4);
    doc.line(margin, 32, pageWidth - margin, 32);

    // ── Meta row ───────────────────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    // ── Table ──────────────────────────────────────────────────────────────────
    // Total usable = 269mm; distribute proportionally across 9 columns
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 41,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        valign: "middle",
        overflow: "linebreak",
        lineColor: [200, 210, 230],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [240, 244, 255],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },  // #           → 10
        1: { halign: "center", cellWidth: 28 },  // Gatepass No → 28
        2: { halign: "center", cellWidth: 28 },  // Gatepass Date → 28
        3: { halign: "center", cellWidth: 22 },  // Category    → 22
        4: { halign: "left", cellWidth: 52 },  // Project     → 52 (widest)
        5: { halign: "left", cellWidth: 40 },  // Destination → 40
        6: { halign: "center", cellWidth: 26 },  // Out Date    → 26
        7: { halign: "center", cellWidth: 33 },  // Prob Return → 33
        8: { halign: "center", cellWidth: 20 },  // Item Status → 20
        // Total: 10+28+28+22+52+40+26+33+20 = 259 < 269 ✓
      },
      margin: { left: margin, right: margin },
      tableWidth: usableWidth,                    // ← explicit total width, no overflow
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerY = pageHeight - 8;

        doc.setFontSize(7);
        doc.setTextColor(150);

        // Left — branding
        doc.text("Generated by VEDTS-EQMS", margin, footerY);

        // Center — page number
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );

        // Right — generated on (formatted like: Wed Jun 24 12:02:05 IST 2025)
        const now = new Date();
        const generatedOn = `Generated On: ${now.toDateString()} ${now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        })}`;
        doc.text(generatedOn, pageWidth - margin, footerY, { align: "right" });
      },
    });

    // ── Open in new tab instead of downloading ────────────────────────────────
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, "_blank");

    // Clean up the blob URL after a delay (once the tab has loaded it)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const titleBlock = [
      ["Gatepass List"],
      [`Category: ${reportMeta.category}`],
      [`Project: ${reportMeta.project}     |     Status: ${reportMeta.status}`],
      [`Total Records: ${reportMeta.totalRecords}     |     Generated: ${reportMeta.generatedAt}`],
      [],
      tableColumns,
      ...tableRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(titleBlock);

    // ── Column widths ──────────────────────────────────────────────────────────
    ws["!cols"] = [
      { wch: 5 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
      { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
    ];

    // ── Merge header rows across all columns ───────────────────────────────────
    const colCount = tableColumns.length - 1;
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount } },  // Gatepass List title
      { s: { r: 1, c: 0 }, e: { r: 1, c: colCount } },  // Period
      { s: { r: 2, c: 0 }, e: { r: 2, c: colCount } },  // Category | Project
      { s: { r: 3, c: 0 }, e: { r: 3, c: colCount } },  // Total | Generated
    ];

    // ── Apply styles to header rows ────────────────────────────────────────────
    const headerCells = ["A1", "A2", "A3", "A4"];
    headerCells.forEach((cellRef, i) => {
      if (!ws[cellRef]) return;
      ws[cellRef].s = {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        font: {
          bold: true,
          sz: i === 0 ? 14 : 10,                          // title bigger than sub-rows
          color: i === 0 ? { rgb: "1E3A8A" } : { rgb: "374151" },
        },
      };
    });

    // ── Style the column header row (row 6, index 5) ──────────────────────────
    tableColumns.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 5, c: colIdx });
      if (!ws[cellRef]) return;
      ws[cellRef].s = {
        alignment: { horizontal: "center", vertical: "center" },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: "1E3A8A" } },             // dark blue background
      };
    });

    // ── Row heights: taller for title rows ────────────────────────────────────
    ws["!rows"] = [
      { hpt: 28 },   // row 1 — title
      { hpt: 18 },   // row 2 — period
      { hpt: 18 },   // row 3 — category/project
      { hpt: 18 },   // row 4 — total/generated
      { hpt: 6 },   // row 5 — blank
      { hpt: 20 },   // row 6 — column headers
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Gatepass List");
    XLSX.writeFile(wb, `Gatepass_List_${reportMeta.fromDate}_to_${reportMeta.toDate}.xlsx`);
  };

  // ── Project options for Select ─────────────────────────────────────────────
  const projectOptions = [
    { value: -1, label: "All Projects" },
    ...projectList.map(p => ({ value: p.projectId, label: p.projectCode + " - " + p.projectShortName })),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />
      <div className="card p-2">
        <div className="card-body">
          <h3 className="text-center mb-3">Gatepass Report</h3>

          {/* ══ FILTER BAR ══════════════════════════════════════════════════ */}
          <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d4f0" }}>

            {/* Category pills */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {CATEGORY_OPTIONS.map(cat => (
                <label
                  key={cat.value}
                  className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                  style={{
                    cursor: "pointer",
                    fontSize: "0.83rem",
                    fontWeight: filterCategory === cat.value ? 600 : 400,
                    border: `1.5px solid ${filterCategory === cat.value ? "#4f6ef7" : "#c7d4f0"}`,
                    backgroundColor: filterCategory === cat.value ? "#4f6ef7" : "#fff",
                    color: filterCategory === cat.value ? "#fff" : "#374151",
                    transition: "all 0.15s ease",
                    userSelect: "none",
                  }}
                >
                  <input type="radio" name="rptCategory" value={cat.value}
                    checked={filterCategory === cat.value}
                    onChange={() => setFilterCategory(cat.value)}
                    style={{ display: "none" }}
                  />
                  {cat.label}
                </label>
              ))}
            </div>

            {/* Project dropdown + Item Status + Download buttons, all on one row */}
            <div className="d-flex align-items-end flex-wrap gap-3">

              {/* Project dropdown */}
              <div style={{ minWidth: "300px", zIndex: 10, position: "relative" }}>
                <label className="form-label fw-semibold d-block mb-1" style={{ color: "#374151", fontSize: "0.85rem" }}>
                  Project
                </label>
                <Select
                  options={projectOptions}
                  value={filterProject || projectOptions[0]}
                  onChange={opt => setFilterProject(opt && opt.value !== -1 ? opt : null)}
                  placeholder="All Projects"
                  isClearable={false}
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>

              {/* Item Status */}
              {/* Item Status */}
              <div className="flex-grow-1" style={{ minWidth: "260px" }}>
                <label className="form-label fw-semibold d-block mb-1" style={{ color: "#374151", fontSize: "0.85rem" }}>
                  Item Status
                </label>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <div className="d-flex flex-wrap gap-3">
                    {STATUS_OPTIONS.map((status) => (
                      <div className="form-check form-check-inline" key={status.value}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="status"
                          id={`status-${status.value}`}
                          value={status.value}
                          checked={filterStatus === status.value}
                          onChange={() => setFilterStatus(status.value)}
                        />

                        <label
                          htmlFor={`status-${status.value}`}
                        >
                          {status.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download buttons */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm"
                  onClick={downloadPDF}
                  disabled={filteredData.length === 0 || isLoading}
                  style={{
                    backgroundColor: "#dc2626", color: "#fff",
                    border: "none", fontWeight: 600, fontSize: "0.82rem",
                    borderRadius: "6px", padding: "5px 14px",
                    opacity: filteredData.length === 0 ? 0.5 : 1,
                    whiteSpace: "nowrap",
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
                    borderRadius: "6px", padding: "5px 14px",
                    opacity: filteredData.length === 0 ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  <FaFileExcel size={13} className="me-1" /> Download Excel
                </button>
              </div>
            </div>

            {/* Summary bar */}
            <div className="mt-2 d-flex align-items-center flex-wrap gap-2">
              <span style={{ fontSize: "0.78rem", color: "#4f6ef7", fontWeight: 500 }}>
                {isLoading ? "Loading…" : `${filteredData.length} record(s) found`}
                {filterCategory !== "All" && <> · <strong>{filterCategory}</strong></>}
                {filterProject && <> · <strong>{filterProject.label}</strong></>}
                {filterStatus !== "All" && (
                  <> · <strong>{STATUS_LABEL[filterStatus]}</strong></>
                )}
              </span>
            </div>
          </div>

          {/* ══ PREVIEW TABLE ════════════════════════════════════════════════ */}
          <div className="table-responsive border rounded" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table table-sm table-bordered table-hover mb-0 text-center align-middle" style={{ fontSize: "1rem" }}>
              <thead style={{ backgroundColor: "#1e3a8a", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  {reportDisplayColumns.map(col => <th key={col} className="py-2">{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={reportDisplayColumns.length} className="py-4 text-muted">Loading data…</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={reportDisplayColumns.length} className="py-4 text-muted">No records found for the selected filters.</td></tr>
                ) : (
                  filteredData.map((item, i) => {
                    const row = tableRows[i]; // reuse existing tableRows for the first 9 cols
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f0f4ff" }}>
                        {row.map((cell, j) => (
                          <td key={j} className={j === 5 ? "text-start" : ""}>{cell}</td>
                        ))}

                        {/* Document column — view-only in table, not in PDF/Excel */}
                        <td>
                          {item.filename ? (
                            <button
                              type="button"
                              onClick={() => openAttachment(item.gatepassId, item.filename)}
                              disabled={attachmentLoading}
                              className="btn btn-outline-primary btn-sm px-2 py-0"
                              style={{ fontSize: "11px" }}
                              title={item.filename}
                            >
                              <FaDownload size={10} className="me-1" />
                              {attachmentLoading ? "Opening…" : item.filename.toLowerCase().endsWith(".pdf") ? "View" : "Download"}
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-3">
            <Link className="btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatepassReport;