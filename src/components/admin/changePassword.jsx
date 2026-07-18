import { Form, Formik ,Field, ErrorMessage} from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import changePasswordStyles from './changePassword.module.css';
import Navbar from "../navbar/navbar";
import { changePassWord } from "../../services/admin.service";
import { showConfirmation } from "../datatable/swalHelper";

function ChangePasswordComponent(){

    const navigate = useNavigate();

    const initialValues = {
        oldPassword:"",
        newPassword:""
    };

    const validationSchema = Yup.object().shape({
        oldPassword: Yup.string().required("Old password is required"),
        newPassword: Yup.string().required("New password is required").min(8, "Password should be at least 8 characters")
        .matches(/^\S*$/, "Password must not contain spaces")
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
        .matches(/[0-9]/,"Password must contain at least one number")
        .notOneOf([Yup.ref("oldPassword")], "New password must not be the same as old password")
    });

    const handleSubmit = async (values) => {
        const successMessage = "PassWord  Updated Successfully!";
        const unsuccessMessage = "PassWord Update Unsuccessful!";
        const Title = "Are you sure to Update ?";
        const confirmed = await showConfirmation();
        if (confirmed) {
            try {
                Swal.fire({
                    title: "Please wait...",
                    html: `
                <div class="loader"></div>
                <p>Please wait while we process your request.</p>
            `,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                });
                const result = await changePassWord(values);
                if (result?.status === 200) {
                    Swal.fire({
                        icon: "success",
                        title: '',
                        text: `${successMessage}`,
                        showConfirmButton: false,
                        timer: 2500
                    });
                    navigate('/dashboard');
                } else {
                    Swal.fire({
                        icon: "error",
                        title: unsuccessMessage,
                        showConfirmButton: false,
                        timer: 2500
                    });
                }
            } catch (error) {
                console.error('Error Update Password:', error);
                Swal.fire('Error!', 'There was an issue with the Update Password.', 'error');
            }
        }
    }

    return (<div>
                <Navbar/>
                <div className="container-fluid row">	
                    <div className="col-md-12">
                        <div className="card mt-4">
                            <div className={`card-header mt-2 bg-dark-nav`}>
                                <div className="row">
                                    {/* <!-- Left content in the header --> */}
                                    <div className="col-md-2 ps-0">
                                        <h5 className="ml-0 mt-2"><b>Password Change</b></h5> 
                                    </div>

                                    {/* <!-- Right content in the header --> */}
                                    <div className="col-md text-md-end">
                                        <div className="mb-2" >
                                            <div className="p-0">
                                                <p className={`btn btn-info btn-sm back ${changePasswordStyles.button}`}  onClick={()=>navigate('/dashboard')}>Back</p>
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="col-md-12 mt-4">
                                    <Formik 
                                        initialValues={initialValues}
                                        validationSchema={validationSchema}
                                        onSubmit={handleSubmit}
                                    >
                                       <Form>
                                            <div className="form-group row mb-4  justify-content-center">
                                                <label htmlFor="oldPassword" className="col-sm-2 col-form-label">
                                                    OLD PASSWORD <span className="text-danger">*</span>
                                                </label>
                                                <div className={`col-sm-10 ${changePasswordStyles.inputfield}`} >
                                                    <Field name="oldPassword"  type="password" className="form-control" required placeholder="Enter your old password" />
                                                    <ErrorMessage name="oldPassword" component="div" className="text-danger mt-1" />
                                                </div>
                                            </div>

                                            <div className="form-group row mb-4  justify-content-center">
                                                <label htmlFor="newPassword" className="col-sm-2 col-form-label">
                                                    NEW PASSWORD <span className="text-danger">*</span>
                                                </label>
                                                <div className={`col-sm-10 ${changePasswordStyles.inputfield}`} >
                                                    <Field name="newPassword" type="password" className="form-control" required placeholder="Enter your new password"/>
                                                    <ErrorMessage name="newPassword" component="div" className="text-danger mt-1" />
                                                </div>
                                            </div>
                                            <div>
                                                <button type="submit" className="btn mt-3 mb-4 back p-2"> 
                                                    Change Password
                                                </button>
                                            </div>
                                        </Form>
                                    </Formik>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>);

}

export default  ChangePasswordComponent;