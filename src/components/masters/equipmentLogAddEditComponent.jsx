import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../datatable/master.css";
import {
  saveEquipmentLogData,
  getEquipmentLogById,
  getEquipmentListService,
  getEmployeeListService,
  getEquipmentLogMasterListById,
  UpdateEquipmentLog,
} from "../../services/masterservice";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import Navbar from "../navbar/navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { FaClock, FaUserClock, FaRegClock } from "react-icons/fa";
import { format } from "date-fns";

const EquipmentLogAddEditComponent = ({
  mode,
  equpmentLogId,
  equipmentValue,
  equipmentName,
  setStatus,
  refreshList,
}) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [existingLogs, setExistingLogs] = useState([]);
  const [logsLoaded, setLogsLoaded] = useState(false); // guards against submitting before overlap data arrives

  const [formData, setFormData] = useState({
    id: "",
    startTime: "",
    endTime: "",
    totalHours: "",
    equipmentId: equipmentValue || "",
    description: "",
    usedBy: "",
  });

  const getDataById = async (id) => {
    try {
      const data = await getEquipmentLogById(id);
      if (!data) return;

      setFormData((prev) => ({
        ...prev,
        id: data?.id ?? "",
        startTime: data.startTime ? new Date(data.startTime) : "",
        endTime: data.endTime ? new Date(data.endTime) : "",
        totalHours: formatDuration(data?.totalHours) ?? "",
        equipmentId: data?.equipmentId ?? equipmentValue ?? "",
        description: data?.description ?? "",
        usedBy: data?.usedBy ?? "",
      }));
    } catch (err) {
      console.error("Failed to fetch equipment log data:", err);
    }
  };

  useEffect(() => {
    if (equpmentLogId) {
      getDataById(equpmentLogId);
    }
    getEquipmentMasterList();
  }, [equpmentLogId]);

  const getEquipmentMasterList = async () => {
    try {
      const data = await getEquipmentListService();
      setEquipmentList(Array.isArray(data) ? data : []);

      const employeeData = await getEmployeeListService();
      setEmployeeList(Array.isArray(employeeData) ? employeeData : []);
    } catch (err) {
      console.error("Failed to fetch equipment master list:", err);
      setEquipmentList([]);
      setEmployeeList([]);
    }
  };

  /* ================= FETCH EXISTING LOGS FOR OVERLAP CHECK ================= */
  useEffect(() => {
    if (formData.equipmentId) {
      fetchExistingLogsForOverlapCheck(formData.equipmentId);
    }
  }, [formData.equipmentId]);

  const fetchExistingLogsForOverlapCheck = async (equipmentId) => {
    setLogsLoaded(false);
    try {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 5);
      const to = new Date();
      to.setFullYear(to.getFullYear() + 5);

      // IMPORTANT: match the exact date format the list screen already uses
      // successfully against this same endpoint — a plain local "yyyy-MM-dd'T'HH:mm:ss"
      // string, NOT toISOString() (which appends "Z"/UTC and the backend may not
      // parse correctly as LocalDateTime, silently returning no data).
      const fromStr = format(from, "yyyy-MM-dd'T'HH:mm:ss");
      const toStr = format(to, "yyyy-MM-dd'T'HH:mm:ss");

      const data = await getEquipmentLogMasterListById(equipmentId, fromStr, toStr);
      setExistingLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch existing logs for overlap check:", err);
      setExistingLogs([]);
    } finally {
      setLogsLoaded(true);
    }
  };

  const isOverlapping = (start, end, excludeId) => {
    if (!start || !end) return false;

    const newStart = new Date(start).getTime();
    const newEnd = new Date(end).getTime();

    return existingLogs.some((log) => {
      // cast both sides to string so number/string id mismatches don't break exclusion
      if (excludeId != null && String(log.id) === String(excludeId)) return false;
      if (!log.startTime || !log.endTime) return false;

      const existingStart = new Date(log.startTime).getTime();
      const existingEnd = new Date(log.endTime).getTime();

      // true overlap test: covers same-period, nested-within, and partial overlaps
      return newStart < existingEnd && existingStart < newEnd;
    });
  };

  function AutoCalculateTotalHours({ startTime, endTime, setFieldValue }) {
    useEffect(() => {
      if (startTime && endTime) {
        const diff = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
        if (!isNaN(diff)) {
          setFieldValue("totalHours", formatDuration(diff));
        }
      }
    }, [startTime, endTime, setFieldValue]);

    return null;
  }

  const getMinDate = () => {
    const currentDate = new Date();
    const minYear = currentDate.getFullYear() - 20;
    return new Date(minYear, currentDate.getMonth(), currentDate.getDate());
  };

  const getMaxDate = () => {
    const currentDate = new Date();
    const maxYear = currentDate.getFullYear() + 50;
    return new Date(maxYear, currentDate.getMonth(), currentDate.getDate());
  };

  const requiredField = Yup.string().required("This field is required");

  const validationSchema = Yup.object().shape({
    startTime: requiredField,

    endTime: Yup.mixed()
      .required("This field is required")
      .test(
        "end-after-start",
        "End time cannot be earlier than or same as start time",
        function (value) {
          const { startTime } = this.parent;
          if (!startTime || !value) return true;
          return new Date(value) > new Date(startTime);
        }
      )
      .test(
        "no-overlap",
        "This equipment already has a usage log during this date & time range",
        function (value) {
          const { startTime } = this.parent;
          if (!startTime || !value) return true;
          return !isOverlapping(startTime, value, mode === "edit" ? formData.id : null);
        }
      ),

    description: requiredField,
    totalHours: requiredField,
    usedBy: requiredField,
  });

  const convertToDecimalHours = (time) => {
    if (!time) return 0;
    const [hh, mm] = time.split(":").map(Number);
    return (hh + mm / 60).toFixed(2);
  };

  const handleSubmit = async (values) => {
    // Block submitting until the overlap-check data has actually arrived at least once —
    // prevents a fast double-click / very quick submit from slipping through with an
    // empty existingLogs array.
    if (!logsLoaded) {
      showAlert("Please wait", "Still checking existing usage logs for this equipment. Try again in a moment.", "info");
      return;
    }

    if (new Date(values.endTime) <= new Date(values.startTime)) {
      showAlert("Error", "End time cannot be earlier than or same as start time.", "error");
      return;
    }

    if (isOverlapping(values.startTime, values.endTime, mode === "edit" ? formData.id : null)) {
      showAlert("Error", "This equipment already has a usage log during this date & time range.", "error");
      return;
    }

    const payload = {
      ...values,
      startTime: values.startTime ? values.startTime.toISOString() : "",
      endTime: values.endTime ? values.endTime.toISOString() : "",
      totalHours: convertToDecimalHours(values.totalHours),
    };

    try {
      if (mode === "add") {
        const confirmed = await showConfirmation();
        if (confirmed) {
          const response = await saveEquipmentLogData(payload);
          if (response.id != null && response.id > 0) {
            showAlert("Success", "Equipment Log added successfully", "success");
            refreshList?.();
            setStatus?.("list");
          } else {
            showAlert("Error", "Failed to add equipment log. Please try again.", "error");
          }
        }
      } else {
        const confirmed = await showConfirmation();
        if (confirmed) {
          const response = await UpdateEquipmentLog(equpmentLogId, payload);
          if (response.id != null && response.id > 0) {
            showAlert("Success", "Equipment log updated successfully", "success");
            refreshList?.();
            setStatus?.("list");
          } else {
            showAlert("Error", "Failed to update equipment log. Please try again.", "error");
          }
        }
      }
    } catch (error) {
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const redirectEquipmentLogList = () => {
    setStatus?.("list");
  };

  const empOptions = employeeList.map((emp) => ({
    value: emp.empId,
    label: emp.displayName ?? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim(),
  }));

  const formatDuration = (hours) => {
    if (hours == null || hours === "") return "";
    const totalMinutes = Math.round(hours * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const mm = String(totalMinutes % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return (
    <div>
      <Navbar />
      <div className="expert-form-container">
        <div className="form-card" style={{ maxWidth: "820px", margin: "24px auto" }}>
          <h4 className="form-title d-flex align-items-center gap-2">
            <FaUserClock />
            {mode === "add" ? "Add Equipment Usage Log" : "Edit Equipment Usage Log"}
            <span className="text-muted" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
              — {equipmentName}
            </span>
          </h4>

          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ setFieldValue, values }) => (
              <>
                <AutoCalculateTotalHours
                  startTime={values.startTime}
                  endTime={values.endTime}
                  setFieldValue={setFieldValue}
                />
                <Form>
                  {/* ---------- Section: Usage Window ---------- */}
                  <div className="log-form-section">
                    <div className="log-form-section-label">
                      <FaClock size={13} /> Usage Window
                    </div>

                    <div className="row gx-3">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="startTime" className="text-start d-block">
                            Start Time <span className="text-danger">*</span>
                          </label>
                          <DatePicker
                            selected={values.startTime}
                            onChange={(date) => {
                              setFieldValue("startTime", date);
                              if (values.endTime && date > values.endTime) {
                                setFieldValue("endTime", null);
                                setFieldValue("totalHours", "");
                              }
                            }}
                            className="form-control"
                            placeholderText="Select start date & time"
                            dateFormat="dd-MM-yyyy h:mm aa"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            showTimeSelect
                            timeIntervals={15}
                            timeCaption="Time"
                            minDate={getMinDate()}
                            maxDate={getMaxDate()}
                            onKeyDown={(e) => e.preventDefault()}
                          />
                          <ErrorMessage name="startTime" component="div" className="text-danger text-start small mt-1" />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="endTime" className="text-start d-block">
                            End Time <span className="text-danger">*</span>
                          </label>
                          <DatePicker
                            selected={values.endTime}
                            onChange={(date) => setFieldValue("endTime", date)}
                            className="form-control"
                            placeholderText="Select end date & time"
                            dateFormat="dd-MM-yyyy h:mm aa"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            showTimeSelect
                            timeIntervals={15}
                            timeCaption="Time"
                            minDate={values.startTime || getMinDate()}
                            maxDate={getMaxDate()}
                            onKeyDown={(e) => e.preventDefault()}
                          />
                          <ErrorMessage name="endTime" component="div" className="text-danger text-start small mt-1" />
                        </div>
                      </div>
                    </div>

                    <div className="row gx-3">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="totalHours" className="text-start d-block">
                            Total Hours <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex align-items-center">
                            <FaRegClock className="me-2 text-muted" size={14} />
                            <Field
                              type="text"
                              name="totalHours"
                              className="form-control"
                              placeholder="Auto-calculated"
                              readOnly
                              style={{ backgroundColor: "#f4f5f7", fontWeight: 600, letterSpacing: "0.02em" }}
                            />
                          </div>
                          <ErrorMessage name="totalHours" component="div" className="text-danger text-start small mt-1" />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="usedBy" className="text-start d-block">
                            Used By <span className="text-danger">*</span>
                          </label>
                          <Select
                            className="text-start"
                            options={empOptions}
                            value={empOptions.find((opt) => opt.value === values.usedBy) || null}
                            onChange={(selected) => setFieldValue("usedBy", selected ? selected.value : "")}
                            isClearable
                            placeholder="Select employee"
                          />
                          <ErrorMessage name="usedBy" component="div" className="text-danger text-start small mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ---------- Section: Details ---------- */}
                  <div className="log-form-section">
                    <div className="log-form-section-label">Details</div>
                    <div className="row gx-3">
                      <div className="col-md-12">
                        <div className="form-group mb-2">
                          <label htmlFor="description" className="text-start d-block">
                            Description <span className="text-danger">*</span>
                          </label>
                          <Field
                            as="textarea"
                            rows={3}
                            name="description"
                            className="form-control"
                            placeholder="Enter usage description"
                          />
                          <ErrorMessage name="description" component="div" className="text-danger text-start small mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <button type="submit" className={`btn ${mode === "add" ? "submit" : "edit"}`}>
                      {mode === "add" ? "SUBMIT" : "UPDATE"}
                    </button>
                    <button type="button" className="btn back" onClick={() => redirectEquipmentLogList()}>
                      BACK
                    </button>
                  </div>
                </Form>
              </>
            )}
          </Formik>
        </div>
      </div>

      <style>{`
        .log-form-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px 18px 4px;
          margin-bottom: 18px;
          background: #fafbfc;
        }
        .log-form-section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          margin-bottom: 14px;
        }
        .react-datepicker-wrapper { width: 100%; }
      `}</style>
    </div>
  );
};

export default EquipmentLogAddEditComponent;