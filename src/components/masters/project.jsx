import { useEffect, useState } from "react";
import { getProjectListService } from "../../services/masterservice";
import { getFormDetailsList } from "../../services/admin.service";
import Navbar from "../navbar/navbar";
import { FaEdit } from "react-icons/fa";
import Datatable from "../datatable/datatable";
import { Link } from "react-router-dom";
import ProjectAddEditComponent from "./projectAddEditComponent"; // ✅ correct import

const FORM_URL = "projectMaster";

const ProjectComponent = () => {
  const [projectList, setProjectList] = useState([]);
  const [status, setStatus]           = useState("list"); // ✅ default = "list" not ""
  const [projectId, setProjectId]     = useState(null);

  const [permissions, setPermissions] = useState({
    forView: false, forAdd: false, forEdit: false, forDelete: false,
  });

  /* ── Load permissions ── */
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

  /* ── Columns ── */
  const baseColumns = [
    { name: "SN",                         selector: (row) => row.sn,               sortable: true, align: "text-center" },
    { name: "Project Code",               selector: (row) => row.projectCode,       sortable: true, align: "text-center" },
    { name: "Project Name",               selector: (row) => row.projectName,       sortable: true, align: "text-start"  },
    { name: "Sanction Date",              selector: (row) => row.sanctionDate,      sortable: true, align: "text-center" },
    { name: "Sanction Cost (₹) Lakh",    selector: (row) => row.sanctionCost,      sortable: true, align: "text-end"   },
    { name: "PDC",                        selector: (row) => row.pdc,               sortable: true, align: "text-center" },
    { name: "Project Director",           selector: (row) => row.projectDirector,   sortable: true, align: "text-start"  },
  ];

  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: "text-center" }]
    : baseColumns;

  /* ── Actions ── */
  const editProject = (id) => { setProjectId(id); setStatus("edit"); };
  const addProject  = ()    => setStatus("add");

  /* ── Formatters ── */
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return "-";
    return `${String(date.getDate()).padStart(2,"0")}-${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}`;
  };

  const formatINR = (amount) => {
    if (amount == null || amount === "") return "-";
    return Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ── Data builder ── */
  const setTableData = (data) => {
    setProjectList(
      data.map((item, index) => ({
        sn:              index + 1 + ".",
        projectCode:     item.projectCode ?? "-",
        projectName:     item.projectName ?? "-",
        sanctionDate:    formatDate(item.sanctionDate),
        sanctionCost:    formatINR(item.totalSanctionCost),
        pdc:             formatDate(item.pdc),
        projectDirector: item.projectDirectorName ?? "-",
        action: permissions.forEdit ? (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => item.projectId != null && editProject(item.projectId)}
            title="Edit Project"
          >
            <FaEdit size={16} />
          </button>
        ) : "-",
      }))
    );
  };

  /* ── Fetch list ── */
  const getProjectMasterList = async () => {
    try {
      const data = await getProjectListService();
      setTableData(Array.isArray(data) && data.length > 0 ? data : []);
    } catch {
      setTableData([]);
    }
  };

  useEffect(() => {
    if (permissions.forView) getProjectMasterList();
  }, [permissions.forView]);

  /* ── No permission screen ── */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Project List</h3>
            <p className="text-danger mt-3">You do not have permission to view this page.</p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Sub-routing ── */
  switch (status) {
    case "add":
      return (
        <ProjectAddEditComponent
          mode="add"
          setStatus={setStatus}
          refreshList={getProjectMasterList}
        />
      );
    case "edit":
      return (
        <ProjectAddEditComponent
          mode="edit"
          projectId={projectId}
          setStatus={setStatus}
          refreshList={getProjectMasterList}
        />
      );
    default: // "list"
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Project List</h3>
              <div id="card-body customized-card">
                <Datatable columns={columns} data={projectList} />
              </div>
              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={addProject}>ADD</button>
                )}
                <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default ProjectComponent;