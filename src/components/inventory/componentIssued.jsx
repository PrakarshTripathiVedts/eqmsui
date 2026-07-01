import { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as Yup from "yup";
import { format, parseISO } from "date-fns";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import { getEmployeeList, getEmployeeListService } from "../../services/masterservice";
import {
  getComponentIssuedListByComponent,
  saveComponentIssuedData,
  saveComponentReturnedData,
} from "../../services/componentservices";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    fontSize: 14,
    borderRadius: 6,
    borderColor: state.isFocused ? "#86b7fe" : "#ced4da",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13,110,253,.25)" : "none",
    "&:hover": { borderColor: "#86b7fe" },
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    fontSize: 14,
    background: isSelected ? "#0d6efd" : isFocused ? "#e8f0fe" : "#fff",
    color: isSelected ? "#fff" : "#212529",
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
};

/* ─────────────────────────────────────────────────────────────
   RETURN MODAL
───────────────────────────────────────────────────────────── */
const ReturnModal = ({ issuedRow, employeeOptions, onClose, onSaved }) => {
  const username = localStorage.getItem("userName") ?? "system";

  const initialValues = {
    componentIssuedId: issuedRow?.componentIssuedId ?? "",
    returnedDate:       new Date(),
    returnedBy:          "",
    remarks:             "",
  };

  const validationSchema = Yup.object().shape({
    returnedDate: Yup.date().nullable().required("Returned Date is required"),
    returnedBy:   Yup.number().typeError("Returned By is required").required("Returned By is required"),
    remarks:      Yup.string()
      .min(2, "Remarks must be at least 2 characters")
      .max(500, "Remarks must be at most 500 characters")
      .required("Remarks is required"),
  });

  const handleSubmit = async (values) => {
    try {
      const confirmed = await showConfirmation();
      if (!confirmed) return;

      const payload = {
        componentIssuedId: values.componentIssuedId,
        returnedDate:       format(new Date(values.returnedDate), "yyyy-MM-dd"),
        returnedBy:          values.returnedBy,
        remarks:             values.remarks,
        createdBy:           username,
      };

      const response = await saveComponentReturnedData(payload);

      if (response?.componentReturnedId > 0) {
        showAlert("Success", "Component returned successfully", "success");

        const returnedByEmp = employeeOptions.find(
          o => String(o.value) === String(values.returnedBy)
        )?.label ?? values.returnedBy;

        onSaved(issuedRow.componentIssuedId, {
          ...response,
          returnedByEmp,
        });
        onClose();
      } else {
        showAlert("Error", "Failed to save return. Please try again.", "error");
      }
    } catch (error) {
      console.error("Return submission error:", error);
      const msg = error?.response?.data?.message ?? "Something went wrong. Please try again later.";
      showAlert("Error", msg, "error");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1050,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12,
          width: "100%", maxWidth: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "linear-gradient(120deg, #355cdd 0%, #1e3fa8 100%)",
            borderRadius: "12px 12px 0 0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            <i className="ti ti-corner-up-left me-1" />
            Return Component
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "0.5px solid rgba(255,255,255,0.4)", borderRadius: 8,
              width: 28, height: 28, cursor: "pointer",
              background: "rgba(255,255,255,0.15)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Issue summary */}
        <div
          className="text-start"
          style={{
            margin: "1rem 1.25rem 0",
            padding: "10px 14px",
            background: "#FAFBFF",
            border: "1px solid #F1F4F9",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <div style={{ color: "#6B7280" }}>
            Issued Qty: <strong style={{ color: "#111827" }}>{issuedRow?.qty}</strong>{" "}
            on <strong style={{ color: "#111827" }}>
              {issuedRow?.issuedDate ? format(parseISO(issuedRow.issuedDate), "dd-MM-yyyy") : "—"}
            </strong>
          </div>
          <div style={{ color: "#6B7280", marginTop: 2 }}>
            Issued To: <strong style={{ color: "#111827" }}>{issuedRow?.issuedToEmp ?? issuedRow?.issuedTo}</strong>
          </div>
        </div>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, errors, touched }) => (
            <Form>
              <div className="text-start" style={{ padding: "1rem 1.25rem 0" }}>

                {/* Returned Date */}
                <div className="form-group mb-3">
                  <label className="d-block">
                    Returned Date: <span className="text-danger">*</span>
                  </label>
                  <DatePicker
                    selected={values.returnedDate}
                    onChange={date => setFieldValue("returnedDate", date)}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="DD-MM-YYYY"
                    className="form-control"
                    maxDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    autoComplete="off"
                  />
                  {touched.returnedDate && errors.returnedDate && (
                    <div className="text-danger" style={{ fontSize: 13, marginTop: 4 }}>
                      {errors.returnedDate}
                    </div>
                  )}
                </div>

                {/* Returned By */}
                <div className="form-group mb-3">
                  <label className="d-block">
                    Returned By: <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={employeeOptions}
                    value={employeeOptions.find(o => String(o.value) === String(values.returnedBy)) ?? null}
                    onChange={opt => setFieldValue("returnedBy", opt?.value ?? "")}
                    placeholder="Select Employee"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    classNamePrefix="react-select"
                  />
                  {touched.returnedBy && errors.returnedBy && (
                    <div className="text-danger" style={{ fontSize: 13, marginTop: 4 }}>
                      {errors.returnedBy}
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div className="form-group mb-3">
                  <label className="d-block">
                    Remarks: <span className="text-danger">*</span>
                  </label>
                  <Field
                    as="textarea"
                    name="remarks"
                    rows={3}
                    className="form-control"
                    placeholder="Enter remarks about the return"
                  />
                  <ErrorMessage name="remarks" component="div" className="text-danger" />
                </div>

              </div>

              <div
                align="center"
                style={{
                  padding: "0.85rem 1.25rem 1.25rem",
                  display: "flex", justifyContent: "center", gap: 10,
                }}
              >
                <button type="submit" className="btn submit">SUBMIT</button>
                <button type="button" className="btn back" onClick={onClose}>CANCEL</button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT ISSUED PAGE
───────────────────────────────────────────────────────────── */
const ComponentIssued = ({ component, setStatus, refreshList }) => {
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [issuedHistory,   setIssuedHistory]   = useState([]);
  const [availableQty,    setAvailableQty]    = useState(component?.latestBalQty ?? 0);
  const [loadingHistory,  setLoadingHistory]  = useState(false);

  // Holds returned info keyed by componentIssuedId, so we can show it
  // immediately after submit without reloading the whole page/list.
  const [returnedMap, setReturnedMap] = useState({});

  // Controls which row's Return modal is open (null = closed)
  const [returnModalRow, setReturnModalRow] = useState(null);

  const username = localStorage.getItem("userName") ?? "system";

  useEffect(() => {
    loadEmployees();
    loadHistory();
  }, []);

  const loadEmployees = async () => {
    try {
      const employees = await getEmployeeListService();
      const eArr = Array.isArray(employees) ? employees : employees?.data ?? [];
      setEmployeeOptions(
        eArr.map(e => ({
          value: e.empId ?? e.id,
          label: e.displayName ?? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
        }))
      );
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  const loadHistory = async () => {
    if (!component?.componentId) return;
    setLoadingHistory(true);
    try {
      const data = await getComponentIssuedListByComponent(component.componentId);
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      setIssuedHistory(arr);

      // If backend already nests return info on each issued row
      // (e.g. row.componentReturned), seed the local returnedMap with it.
      const seeded = {};
      arr.forEach(row => {
        if (row.componentReturned || row.returnedDate) {
          seeded[row.componentIssuedId] = {
            returnedDate:  row.componentReturned?.returnedDate  ?? row.returnedDate,
            returnedByEmp: row.componentReturned?.returnedByEmp ?? row.returnedByEmp,
            remarks:       row.componentReturned?.remarks       ?? row.returnedRemarks,
          };
        }
      });
      if (Object.keys(seeded).length > 0) {
        setReturnedMap(prev => ({ ...seeded, ...prev }));
      }
    } catch (err) {
      console.error("Failed to load issue history:", err);
      setIssuedHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const initialValues = {
    componentId: component?.componentId ?? "",
    issueType:   "N",
    issuedDate:  new Date(),
    issuedBy:    "",
    issuedTo:    "",
    qty:         "",
    purpose:     "",
    probableDateOfReturn: null,
  };

  const validationSchema = Yup.object().shape({
    issueType:  Yup.string().oneOf(["R", "N"]).required("Issue Type is required"),
    issuedDate: Yup.date().nullable().required("Issued Date is required"),
    issuedBy:   Yup.number().typeError("Issued By is required").required("Issued By is required"),
    issuedTo:   Yup.number().typeError("Issued To is required").required("Issued To is required"),
    qty: Yup.number()
      .typeError("Qty must be a number")
      .positive("Qty must be greater than 0")
      .max(availableQty, `Qty cannot exceed available balance (${availableQty} ${component?.unitCode ?? ""})`)
      .required("Qty is required"),
    purpose: Yup.string()
      .min(2, "Purpose must be at least 2 characters")
      .max(500, "Purpose must be at most 500 characters")
      .required("Purpose is required"),
    probableDateOfReturn: Yup.date()
      .nullable()
      .when("issueType", {
        is: "R",
        then: (schema) => schema.required("Probable Date of Return is required").min(new Date(), "Return date must be in the future"),
        otherwise: (schema) => schema.nullable(),
      }),
  });

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const confirmed = await showConfirmation();
      if (!confirmed) return;

      const payload = {
        componentId:  values.componentId,
        issueType:    values.issueType,
        issuedDate:   format(new Date(values.issuedDate), "yyyy-MM-dd"),
        issuedBy:     values.issuedBy,
        issuedTo:     values.issuedTo,
        qty:          parseFloat(values.qty),
        purpose:      values.purpose,
        probableDateOfReturn: values.issueType === "R" && values.probableDateOfReturn
          ? format(new Date(values.probableDateOfReturn), "yyyy-MM-dd")
          : null,
        createdBy:    username,
      };

      const response = await saveComponentIssuedData(payload);

      if (response?.componentIssuedId > 0) {
        showAlert("Success", "Quantity issued successfully", "success");
        const newAvailable = availableQty - parseFloat(values.qty);
        setAvailableQty(newAvailable);
        resetForm({
          values: {
            ...initialValues,
            issuedDate: new Date(),
          },
        });

        loadHistory();
        refreshList?.(); // refresh main component list's latestBalQty
      } else {
        showAlert("Error", "Failed to issue quantity. Please try again.", "error");
      }
    } catch (error) {
      console.error("Issue submission error:", error);
      const msg = error?.response?.data?.message ?? "Something went wrong. Please try again later.";
      showAlert("Error", msg, "error");
    }
  };

  /* ── Called by ReturnModal after a successful save ──
     Updates returnedMap WITHOUT reloading the page or the issued history list,
     so the row instantly flips to show return info. ── */
  const handleReturnSaved = (componentIssuedId, returnedData) => {
    setReturnedMap(prev => ({
      ...prev,
      [componentIssuedId]: {
        returnedDate:  returnedData.returnedDate,
        returnedByEmp: returnedData.returnedByEmp,
        remarks:       returnedData.remarks,
      },
    }));
  };

  return (
    <div>
      <Navbar />
      <div className="expert-form-container">
        <div className="form-card" style={{ marginLeft: "8%", marginRight: "8%" }}>

          <h4 className="form-title">Issue Component Quantity</h4>

          {/* ── Component Summary Header ── */}
          <div
            className="row mb-3 p-3"
            style={{
              background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)",
              borderRadius: 10,
              marginLeft: 0,
              marginRight: 0,
            }}
          >
            <div className="col-md-3 text-start">
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>
                Component
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                {component?.componentName ?? "—"}
              </div>
            </div>
            <div className="col-md-3 text-start">
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>
                Unit
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                {component?.unitCode ?? "—"}
              </div>
            </div>
            <div className="col-md-3 text-start">
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>
                Available Balance
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: availableQty > 0 ? "#10B981" : "#E24B4A" }}>
                {availableQty} <span style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>{component?.unitCode}</span>
              </div>
            </div>
            <div className="col-md-3 text-start">
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>
                Status
              </div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: availableQty > 0 ? "rgba(16,185,129,0.13)" : "rgba(226,75,74,0.13)",
                  color: availableQty > 0 ? "#065F46" : "#991B1B",
                  marginTop: 4,
                }}
              >
                {availableQty > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          {availableQty <= 0 ? (
            <div className="alert alert-danger text-start" style={{ borderRadius: 8 }}>
              <i className="ti ti-alert-circle me-1" />
              No available balance for this component. Cannot issue further quantity.
            </div>
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, setFieldValue, errors, touched }) => (
                <Form>
                  <div className="row text-start">

                    {/* ── Issued Date ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Issued Date: <span className="text-danger">*</span>
                        </label>
                        <DatePicker
                          selected={values.issuedDate}
                          onChange={date => setFieldValue("issuedDate", date)}
                          dateFormat="dd-MM-yyyy"
                          placeholderText="DD-MM-YYYY"
                          className="form-control mb-2"
                          maxDate={new Date()}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          autoComplete="off"
                        />
                        {touched.issuedDate && errors.issuedDate && (
                          <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                            {errors.issuedDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Issued By ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Issued By: <span className="text-danger">*</span>
                        </label>
                        <Select
                          options={employeeOptions}
                          value={employeeOptions.find(o => String(o.value) === String(values.issuedBy)) ?? null}
                          onChange={opt => setFieldValue("issuedBy", opt?.value ?? "")}
                          placeholder="Select Employee"
                          isClearable
                          styles={selectStyles}
                          menuPortalTarget={document.body}
                          classNamePrefix="react-select"
                        />
                        {touched.issuedBy && errors.issuedBy && (
                          <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                            {errors.issuedBy}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Issued To ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Issued To: <span className="text-danger">*</span>
                        </label>
                        <Select
                          options={employeeOptions}
                          value={employeeOptions.find(o => String(o.value) === String(values.issuedTo)) ?? null}
                          onChange={opt => setFieldValue("issuedTo", opt?.value ?? "")}
                          placeholder="Select Employee"
                          isClearable
                          styles={selectStyles}
                          menuPortalTarget={document.body}
                          classNamePrefix="react-select"
                        />
                        {touched.issuedTo && errors.issuedTo && (
                          <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                            {errors.issuedTo}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Qty ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Qty to Issue: <span className="text-danger">*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                          <Field
                            type="number"
                            name="qty"
                            className="form-control mb-2"
                            placeholder="Enter Qty"
                            min="0"
                            step="0.01"
                            max={availableQty}
                          />
                        </div>
                        <small className="text-muted d-block text-start" style={{ marginTop: -6, marginBottom: 6 }}>
                          Max available: {availableQty} {component?.unitCode}
                        </small>
                        <ErrorMessage name="qty" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                    {/* ── Issue Type (Radio: Returnable / Non-Returnable) ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Issue Type: <span className="text-danger">*</span>
                        </label>
                        <div style={{ display: "flex", gap: 20, marginTop: 6, marginBottom: 8 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                            <Field
                              type="radio"
                              name="issueType"
                              value="N"
                              checked={values.issueType === "N"}
                              onChange={() => {
                                setFieldValue("issueType", "N");
                                setFieldValue("probableDateOfReturn", null);
                              }}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            Non-Returnable
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                            <Field
                              type="radio"
                              name="issueType"
                              value="R"
                              checked={values.issueType === "R"}
                              onChange={() => {
                                setFieldValue("issueType", "R");
                              }}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            Returnable
                          </label>
                        </div>
                        {touched.issueType && errors.issueType && (
                          <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                            {errors.issueType}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Probable Date of Return (only when Returnable) ── */}
                    {values.issueType === "R" && (
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="text-start d-block">
                            Probable Date of Return: <span className="text-danger">*</span>
                          </label>
                          <DatePicker
                            selected={values.probableDateOfReturn}
                            onChange={date => setFieldValue("probableDateOfReturn", date)}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="DD-MM-YYYY"
                            className="form-control mb-2"
                            minDate={new Date()}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            autoComplete="off"
                          />
                          {touched.probableDateOfReturn && errors.probableDateOfReturn && (
                            <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                              {errors.probableDateOfReturn}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Purpose ── */}
                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Purpose: <span className="text-danger">*</span>
                        </label>
                        <Field
                          as="textarea"
                          name="purpose"
                          rows={3}
                          className="form-control mb-2"
                          placeholder="Enter Purpose of Issue"
                        />
                        <ErrorMessage name="purpose" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                  </div>

                  <div align="center">
                    <button type="submit" className="btn submit mt-3 me-2">ISSUE QTY</button>
                    <button type="button" className="btn back mt-3" onClick={() => setStatus('')}>BACK</button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {availableQty <= 0 && (
            <div align="center" className="mt-3">
              <button type="button" className="btn back" onClick={() => setStatus('')}>BACK</button>
            </div>
          )}

          {/* ── Issue History for this Component ── */}
          <div className="mt-4">
            <h6 className="text-start mb-2" style={{ fontWeight: 700, color: "#111827" }}>
              <i className="ti ti-history me-1" />
              Issue History — {component?.componentName}
            </h6>

            {loadingHistory ? (
              <div className="text-center py-3 text-muted">Loading...</div>
            ) : issuedHistory.length === 0 ? (
              <div
                className="text-center py-4"
                style={{ background: "#FAFBFF", borderRadius: 10, border: "1px dashed #D1D5DB" }}
              >
                <i className="ti ti-package-off" style={{ fontSize: 32, color: "#CBD5E1" }} />
                <p className="text-muted mt-2 mb-0" style={{ fontSize: 13 }}>
                  No quantity issued yet for this component
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-sm table-bordered" style={{ fontSize: 13 }}>
                  <thead style={{ background: "#F9FAFB" }}>
                    <tr>
                      <th>SN</th>
                      <th>Issued Date</th>
                      <th>Issued By</th>
                      <th>Issued To</th>
                      <th>Qty</th>
                      <th>Purpose</th>
                      <th>Issue Type</th>
                      <th>Probable Return Date</th>
                      <th>Return Info</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedHistory.map((row, idx) => {
                      const returned = returnedMap[row.componentIssuedId];
                      const isReturnable = row.issueType === "R";

                      return (
                        <tr key={row.componentIssuedId ?? idx}>
                          <td>{idx + 1}</td>
                          <td>{row.issuedDate ? format(parseISO(row.issuedDate), "dd-MM-yyyy") : "—"}</td>
                          <td className="text-start">{row.issuedByEmp ?? row.issuedBy ?? "—"}</td>
                          <td className="text-start">{row.issuedToEmp ?? row.issuedTo ?? "—"}</td>
                          <td>{row.qty} {component?.unitCode}</td>
                          <td className="text-start" style={{ maxWidth: 220, whiteSpace: "normal" }}>{row.purpose}</td>
                          <td>
                            <span
                              style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                                background: isReturnable ? "rgba(239,159,39,0.13)" : "rgba(107,114,128,0.13)",
                                color: isReturnable ? "#92400E" : "#374151",
                              }}
                            >
                              {isReturnable ? "Returnable" : "Non-Returnable"}
                            </span>
                          </td>
                          <td>
                            {isReturnable && row.probableDateOfReturn
                              ? format(parseISO(row.probableDateOfReturn), "dd-MM-yyyy")
                              : "—"}
                          </td>

                          {/* ── Return Info ── */}
                          <td className="text-start" style={{ minWidth: 180 }}>
                            {!isReturnable ? (
                              <span className="text-muted">—</span>
                            ) : returned ? (
                              <div style={{ fontSize: 12 }}>
                                <div>
                                  <strong>Returned:</strong>{" "}
                                  {returned.returnedDate
                                    ? format(
                                        typeof returned.returnedDate === "string"
                                          ? parseISO(returned.returnedDate)
                                          : returned.returnedDate,
                                        "dd-MM-yyyy"
                                      )
                                    : "—"}
                                </div>
                                <div><strong>By:</strong> {returned.returnedByEmp ?? "—"}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>
                                  {returned.remarks}
                                </div>
                              </div>
                            ) : (
                              <span
                                style={{
                                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                                  background: "rgba(226,75,74,0.10)", color: "#991B1B",
                                }}
                              >
                                Not Returned
                              </span>
                            )}
                          </td>

                          {/* ── Action ── */}
                          <td>
                            {isReturnable && !returned && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{
                                  background: "#355cdd", color: "#fff",
                                  border: "none", borderRadius: 6,
                                  padding: "4px 12px", fontSize: 12, fontWeight: 600,
                                }}
                                onClick={() => setReturnModalRow(row)}
                              >
                                Return
                              </button>
                            )}
                            {isReturnable && returned && (
                              <span
                                style={{
                                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                                  background: "rgba(16,185,129,0.13)", color: "#065F46",
                                }}
                              >
                                Returned
                              </span>
                            )}
                            {!isReturnable && <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Return Modal ── */}
      {returnModalRow && (
        <ReturnModal
          issuedRow={returnModalRow}
          employeeOptions={employeeOptions}
          onClose={() => setReturnModalRow(null)}
          onSaved={handleReturnSaved}
        />
      )}
    </div>
  );
};

export default ComponentIssued;