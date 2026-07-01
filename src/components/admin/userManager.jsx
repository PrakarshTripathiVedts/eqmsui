import { useEffect, useState } from "react";
import { getUserManagerList, getFormDetailsList } from "../../services/admin.service"; // ✅ Imported reset function
import Datatable from "../datatable/datatable";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom";
import { FaUserEdit, FaKey } from "react-icons/fa"; // ✅ Imported FaKey icon
import UserManagerAddEditComponent from "./userManagerAddEdit";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import { resetUserPassword } from "../../services/masterservice";

const FORM_URL = "userManager";

const UserManager = () => {
  const [userManager, setUserManagerList] = useState([]);
  const [status, setStatus]   = useState("list"); 
  const [loginId, setLoginId] = useState(null);
  const [message, setMessage] = useState(""); // ✅ Success message state
  const [permissions, setPermissions] = useState({
    forView: false, forAdd: false, forEdit: false, forDelete: false,
  });

  /* ── Permissions ── */
  useEffect(() => {
    const roleId = localStorage.getItem("roleId");
    const loadPermissions = async () => {
      try {
        const details = await getFormDetailsList(roleId);
        const detailArray = Array.isArray(details) ? details : details?.data ?? [];
        const match = detailArray.find((d) => d.formUrl?.toLowerCase() === FORM_URL.toLowerCase());
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

  /* ── List ── */
  const getManagerList = async () => {
    try {
      const data = await getUserManagerList();
      setTableData(Array.isArray(data) && data.length > 0 ? data : []);
    } catch {
      setTableData([]);
    }
  };

  useEffect(() => {
    if (permissions.forView) getManagerList();
  }, [permissions.forView]);

  /* ── Actions ── */
  const editUser = (id) => { setLoginId(id); setStatus("edit"); };
  const addUser  = ()    => setStatus("add");

  // ✅ Updated Reset Password Action matching handleSubmit style
const handleResetPassword = async (loginId, userName) => {
 const confirmed = await showConfirmation();
  if (!confirmed) return;

  try {
    // 1. Call the backend api service
    await resetUserPassword(loginId);
    
    // 2. ✅ Triggers a popup alert matching the handleSubmit theme
    showAlert("Success", "Password reset successfully as 123", "success");
    
    // 3. Optional: Refresh list just to stay safe
    getManagerList(); 
    
  } catch (error) {
    console.error("Error resetting password:", error);
    const msg = error?.response?.data?.message ?? "Failed to reset password. Please try again.";
    showAlert("Error", msg, "error");
  }
};

  /* ── Table data ── */
  const setTableData = (data) => {
    setUserManagerList(
      data.map((item, index) => ({
        sn:       index + 1 + ".",
        userName: item.userName ?? "-",
        empName:  item.empName  ?? "-",
        roleName: item.roleName ?? "-",
        action: permissions.forEdit ? (
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-warning btn-sm me-1"
              onClick={() => item.loginId != null && editUser(item.loginId)}
              title="Edit User"
            >
              <FaUserEdit size={16} />
            </button>
            
            {/* ✅ Reset Password Button Added */}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => item.loginId != null && handleResetPassword(item.loginId, item.userName)}
              title="Reset Password"
            >
              <FaKey size={14} />
            </button>
          </div>
        ) : "-",
      }))
    );
  };

  /* ── Columns ── */
  const baseColumns = [
    { name: "SN",        selector: (row) => row.sn,        sortable: true, align: "text-center" },
    { name: "User Name", selector: (row) => row.userName,  sortable: true, align: "text-center" },
    { name: "Employee",  selector: (row) => row.empName,   sortable: true, align: "text-start"  },
    { name: "Role Name", selector: (row) => row.roleName,  sortable: true, align: "text-center" },
  ];

  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: "text-center" }]
    : baseColumns;

  /* ── No permission ── */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>User Manager List</h3>
            <p className="text-danger mt-3">You do not have permission to view this page.</p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Routing ── */
  switch (status) {
    case "add":
      return (
        <UserManagerAddEditComponent
          mode="add"
          setStatus={setStatus}
          refreshList={getManagerList}
        />
      );
    case "edit":
      return (
        <UserManagerAddEditComponent
          mode="edit"
          loginId={loginId}
          setStatus={setStatus}
          refreshList={getManagerList}
        />
      );
    default: // "list"
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>User Manager List</h3>
              
              {/* ✅ Success Alert Box */}
              {message && (
                <div className="alert alert-success my-2" role="alert">
                  {message}
                </div>
              )}

              <div id="card-body customized-card">
                <Datatable columns={columns} data={userManager} />
              </div>
              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={addUser}>ADD</button>
                )}
                <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default UserManager;