import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Navbar from "../navbar/navbar";
import {
    checkUsernameExistsService,
    getRolesList,
    getUserByIdService,
    saveUserService,
    updateUserService
} from "../../services/admin.service";
import { getEmployeeListService } from "../../services/masterservice";
import { showAlert, showConfirmation } from "../datatable/swalHelper";

const UserManagerAddEditComponent = ({ mode, loginId, setStatus, refreshList }) => {
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [usernameStatus, setUsernameStatus] = useState("idle");
    const usernameCheckTimer = useRef(null);
    const [initialValues, setInitialValues] = useState({
        userName: "",
        employee: null, // { value: empId, label: displayName }
        role: null, // { value: roleId, label: roleName }
    });
    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState("");

    // ── Add this useEffect for real-time username checking ──
    useEffect(() => {
        if (mode !== "add") return;

        const val = initialValues.userName; // not needed here, watch values via Formik
    }, []);
    // ↑ Remove the above — instead wire it inside the Field via onChange below

    /* ── Load dropdowns ── */
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [empList, roleList] = await Promise.all([
                    getEmployeeListService(),
                    getRolesList(),
                ]);

                const empArr = Array.isArray(empList) ? empList : empList?.data ?? [];
                const roleArr = Array.isArray(roleList) ? roleList : roleList?.data ?? [];

                setEmployeeOptions(
                    empArr.map((e) => ({ value: e.empId ?? e.employeeId, label: e.displayName ?? e.empName }))
                );
                setRoleOptions(
                    roleArr.map((r) => ({ value: r.roleId, label: r.roleName }))
                );
            } catch (err) {
                console.error("Failed to load dropdowns", err);
            }
        };
        loadDropdowns();
    }, []);

    /* ── Load existing user for edit ── */
    useEffect(() => {
        const loadUser = async () => {
            if (mode === "edit" && loginId) {
                try {
                    const data = await getUserByIdService(loginId);
                    setInitialValues({
                        userName: data.userName ?? "",
                        employee: data.empId
                            ? { value: data.empId, label: data.empName ?? String(data.empId) }
                            : null,
                        role: data.roleId
                            ? { value: data.roleId, label: data.roleName ?? String(data.roleId) }
                            : null,
                    });
                } catch (err) {
                    console.error("Failed to load user", err);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [mode, loginId]);

    // ── Updated validationSchema — sync only, reads usernameStatus ──
    const validationSchema = Yup.object({
        userName: Yup.string()
            .trim()
            .required("Username is required")
            .min(3, "Min 3 characters")
            .max(50, "Max 50 characters")
            .test(
                "unique-username",
                "Username already exists",
                function () {
                    if (mode !== "add") return true;
                    // Block submit if taken or still checking
                    return usernameStatus !== "taken" && usernameStatus !== "checking";
                }
            ),
        employee: Yup.object().nullable().required("Employee is required"),
        role: Yup.object().nullable().required("Role is required"),
    });


    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const confirmed = await showConfirmation();
            if (!confirmed) { setSubmitting(false); return; }

            const payload = {
                userName: values.userName.trim(),
                empId: values.employee?.value ?? null,
                roleId: values.role?.value ?? null,
                // Ensure loginId is attached to the body for the update mode
                ...(mode === "edit" && { loginId: loginId }), 
            };

            if (mode === "add") {
                const result = await saveUserService(payload);
                if (result?.loginId > 0) {
                    showAlert("Success", "User added successfully.", "success");
                    refreshList?.();
                    setStatus("list");
                } else {
                    showAlert("Error", "Failed to save user. Please try again.", "error");
                }
            } else {
                // ⬇️ Now cleanly passes just the payload object directly
                const result = await updateUserService(payload);
                if (result?.loginId != null) {
                    showAlert("Success", "User updated successfully.", "success");
                    refreshList?.();
                    setStatus("list");
                } else {
                    showAlert("Error", "Failed to update user. Please try again.", "error");
                }
            }
        } catch (error) {
            console.error("Submission error:", error);
            const msg = error?.response?.data?.message ?? "Something went wrong. Please try again later.";
            showAlert("Error", msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Add this useEffect for cleanup ──
    useEffect(() => {
        return () => clearTimeout(usernameCheckTimer.current);
    }, []);

    /* ── Loading state ── */
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
                            {mode === "add" ? "Add New User" : "Edit User"}
                        </h5>
                        <span
                            className="badge bg-secondary text-uppercase"
                            style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}
                        >
                            {mode === "add" ? "New Record" : `Login ID: ${loginId}`}
                        </span>
                    </div>

                    {submitError && (
                        <div className="alert alert-danger py-2" role="alert">
                            {submitError}
                        </div>
                    )}

                    <Formik
                        enableReinitialize
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ values, setFieldValue, setFieldTouched, isSubmitting, touched, errors, validateForm }) => (
                            <Form>
                                <div className="row g-3 text-start">
                                    {/* ── Username field with real-time check ── */}
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">
                                            Username <span className="text-danger">*</span>
                                        </label>
                                        {mode === "edit" ? (
                                            <div className="form-control bg-light text-muted" style={{ cursor: "not-allowed" }}>
                                                {values.userName || "-"}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="position-relative">
                                                    <Field
                                                        name="userName"
                                                        placeholder="e.g. john.doe"
                                                        maxLength={50}
                                                        className={`form-control pe-4 ${touched.userName && errors.userName ? "is-invalid" :
                                                                usernameStatus === "available" ? "is-valid" : ""
                                                            }`}
                                                        onChange={(e) => {
                                                            const val = e.target.value;

                                                            // 1. Update Formik field value directly — no 'field' object needed
                                                            setFieldValue("userName", val);
                                                            setFieldTouched("userName", true, false);

                                                            // 2. Reset status
                                                            setUsernameStatus("idle");
                                                            clearTimeout(usernameCheckTimer.current);

                                                            if (val.trim().length < 3) return;

                                                            // 3. Debounce API call
                                                            usernameCheckTimer.current = setTimeout(async () => {
                                                                setUsernameStatus("checking");
                                                                try {
                                                                    const exists = await checkUsernameExistsService(val.trim());
                                                                    setUsernameStatus(exists ? "taken" : "available");
                                                                } catch {
                                                                    setUsernameStatus("idle");
                                                                }
                                                            }, 500);
                                                        }}
                                                    />

                                                    {/* Spinner inside field while checking */}
                                                    {usernameStatus === "checking" && (
                                                        <span
                                                            className="position-absolute top-50 end-0 translate-middle-y me-2"
                                                            style={{ pointerEvents: "none" }}
                                                        >
                                                            <span className="spinner-border spinner-border-sm text-secondary" role="status" />
                                                        </span>
                                                    )}
                                                </div>

                                                <ErrorMessage name="userName" component="div" className="invalid-feedback d-block" />

                                                {/* Real-time feedback messages */}
                                                {usernameStatus === "available" && !errors.userName && (
                                                    <div className="text-success mt-1" style={{ fontSize: "0.82em" }}>
                                                        Username is available ✓
                                                    </div>
                                                )}
                                                {usernameStatus === "taken" && (
                                                    <div className="text-danger mt-1" style={{ fontSize: "0.82em" }}>
                                                        Username already exists ✗
                                                    </div>
                                                )}
                                                {usernameStatus === "checking" && (
                                                    <div className="text-muted mt-1" style={{ fontSize: "0.82em" }}>
                                                        Checking availability...
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                     {/* ── Employee dropdown — add only, read-only in edit ── */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">
                      Employee <span className="text-danger">*</span>
                    </label>
                    {mode === "edit" ? (
                      <div
                        className="form-control bg-light text-muted"
                        style={{ cursor: "not-allowed" }}
                      >
                        {values.employee?.label || "-"}
                      </div>
                    ) : (
                      <Select
                        options={employeeOptions}
                        value={values.employee}
                        onChange={(opt) => setFieldValue("employee", opt)}
                        onBlur={() => setFieldTouched("employee", true)}
                        placeholder="Select employee..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        classNamePrefix="react-select"
                      />
                    )}
                    {touched.employee && errors.employee && (
                      <div className="text-danger mt-1" style={{ fontSize: "0.82em" }}>
                        {errors.employee}
                      </div>
                    )}
                  </div>

                                    {/* Role dropdown — editable in both modes */}
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">
                                            Role <span className="text-danger">*</span>
                                        </label>
                                        <Select
                                            options={roleOptions}
                                            value={values.role}
                                            onChange={(opt) => setFieldValue("role", opt)}
                                            onBlur={() => setFieldTouched("role", true)}
                                            placeholder="Select role..."
                                            isClearable
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                                            classNamePrefix="react-select"
                                        />
                                        {touched.role && errors.role && (
                                            <div className="text-danger" style={{ fontSize: "0.82em" }}>{errors.role}</div>
                                        )}
                                        {mode === "edit" && (
                                            <small className="text-muted">Only the role can be changed for an existing user.</small>
                                        )}
                                    </div>

                                </div>{/* /row */}

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

export default UserManagerAddEditComponent;