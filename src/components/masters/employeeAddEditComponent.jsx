import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../navbar/navbar";
import EmployeeComponent from "./employee";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import { getDesignationListService, getDivisionListService, getEmployeeByIdService, saveEmployeeService, updateEmployeeService } from "../../services/admin.service";


const EmployeeAddEditComponent = ({ mode, employeeId }) => {
    const [status, setStatus] = useState("");
    const [initialValues, setInitialValues] = useState({
        title: "",
        salutation: "",
        srNo: "",
        empNo: "",
        empName: "",
        punchCardNo: "",
        desigId: null,
        extNo: "",
        mobileNo: "",
        divisionId: null,
        email: "",
        dronaEmail: "",
        internalEmail: "",
        internetEmail: "",
        empStatus: "",
    });

    const [desigOptions, setDesigOptions] = useState([]);
    const [divisionOptions, setDivisionOptions] = useState([]);

    const validationSchema = Yup.object({
        empName: Yup.string().required("Employee name is required"),
        empNo: Yup.string().required("Employee number is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
        mobileNo: Yup.string()
            .matches(/^[0-9]{10}$/, "Must be 10 digits")
            .required("Mobile number is required"),
        desigId: Yup.mixed().required("Designation is required"),
        divisionId: Yup.mixed().required("Division is required"),
    });

    useEffect(() => {
        loadDropdowns();
        if (mode === "edit" && employeeId) {
            loadEmployee();
        }
    }, []);

    const loadDropdowns = async () => {
        try {
            const [desigs, divs] = await Promise.all([
                getDesignationListService(),
                getDivisionListService(),
            ]);
            setDesigOptions(
                desigs.map((d) => ({ value: d.desigId, label: d.designation }))
            );
            setDivisionOptions(
                divs.map((d) => ({ value: d.divisionId, label: d.divisionName }))
            );
        } catch (err) {
            console.error("Failed to load dropdowns", err);
        }
    };

    const loadEmployee = async () => {
        try {
            const data = await getEmployeeByIdService(employeeId);
            setInitialValues({

                title: data.title ?? "",
                salutation: data.salutation ?? "",
                srNo: data.srNo ?? "",
                empNo: data.empNo ?? "",
                empName: data.empName ?? "",
                punchCardNo: data.punchCardNo ?? "",
                desigId: data.desigId ?? null,
                extNo: data.extNo ?? "",
                mobileNo: data.mobileNo ?? "",
                divisionId: data.divisionId ?? null,
                email: data.email ?? "",
                dronaEmail: data.dronaEmail ?? "",
                internalEmail: data.internalEmail ?? "",
                internetEmail: data.internetEmail ?? "",
                empStatus: data.empStatus ?? "",
            });
        } catch (err) {
            showAlert("error", "Failed to load employee details.");
        }
    };

    const handleSubmit = async (values) => {
        const confirmed = await showConfirmation(
            mode === "add" ? "Add Employee?" : "Update Employee?"
        );
        if (!confirmed) return;

        try {
            if (mode === "add") {
                await saveEmployeeService(values);
                showAlert("success", "Employee added successfully.");
            } else {
                await updateEmployeeService(employeeId, { ...values, empId: employeeId });
                showAlert("success", "Employee updated successfully.");
            }
            setStatus("list");
        } catch (err) {
            showAlert("error", "Operation failed. Please try again.");
        }
    };

    if (status === "list") return <EmployeeComponent />;

    return (
        <div>
            <Navbar />
            <div className="expert-form-container">
                <div className="form-card">
                    <h4 className="form-title">
                        {mode === "add" ? "Add Employee Details" : "Edit Employee Details"}
                    </h4>

                    <Formik
                        enableReinitialize
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ values, setFieldValue }) => (
                            <Form>
                                <div className="row g-3 mt-2 text-start">

                                    {/* Title */}
                                    <div className="col-md-2">
                                        <label className="form-label">Title</label>
                                        <Select
                                            options={[
                                                { value: "Mr.", label: "Mr." },
                                                { value: "Mrs.", label: "Mrs." },
                                                { value: "Ms.", label: "Ms." },
                                            ]}
                                            value={
                                                values.title
                                                    ? { value: values.title, label: values.title }
                                                    : null
                                            }
                                            onChange={(opt) => setFieldValue("title", opt ? opt.value : "")}
                                            placeholder="-- Select --"
                                            isClearable
                                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                                        />
                                        <ErrorMessage name="title" component="div" className="text-danger small" />
                                    </div>

                                    {/* Salutation */}
                                    <div className="col-md-2">
                                        <label className="form-label">Rank</label>
                                        <Select
                                            options={[
                                                { value: "Prof.", label: "Prof." },
                                                { value: "Lt.", label: "Lt." },
                                                { value: "Dr.", label: "Dr." },
                                            ]}
                                            value={
                                                values.salutation
                                                    ? { value: values.salutation, label: values.salutation }
                                                    : null
                                            }
                                            onChange={(opt) => setFieldValue("salutation", opt ? opt.value : "")}
                                            placeholder="-- Select --"
                                            isClearable
                                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                                        />
                                        <ErrorMessage name="salutation" component="div" className="text-danger small" />
                                    </div>

                                    {/* Sr No */}
                                    <div className="col-md-2">
                                        <label className="form-label">Sr. No</label>
                                        <Field name="srNo" type="number" className="form-control form-control-sm" />
                                    </div>

                                    {/* Emp No */}
                                    <div className="col-md-2">
                                        <label className="form-label">Employee No <span className="text-danger">*</span></label>
                                        <Field name="empNo" className="form-control form-control-sm" />
                                        <ErrorMessage name="empNo" component="div" className="text-danger small" />
                                    </div>

                                    {/* Emp Name */}
                                    <div className="col-md-4">
                                        <label className="form-label">Employee Name <span className="text-danger">*</span></label>
                                        <Field name="empName" className="form-control form-control-sm" />
                                        <ErrorMessage name="empName" component="div" className="text-danger small" />
                                    </div>

                                    {/* Punch Card No */}
                                    <div className="col-md-3">
                                        <label className="form-label">Punch Card No</label>
                                        <Field name="punchCardNo" className="form-control form-control-sm" />
                                    </div>

                                    {/* Designation - React Select */}
                                    <div className="col-md-3">
                                        <label className="form-label">Designation <span className="text-danger">*</span></label>
                                        <Select
                                            options={desigOptions}
                                            value={desigOptions.find((o) => o.value === values.desigId) || null}
                                            onChange={(opt) => setFieldValue("desigId", opt ? opt.value : null)}
                                            placeholder="Select Designation"
                                            isClearable
                                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                                        />
                                        <ErrorMessage name="desigId" component="div" className="text-danger small" />
                                    </div>

                                    {/* Division - React Select */}
                                    <div className="col-md-3">
                                        <label className="form-label">Division <span className="text-danger">*</span></label>
                                        <Select
                                            options={divisionOptions}
                                            value={divisionOptions.find((o) => o.value === values.divisionId) || null}
                                            onChange={(opt) => setFieldValue("divisionId", opt ? opt.value : null)}
                                            placeholder="Select Division"
                                            isClearable
                                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                                        />
                                        <ErrorMessage name="divisionId" component="div" className="text-danger small" />
                                    </div>

                                    {/* Ext No */}
                                    <div className="col-md-3">
                                        <label className="form-label">Extension No</label>
                                        <Field name="extNo" className="form-control form-control-sm" />
                                    </div>

                                    {/* Mobile No */}
                                    <div className="col-md-3">
                                        <label className="form-label">Mobile No <span className="text-danger">*</span></label>
                                        <Field name="mobileNo" className="form-control form-control-sm" />
                                        <ErrorMessage name="mobileNo" component="div" className="text-danger small" />
                                    </div>

                                    {/* Email */}
                                    <div className="col-md-3">
                                        <label className="form-label">Email <span className="text-danger">*</span></label>
                                        <Field name="email" type="email" className="form-control form-control-sm" />
                                        <ErrorMessage name="email" component="div" className="text-danger small" />
                                    </div>

                                    {/* Drona Email */}
                                    <div className="col-md-3">
                                        <label className="form-label">Drona Email</label>
                                        <Field name="dronaEmail" type="email" className="form-control form-control-sm" />
                                    </div>

                                    {/* Internal Email */}
                                    <div className="col-md-3">
                                        <label className="form-label">Internal Email</label>
                                        <Field name="internalEmail" type="email" className="form-control form-control-sm" />
                                    </div>

                                    {/* Internet Email */}
                                    <div className="col-md-4">
                                        <label className="form-label">Internet Email</label>
                                        <Field name="internetEmail" type="email" className="form-control form-control-sm" />
                                    </div>

                                    {/* Emp Status */}
                                    <div className="col-md-3">
                                        <label className="form-label">Employee Status</label>
                                        <Select
                                            options={[
                                                { value: "P", label: "Present" },
                                                { value: "R", label: "Retired" },
                                                { value: "T", label: "Transferred" },
                                            ]}
                                            value={
                                                values.empStatus
                                                    ? { value: values.empStatus, label: values.empStatus === "P" ? "Present" : values.empStatus === "R" ? "Retired" : "Transferred" }
                                                    : null
                                            }
                                            onChange={(opt) => setFieldValue("empStatus", opt ? opt.value : "")}
                                            placeholder="-- Select --"
                                            isClearable
                                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                                        />
                                        <ErrorMessage name="empStatus" component="div" className="text-danger small" />
                                    </div>

                                </div>

                                {/* Buttons */}
                                <div className="text-center mt-4">
                                    <button type="submit" className="btn btn-success me-2">
                                        {mode === "add" ? "SUBMIT" : "UPDATE"}
                                    </button>
                                    <button type="button" className="btn back btn-sm" onClick={() => setStatus("list")}>
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

export default EmployeeAddEditComponent;