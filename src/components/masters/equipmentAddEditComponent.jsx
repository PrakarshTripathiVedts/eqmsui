import { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../datatable/master.css";
import { saveEquipmentData, UpdateEquipment, getEquipmentById, getEquipmentListService, getEmployeeListService, getProjectListService, FileDownload } from "../../services/masterservice";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import Equipment from "./equipment";
import Navbar from "../navbar/navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { format } from "date-fns";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Swal from "sweetalert2";
import { FaDownload } from "react-icons/fa";


const EquipmentAddEditComponent = ({ mode, equipmentId }) => {

  const [status, setStatus] = useState('');


  const [employeeList, setEmployeeList] = useState([]);
  const [projectList, setProjectList] = useState([]);

  const [serialNumberList, setSerialNumberList] = useState([]);


  const [formData, setFormData] = useState({
    itemCost: "",
    itemSerialNumber: "",
    parentLocation: "",
    presentLocation: "",
    serviceStatus: "",
    specification: "",
    soNo: "",
    soDate: "",
    model: "",
    make: "",
    locationOfficer: "",
    projectId: "",
    equipmentName: "",
    remarks: "",
    ssrNo: "",
    warranty: "",
    procurementName: "",
    crvNo: "",
    crvDate: "",
  });



  const getDataById = async (equipmentId) => {
    try {
      const data = await getEquipmentById(equipmentId);
      if (!data) return;

      setFormData(prev => ({
        ...prev,
        equipmentId: data?.equipmentId ?? "",
        equipmentName: data?.equipmentName ?? "",
        itemCost: data?.itemCost ?? 0,
        itemSerialNumber: data?.itemSerialNumber ?? "",
        parentLocation: data?.parentLocation ?? "",
        presentLocation: data?.presentLocation ?? "",
        remarks: data?.remarks ?? "",
        soNo: data?.soNo ?? "",
        soDate: data?.soDate ?? "",
        ssrNo: data?.ssrNo ?? "",
        serviceStatus: data?.serviceStatus ?? "",
        specification: data?.specification ?? "",
        locationOfficer: data?.locationOfficer ?? "",
        projectId: data?.projectId ?? "",
        model: data?.model ?? "",
        make: data?.make ?? "",
        photoName: data?.photoName ?? "",
        fileName: data?.fileName ?? "",
        warranty: data?.warranty ?? "",
        procurementName: data?.procurementName ?? "",
        crvNo: data?.crvNo ?? "",
        crvDate: data?.crvDate ?? "",

      }));
    } catch (err) {
      console.error("Failed to fetch equipment data:", err);
    }
  };

  useEffect(() => {
    if (equipmentId) {
      getDataById(equipmentId);
    }
    getModelAndMakeAndEquipmentMasterList();
  }, [equipmentId]);

  const getModelAndMakeAndEquipmentMasterList = async () => {
    try {


      const employeeData = await getEmployeeListService();
      if (Array.isArray(employeeData) && employeeData.length > 0) {
        setEmployeeList(employeeData);
      } else {
        setEmployeeList([]);
        console.error("Employee list is empty or invalid.");
      }

      const projectData = await getProjectListService();
      if (Array.isArray(projectData) && projectData.length > 0) {
        setProjectList(projectData);
      } else {
        setProjectList([]);
        console.error("Project list is empty or invalid.");
      }


      const equipmentData = await getEquipmentListService();
      if (Array.isArray(equipmentData) && equipmentData.length > 0) {
        const serialnumberlist = equipmentData.map(item => item.itemSerialNumber);
        setSerialNumberList(serialnumberlist);
      } else {
        setSerialNumberList([]);
        console.error("Equipment list is empty or invalid.");
      }

    } catch (err) {
      console.error("Failed to fetch model or make or equipment list:", err);

      setEmployeeList([]);
      setProjectList([]);
      setSerialNumberList([]);
    }
  };

  // Form Validation Schema

  const stringWithCommonRules = (label) =>
    Yup.string()
      .min(2, `${label} must be at least 2 characters`)
      .max(200, `${label} must be at most 200 characters`)
      .required(`${label} is required`);

  const requiredField = Yup.string().required("This field is required");

  const formValidationSchema = (serialNumberList) => Yup.object().shape({


    // projectSsrNo: stringWithCommonRules("Project SSR number"),
    itemSerialNumber: stringWithCommonRules("Serial number")
      .notOneOf(serialNumberList, "Serial number already exists"),
    parentLocation: stringWithCommonRules("Parent Location"),
    presentLocation: stringWithCommonRules("Present Location"),
    specification: stringWithCommonRules("Specification"),

    equipmentName: stringWithCommonRules("Equipment name"),
    make: stringWithCommonRules("Make"),
    model: stringWithCommonRules("Model"),
    soNo: stringWithCommonRules("So Number"),
    soDate: stringWithCommonRules("So Date"),
    projectId: requiredField,
    ssrNo: Yup.string().when("projectId", {
      is: (projectId) => projectId !== 0,
      then: () => stringWithCommonRules("SSR No"),
      otherwise: () => Yup.string().notRequired(),
    }),

    photo: Yup.mixed()
      .test("fileType", "Only PNG, JPG, and JPEG files are allowed.", (value) => {
        if (!value) return true; // not required; remove this line if photo is mandatory
        return ["image/png", "image/jpeg"].includes(value.type);
      }),

    locationOfficer: requiredField,
    warranty: requiredField,
    procurementName: stringWithCommonRules("Procurement Name"),
    crvNo: stringWithCommonRules("CRV No"),
    crvDate: requiredField,
    itemCost: Yup.number()
      .typeError("Item cost must be a number")
      .positive("Item cost must be greater than zero")
      .max(9999999999, "Item cost is too large")
      .test(
        "maxDigitsAfterDecimal",
        "Item cost must have at most 2 decimal places",
        (value) => value === undefined || /^\d+(\.\d{1,2})?$/.test(value.toString())
      )
      .required("Item cost is required"),

  });


  const validationSchema = useMemo(() => {
    const filteredList = serialNumberList.filter((serial) => serial !== formData.itemSerialNumber);
    return formValidationSchema(filteredList);
  }, [serialNumberList, formData.itemSerialNumber]);


  const handleSubmit = async (values) => {
    const dto = {
      ...values,
      soDate: format(new Date(values.soDate), "yyyy-MM-dd"),
      crvDate: format(new Date(values.crvDate), "yyyy-MM-dd"),
    }
    try {
      if (mode === "add") {
        const confirmed = await showConfirmation();
        if (confirmed) {
          const response = await saveEquipmentData(dto);
          if (response.equipmentId != null && response.equipmentId > 0) {
            setStatus('list');
            showAlert("Success", "Equipment added successfully", "success");
          }
          else {
            showAlert("Error", "Failed to add equipment. Please try again.", "error");
          }
        }
      } else {
        const confirmed = await showConfirmation();
        if (confirmed) {
          const response = await UpdateEquipment(equipmentId, dto);
          if (response.equipmentId != null && response.equipmentId > 0) {
            setStatus('list');
            showAlert("Success", "Equipment updated successfully", "success");
          }
          else {
            showAlert("Error", "Failed to update equipment. Please try again.", "error");
          }
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const redirectEquipmentList = () => {
    setStatus('list');
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

  const empOptions = employeeList.map(emp => ({
    value: emp.empId,
    label: emp.displayName ?? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim(),
  }));


  const projOptions = projectList.map(proj => ({
    value: proj.projectId,
    label: proj.projectCode + ' - ' + proj.projectShortName
  }));

  const handleDownload = async (equipmentId, type) => {
    let response = await FileDownload(equipmentId, type);

    const { data, fileName, contentType } = response;

    if (data === '0') {
      Swal.fire("Error", "File not found", "error");
      return;
    }

    const blob = new Blob([data], { type: contentType });

    if (contentType === "application/pdf") {
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };


  switch (status) {
    case 'list':
      return <Equipment></Equipment>;
    default:
      return (
        <div>
          <Navbar />
          <div className="expert-form-container">
            <div className="form-card">
              <h4 className="form-title">{mode === "add" ? "Add Equipment Details" : "Edit Equipment Details"}</h4>
              <Formik
                initialValues={formData}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                  // const payload = {
                  //   ...values,
                  //   model: values.model ? { id: values.model } : null,
                  //   make: values.make ? { id: values.make } : null,
                  // };
                  handleSubmit(values);
                }}

                enableReinitialize={true}
              >
                {({ setFieldValue, setFieldTouched, values }) => (
                  <Form>
                    <div className="row">

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="equipmentName" className="text-start d-block"> Name of Equipment : <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="equipmentName"
                            className="form-control mb-2"
                            placeholder="Enter Equipment Name"
                          />
                          <ErrorMessage name="equipmentName" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="procurementName" className="text-start d-block">Procurement Name: <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="procurementName"
                            className="form-control mb-2"
                            placeholder="Enter Procurement Name"
                          />
                          <ErrorMessage name="procurementName" component="div" className="text-danger text-start" />
                        </div>
                      </div>


                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="itemSerialNumber" className="text-start d-block">Serial Number: <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="itemSerialNumber"
                            className="form-control mb-2"
                            placeholder="Enter Serial Number"
                          />
                          <ErrorMessage name="itemSerialNumber" component="div" className="text-danger text-start" />
                        </div>
                      </div>


                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="make" className="text-start d-block">
                            Make: <span className="text-danger">*</span>
                          </label>

                          <Field
                            type="text"
                            name="make"
                            className="form-control mb-2"
                            placeholder="Enter Make"
                          />

                          <ErrorMessage name="make" component="div" className="text-danger text-start" />
                        </div>
                      </div>



                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="model" className="text-start d-block">
                            Model: <span className="text-danger">*</span>
                          </label>

                          <Field
                            type="text"
                            name="model"
                            className="form-control mb-2"
                            placeholder="Enter Model"
                          />

                          <ErrorMessage name="model" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="soNo" className="text-start d-block">Supply Order No / GeM Contract No: <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="soNo"
                            className="form-control mb-2"
                            placeholder="Enter Supply Order Number"
                          />
                          <ErrorMessage name="soNo" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="soDate" className="text-start d-block">
                            Supply Order Date : <span className="text-danger">*</span>
                          </label>

                          <DatePicker
                            selected={values.soDate}
                            onChange={(date) => {
                              setFieldValue("soDate", date);
                              if (date) {
                                const soDate = new Date(date);
                                setFieldValue("soDate", soDate);
                              }
                            }}
                            className="form-control mb-2"
                            placeholderText="Select Supply Order Date"
                            dateFormat="dd-MM-yyyy"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            minDate={getMinDate()}
                            maxDate={getMaxDate()}
                            onKeyDown={(e) => e.preventDefault()}
                          />

                          <ErrorMessage name="soDate" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="itemCost" className="text-start d-block">Item Cost : <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="itemCost"
                            className="form-control mb-2 "
                            placeholder="Enter Item Cost"
                          />
                          <ErrorMessage name="itemCost" component="div" className="text-danger text-start" />
                        </div>
                      </div>



                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="parentLocation" className="text-start d-block">Parent Location : <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="parentLocation"
                            className="form-control mb-2"
                            placeholder="Enter Parent Location"
                          />
                          <ErrorMessage name="parentLocation" component="div" className="text-danger text-start" />
                        </div>
                      </div>



                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="locationOfficer" className="text-start d-block">Person Incharge : <span className="text-danger">*</span></label>
                          <Select
                            className="text-start"
                            options={empOptions}
                            value={empOptions.find(opt => opt.value === values.locationOfficer) || null}
                            onChange={(selected) => setFieldValue("locationOfficer", selected ? selected.value : "")}
                            isClearable
                            placeholder="Select"
                          />
                          <ErrorMessage name="locationOfficer" component="div" className="text-danger text-start" />
                        </div>
                      </div>


                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="projectId" className="text-start d-block">Project : <span className="text-danger">*</span></label>
                          <Select
                            className="text-start"
                            options={projOptions}
                            value={projOptions.find(opt => opt.value === values.projectId) || null}
                            onChange={(selected) => setFieldValue("projectId", selected ? selected.value : "")}
                            isClearable
                            placeholder="Select"
                          />

                          <ErrorMessage name="projectId" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="presentLocation" className="text-start d-block">Present Location : <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="presentLocation"
                            className="form-control mb-2"
                            placeholder="Enter Present Location"
                          />
                          <ErrorMessage name="presentLocation" component="div" className="text-danger text-start" />
                        </div>
                      </div>


                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="photo" className="text-start d-block">Photo Upload :
                            {mode === 'edit' && values.photoName && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleDownload(values.equipmentId, "photo")}
                              >
                                <FaDownload size={16} />
                              </button>
                            )
                            }
                          </label>

                          <input id="photo" name="photo" type="file" className="form-control mb-2" accept=".png,.jpg,.jpeg"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              setFieldValue("photo", file);
                            }}

                          />
                          <ErrorMessage name="photo" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="file" className="text-start d-block">File Upload : &nbsp;
                            {mode === 'edit' && values.fileName && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleDownload(values.equipmentId, "file")}
                              >
                                <FaDownload size={16} />
                              </button>)}
                          </label>

                          <input id="file" name="file" type="file" className="form-control mb-2"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              setFieldValue("file", file);
                            }}

                          />
                          <ErrorMessage name="file" component="div" className="text-danger text-start" />
                        </div>
                      </div>
                      {values?.projectId === 0 &&
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="ssrNo" className="text-start d-block">SSR Number : <span className="text-danger">*</span></label>
                            <Field type="text" name="ssrNo" className="form-control mb-2" placeholder="Enter SSR Number" />

                            <ErrorMessage name="ssrNo" component="div" className="text-danger text-start" />
                          </div>
                        </div>
                      }

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="serviceStatus" className="text-start d-block"> Service Status: </label>

                          <Field
                            as="select"
                            name="serviceStatus"
                            className="form-control mb-2"
                          >
                            <option value="">--Select--</option>
                            <option value="Y">Working</option>
                            <option value="N">Not Working</option>
                          </Field>

                          <ErrorMessage name="serviceStatus" component="div" className="text-danger text-start" />
                        </div>
                      </div>


                      {/* <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="calibrationAgency" className="text-start d-block">Calibration Agency :  <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="calibrationAgency"
                            className="form-control mb-2"
                            placeholder="Enter Calibration Agency"
                          />
                          <ErrorMessage name="calibrationAgency" component="div" className="text-danger text-start" />
                        </div>
                      </div> 

                       <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="calibrationDate" className="text-start d-block">
                            Calibration Date :  <span className="text-danger">*</span>
                          </label>

                          <DatePicker
                            selected={values.calibrationDate}
                            onChange={(date) => {
                              setFieldValue("calibrationDate", date);
                              if (date) {
                                const dueDate = new Date(date);
                                dueDate.setFullYear(dueDate.getFullYear() + 1);
                                setFieldValue("calibrationDueDate", dueDate);
                              }
                            }}
                            className="form-control mb-2"
                            placeholderText="Select Calibration Date"
                            dateFormat="dd-MM-yyyy"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            minDate={getMinDate()}
                            maxDate={getMaxDate()}
                            onKeyDown={(e) => e.preventDefault()}
                          />

                          <ErrorMessage name="calibrationDate" component="div" className="text-danger text-start" />
                        </div>
                      </div> 

                       <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="calibrationDueDate" className="text-start d-block">
                            Calibration Due Date :  <span className="text-danger">*</span>
                          </label>

                          <DatePicker
                            selected={values.calibrationDueDate}
                            onChange={(date) => setFieldValue("calibrationDueDate", date)}
                            className="form-control mb-2"
                            placeholderText="Select Calibration Due Date"
                            dateFormat="dd-MM-yyyy"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            minDate={values.calibrationDate || getMinDate()}
                            maxDate={getMaxDate()}
                            onKeyDown={(e) => e.preventDefault()}
                          />

                          <ErrorMessage name="calibrationDueDate" component="div" className="text-danger text-start" />
                        </div>
                      </div> */}

                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="warranty" className="text-start d-block">Warranty: <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="warranty"
                            className="form-control mb-2"
                            placeholder="Enter Warranty"
                          />
                          <ErrorMessage name="warranty" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      {/* ✅ NEW: CRV No */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="crvNo" className="text-start d-block">CRV No: <span className="text-danger">*</span></label>
                          <Field type="text" name="crvNo" className="form-control mb-2" placeholder="Enter CRV No" />
                          <ErrorMessage name="crvNo" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      {/* ✅ NEW: CRV Date */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="crvDate" className="text-start d-block">CRV Date: <span className="text-danger">*</span></label>
                          <DatePicker
                            selected={values.crvDate}
                            onChange={(date) => setFieldValue("crvDate", date)}
                            className="form-control mb-2"
                            placeholderText="Select CRV Date"
                            dateFormat="dd-MM-yyyy"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            minDate={getMinDate()}
                            maxDate={getMaxDate()}
                            onKeyDown={(e) => e.preventDefault()}
                          />
                          <ErrorMessage name="crvDate" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="specification" className="text-start d-block">Specification : <span className="text-danger">*</span></label>
                          <Field
                            type="text" name="specification" className="form-control mb-2" placeholder="Enter Specification" />
                          <ErrorMessage name="specification" component="div" className="text-danger text-start" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="remarks" className="text-start d-block">Remarks : </label>
                          <Field
                            type="text"
                            name="remarks"
                            className="form-control mb-2"
                            placeholder="Enter Remarks"
                          />
                          <ErrorMessage name="remarks" component="div" className="text-danger text-start" />
                        </div>
                      </div>
                      {/* <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="amc" className="text-start d-block">AMC: <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="amc"
                            className="form-control mb-2"
                            placeholder="Enter AMC"
                          />
                          <ErrorMessage name="amc" component="div" className="text-danger text-start" />
                        </div>
                      </div> */}

                    </div>
                    <div align="center">
                      <button type="submit" className={`btn ${mode === "add" ? "submit" : "edit"} mt-3`} >
                        {mode === "add" ? "SUBMIT" : "UPDATE"}
                      </button>
                      <button className="btn back mt-3" onClick={() => redirectEquipmentList()}>BACK</button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      );
  }
};

export default EquipmentAddEditComponent;
