import { useEffect, useState } from "react";
import Navbar from "../navbar/navbar";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { format } from "date-fns";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import * as Yup from "yup";
import { getProjectListService } from "../../services/masterservice";
import { checkGatepassNoExists, getGatepassById, saveGatepass, UpdateGatepassData } from "../../services/gatepass.service";
import Select from "react-select";
import useGatepassAttachment from "./useGatepassAttachment";

const CATEGORY_OPTIONS = [
  { value: "RMGP", label: "RMGP" },
  { value: "TSGP", label: "TSGP" },
  { value: "NRMGP", label: "NRMGP" },
  { value: "NRMGP-C", label: "NRMGP-C" },
];

const SHOW_RETURN_DATE_FOR = ["RMGP", "TSGP"];

const GatePassAddEdit = ({ mode, gatepassId, setStatus, refreshList }) => {

  const [projectList, setProjectList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFilename, setExistingFilename] = useState('');
  const [existingFilepath, setExistingFilepath] = useState('');
  const [gatepassNoError, setGatepassNoError] = useState("");
  const [isCheckingNo, setIsCheckingNo] = useState(false);
  const { openAttachment, loading: attachmentLoading } = useGatepassAttachment();
  const filSize = localStorage.getItem('filSize'); // Default to 25 MB if not set

  const [formData, setFormData] = useState({
    gatepassId: "",
    gatepassNo: "",
    gatepassDate: "",
    category: "RMGP",
    projectId: "",
    destination: "",
    probableReturnDate: "",
    outDate: "",
    itemStatus: "O",
    remarks: "",
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getProjectListService();
        setProjectList(Array.isArray(data) ? data : []);
      } catch {
        setProjectList([]);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && gatepassId) loadGatepassById(gatepassId);
  }, [gatepassId, mode]);

  const loadGatepassById = async (id) => {
    try {
      const data = await getGatepassById(id);
      if (!data) return;
      setExistingFilename(data.filename ?? '');
      setExistingFilepath(data.filepath ?? '');
      setFormData({
        gatepassId: data.gatepassId ?? "",
        gatepassNo: data.gatepassNo ?? "",
        gatepassDate: data.gatepassDate ?? "",
        category: data.category ?? "RMGP",
        projectId: data.projectId ?? "",
        destination: data.destination ?? "",
        probableReturnDate: data.probableReturnDate ?? "",
        outDate: data.outDate ?? "",
        itemStatus: data.itemStatus ?? "",
        remarks: data.remarks ?? "",
      });
    } catch (err) {
      console.error("Failed to fetch gatepass:", err);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() - 20, d.getMonth(), d.getDate());
  };
  const getMaxDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() + 50, d.getMonth(), d.getDate());
  };

  const validationSchema = Yup.object().shape({
    gatepassNo: Yup.string().required("Gatepass No is required"),
    gatepassDate: Yup.string().required("Gatepass Date is required"),
    category: Yup.string().required("Category is required"),
    projectId: Yup.string().required("Project is required"),
    destination: Yup.string().min(2, "Min 2 characters").required("Destination is required"),

    probableReturnDate: Yup.string()
      .nullable()
      .when("category", {
        is: (cat) => SHOW_RETURN_DATE_FOR.includes(cat),
        then: (schema) =>
          schema
            .required("Probable Return Date is required")
            .test("after-gatepass-date", "Must be on or after Gatepass Date", function (value) {
              const { gatepassDate } = this.parent;
              if (!value || !gatepassDate) return true;
              return new Date(value) >= new Date(gatepassDate);
            }),
        otherwise: (schema) => schema.notRequired(),
      }),

    outDate: Yup.string()
      .required("Out Date is required")
      .test("after-gatepass-date", "Must be on or after Gatepass Date", function (value) {
        const { gatepassDate } = this.parent;
        if (!value || !gatepassDate) return true;
        return new Date(value) >= new Date(gatepassDate);
      }),

    itemStatus: Yup.string().required("Item Status is required"),
    remarks: Yup.string().nullable(),
  });

  const handleSubmit = async (values) => {
    if (values.remarks && values.remarks.length > 1000) {
    showAlert("Warning", "Remarks cannot exceed 1000 characters.", "warning");
    return; // Stop submission
  }
    try {
      const confirmed = await showConfirmation();
      if (!confirmed) return;

      const formPayload = new FormData();
      const dto = {
        ...values,
        gatepassDate: values.gatepassDate ? format(new Date(values.gatepassDate), "yyyy-MM-dd") : null,
        probableReturnDate: values.probableReturnDate ? format(new Date(values.probableReturnDate), "yyyy-MM-dd") : null,
        outDate: values.outDate ? format(new Date(values.outDate), "yyyy-MM-dd") : null,
      };

      formPayload.append("data", new Blob([JSON.stringify(dto)], { type: "application/json" }));
      if (selectedFile) formPayload.append("file", selectedFile);

      if (mode === "add") {
        const exists = await checkGatepassNoExists(values.gatepassNo.trim());
        if (exists) {
          setGatepassNoError(`Gatepass No "${values.gatepassNo}" already exists.`);
          return;
        }
        const response = await saveGatepass(formPayload);
        if (response?.gatepassId > 0) {
          showAlert("Success", "Gatepass added successfully", "success");
          refreshList?.();
          setStatus('');
        } else {
          showAlert("Error", "Failed to save Gatepass. Please try again.", "error");
        }
      } else {
        const response = await UpdateGatepassData(gatepassId, formPayload);
        if (response?.gatepassId > 0) {
          showAlert("Success", "Gatepass updated successfully", "success");
          refreshList?.();
          setStatus('');
        } else {
          showAlert("Error", "Failed to update Gatepass. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const pageTitle = mode === "add" ? "Add Gate Pass" : "Edit Gate Pass";

  return (
    <div>
      <Navbar />
      <div className="expert-form-container">
        <div className="form-card" style={{ marginLeft: "10%", marginRight: "10%" }}>

          <h4 className="form-title">{pageTitle}</h4>

          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ setFieldValue, values }) => {
              const showProbableReturn = SHOW_RETURN_DATE_FOR.includes(values.category);

              return (
                <Form>

                  {/* ── Category Radio Buttons ── */}
                  <div className="row mb-3">
                    <div className="col-12">
                      <label className="text-start d-block mb-2 fw-semibold">
                        Category: <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex gap-3 flex-wrap">
                        {CATEGORY_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setFieldValue("category", opt.value);
                              if (!SHOW_RETURN_DATE_FOR.includes(opt.value)) {
                                setFieldValue("probableReturnDate", "");
                              }
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              padding: "8px 20px",
                              border: `1px solid ${values.category === opt.value ? "#0d6efd" : "#ced4da"}`,
                              borderRadius: "6px", cursor: "pointer",
                              background: values.category === opt.value ? "#e8f0fe" : "#fff",
                              color: values.category === opt.value ? "#0d47a1" : "#495057",
                              fontWeight: values.category === opt.value ? "500" : "400",
                              transition: "all 0.15s", userSelect: "none",
                            }}
                          >
                            <input type="radio" name="category" value={opt.value}
                              checked={values.category === opt.value} onChange={() => { }}
                              style={{ display: "none" }} />
                            <span style={{
                              width: "16px", height: "16px", borderRadius: "50%",
                              border: `2px solid ${values.category === opt.value ? "#0d6efd" : "#adb5bd"}`,
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              {values.category === opt.value && (
                                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0d6efd" }} />
                              )}
                            </span>
                            {opt.label}
                          </div>
                        ))}
                      </div>
                      <ErrorMessage name="category" component="div" className="text-danger text-start mt-1" />
                    </div>
                  </div>

                  <div className="row">

                    {/* ── Gatepass No ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Gatepass No: <span className="text-danger">*</span>
                        </label>

                        <div style={{ position: "relative" }}>
                          <Field name="gatepassNo">
                            {({ field, form }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="Enter Gatepass No"
                                className={`form-control mb-1 ${gatepassNoError ? "is-invalid" : ""}`}
                                onChange={(e) => {
                                  field.onChange(e); {/* ← Formik's own onChange — keeps value updating */ }
                                  if (gatepassNoError) setGatepassNoError(""); {/* ← clears duplicate error */ }
                                }}
                                onBlur={async (e) => {
                                  field.onBlur(e); {/* ← Formik's own onBlur — marks field touched */ }
                                  const val = e.target.value.trim();
                                  if (!val || mode === "edit") return;
                                  setIsCheckingNo(true);
                                  setGatepassNoError("");
                                  try {
                                    const exists = await checkGatepassNoExists(val);
                                    if (exists) {
                                      setGatepassNoError(`Gatepass No "${val}" already exists.`);
                                    }
                                  } catch {
                                    // silent — backend will catch it anyway
                                  } finally {
                                    setIsCheckingNo(false);
                                  }
                                }}
                              />
                            )}
                          </Field>
                        </div>

                        {/* Yup required error */}
                        <ErrorMessage name="gatepassNo" component="div" className="text-danger text-start" style={{ fontSize: "0.82rem" }} />

                        {/* duplicate error */}
                        {gatepassNoError && (
                          <div className="text-danger text-start" style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                            ⚠ {gatepassNoError}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* ── Gatepass Date ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">Gatepass Date: <span className="text-danger">*</span></label>
                        <DatePicker
                          selected={values.gatepassDate ? new Date(values.gatepassDate) : null}
                          onChange={(date) => setFieldValue("gatepassDate", date)}
                          className="form-control mb-2" placeholderText="Select Gatepass Date"
                          dateFormat="dd-MM-yyyy" showYearDropdown showMonthDropdown dropdownMode="select"
                          minDate={getMinDate()} maxDate={getMaxDate()} onKeyDown={(e) => e.preventDefault()}
                        />
                        <ErrorMessage name="gatepassDate" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                    {/* ── Project ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">
                          Project: <span className="text-danger">*</span>
                        </label>
                        <Select
                          options={projectList.map((p) => ({
                            value: p.projectId,
                            label: `${p.projectCode} - ${p.projectShortName}`,
                          }))}
                          value={(() => {
                            const matched = projectList.find((p) => p.projectId === values.projectId);
                            return matched
                              ? { value: matched.projectId, label: `${matched.projectCode} - ${matched.projectShortName}` }
                              : null;
                          })()}
                          onChange={(selected) => setFieldValue("projectId", selected ? selected.value : "")}
                          isClearable
                          placeholder="-- Select Project --"
                          className="text-start mb-2"
                        />
                        <ErrorMessage name="projectId" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                    {/* ── Destination ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">Destination: <span className="text-danger">*</span></label>
                        <Field type="text" name="destination" className="form-control mb-2" placeholder="Enter Destination" />
                        <ErrorMessage name="destination" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                    {/* ── Out Date ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">Out Date: <span className="text-danger">*</span></label>
                        <DatePicker
                          selected={values.outDate ? new Date(values.outDate) : null}
                          onChange={(date) => setFieldValue("outDate", date)}
                          className="form-control mb-2" placeholderText="Select Out Date"
                          dateFormat="dd-MM-yyyy" showYearDropdown showMonthDropdown dropdownMode="select"
                          minDate={getMinDate()} maxDate={getMaxDate()} onKeyDown={(e) => e.preventDefault()}
                        />
                        <ErrorMessage name="outDate" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                    {/* ── Probable Return Date (RMGP & TSGP only) ── */}
                    {showProbableReturn && (
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="text-start d-block">Probable Return Date: <span className="text-danger">*</span></label>
                          <DatePicker
                            selected={values.probableReturnDate ? new Date(values.probableReturnDate) : null}
                            onChange={(date) => setFieldValue("probableReturnDate", date)}
                            className="form-control mb-2" placeholderText="Select Probable Return Date"
                            dateFormat="dd-MM-yyyy" showYearDropdown showMonthDropdown dropdownMode="select"
                            minDate={values.outDate ? new Date(values.outDate) : getMinDate()}
                            maxDate={getMaxDate()} onKeyDown={(e) => e.preventDefault()}
                          />
                          <ErrorMessage name="probableReturnDate" component="div" className="text-danger text-start" />
                        </div>
                      </div>
                    )}

                    {/* ── Upload File ── */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="text-start d-block">Upload File:</label>

                        {/* Existing attachment — shown in edit mode when no new file chosen */}
                        {mode === "edit" && existingFilename && !selectedFile && (
                          <div className="mb-2 d-flex align-items-center gap-2">
                            <span className="text-muted" style={{ fontSize: "13px" }}>Current:</span>
                            <button
                              type="button"
                              onClick={() => openAttachment(gatepassId, existingFilename)}
                              disabled={attachmentLoading}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: attachmentLoading ? "wait" : "pointer",
                                color: "#0d6efd",
                                fontSize: "13px",
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "inline-block",
                                textAlign: "left",
                              }}
                              title={existingFilename}
                            >
                              {attachmentLoading ? "Opening…" : `📎 ${existingFilename}`}
                            </button>
                          </div>
                        )}

                        {/* New file chosen — show name + remove option */}
                        {selectedFile && (
                          <div className="mb-1 d-flex align-items-center gap-2">
                            <span style={{ fontSize: "13px", color: "#198754" }}>
                              ✅ New file: <strong>{selectedFile.name}</strong>
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0"
                              style={{ fontSize: "12px" }}
                              onClick={() => setSelectedFile(null)}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}

                        <input
                          type="file"
                          className="form-control mb-2"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Check if file size exceeds the allowed limit
                              if (file.size > filSize) {
                                const maxMb = (filSize / (1024 * 1024)).toFixed(0);
                                showAlert("Error", `File size cannot exceed ${maxMb} MB.`, "error");
                                e.target.value = ""; // Reset file input UI
                                setSelectedFile(null); // Clear selected file state
                                return;
                              }
                              setSelectedFile(file);
                            } else {
                              setSelectedFile(null);
                            }
                          }}
                        />

                        {mode === "edit" && existingFilename && (
                          <small className="text-muted text-start d-block">
                            Uploading a new file will replace the existing one.
                          </small>
                        )}
                      </div>
                    </div>

                    {/* ── Remarks ── */}
                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="text-start d-block">Remarks:</label>
                        <Field
                          as="textarea"
                          name="remarks"
                          className="form-control mb-2"
                          placeholder="Enter remarks (optional)"
                          rows={3}
                          style={{ resize: "vertical" }}
                          maxLength={1000} // Keeps user from typing past 1000
                        />
                        {/* Add this line below to show the Yup validation message */}
                        <ErrorMessage name="remarks" component="div" className="text-danger text-start" />
                      </div>
                    </div>

                  </div>

                  {/* ── Buttons ── */}
                  <div align="center">
                    <button
                      type="submit"
                      className={`btn ${mode === "add" ? "submit" : "edit"} mt-3 me-2`}
                      disabled={!!gatepassNoError || isCheckingNo}  // ← block if duplicate
                    >
                      {mode === "add" ? "SUBMIT" : "UPDATE"}
                    </button>
                    <button type="button" className="btn back mt-3" onClick={() => setStatus('')}>
                      BACK
                    </button>
                  </div>

                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default GatePassAddEdit;