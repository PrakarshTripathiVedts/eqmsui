import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Form, Formik } from "formik";
import Select from "react-select";
import "bootstrap/dist/css/bootstrap.min.css";
import toggleStyles from "./ToggleSwitchbtn.module.css";
import roleStyles from "./roleAccess.module.css";
import { 
  getFormModuleList, 
  getFormRoleAccessList, 
  getRolesList, 
  updateFormRoleAccess, 
  getFormDetailsList 
} from "../../services/admin.service";
import Navbar from "../navbar/navbar";
import Datatable from "../datatable/datatable";

/* ================= STORAGE KEYS ================= */
const VISITED_KEY = "roleAccess_visited";
const STATE_KEY = "roleAccess_state_MODULE";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "roleAccess";

const RoleAccessComponent = () => {
  const [formRoleAccessList, setFormRoleAccessList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [formModulesList, setFormModulesList] = useState([]);
  const formikRef = useRef(null);

  /* ================= PERMISSIONS STATE ================= */
  const [permissions, setPermissions] = useState({
    forView:   false,
    forAdd:    false,
    forEdit:   false,
    forDelete: false,
  });

  const [initialValues, setInitialValues] = useState({
    selectedRole: null,
    selectedFormModule: null,
  });

  /* ================= LOAD PERMISSIONS ================= */
  useEffect(() => {
    const roleId = localStorage.getItem("roleId");

    const loadPermissions = async () => {
      try {
        const details = await getFormDetailsList(roleId);
        const detailArray = Array.isArray(details) ? details : details?.data ?? [];

        const match = detailArray.find(
          (d) => d.formUrl?.toLowerCase() === FORM_URL.toLowerCase()
        );

        if (match) {
          setPermissions({
            forView:   match.forView   === true || match.forView   === 1 || match.forView   === "Y",
            forAdd:    match.forAdd    === true || match.forAdd    === 1 || match.forAdd    === "Y",
            forEdit:   match.forEdit   === true || match.forEdit   === 1 || match.forEdit   === "Y",
            forDelete: match.forDelete === true || match.forDelete === 1 || match.forDelete === "Y",
          });
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    };

    loadPermissions();
  }, []);

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    try {
      const roles = await getRolesList();
      const modules = await getFormModuleList();

      setRolesList(roles);
      setFormModulesList(modules);

      const roleOptions = roles.map((r) => ({
        value: r.roleId,
        label: r.roleName,
      }));

      const moduleOptions = [
        { value: 0, label: "All" },
        ...modules.map((m) => ({
          value: m.formModuleId,
          label: m.formModuleName,
        })),
      ];

      const saved = JSON.parse(localStorage.getItem(STATE_KEY));

      const selectedRole = saved?.roleId
        ? roleOptions.find((r) => r.value === saved.roleId)
        : roleOptions[0];

      const selectedModule =
        saved?.moduleId !== undefined
          ? moduleOptions.find((m) => m.value === saved.moduleId)
          : moduleOptions[0];

      if (selectedRole) {
        const list = await getFormRoleAccessList(
          selectedRole.value,
          selectedModule ? selectedModule.value : 0
        );
        setFormRoleAccessList(list);
      }

      setInitialValues({
        selectedRole,
        selectedFormModule: selectedModule,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VISITED_KEY, "true");
    fetchData();
  }, [fetchData]);

  /* ================= FILTER ================= */
  const fetchFilteredData = async (roleId, moduleId) => {
    const list = await getFormRoleAccessList(roleId, moduleId);
    setFormRoleAccessList(list);
  };

  /* ================= MODULE TOGGLE ================= */
  const handleSwitchChange = async (
    index,
    formDetailId,
    formRoleAccessId,
    selectedRole,
    action
  ) => {
    // If the logged-in user lacks Edit permission for the Role Access module, intercept the toggle action.
    if (!permissions.forEdit) return;

    const item = formRoleAccessList[index];
    const newIsActive = action === "View" ? !item.isActive : item.isActive;
    let newForView = action === "View" ? !item.forView : item.forView;
    let newForAdd = action === "Add" ? !item.forAdd : item.forAdd;
    let newForEdit = action === "Edit" ? !item.forEdit : item.forEdit;
    let newForDelete = action === "Delete" ? !item.forDelete : item.forDelete;

    try {
      if (action === "View" && !newForView) {
        newForAdd = false;
        newForEdit = false;
        newForDelete = false;
      }
      if (newForAdd || newForEdit || newForDelete) {
        newForView = true;
      }

      await updateFormRoleAccess(
        formRoleAccessId,
        item.isActive,
        newForView,
        newForAdd,
        newForEdit,
        newForDelete,
        formDetailId,
        selectedRole
      );

      const updatedList = [...formRoleAccessList];
      updatedList[index] = {
        ...item,
        active: newIsActive,
        forView: newForView,
        forAdd: newForAdd,
        forEdit: newForEdit,
        forDelete: newForDelete,
      };
      setFormRoleAccessList(updatedList);
    } catch (error) {
      console.error("Error updating form role access:", error);
    }
  };

  /* ================= SELECT OPTIONS ================= */
  const roleOptions = rolesList.map((r) => ({
    value: r.roleId,
    label: r.roleName,
  }));

  const moduleOptions = [
    { value: 0, label: "All" },
    ...formModulesList.map((m) => ({
      value: m.formModuleId,
      label: m.formModuleName,
    })),
  ];

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    { name: "SN", selector: (row) => row.sn, width: "60px" },
    { name: "Name", selector: (row) => row.formName },
    { name: "View", selector: (row) => row.view },
    { name: "Add", selector: (row) => row.add },
    { name: "Edit", selector: (row) => row.edit },
    { name: "Delete", selector: (row) => row.delete },
  ];

  /* ================= NO VIEW PERMISSION ================= */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Role Access</h3>
            <p className="text-danger mt-3">
              You do not have permission to view this page.
            </p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ================= MAIN VIEW ================= */
  return (
    <div>
      <Navbar />

      <div className="card p-2">
        <div className="card-body">

          {/* Page Title */}
          <h3 className="mb-3">Role Access</h3>

          <Formik
            innerRef={formikRef}
            enableReinitialize
            initialValues={initialValues}
          >
            {({ values, setFieldValue }) => {

              /* ================= TABLE DATA ================= */
              const tableData = formRoleAccessList.map((item, index) => ({
                sn: index + 1,
                formName: item.formName || "-",

                view: (
                  <label className={toggleStyles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={item.forView}
                      disabled={!permissions.forEdit} // Gray out or lock input if unauthorized
                      onChange={() =>
                        handleSwitchChange(
                          index,
                          item.formDetailId,
                          item.formRoleAccessId,
                          values.selectedRole?.value,
                          "View"
                        )
                      }
                    />
                    <span className={toggleStyles.slider} />
                  </label>
                ),

                add: (
                  <label className={toggleStyles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={item.forAdd}
                      disabled={!permissions.forEdit} // Gray out or lock input if unauthorized
                      onChange={() =>
                        handleSwitchChange(
                          index,
                          item.formDetailId,
                          item.formRoleAccessId,
                          values.selectedRole?.value,
                          "Add"
                        )
                      }
                    />
                    <span className={toggleStyles.slider} />
                  </label>
                ),

                edit: (
                  <label className={toggleStyles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={item.forEdit}
                      disabled={!permissions.forEdit} // Gray out or lock input if unauthorized
                      onChange={() =>
                        handleSwitchChange(
                          index,
                          item.formDetailId,
                          item.formRoleAccessId,
                          values.selectedRole?.value,
                          "Edit"
                        )
                      }
                    />
                    <span className={toggleStyles.slider} />
                  </label>
                ),

                delete: (
                  <label className={toggleStyles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={item.forDelete}
                      disabled={!permissions.forEdit} // Gray out or lock input if unauthorized
                      onChange={() =>
                        handleSwitchChange(
                          index,
                          item.formDetailId,
                          item.formRoleAccessId,
                          values.selectedRole?.value,
                          "Delete"
                        )
                      }
                    />
                    <span className={toggleStyles.slider} />
                  </label>
                ),
              }));

              return (
                <Form>
                  {/* ================= DROPDOWNS ================= */}
                  <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                      <div className="row g-3 text-start">
                        <div className="col-md-4">
                          <label className="fw-semibold">Role</label>
                          <Select
                            options={roleOptions}
                            value={values.selectedRole}
                            onChange={(e) => {
                              setFieldValue("selectedRole", e);
                              fetchFilteredData(
                                e.value,
                                values.selectedFormModule?.value ?? 0
                              );
                            }}
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="fw-semibold">Module</label>
                          <Select
                            options={moduleOptions}
                            value={values.selectedFormModule}
                            onChange={(e) => {
                              setFieldValue("selectedFormModule", e);
                              fetchFilteredData(
                                values.selectedRole?.value,
                                e.value
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ================= TABLE ================= */}
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <Datatable columns={columns} data={tableData} />
                    </div>
                  </div>

                  {/* ================= BACK BUTTON ================= */}
                  <div className="mt-3">
                    <Link className="btn back" to="/dashboard">
                      BACK
                    </Link>
                  </div>

                </Form>
              );
            }}
          </Formik>

        </div>
      </div>
    </div>
  );
};

export default RoleAccessComponent;