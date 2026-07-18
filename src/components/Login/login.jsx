import { useState } from "react";
import './login.css';
import loginimage from '../../assets/images/login_image.jpg';
import drdologo from '../../assets/images/drdologo.png';
import { MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import withRouter from "../../common/with-router";
import { login } from "../../services/auth.service";
import { useNavigate } from "react-router-dom";

const LoginPage = (props) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const initialValues = { username: "", password: "" };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .required("Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must not exceed 20 characters"),
    password: Yup.string()
      .required("Password is required")
      .min(3, "Password must be at least 3 characters")
      .max(40, "Password must not exceed 40 characters"),
  });

  const handleLoginSubmit = async (values) => {
    setMessage("");
    setLoading(true);
    try {
      const { username, password } = values;
      const response = await login(username, password);
      if (response?.token) {
        navigate("/dashboard");
      } else {
        showError("Login failed. Please try again.");
      }
    } catch (error) {
      let resMessage = "Something went wrong. Try again.";
      if (error.response) {
        if (error.response.status === 401) {
          resMessage = "Username or password is incorrect";
        } else if (error.response.data?.message) {
          resMessage = error.response.data.message;
        }
      }
      showError(resMessage);
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="login-page">
      <header className="login-topbar">
        <img src={drdologo} alt="DRDO Logo" className="login-topbar-logo" />
        <div className="login-topbar-text">
          <h1>Equipment &amp; Project Inventory Monitoring System (EQPIMS Ver1.0)</h1>
          <h2 className="text-center">Directorate of Portable Short Range Radar (DPSRR)</h2>
        </div>
      </header>

      <main className="login-main">
        {/* LEFT — instrument panel */}
        <section className="login-visual">
          <div className="radar-grid" aria-hidden="true"></div>
          <div className="scan-line" aria-hidden="true"></div>
          <div className="login-visual-content">
            <img src={loginimage} alt="" className="login-visual-image" />
          </div>
          <div className="login-visual-caption">

            <p>Real-time visibility into equipment, calibration, and inventory across DPSRR installations.</p>
          </div>
        </section>

        {/* RIGHT — form panel */}
        <section className="login-form-panel">
          <div className="login-form-inner">
            <h2 className="mb-3">Sign in</h2>


            {message && (
              <div className="login-alert" role="alert">
                {message}
              </div>
            )}

            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleLoginSubmit}>
              {({ errors, touched, handleChange, values }) => (
                <Form className="login-form">
                  <div className="field-group">
                    <label htmlFor="username">Username</label>
                    <div className="field-control">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your username"
                        value={values.username}
                        onChange={handleChange}
                      />
                      <MdPerson className="field-icon" />
                    </div>
                    {errors.username && touched.username && (
                      <div className="field-error">{errors.username}</div>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="password">Password</label>
                    <div className="field-control">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={values.password}
                        onChange={handleChange}
                      />
                      <span
                        className="field-icon field-icon-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        role="button"
                        tabIndex={0}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </span>
                    </div>
                    {errors.password && touched.password && (
                      <div className="field-error">{errors.password}</div>
                    )}
                  </div>

                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? "Signing in…" : "Login"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <small>Website maintained by Vedant Tech Solutions</small>
      </footer>
    </div>
  );
};

export default withRouter(LoginPage);