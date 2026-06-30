import { useEffect, useState } from "react";
import { getEmployeeListService } from "../../services/masterservice";
import { getFormDetailsList } from "../../services/admin.service";
import Navbar from "../navbar/navbar";
import { FaEdit } from "react-icons/fa";
import Datatable from "../datatable/datatable";
import { Link } from "react-router-dom";
import EmployeeAddEditComponent from "./employeeAddEditComponent";

/* ─── adjust this to match your formUrl for this page ─── */
const FORM_URL = "employee"; // must match detail.formUrl in your DB

const EmployeeComponent = () => {

  const [employeeList, setEmployeeList]   = useState([]);
  const [status, setStatus]               = useState('');
  const [employeeId, setEmployeeId]       = useState(null);
  const [permissions, setPermissions]     = useState({
    forView:   false,
    forAdd:    false,
    forEdit:   false,
    forDelete: false,
  });

  /* ================= LOAD PERMISSIONS ================= */
  useEffect(() => {
    const roleId = localStorage.getItem("roleId");

    const loadPermissions = async () => {
      try {
        const details = await getFormDetailsList(roleId);
        const detailArray = Array.isArray(details) ? details : details?.data ?? [];

        // find the row that belongs to THIS page
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

  /* ================= LOAD EMPLOYEE LIST ================= */
  const getEmployeeMasterList = async () => {
    try {
      const data = await getEmployeeListService();
      setTableData(Array.isArray(data) && data.length > 0 ? data : []);
    } catch (err) {
      setTableData([]);
    }
  };

  useEffect(() => {
    getEmployeeMasterList();
  }, []);

  /* ================= TABLE DATA ================= */
  const setTableData = (data) => {
    setEmployeeList(
      data.map((item, index) => ({
        sn:           index + 1 + ".",
        employeeName: item.displayName  ?? "-",
        division:     item.divisionName ?? "-",
        punchCard:    item.punchCardNo  ?? "-",
        email:        item.email        ?? "-",
        mobile:       item.mobileNo     ?? "-",

        // Edit button shown only when forEdit permission is true
        action: permissions.forEdit ? (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => item.empId != null && editEmployee(item.empId)}
            title="Edit Employee"
          >
            <FaEdit size={16} />
          </button>
        ) : "-",
      }))
    );
  };

  /* ================= ACTIONS ================= */
  const editEmployee = (id) => { setEmployeeId(id); setStatus("edit"); };
  const addEmployee  = ()    => { setStatus("add"); };

  /* ================= COLUMNS ================= */
  // hide Action column entirely if neither edit nor delete is allowed
  const baseColumns = [
    { name: "SN",         selector: (row) => row.sn,           sortable: true, align: "text-center" },
    { name: "Employee",   selector: (row) => row.employeeName,  sortable: true, align: "text-start"  },
    { name: "Division",   selector: (row) => row.division,      sortable: true, align: "text-center" },
    { name: "Punch Card", selector: (row) => row.punchCard,     sortable: true, align: "text-center" },
    { name: "Email",      selector: (row) => row.email,         sortable: true, align: "text-start"  },
    { name: "Mobile",     selector: (row) => row.mobile,        sortable: true, align: "text-center" },
  ];

  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: "text-center" }]
    : baseColumns;

  /* ================= ROUTING ================= */
  switch (status) {
    case "add":
      return <EmployeeAddEditComponent mode="add" />;
    case "edit":
      return <EmployeeAddEditComponent mode="edit" employeeId={employeeId} />;
    default:
      break;
  }

  /* ================= NO VIEW PERMISSION ================= */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Employee List</h3>
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
        <div className="card-body text-center">
          <h3>Employee List</h3>

          <div id="card-body customized-card">
            <Datatable columns={columns} data={employeeList} />
          </div>

          <div align="center">
            {/* Add button shown only when forAdd permission is true */}
            {permissions.forAdd && (
              <button className="mt-2 btn add" onClick={addEmployee}>
                ADD
              </button>
            )}
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeComponent;