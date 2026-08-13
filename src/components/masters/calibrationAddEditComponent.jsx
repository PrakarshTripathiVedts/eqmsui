import { useEffect, useState } from "react";
import Navbar from "../navbar/navbar";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { format } from "date-fns";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import * as Yup from "yup";
import Select from "react-select";
import { getCalibrationId, saveCalibrationData, UpdateCalibration, getEmployeeListService, getVendorListService } from "../../services/masterservice";

const CalibrationAddEditComponent = ({
  mode,
  calibrationId,
  equipmentValue,
  equipmentName,
  setStatus,
  refreshList,
  latestAgency,
  latestDueDate,
  latestCalibrationDate,
  hasCalibration,
  equipment
}) => {
  const [employeeList, setEmployeeList] = useState([]);
  const [vendorList, setVendorList] = useState([]);

  const [formData, setFormData] = useState({
    equipmentId: equipmentValue || "",
    calibrationAgency: "LRDE",          // ← default to LRDE
    periodOfCalibration: "",
    calibrationDate: "",
    calibrationDueDate: "",
    calibrationType: "I",
    calibratedBy: "",
    remarks: "",
  });

  /* ── Load dropdowns ─────────────────────────────────────────────────── */
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const empData = await getEmployeeListService();
        setEmployeeList(Array.isArray(empData) ? empData : []);
      } catch { setEmployeeList([]); }

      try {
        const venData = await getVendorListService();
        setVendorList(Array.isArray(venData) ? venData : []);
      } catch { setVendorList([]); }
    };
    loadDropdowns();
  }, []);

  /* ── Pre-fill agency and default selected Date on REVISE ────────────── */
  useEffect(() => {
    if (mode === 'add' && hasCalibration) {
      setFormData(prev => ({ 
        ...prev, 
        calibrationAgency: latestAgency || prev.calibrationAgency,
        // Automatically default select the latestCalibrationDate on entry if available
        calibrationDate: latestCalibrationDate ? new Date(latestCalibrationDate) : prev.calibrationDate
      }));
    }
  }, [latestAgency, latestCalibrationDate, hasCalibration, mode]);

  /* ── Load for EDIT ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (mode === 'edit' && calibrationId) {
      getDataByCalibrationId(calibrationId);
    }
  }, [calibrationId, mode]);

  const getDataByCalibrationId = async (id) => {
    try {
      const data = await getCalibrationId(id);
      if (!data) return;
      setFormData({
        calibrationId: data.calibrationId ?? "",
        equipmentId: data.equipmentId ?? "",
        calibrationAgency: data.calibrationAgency ?? "",
        periodOfCalibration: data.periodOfCalibration ?? "",
        calibrationDate: data.calibrationDate ?? "",
        calibrationDueDate: data.calibrationDueDate ?? "",
        calibrationType: data.calibrationType ?? "I",
        calibratedBy: data.calibratedBy ?? "",
        remarks: data.remarks ?? "",
      });
    } catch (err) {
      console.error("Failed to fetch calibration data:", err);
    }
  };

  /* ── Date helpers ───────────────────────────────────────────────────── */
  const getGlobalMinDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() - 20, d.getMonth(), d.getDate());
  };

  const getMaxDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() + 50, d.getMonth(), d.getDate());
  };

  const getCalibrationDateMin = () => {
    if (mode === 'add' && hasCalibration && latestCalibrationDate) {
      const prevCal = new Date(latestCalibrationDate);
      prevCal.setDate(prevCal.getDate() + 1);  // must be strictly after
      return prevCal;
    }
    return getGlobalMinDate();
  };

  /* ── Compute due date from calibrationDate + periodOfCalibration ────── */
  const computeDueDate = (calibrationDate, months) => {
    if (!calibrationDate || !months || isNaN(months)) return null;
    const due = new Date(calibrationDate);
    due.setMonth(due.getMonth() + parseInt(months));
    return due;
  };

  /* ── Validation ─────────────────────────────────────────────────────── */
  const validationSchema = Yup.object().shape({
    calibrationAgency: Yup.string()
      .required("Calibration Agency is required"),

    periodOfCalibration: Yup.number()
      .typeError("Must be a number")
      .integer("Must be a whole number")
      .min(1, "Must be at least 1 month")
      .max(120, "Cannot exceed 120 months")
      .required("Period of Calibration is required"),

    calibrationDate: Yup.string()
      .required("Calibration Date is required")
      .test(
        "after-last-calibration-date",
        latestCalibrationDate
          ? `Must be after ${format(new Date(latestCalibrationDate), "dd-MM-yyyy")}`
          : "Invalid date",
        (value) => {
          if (!(mode === 'add' && hasCalibration && latestCalibrationDate)) return true;
          if (!value) return false;
          return new Date(value) > new Date(latestCalibrationDate);
        }
      ),

    calibrationDueDate: Yup.string()
      .required("Calibration Due Date is required")
      .test(
        "after-calibration-date",
        "Due Date must be after Calibration Date",
        function (value) {
          const { calibrationDate } = this.parent;
          if (!value || !calibrationDate) return true;
          return new Date(value) > new Date(calibrationDate);
        }
      ),

    calibrationType: Yup.string()
      .oneOf(["I", "O"], "Please select a calibration type")
      .required("Calibration type is required"),

    calibratedBy: Yup.string()
      .required("This field is required"),

    // remarks: Yup.string()
    //   .min(2, "Remarks must be at least 2 characters")
    //   .max(500, "Remarks must be at most 500 characters")
    //   .required("Remarks is required"),
  });

  /* ── Submit ─────────────────────────────────────────────────────────── */
  const handleSubmit = async (values) => {
    const dto = {
      ...values,
      calibrationDate: values.calibrationDate
        ? format(new Date(values.calibrationDate), "yyyy-MM-dd") : null,
      calibrationDueDate: values.calibrationDueDate
        ? format(new Date(values.calibrationDueDate), "yyyy-MM-dd") : null,
    };

    try {
      const confirmed = await showConfirmation();
      if (!confirmed) return;

      if (mode === "add") {
        const response = await saveCalibrationData(dto);
        if (response?.calibrationId > 0) {
          showAlert("Success",
            hasCalibration ? "Calibration revised successfully" : "Calibration added successfully",
            "success");
          refreshList?.();
          setStatus('');
        } else {
          showAlert("Error", "Failed to save calibration. Please try again.", "error");
        }
      } else {
        const response = await UpdateCalibration(calibrationId, dto);
        if (response?.calibrationId > 0) {
          showAlert("Success", "Calibration updated successfully", "success");
          refreshList?.();
          setStatus('');
        } else {
          showAlert("Error", "Failed to update calibration. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const isRevising = mode === 'add' && hasCalibration;

  const pageTitle =
    mode === 'edit' ? "Edit Calibration"
      : hasCalibration ? "Revise Calibration"
        : "Add Calibration";

  /* ── React Select options ───────────────────────────────────────────── */
  const empOptions = employeeList.map(emp => ({
    value: emp.empId,
    label: emp.displayName ? `${emp.displayName}` : emp.empName,
  }));

  const vendorOptions = vendorList.map(v => ({
    value: v.vendorId,
    label: v.vendorName,
  }));

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div>
      <Navbar />
      <div className="expert-form-container">
        <div className="form-card" style={{ marginLeft: "15%", marginRight: "15%" }}>

          <h4 className="form-title">{pageTitle}</h4>
          <div className="row mb-3 p-2 rounded" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d4f0" }}>
            <div className="col-md-3 text-start">
              <small className="text-muted d-block">Equipment Name</small>
              <strong>{equipment?.equipmentName || equipmentName || "—"}</strong>
            </div>
            <div className="col-md-3 text-center">
              <small className="text-muted d-block">Make</small>
              <strong>{equipment?.make || "—"}</strong>
            </div>
            <div className="col-md-3 text-center">
              <small className="text-muted d-block">Model</small>
              <strong>{equipment?.model || "—"}</strong>
            </div>
            <div className="col-md-3 text-center">
              <small className="text-muted d-block">Serial No</small>
              <strong>{equipment?.itemSerialNumber || "—"}</strong>
            </div>
          </div>
          {isRevising && latestCalibrationDate && (
            <p className="text-info text-center mb-3" style={{ fontSize: "0.9rem" }}>
              Previous Calibration Date:&nbsp;
              <strong>{format(new Date(latestCalibrationDate), "dd-MM-yyyy")}</strong>
              &nbsp;— New calibration date must be after this.
            </p>
          )}

          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ setFieldValue, values }) => (
              <Form>
                <div className="row">

                   {/* Calibration Type — Radio */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Calibration Type: <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex gap-4 mb-2">
                        <div className="form-check">
                          <input
                            type="radio"
                            id="typeInHouse"
                            name="calibrationType"
                            value="I"
                            checked={values.calibrationType === "I"}
                            onChange={() => {
                              setFieldValue("calibrationType", "I");
                              setFieldValue("calibrationAgency", "LRDE");
                              setFieldValue("calibratedBy", "");
                            }}
                            className="form-check-input"
                          />
                          <label htmlFor="typeInHouse" className="form-check-label">In House</label>
                        </div>
                        <div className="form-check">
                          <input
                            type="radio"
                            id="typeOutHouse"
                            name="calibrationType"
                            value="O"
                            checked={values.calibrationType === "O"}
                            onChange={() => {
                              setFieldValue("calibrationType", "O");
                              setFieldValue("calibrationAgency", "");
                              setFieldValue("calibratedBy", "");
                            }}
                            className="form-check-input"
                          />
                          <label htmlFor="typeOutHouse" className="form-check-label">Out House</label>
                        </div>
                      </div>
                      <ErrorMessage name="calibrationType" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* Calibration Agency */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="calibrationAgency" className="text-start d-block">
                        Calibration Agency: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="calibrationAgency"
                        className="form-control mb-2"
                        placeholder="Enter Calibration Agency"
                      />
                      <ErrorMessage name="calibrationAgency" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* Period of Calibration */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="periodOfCalibration" className="text-start d-block">
                        Period of Calibration (Months): <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="number"
                        name="periodOfCalibration"
                        className="form-control mb-2"
                        placeholder="e.g. 12"
                        min={1}
                        max={120}
                        onChange={(e) => {
                          const months = e.target.value;
                          setFieldValue("periodOfCalibration", months);
                          if (values.calibrationDate && months) {
                            const due = computeDueDate(values.calibrationDate, months);
                            setFieldValue("calibrationDueDate", due);
                          }
                        }}
                      />
                      <ErrorMessage name="periodOfCalibration" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* Calibration Date */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="calibrationDate" className="text-start d-block">
                        Last Calibration Date: <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        selected={values.calibrationDate ? new Date(values.calibrationDate) : null}
                        onChange={(date) => {
                          setFieldValue("calibrationDate", date);
                          if (date && values.periodOfCalibration) {
                            const due = computeDueDate(date, values.periodOfCalibration);
                            setFieldValue("calibrationDueDate", due);
                          } else if (date) {
                            const due = new Date(date);
                            due.setFullYear(due.getFullYear() + 1);
                            setFieldValue("calibrationDueDate", due);
                          } else {
                            setFieldValue("calibrationDueDate", "");
                          }
                        }}
                        className="form-control mb-2"
                        placeholderText="Select Calibration Date"
                        dateFormat="dd-MM-yyyy"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        minDate={getCalibrationDateMin()}
                        maxDate={getMaxDate()}
                        onKeyDown={(e) => e.preventDefault()}
                      />
                      <ErrorMessage name="calibrationDate" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* Calibration Due Date */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="calibrationDueDate" className="text-start d-block">
                        Calibration Due Date: <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        selected={values.calibrationDueDate ? new Date(values.calibrationDueDate) : null}
                        onChange={(date) => setFieldValue("calibrationDueDate", date)}
                        className="form-control mb-2"
                        placeholderText="Auto-filled from period"
                        dateFormat="dd-MM-yyyy"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        minDate={
                          values.calibrationDate
                            ? (() => {
                              const d = new Date(values.calibrationDate);
                              d.setDate(d.getDate() + 1);
                              return d;
                            })()
                            : getCalibrationDateMin()
                        }
                        maxDate={getMaxDate()}
                        onKeyDown={(e) => e.preventDefault()}
                      />
                      <ErrorMessage name="calibrationDueDate" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* Calibrated By */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Calibrated By: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="calibratedBy"
                        className="form-control mb-2"
                        placeholder="Enter name of person / agency who calibrated"
                      />
                      <ErrorMessage name="calibratedBy" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="remarks" className="text-start d-block">
                        Remarks: 
                      </label>
                      <Field
                        as="textarea"
                        name="remarks"
                        rows={3}
                        className="form-control mb-2"
                        placeholder="Enter Remarks"
                      />
                      <ErrorMessage name="remarks" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                </div>

                {/* Buttons */}
                <div align="center">
                  <button
                    type="submit"
                    className={`btn ${mode === "add" ? "submit" : "edit"} mt-3 me-2`}
                  >
                    {mode === "add" ? (hasCalibration ? "REVISE" : "SUBMIT") : "UPDATE"}
                  </button>
                  <button
                    type="button"
                    className="btn back mt-3"
                    onClick={() => setStatus('')}
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

export default CalibrationAddEditComponent;