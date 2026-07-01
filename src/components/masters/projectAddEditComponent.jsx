import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom";
import {
  getProjectByIdService,
  saveProjectService,
  updateProjectService,
  getEmployeeListService,
} from "../../services/masterservice";
import { showAlert, showConfirmation } from "../datatable/swalHelper";

const ProjectAddEditComponent = ({ mode, projectId, setStatus, refreshList }) => {
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [initialValues, setInitialValues] = useState({
    projectCode: "",
    projectName: "",
    projectShortName: "",
    sanctionDate: null,
    pdc: null,
    projectDirector: null, // { value, label }
  });
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");

  /* ── Load employees ── */
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const list = await getEmployeeListService();
        const arr = Array.isArray(list) ? list : list?.data ?? [];
        setEmployeeOptions(
          arr.map((emp) => ({
            value: emp.employeeId,
            label: emp.displayName ?? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim(),
          }))
        );
      } catch (e) {
        console.error("Failed to load employees", e);
      }
    };
    loadEmployees();
  }, []);

  /* ── Load project for edit ── */
  useEffect(() => {
    const loadProject = async () => {
      if (mode === "edit" && projectId) {
        try {
          const data = await getProjectByIdService(projectId);
          setInitialValues({
            projectCode: data.projectCode ?? "",
            projectName: data.projectName ?? "",
            projectShortName: data.projectShortName ?? "",
            sanctionDate: data.sanctionDate ? new Date(data.sanctionDate) : null,
            pdc: data.pdc ? new Date(data.pdc) : null,
            projectDirector: data.projectDirector
              ? {
                  value: data.projectDirector,
                  label: data.projectDirectorName ?? String(data.projectDirector),
                }
              : null,
          });
        } catch (e) {
          console.error("Failed to load project", e);
        }
      }
      setLoading(false);
    };
    loadProject();
  }, [mode, projectId]);

  /* ── Validation schema ── */
  const validationSchema = Yup.object({
    projectCode: Yup.string()
      .trim()
      .max(20, "Max 20 characters")
      .required("Project Code is required"),
    projectName: Yup.string()
      .trim()
      .max(255, "Max 255 characters")
      .required("Project Name is required"),
    projectShortName: Yup.string()
      .trim()
      .max(255, "Max 255 characters")
      .required("Project Short Name is required"),
    sanctionDate: Yup.date().nullable(),
    pdc: Yup.date()
      .nullable()
      .min(Yup.ref("sanctionDate"), "PDC must be after Sanction Date"),
    projectDirector: Yup.object().nullable(),
  });

  /* ── Format date for API (yyyy-MM-dd) ── */
  const formatDateForApi = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

 /* ── Submit ── */
  const handleSubmit = async (values, { setSubmitting }) => {
    // 1. Show confirmation dialog first based on the mode
    const confirmed = await showConfirmation(
      mode === "add" ? "Add Project?" : "Update Project?"
    );
    if (!confirmed) return;

    setSubmitError("");
    const payload = {
      projectCode: values.projectCode.trim(),
      projectName: values.projectName.trim(),
      projectShortName: values.projectShortName.trim(),
      sanctionDate: formatDateForApi(values.sanctionDate),
      pdc: formatDateForApi(values.pdc),
      projectDirector: values.projectDirector?.value ?? null,
    };

    try {
      if (mode === "add") {
        await saveProjectService(payload);
        showAlert("success", "Project added successfully.");
      } else {
        await updateProjectService(projectId, { ...payload, projectId });
        showAlert("success", "Project updated successfully.");
      }
      refreshList?.();
      setStatus("list");
    } catch (e) {
      console.error("Save failed", e);
      
      // Kept your error state update and added the generic alert notification
      const errorMessage = e?.response?.data?.message ?? "Failed to save. Please try again.";
      setSubmitError(errorMessage);
      showAlert("error", "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="card p-2">
        <div className="card-body">

          {/* ── Header ── */}
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <h5 className="mb-0 fw-semibold">
              {mode === "add" ? "Add New Project" : "Edit Project"}
            </h5>
            <span className="badge bg-secondary text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
              {mode === "add" ? "New Record" : `ID: ${projectId}`}
            </span>
          </div>

          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, setFieldTouched, isSubmitting, touched, errors }) => (
              <Form>
                <div className="row g-3 text-start">

                  {/* Project Code */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Project Code <span className="text-danger">*</span>
                    </label>
                    <Field
                      name="projectCode"
                      className={`form-control ${touched.projectCode && errors.projectCode ? "is-invalid" : ""}`}
                      placeholder="e.g. PROJ-001"
                      maxLength={20}
                    />
                    <ErrorMessage name="projectCode" component="div" className="invalid-feedback" />
                  </div>

                  {/* Project Short Name */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Project Short Name <span className="text-danger">*</span>
                    </label>
                    <Field
                      name="projectShortName"
                      className={`form-control ${touched.projectShortName && errors.projectShortName ? "is-invalid" : ""}`}
                      placeholder="e.g. EQMS"
                      maxLength={255}
                    />
                    <ErrorMessage name="projectShortName" component="div" className="invalid-feedback" />
                  </div>

                   {/* Sanction Date */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Sanction Date</label>
                    <div>
                      <DatePicker
                        selected={values.sanctionDate}
                        onChange={(date) => {
                          setFieldValue("sanctionDate", date);
                          /* clear PDC if it's now before new sanctionDate */
                          if (values.pdc && date && values.pdc < date) {
                            setFieldValue("pdc", null);
                          }
                        }}
                        onBlur={() => setFieldTouched("sanctionDate", true)}
                        dateFormat="dd-MM-yyyy"
                        className={`form-control ${touched.sanctionDate && errors.sanctionDate ? "is-invalid" : ""}`}
                        placeholderText="DD-MM-YYYY"
                        isClearable
                        showYearDropdown
                        scrollableYearDropdown
                      />
                      {touched.sanctionDate && errors.sanctionDate && (
                        <div className="text-danger" style={{ fontSize: "0.82em" }}>
                          {errors.sanctionDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDC */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">PDC (Probable Date of Completion)</label>
                    <div>
                      <DatePicker
                        selected={values.pdc}
                        onChange={(date) => setFieldValue("pdc", date)}
                        onBlur={() => setFieldTouched("pdc", true)}
                        dateFormat="dd-MM-yyyy"
                        className={`form-control ${touched.pdc && errors.pdc ? "is-invalid" : ""}`}
                        placeholderText="DD-MM-YYYY"
                        isClearable
                        showYearDropdown
                        scrollableYearDropdown
                        minDate={values.sanctionDate ?? undefined}
                      />
                      {touched.pdc && errors.pdc && (
                        <div className="text-danger" style={{ fontSize: "0.82em" }}>
                          {errors.pdc}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Name */}
                  <div className="col-8">
                    <label className="form-label fw-semibold">
                      Project Name <span className="text-danger">*</span>
                    </label>
                    <Field
                      name="projectName"
                      className={`form-control ${touched.projectName && errors.projectName ? "is-invalid" : ""}`}
                      placeholder="Enter full project name"
                      maxLength={255}
                    />
                    <ErrorMessage name="projectName" component="div" className="invalid-feedback" />
                  </div>

                 

                  {/* Project Director */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Project Director</label>
                    <Select
                      options={employeeOptions}
                      value={values.projectDirector}
                      onChange={(opt) => setFieldValue("projectDirector", opt)}
                      onBlur={() => setFieldTouched("projectDirector", true)}
                      placeholder="Select employee..."
                      isClearable
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      classNamePrefix="react-select"
                    />
                    {touched.projectDirector && errors.projectDirector && (
                      <div className="text-danger" style={{ fontSize: "0.82em" }}>
                        {errors.projectDirector}
                      </div>
                    )}
                  </div>

                </div>{/* /row */}

                {/* ── Action Buttons ── */}
                <div className="d-flex justify-content-center gap-2 mt-4 pt-3 border-top">
                  <button
                    type="submit"
                    className="btn add px-4"    
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Saving...
                      </>
                    ) : mode === "add" ? "SUBMIT" : "UPDATE"}
                  </button>
                  <button
                    type="button"
                    className="btn back px-4"
                    onClick={() => setStatus("list")}
                    disabled={isSubmitting}
                  >
                    BACK
                  </button>
                </div>

              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ProjectAddEditComponent;