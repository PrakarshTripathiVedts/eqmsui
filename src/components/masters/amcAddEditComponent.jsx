import { useEffect, useState } from "react";
import Navbar from "../navbar/navbar";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { format } from "date-fns";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import * as Yup from "yup";
import { getAmcById, saveAmcData, UpdateAmc } from "../../services/masterservice";

const AmcAddEditComponent = ({
  mode,
  amcId,
  equipmentValue,
  equipmentName,
  setStatus,
  refreshList,
  latestDueDate,
  latestAmcStartDate,
  hasAmc,
  equipment,
  amcHistory = [],   // ← ADD THIS
}) => {

  const [formData, setFormData] = useState({
    equipmentId:  equipmentValue || "",
    amcAgency:    "",
    amcStartDate: "",
    amcEndDate:   "",
  });

  /* ── Pre-fill startDate when REVISING ── */
  useEffect(() => {
    if (mode === 'add' && hasAmc && latestDueDate) {
      const nextDay = new Date(latestDueDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setFormData(prev => ({ ...prev, amcStartDate: nextDay }));
    }
  }, [latestDueDate, hasAmc, mode]);

  /* ── Load for EDIT ── */
  useEffect(() => {
    if (mode === 'edit' && amcId) {
      getDataByAmcId(amcId);
    }
  }, [amcId, mode]);

  const getDataByAmcId = async (id) => {
    try {
      const data = await getAmcById(id);
      if (!data) return;
      setFormData({
        amcId:        data.amcId        ?? "",
        equipmentId:  data.equipmentId  ?? "",
        amcAgency:    data.amcAgency    ?? "",
        amcStartDate: data.amcStartDate ?? "",
        amcEndDate:   data.amcEndDate   ?? "",
      });
    } catch (err) {
      console.error("Failed to fetch AMC data:", err);
    }
  };

  /* ── Date helpers ── */
  const getGlobalMinDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() - 20, d.getMonth(), d.getDate());
  };

  const getMaxDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() + 50, d.getMonth(), d.getDate());
  };

  const getAmcStartMin = () => {
    if (mode === 'add' && hasAmc && latestDueDate) {
      const d = new Date(latestDueDate);
      d.setDate(d.getDate() + 1);
      return d;
    }
    return getGlobalMinDate();
  };

  /* ── Validation ── */
  const validationSchema = Yup.object().shape({

    amcAgency: Yup.string()
      .required("AMC Agency is required"),

    amcStartDate: Yup.string()
      .required("AMC Start Date is required")
      .test(
        "after-last-end-date",
        latestDueDate
          ? `Start Date must be after previous AMC End Date (${format(new Date(latestDueDate), "dd-MM-yyyy")})`
          : "Invalid date",
        (value) => {
          if (!(mode === 'add' && hasAmc && latestDueDate)) return true;
          if (!value) return false;
          return new Date(value) > new Date(latestDueDate);
        }
      ),

    amcEndDate: Yup.string()
      .required("AMC End Date is required")
      .test(
        "after-start-date",
        "AMC End Date must be after AMC Start Date",
        function (value) {
          const { amcStartDate } = this.parent;
          if (!value || !amcStartDate) return true;
          return new Date(value) > new Date(amcStartDate);
        }
      ),
  });

  /* ── Submit ── */
  const handleSubmit = async (values) => {
    const dto = {
      ...values,
      amcStartDate: values.amcStartDate ? format(new Date(values.amcStartDate), "yyyy-MM-dd") : null,
      amcEndDate:   values.amcEndDate   ? format(new Date(values.amcEndDate),   "yyyy-MM-dd") : null,
    };

    try {
      const confirmed = await showConfirmation();
      if (!confirmed) return;

      if (mode === "add") {
        const response = await saveAmcData(dto);
        if (response?.amcId > 0) {
          showAlert("Success", hasAmc ? "AMC revised successfully" : "AMC added successfully", "success");
          refreshList?.();
          setStatus('');
        } else {
          showAlert("Error", "Failed to save AMC. Please try again.", "error");
        }
      } else {
        const response = await UpdateAmc(amcId, dto);
        if (response?.amcId > 0) {
          showAlert("Success", "AMC updated successfully", "success");
          refreshList?.();
          setStatus('');
        } else {
          showAlert("Error", "Failed to update AMC. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const isRevising = mode === 'add' && hasAmc;

  const pageTitle =
    mode === 'edit' ? "Edit AMC" :
    isRevising      ? "Revise AMC" : "Add AMC";

  /* ── Render ── */
  return (
    <div>
      <Navbar />
      <div className="expert-form-container">
        <div className="form-card" style={{ marginLeft: "15%", marginRight: "15%" }}>

          <h4 className="form-title">{pageTitle}</h4>

          {/* Equipment Details Banner */}
          <div className="row mb-3 p-2 rounded" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d4f0" }}>
            <div className="col-md-3 text-center">
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

          {/* Revise context banner
          {isRevising && latestDueDate && (
            <div className="alert alert-info py-2 text-center mb-3" style={{ fontSize: "0.9rem" }}>
              Previous AMC period:&nbsp;
              {latestAmcStartDate && (
                <><strong>{format(new Date(latestAmcStartDate), "dd-MM-yyyy")}</strong>&nbsp;→&nbsp;</>
              )}
              <strong>{format(new Date(latestDueDate), "dd-MM-yyyy")}</strong>
              &nbsp;— New AMC Start Date must be after&nbsp;
              <strong>{format(new Date(latestDueDate), "dd-MM-yyyy")}</strong>.
            </div>
          )} */}
{isRevising && amcHistory.length > 0 && (
  <div className="mb-4">
    <h6 className="text-start mb-2" style={{ color: "#4a5568", fontWeight: 600 }}>
      AMC History
    </h6>
    <div style={{ 
      maxHeight: "200px",         // ← fixed height
      overflowY: "auto", 
      border: "1px solid #dee2e6", 
      borderRadius: "6px" 
    }}>
      <table className="table table-sm table-bordered table-hover mb-0" style={{ fontSize: "0.85rem" }}>
        <thead style={{ backgroundColor: "#e8edf7", position: "sticky", top: 0, zIndex: 1 }}>
          <tr>
            <th className="text-center">SN</th>
            <th className="text-center">Agency</th>
            <th className="text-center">AMC Start Date</th>
            <th className="text-center">AMC End Date</th>
            <th className="text-center">Revision</th>
          </tr>
        </thead>
        <tbody>
          {amcHistory.map((item, idx) => (
            <tr key={idx}>
              <td className="text-center">{item.sn}</td>
              <td className="text-start">{item.agency}</td>
              <td className="text-center">{item.amcDate}</td>
              <td className="text-center">{item.amcEndDate}</td>
              <td className="text-center">{item.revision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
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

                  {/* AMC Agency */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        AMC Agency: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="amcAgency"
                        className="form-control mb-2"
                        placeholder="Enter AMC Agency"
                      />
                      <ErrorMessage name="amcAgency" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* AMC Start Date */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        AMC Start Date: <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        selected={values.amcStartDate ? new Date(values.amcStartDate) : null}
                        onChange={(date) => {
                          setFieldValue("amcStartDate", date);
                          if (date) {
                            const end = new Date(date);
                            end.setFullYear(end.getFullYear() + 1);
                            setFieldValue("amcEndDate", end);
                          } else {
                            setFieldValue("amcEndDate", "");
                          }
                        }}
                        className="form-control mb-2"
                        placeholderText={
                          isRevising && latestDueDate
                            ? `Must be after ${format(new Date(latestDueDate), "dd-MM-yyyy")}`
                            : "Select AMC Start Date"
                        }
                        dateFormat="dd-MM-yyyy"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        minDate={getAmcStartMin()}
                        maxDate={getMaxDate()}
                        onKeyDown={(e) => e.preventDefault()}
                      />
                      <ErrorMessage name="amcStartDate" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* AMC End Date */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        AMC End Date: <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        selected={values.amcEndDate ? new Date(values.amcEndDate) : null}
                        onChange={(date) => setFieldValue("amcEndDate", date)}
                        className="form-control mb-2"
                        placeholderText="Auto-filled (+1 year from start)"
                        dateFormat="dd-MM-yyyy"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        minDate={
                          values.amcStartDate
                            ? (() => {
                                const d = new Date(values.amcStartDate);
                                d.setDate(d.getDate() + 1);
                                return d;
                              })()
                            : getAmcStartMin()
                        }
                        maxDate={getMaxDate()}
                        onKeyDown={(e) => e.preventDefault()}
                      />
                      <ErrorMessage name="amcEndDate" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                </div>

                {/* Buttons */}
                <div align="center">
                  <button
                    type="submit"
                    className={`btn ${mode === "add" ? "submit" : "edit"} mt-3 me-2`}
                  >
                    {mode === "add" ? (hasAmc ? "REVISE" : "SUBMIT") : "UPDATE"}
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

export default AmcAddEditComponent;