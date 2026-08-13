import { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import * as Yup from "yup";
import { getComponentId,saveComponentData, UpdateComponentData,} from "../../services/componentservices";
import { getEmployeeListService, getItemUnitList, } from "../../services/masterservice";
import { format, parseISO } from "date-fns";


const ComponentAddEdit = ({ mode, componentId, setStatus, refreshList }) => {

  const [unitOptions,     setUnitOptions]     = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [formData, setFormData] = useState({
    componentId:    "",
    componentType:  "",
    componentName:  "",
    componentSpecs: "",
    roomNo:         "",
    almirahNo:      "",
    boxNo:          "",
    unitCode:       "",
    openingBalQty:  "",
    balQtyDate:     null,
    personIncharge: "",
    remarks:        "",
  });

  /* ── Load dropdowns ── */
  useEffect(() => {
    loadDropdowns();
  }, []);

  /* ── Load edit data after dropdowns are ready ── */
  useEffect(() => {
    if (mode === "edit" && componentId) {
      getDataByComponentId(componentId);
    }
  }, [componentId, mode]);

  const loadDropdowns = async () => {
    try {
      const [units, employees] = await Promise.all([
        getItemUnitList(),
        getEmployeeListService(),          // adjust to your actual service fn name
      ]);

      // Unit options — adjust field names to match your API response
      const uArr = Array.isArray(units) ? units : units?.data ?? [];
      setUnitOptions(
        uArr.map(u => ({
          value: u.itemUnitCode ?? u.code ?? u.value,
          label: u.itemUnitCode ?? u.code ?? u.value,
        }))
      );

      // Employee options — adjust field names to match your API response
      const eArr = Array.isArray(employees) ? employees : employees?.data ?? [];
      setEmployeeOptions(
        eArr.map(e => ({
          value: e.empId ?? e.id,
          label: e.displayName ?? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
        }))
      );
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  };

  const getDataByComponentId = async (id) => {
    try {
      const data = await getComponentId(id);
      if (!data) return;
      setFormData({
        componentId:    data.componentId    ?? "",
        componentType:  data.componentType  ?? "",
        componentName:  data.componentName  ?? "",
        componentSpecs: data.componentSpecs ?? "",
        roomNo:         data.roomNo         ?? "",
        almirahNo:      data.almirahNo      ?? "",
        boxNo:          data.boxNo          ?? "",
        unitCode:       data.unitCode       ?? "",
        openingBalQty:  data.openingBalQty  ?? "",
        balQtyDate:     data.balQtyDate     ? new Date(data.balQtyDate) : null,
        personIncharge: data.personIncharge ?? "",
        remarks:        data.remarks        ?? "",
        latestBalQty:   data.latestBalQty   ?? "",
        latestQtyDate:  data.latestQtyDate  ? new Date(data.latestQtyDate) : null,
      });
    } catch (err) {
      console.error("Failed to fetch component data:", err);
    }
  };

  /* ── Validation ── */
  const strField = (label, min = 2, max = 200) =>
    Yup.string()
      .min(min, `${label} must be at least ${min} characters`)
      .max(max, `${label} must be at most ${max} characters`)
      .required(`${label} is required`);

  const validationSchema = Yup.object().shape({
    componentType:  Yup.string().required("Component Type is required"),
    componentName:  strField("Component Name"),
    componentSpecs: strField("Component Specs", 2, 500),
    roomNo:         Yup.string().max(50).required("Room No is required"),
    almirahNo:      Yup.string().max(50).required("Almirah No is required"),
    boxNo:          Yup.string().max(50).required("Box No is required"),
    unitCode:       Yup.string().required("Unit is required"),
    openingBalQty:  Yup.number()
                      .typeError("Opening Balance must be a number")
                      .min(0, "Cannot be negative")
                      .required("Opening Balance Qty is required"),
    balQtyDate:     Yup.date().nullable().required("Balance Qty Date is required"),
    personIncharge: Yup.number()
                      .typeError("Person In-charge is required")
                      .required("Person In-charge is required"),
    remarks:        strField("Remarks", 2, 500),
  });

  /* ── Submit ──
     On ADD:  latestBalQty  = openingBalQty
              latestQtyDate = balQtyDate
     On EDIT: do NOT overwrite latest* fields (backend keeps them)
  ── */
  const handleSubmit = async (values) => {
    try {
      const confirmed = await showConfirmation();
      if (!confirmed) return;

      const payload = {
        ...values,
        openingBalQty: parseFloat(values.openingBalQty),
        balQtyDate:    values.balQtyDate
          ? format(new Date(values.balQtyDate), "yyyy-MM-dd")
          : null,
        // Copy opening values to latest on first save
        ...(mode === "add" && {
          latestBalQty:  parseFloat(values.openingBalQty),
          latestQtyDate: values.balQtyDate
            ? format(new Date(values.balQtyDate), "yyyy-MM-dd")
            : null,
        }),
      };

      if (mode === "add") {
        const response = await saveComponentData(payload);
        if (response?.componentId > 0) {
          showAlert("Success", "Component added successfully", "success");
          refreshList?.();
          setStatus("");
        } else {
          showAlert("Error", "Failed to add Component. Please try again.", "error");
        }
      } else {
        const response = await UpdateComponentData(componentId, payload);
        if (response?.componentId > 0) {
          showAlert("Success", "Component updated successfully", "success");
          refreshList?.();
          setStatus("");
        } else {
          showAlert("Error", "Failed to update Component. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  /* ── Shared Select styles ── */
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

  return (
    <div>
      <Navbar />
      <div className="expert-form-container">
        <div className="form-card" style={{ marginLeft: "10%", marginRight: "10%" }}>

          <h4 className="form-title">
            {mode === "add" ? "Add Component" : "Edit Component"}
          </h4>

          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue, errors, touched }) => (
              <Form>
                <div className="row text-start">

                  {/* ── Component Type ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Component Type: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="componentType"
                        className="form-control mb-2"
                        placeholder="Enter Component Type"
                      />
                      <ErrorMessage name="componentType" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Component Name ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Component Name: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="componentName"
                        className="form-control mb-2"
                        placeholder="Enter Component Name"
                      />
                      <ErrorMessage name="componentName" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Component Specs ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Component Specs: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="componentSpecs"
                        className="form-control mb-2"
                        placeholder="Enter Specifications"
                      />
                      <ErrorMessage name="componentSpecs" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Unit Code ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Unit: <span className="text-danger">*</span>
                      </label>
                      <Select
                        options={unitOptions}
                        value={unitOptions.find(o => o.value === values.unitCode) ?? null}
                        onChange={opt => setFieldValue("unitCode", opt?.value ?? "")}
                        placeholder="Select Unit"
                        isClearable
                        styles={selectStyles}
                        menuPortalTarget={document.body}
                        classNamePrefix="react-select"
                      />
                      {touched.unitCode && errors.unitCode && (
                        <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                          {errors.unitCode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Opening Balance Qty ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Opening Balance Qty: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="number"
                        name="openingBalQty"
                        className="form-control mb-2"
                        placeholder="Enter Opening Balance Qty"
                        min="0"
                        step="0.01"
                      />
                      <ErrorMessage name="openingBalQty" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Balance Qty Date ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Balance Qty Date: <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        selected={values.balQtyDate}
                        onChange={date => setFieldValue("balQtyDate", date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="DD-MM-YYYY"
                        className="form-control mb-2"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        autoComplete="off"
                      />
                      {touched.balQtyDate && errors.balQtyDate && (
                        <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                          {errors.balQtyDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Person In-charge (Employee) ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Person In-charge: <span className="text-danger">*</span>
                      </label>
                      <Select
                        options={employeeOptions}
                        value={employeeOptions.find(o => o.value === values.personIncharge) ?? null}
                        onChange={opt => setFieldValue("personIncharge", opt?.value ?? "")}
                        placeholder="Select Employee"
                        isClearable
                        styles={selectStyles}
                        menuPortalTarget={document.body}
                        classNamePrefix="react-select"
                      />
                      {touched.personIncharge && errors.personIncharge && (
                        <div className="text-danger text-start" style={{ fontSize: 13, marginTop: 4 }}>
                          {errors.personIncharge}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Room No ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Room No: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="roomNo"
                        className="form-control mb-2"
                        placeholder="Enter Room No"
                      />
                      <ErrorMessage name="roomNo" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Almirah No ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Almirah No: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="almirahNo"
                        className="form-control mb-2"
                        placeholder="Enter Almirah No"
                      />
                      <ErrorMessage name="almirahNo" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Box No ── */}
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Box No: <span className="text-danger">*</span>
                      </label>
                      <Field
                        type="text"
                        name="boxNo"
                        className="form-control mb-2"
                        placeholder="Enter Box No"
                      />
                      <ErrorMessage name="boxNo" component="div" className="text-danger text-start" />
                    </div>
                  </div>

                  {/* ── Edit-only: Latest Balance info (read-only display) ── */}
                  {mode === "edit" && (
                    <>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="text-start d-block">Latest Balance Qty:</label>
                          <Field
                            type="number"
                            name="latestBalQty"
                            className="form-control mb-2"
                            readOnly
                            style={{ background: "#f8f9fa", cursor: "not-allowed", color: "#6c757d" }}
                          />
                          <small className="text-muted d-block text-start">
                            Updated automatically on stock transactions
                          </small>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="text-start d-block">Latest Qty Date:</label>
                          
                          <DatePicker
                        selected={values.latestQtyDate}
                        onChange={date => setFieldValue("latestQtyDate", date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="DD-MM-YYYY"
                        className="form-control mb-2"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        autoComplete="off"
                        readOnly
                        style={{ background: "#f8f9fa", cursor: "not-allowed", color: "#6c757d" }}
                      />
                          <small className="text-muted d-block text-start">
                            Updated automatically on stock transactions
                          </small>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Remarks ── */}
                  <div className="col-md-8">
                    <div className="form-group">
                      <label className="text-start d-block">
                        Remarks: <span className="text-danger">*</span>
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

                </div>{/* /.row */}

                {/* ── Buttons ── */}
                <div align="center">
                  <button
                    type="submit"
                    className={`btn ${mode === "add" ? "submit" : "edit"} mt-3 me-2`}
                  >
                    {mode === "add" ? "SUBMIT" : "UPDATE"}
                  </button>
                  <button
                    type="button"
                    className="btn back mt-3"
                    onClick={() => setStatus("")}
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

export default ComponentAddEdit;