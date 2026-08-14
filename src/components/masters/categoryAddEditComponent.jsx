import { useEffect, useState } from "react";
import Navbar from "../navbar/navbar";
import * as Yup from "yup";
import { Formik } from "formik";
import { Form } from "formik";
import { Field, ErrorMessage } from "formik";
import { showAlert } from "../datatable/swalHelper";
import { showConfirmation } from "../datatable/swalHelper";
import { getCategoryById, saveCategoryMaster, updateCategoryMaster } from "../../services/masterservice";

const CategoryAddEditComponent = ({
  mode,
  categoryId,
  setStatus,
  refreshList,
  existingCategories = [], //NEW:raw category list from parent ,used for duplicate check
  onClose,
}) => {

  const [initialValues, setInitialValues] = useState({
    categoryCode: "",
    categoryName: "",
  });

  const [loading, setLoading] = useState(true);

  const [originalCategoryCode, setOriginalCategoryCode] = useState(null)

  /* ── Load Category for edit ── */

  useEffect(() => {
    const loadCategory = async () => {
      if (mode === "edit" && categoryId) {
        try {
          const data = await getCategoryById(categoryId);
          setInitialValues({
            categoryCode: data.categoryCode ?? "",
            categoryName: data.categoryName ?? "",
          });
          setOriginalCategoryCode(data.categoryCode ?? null);
        } catch (e) {
          console.error("Failed to load category", e);
        }
      }
      setLoading(false);
    };
    loadCategory();
  }, [mode, categoryId]);


  const isDuplicateCategoryCode = (code) => {
    if (!code) return false;
    const trimmed = code.trim().toLowerCase();
    if (mode === "edit" &&
      originalCategoryCode &&
      originalCategoryCode.trim().toLowerCase() === trimmed) {
      return false;
    }
    return existingCategories.some((item) =>
      item.categoryCode &&
      item.categoryCode.trim().toLowerCase() === trimmed
    );
  };
  /* ── Validation schema ── */
  // Recreated on every render, so it always closes over the latest
  // existingCategory / mode / categoryId

  const validationSchema = Yup.object({
    categoryCode: Yup.string()
      .trim()
      .max(10, "Max 10 characters")
      .required("Category code is required")
      .test(
        "unique-category-code",
        "Category Code already exists",
        (value) => !isDuplicateCategoryCode(value)
      ),
    categoryName: Yup.string()
      .trim()
      .max(255, "Max 255 characters")
      .required("Category name is required"),
  })

  /* ── Submit ── */
  const handleSubmit = async (values, { setSubmitting }) => {
    // Duplicate category code check
    if (isDuplicateCategoryCode(values.categoryCode)) {
      showAlert("error", "Category Code already exists.");
      return;
    }
    const confirmed = await showConfirmation(
      mode === "add" ? "Add Category?" : "Update Category?");

    if (!confirmed) return;


    const payload = {
      categoryCode: values.categoryCode.trim(),
      categoryName: values.categoryName.trim(),
    };
    try {
      if (mode === "add") {
        // ADD API
        await saveCategoryMaster(payload);
        showAlert("success", "Category added successfully.");
      } else {
        // UPDATE API
        await updateCategoryMaster({
          ...payload, categoryId
        });
        showAlert("success", "Category updated successfully.");
      }
      refreshList?.();
      // setStatus("list"); //uncomment when using with out model
      onClose();
    } catch (error) {
      console.error("Save Category failed", error);
      const errorMessage =
        error?.response?.data?.message ??
        "Failed to save category. Please try again.";
      showAlert("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div>
        {/* <Navbar /> */}
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
      {/* <Navbar /> */}
      <div className="card p-2">
        <div className="card-body">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            {/* <h5 className="mb-0 fw-semibold">
            {mode === "add" ? "Add New Category" : "Edit Category"}
          </h5> */}
          </div>

          {/* Formik Form */}
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values,
              setFieldValue,
              setFieldTouched,
              touched,
              errors,
              isSubmitting,
            }) => (
              <Form>
                <div className="row g-3 text-start">
                  {/* Category Code */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Category Code <span className="text-danger">*</span>
                    </label>
                    <Field
                      name="categoryCode"
                      className={`form-control ${touched.categoryCode && errors.categoryCode ? "is-invalid" : ""}`}
                      placeholder="Enter Category Code"
                      maxLength={10}
                    />
                    <ErrorMessage
                      name="categoryCode"
                      component="div"
                      className="invalid-feedback"
                    />
                  </div>
                  {/* Category Name */}
                  <div className="col-md-9">
                    <label className="form-label fw-semibold">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <Field
                      name="categoryName"
                      className={`form-control ${touched.categoryName && errors.categoryName ? "is-invalid" : ""}`}
                      placeholder="Enter Category Name"
                      maxLength={255}
                    />
                    <ErrorMessage
                      name="categoryName"
                      component="div"
                      className="invalid-feedback"
                    />
                  </div>
                </div>
                {/* Buttons */}
                <div className="d-flex justify-content-center gap-2 mt-4 pt-3 border-top">
                  <button type="submit" className={`btn px-4 ${mode === "edit" ? "btn-warning" : "btn-success"}`}
                  >
                    {mode === "add" ? ("SUBMIT") : ("UPDATE")}
                  </button>
                  <button type="button" className="btn  back px-4"
                    // onClick={() => setStatus("list")}  // with out model 
                    onClick={onClose} //for  model
                    disabled={isSubmitting}>
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



}

export default CategoryAddEditComponent;