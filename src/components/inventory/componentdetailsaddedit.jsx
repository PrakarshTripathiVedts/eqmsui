import { Formik, Form, Field, ErrorMessage } from "formik";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import Navbar from "../navbar/navbar";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import ComponentDetails from "./componentdetails";
import { getComponentDetailsId, saveComponentDetailsData, UpdateComponentDetailsData } from "../../services/componentservices";



const ComponentDetailsAddEditComponent = ({ mode, componentDetailsId, componentValue, componentName }) => {


    const [status, setStatus] = useState('');


    const [formData, setFormData] = useState({


        componentId: componentValue || "",
        componentNomenclature: "",
        partNo: "",
        qty: "",
        roomNo: "",
        almiraahNo: "",
        boxNo: "",
        remarks: "",


    });

      const getDataByComponentDetailsId = async (componentDetailsId) => {
        try {
          const data = await getComponentDetailsId(componentDetailsId);
          if (!data) return;

          setFormData(prev => ({
            ...prev,
            componentDetailsId:data?.componentDetailsId ?? "",
            componentId: data?.componentId ?? "",
            componentNomenclature: data?.componentNomenclature ?? "",
            partNo: data?.partNo ?? "",
            qty: data?.qty ?? "",
            roomNo: data?.roomNo ?? "",
            almiraahNo: data?.almiraahNo ?? "",
            boxNo: data?.boxNo ?? "",
            remarks: data?.remarks ?? "",


          }));
        } catch (err) {
          console.error("Failed to fetch equipment data:", err);
        }
      };

      useEffect(() => {
        if (componentDetailsId) {
          getDataByComponentDetailsId(componentDetailsId);
        }

      }, [componentDetailsId]);


    // Form Validation Schema


    const requiredField = Yup.string().required("This field is required");

    const validationSchema = Yup.object().shape({

        componentNomenclature: requiredField,
        partNo: requiredField,
        qty: requiredField,
        roomNo: requiredField,
        almiraahNo: requiredField,
        boxNo: requiredField,
        remarks: requiredField,

    });


    const handleSubmit = async (values) => {

        const dto = {
            ...values,
        }



        try {
            if (mode === "add") {
                const confirmed = await showConfirmation();
                if (confirmed) {
                    const response = await saveComponentDetailsData(dto);
                    if (response.componentDetailsId != null && response.componentDetailsId > 0) {
                        setStatus('list');
                        showAlert("Success", "Component Details added successfully", "success");
                    }
                    else {
                        showAlert("Error", "Failed to add Component Details. Please try again.", "error");
                    }
                }
            }
            else {
                const confirmed = await showConfirmation();
                if (confirmed) {
                  const response = await UpdateComponentDetailsData(componentDetailsId, dto);
                  if (response.componentDetailsId != null && response.componentDetailsId > 0) {
                    setStatus('list');
                    showAlert("Success", "Component Details updated successfully", "success");
                  }
                  else {
                    showAlert("Error", "Failed to update Component Details. Please try again.", "error");
                  }
                }
              }
        } catch (error) {
            console.error("Submission error:", error);
            showAlert("Error", "Something went wrong. Please try again later.", "error");
        }


    };



    const redirectComponentDetailsList = () => {
        setStatus('list');
    }




    switch (status) {
        case 'list':
    return (
        <ComponentDetails
            selectedComponentId={formData.componentId}
            selectedComponentName={componentName}
        />
    );
        default:
            return (
                <div>
                    <Navbar />
                    <div className="expert-form-container">
                        <div className="form-card">
                            <h4 className="form-title">{mode === "add" ? "Add Component Details" : "Edit Component Details"} - {componentName}</h4>
                            <Formik
                                initialValues={formData}
                                validationSchema={validationSchema}
                                onSubmit={(values) => {

                                    handleSubmit(values);
                                }}

                                enableReinitialize={true}
                            >
                                {({ setFieldValue, setFieldTouched, values }) => (
                                    <Form>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="componentNomenclature" className="text-start d-block">Nomenclature: </label>
                                                    <Field
                                                        type="text"
                                                        name="componentNomenclature"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Nomenclature"
                                                    />
                                                    <ErrorMessage name="componentNomenclature" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                            <div className="col-md-2">
                                                <div className="form-group">
                                                    <label htmlFor="partNo" className="text-start d-block">Part No: </label>
                                                    <Field
                                                        type="text"
                                                        name="partNo"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Part No"
                                                    />
                                                    <ErrorMessage name="partNo" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                            <div className="col-md-2">
                                                <div className="form-group">
                                                    <label htmlFor="qty" className="text-start d-block">Quantity: </label>
                                                    <Field
                                                        type="number"
                                                        name="qty"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Qty"
                                                    />
                                                    <ErrorMessage name="qty" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                            <div className="col-md-2">
                                                <div className="form-group">
                                                    <label htmlFor="roomNo" className="text-start d-block">Room No: </label>
                                                    <Field
                                                        type="text"
                                                        name="roomNo"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Room No"
                                                    />
                                                    <ErrorMessage name="roomNo" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                            <div className="col-md-2">
                                                <div className="form-group">
                                                    <label htmlFor="almiraahNo" className="text-start d-block">Almiraah No: </label>
                                                    <Field
                                                        type="text"
                                                        name="almiraahNo"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Almiraah No"
                                                    />
                                                    <ErrorMessage name="almiraahNo" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                            <div className="col-md-2">
                                                <div className="form-group">
                                                    <label htmlFor="boxNo" className="text-start d-block">Box No: </label>
                                                    <Field
                                                        type="text"
                                                        name="boxNo"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Box No"
                                                    />
                                                    <ErrorMessage name="boxNo" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                            <div className="col-md-2">
                                                <div className="form-group">
                                                    <label htmlFor="remarks" className="text-start d-block">Remarks: </label>
                                                    <Field
                                                        type="text"
                                                        name="remarks"
                                                        className="form-control mb-2"
                                                        placeholder="Enter Remarks"
                                                    />
                                                    <ErrorMessage name="remarks" component="div" className="text-danger text-start" />
                                                </div>
                                            </div>

                                        </div>

                                        <div align="center">
                                            <button type="submit" className={`btn ${mode === "add" ? "submit" : "edit"} mt-3`} >
                                                {mode === "add" ? "SUBMIT" : "UPDATE"}
                                            </button>
                                            <button className="btn back mt-3" onClick={() => redirectComponentDetailsList()}>BACK</button>
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

export default ComponentDetailsAddEditComponent;