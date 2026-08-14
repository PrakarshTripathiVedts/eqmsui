import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Select from "react-select";
import * as Yup from "yup";
import { getEmployeeListService } from "../../services/masterservice";
import { getCategoryList } from "../../services/masterservice";
const SsrItemsImportModal = ({ show, row, onClose, onSubmit, action, modalFor = "" }) => {

    const [submitting, setSubmitting] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);

    const getCategoryOptionsList = async () => {
        try {
            const categoryData = await getCategoryList();
            setCategoryList(
                Array.isArray(categoryData) ? categoryData : []
            );
        } catch (err) {
            console.error("Failed to fetch category list:", err);
            setCategoryList([]);
        }
    };

    const getEmployeeList = async () => {
        try {
            const employeeData = await getEmployeeListService();
            setEmployeeList(
                Array.isArray(employeeData) ? employeeData : []
            );

            if (!Array.isArray(employeeData) || employeeData.length === 0) {
                console.warn("Employee list is empty.");
            }
        } catch (err) {
            console.error("Failed to fetch employee list:", err);
            setEmployeeList([]);
        }
    };

    useEffect(() => {
        getEmployeeList();
    }, []);

    useEffect(() => {
        getCategoryOptionsList();

    }, []);


    if (!show) return null;

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await onSubmit({
                ledgerPageCrvId: row.ledgerPageCrvId,
                ...values,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const sanitize = (val) => (!val || val === "-" ? "" : val);

    const initialValues = {
        procurement: sanitize(row?.procurement || row?.itemDescription),
        actualItemName: sanitize(row?.actualItemName),
        presentLocation: sanitize(row?.presentLocation),
        personInCharge: sanitize(row?.personInCharge),
        demandNo: sanitize(row?.demandNo),
        itemCategory: sanitize(row?.itemCategory),
        specification: sanitize(row?.specification),
        remarks: sanitize(row?.remarks),
    };

    const validationSchema = Yup.object({
        presentLocation:
            modalFor === "PROJECT" && row?.pageType === "Expendable"
                ? Yup.string().notRequired()
                : Yup.string().required("Present Location is required"),

        personInCharge:
            modalFor === "PROJECT" && row?.pageType === "Expendable"
                ? Yup.number().notRequired()
                : Yup.number()
                    .typeError("Person In Charge is required")
                    .required("Person In Charge is required"),

        itemCategory:
            modalFor === "PROJECT" && row?.pageType === "Expendable"
                ? Yup.string().notRequired()
                : Yup.string().required("Item Category is required"),
    });

    const empOptions = employeeList.map(emp => ({
        value: emp.empId,
        label: emp.displayName ?? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim(),
    }));

    const categoryOptions = categoryList.map(cat => ({
        value: cat.categoryId,
        label: `${cat.categoryCode ?? "-"} (${cat.categoryName ?? "-"})`
    }));



    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
        >
            {({ errors, touched, values, setFieldValue }) => (
                <Form>
                    <div
                        className="modal d-block"
                        tabIndex="-1"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-xl">
                            <div className="modal-content">

                                <div
                                    className="modal-header"
                                    style={{
                                        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                        color: "#fff",
                                    }}
                                >
                                    <h5 className="modal-title mb-0">
                                        {action === "EDIT"
                                            ? `Edit Imported ${modalFor === "PROJECT" ? "Project Wise " : ""}SSR Item`
                                            : `Import ${modalFor === "PROJECT" ? "Project Wise " : ""}SSR Item`}
                                    </h5>


                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={onClose}
                                    />
                                </div>

                                <div className="modal-body text-start">

                                    {/* Info Bar moved from header */}
                                    <div
                                        className="row w-100 mb-4 py-3 ms-1"
                                        style={{
                                            background: "rgb(233 238 243)",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "6px",
                                        }}
                                    >
                                        {modalFor === "DIVISION" && (
                                            <div className="col-md-4">
                                                <strong>SSR No:</strong> {row.ssrNo || "-"}
                                            </div>
                                        )}

                                        <div className={modalFor === "DIVISION" ? "col-md-4" : "col-md-6"}>
                                            <strong>Ledger Name:</strong> {row.ledgerName || "-"}
                                        </div>

                                        <div className={modalFor === "DIVISION" ? "col-md-4" : "col-md-6"}>
                                            <strong>Page No:</strong> {row.pageNo || "-"}
                                        </div>
                                    </div>

                                    <div className="row">

                                        {((row.pageType === "Non-Expendable" && modalFor === "PROJECT") || modalFor === "DIVISION") && (<>

                                            <div className="col-md-6 mb-2">
                                                <label className="form-label">
                                                    Procurement Name
                                                </label>
                                                <Field
                                                    name="procurement"
                                                    className="form-control"
                                                    placeholder="Enter Procurement"
                                                />
                                                <ErrorMessage name="procurement" component="div" className="text-danger" />
                                            </div>

                                            <div className="col-md-6 mb-2">
                                                <label className="form-label">
                                                    Actual Item Name
                                                </label>
                                                <Field
                                                    name="actualItemName"
                                                    className="form-control"
                                                    placeholder="Enter Actual Item Name"
                                                />
                                                <ErrorMessage name="actualItemName" component="div" className="text-danger" />
                                            </div>

                                            <div className="col-md-6 mb-2">
                                                <label className="form-label">
                                                    Present Location <span className="text-danger">*</span>
                                                </label>
                                                <Field
                                                    name="presentLocation"
                                                    className="form-control"
                                                    placeholder="Enter Present Location"
                                                />
                                                <ErrorMessage name="presentLocation" component="div" className="text-danger" />
                                            </div>

                                            <div className="col-md-6 mb-2">
                                                <label htmlFor="personInCharge" className="text-start d-block form-label">Person Incharge <span className="text-danger">*</span> </label>
                                                <Select
                                                    className="text-start"
                                                    options={empOptions}
                                                    value={empOptions.find(opt => opt.value === values.personInCharge) || null}
                                                    onChange={(selected) => setFieldValue("personInCharge", selected ? selected.value : "")}
                                                    isClearable
                                                    placeholder="Select"
                                                />

                                                <ErrorMessage name="personInCharge" component="div" className="text-danger" />
                                            </div>

                                            <div className="col-md-6 mb-2">
                                                <label className="form-label">
                                                    Demand No
                                                </label>
                                                <Field
                                                    name="demandNo"
                                                    className="form-control"
                                                    placeholder="Enter Demand No"
                                                />
                                                <ErrorMessage name="demandNo" component="div" className="text-danger" />
                                            </div>

                                            <div className="col-md-6 mb-2">
                                                <label htmlFor="itemCategory" className="text-start d-block form-label">Item Category : <span className="text-danger">*</span> </label>
                                                <Select
                                                    className="text-start"
                                                    options={categoryOptions}
                                                    value={categoryOptions.find(opt => opt.value === values.itemCategory) || null}
                                                    onChange={(selected) => setFieldValue("itemCategory", selected ? selected.value : "")}
                                                    isClearable
                                                    placeholder="Select"
                                                />
                                                <ErrorMessage name="itemCategory" component="div" className="text-danger" />
                                            </div>

                                            <div className="col-md-6 mb-2">
                                                <label className="form-label">
                                                    Specification
                                                </label>
                                                <Field
                                                    type="text"
                                                    name="specification"
                                                    className="form-control"
                                                    placeholder="Enter Specification"
                                                />
                                                <ErrorMessage name="specification" component="div" className="text-danger" />
                                            </div>

                                        </>)}

                                        <div className={`col-md-${row.pageType === "Expendable" && modalFor === "PROJECT" ? '12' : '6'} mb-2`}>
                                            <label className="form-label">
                                                Remarks
                                            </label>
                                            <Field
                                                type="text"
                                                name="remarks"
                                                className="form-control"
                                                placeholder="Enter Remarks"
                                            />
                                            <ErrorMessage name="remarks" component="div" className="text-danger" />
                                        </div>

                                    </div>
                                </div>

                                <div className="modal-footer justify-content-center mt-3">
                                    <button
                                        type="submit"
                                        className={`${action === "EDIT" ? "btn-warning" : "btn-success"} btn px-4 fw-bold`}
                                    >
                                        {action === "EDIT" ? "UPDATE" : "SUBMIT"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default SsrItemsImportModal;