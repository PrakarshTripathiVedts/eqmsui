import { format } from "date-fns";
import { useEffect, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import Datatable from "../datatable/datatable";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom"; // Added for BACK button redirection
import { getAuditStampingList, getUserManagerList, getFormDetailsList } from "../../services/admin.service";
import { formatfromtoDate } from "../../services/auth.service";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "auditStamping";

const AuditStamping = () => {
  const [auditStamping, setAuditStamping] = useState([]);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Permissions State
  const [permissions, setPermissions] = useState({
    forView:   false,
    forAdd:    false,
    forEdit:   false,
    forDelete: false,
  });

  const today = new Date();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(today.getDate() - 30);
    return d;
  });
  const [toDate, setToDate] = useState(today);

  const roleName = localStorage.getItem("role");
  const loginId = localStorage.getItem("loginId");
  const userName = localStorage.getItem("userName");

  const getMinDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() - 20, d.getMonth(), d.getDate());
  };

  const getMaxDate = () => {
    const d = new Date();
    return new Date(d.getFullYear() + 50, d.getMonth(), d.getDate());
  };

  const parseDateTime = (str) => {
    if (!str || str === "-") return new Date(0);
    const [datePart, timePart] = str.split(" ");
    const [dd, mm, yyyy] = datePart.split("-").map(Number);
    let hh = 0, min = 0, sec = 0;
    if (timePart) [hh, min, sec] = timePart.split(":").map(Number);
    return new Date(yyyy, mm - 1, dd, hh, min, sec);
  };

  const columns = [
    { name: "SN", selector: (row) => row.sn, sortable: true, align: "text-center" },
    { name: "Login Date", selector: (row) => row.loginDate, sortable: true, sortValue: (row) => parseDateTime(row.loginDate), align: "text-center" },
    { name: "IP Address", selector: (row) => row.ipAddress, sortable: true, align: "text-center" },
    { name: "Mac Address", selector: (row) => row.macAddress, sortable: true, align: "text-center" },
    { name: "Logout Type", selector: (row) => row.logoutType, sortable: true, align: "text-center" },
    { name: "Logout Date", selector: (row) => row.logoutDate, sortable: true, sortValue: (row) => parseDateTime(row.logoutDate), align: "text-center" },
  ];

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

  /** Fetch audit list for given user + date range */
  const fetchAuditList = useCallback(async (user, from, to) => {
    if (!user?.value) return;
    try {
      const data = await getAuditStampingList(user.value, from, to);
      const list = Array.isArray(data) ? data : [];
      setAuditStamping(
        list.map((item, index) => ({
          sn: index + 1,
          loginDate: item.loginDate
            ? format(new Date(item.loginDate), "dd-MM-yyyy HH:mm:ss")
            : "-",
          ipAddress: item.ipAddress || "-",
          macAddress: item.macAddress || "-",
          logoutType: item.logoutType || "-",
          logoutDate: item.logoutDate
            ? format(new Date(item.logoutDate), "dd-MM-yyyy HH:mm:ss")
            : "-",
        }))
      );
    } catch (err) {
      setAuditStamping([]);
    }
  }, []);

  /** On mount: load users, set default, fetch initial data */
  useEffect(() => {
    // Only proceed to load structural user lists if viewing permissions pass 
    const fetchUsers = async () => {
      try {
        const allUsers = await getUserManagerList();
        if (!Array.isArray(allUsers)) return;

        const filtered =
          roleName === "ROLE_ADMIN"
            ? allUsers
            : allUsers.filter((u) => String(u.loginId) === String(loginId));

        const options = filtered.map((u) => ({
          value: u.userName,
          label: `${u.userName} (${u.empName})`,
        }));

        setUserList(options);

        const defaultUser =
          roleName === "ROLE_ADMIN"
            ? options.find((o) => o.value === userName) || options[0]
            : options[0];

        if (defaultUser) {
          setSelectedUser(defaultUser);
          await fetchAuditList(
            defaultUser,
            formatfromtoDate(fromDate),
            formatfromtoDate(toDate)
          );
        }
      } catch (err) {
        console.error("Error fetching user list:", err);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= NO VIEW PERMISSION BLOCK ================= */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card mt-5">
          <div className="card-body text-center">
            <h3 className="custom-heading">Audit Stamping</h3>
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
      <div className="card mt-5">
        <div className="card-body">
          <div className="row">
            <div className="col-md-12 text-start">
              <h3 className="custom-heading">Audit Stamping</h3>
              <br />
            </div>
          </div>

          {/* Filters */}
          <div className="row g-3 justify-content-end">

            {/* User Dropdown */}
            <div className="col-md-3 d-flex align-items-center text-start" style={{ width: "35%" }}>
              <label className="dak-label me-2 mb-0">UserName:</label>
              <div className="flex-grow-1">
                <Select
                  options={userList}
                  value={selectedUser}
                  onChange={(newValue) => {
                    setSelectedUser(newValue);
                    fetchAuditList(
                      newValue,
                      formatfromtoDate(fromDate),
                      formatfromtoDate(toDate)
                    );
                  }}
                  isSearchable
                  className="my-1"
                  styles={{
                    option: (provided) => ({
                      ...provided,
                      minWidth: "250px",
                      textAlign: "left",
                    }),
                  }}
                />
              </div>
            </div>

            {/* From Date */}
            <div className="col-md-2 d-flex align-items-center">
              <label className="dak-label me-3 mb-0">From</label>
              <DatePicker
                selected={fromDate}
                onChange={(newValue) => {
                  setFromDate(newValue);
                  fetchAuditList(
                    selectedUser,
                    formatfromtoDate(newValue),
                    formatfromtoDate(toDate)
                  );
                }}
                className="form-control my-1"
                placeholderText="From Date"
                dateFormat="dd-MM-yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                onKeyDown={(e) => e.preventDefault()}
              />
            </div>

            {/* To Date */}
            <div className="col-md-2 d-flex align-items-center">
              <label className="dak-label me-3 mb-0">To</label>
              <DatePicker
                selected={toDate}
                onChange={(newValue) => {
                  setToDate(newValue);
                  fetchAuditList(
                    selectedUser,
                    formatfromtoDate(fromDate),
                    formatfromtoDate(newValue)
                  );
                }}
                className="form-control my-1"
                placeholderText="To Date"
                dateFormat="dd-MM-yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                onKeyDown={(e) => e.preventDefault()}
              />
            </div>
          </div>

          <br />

          {/* Table */}
          <div id="card-body customized-card">
            <Datatable columns={columns} data={auditStamping} />
          </div>

          {/* Optional Action Footer (e.g. Back Link matching design) */}
          <div align="center" className="mt-3">
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuditStamping;