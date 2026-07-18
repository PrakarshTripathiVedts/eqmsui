import { useEffect, useState } from "react";
import Datatable from "../datatable/datatable";
import { getEquipmentById, getEquipmentListService } from "../../services/masterservice";
import { getFormDetailsList } from "../../services/admin.service"; // Imported for permission checks
import EquipmentAddEditComponent from "./equipmentAddEditComponent";
import "../datatable/master.css";
import { FaDownload, FaEdit, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import Navbar from "../navbar/navbar";
import { printEquipmentDownload } from "../print/equipmentPrint";
import { Tooltip } from "react-tooltip";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "equipment";

const Equipment = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [status, setStatus] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [openPopover, setOpenPopover] = useState(null);

  /* ================= PERMISSIONS STATE ================= */
  const [permissions, setPermissions] = useState({
    forView: false,
    forAdd: false,
    forEdit: false,
    forDelete: false,
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
            forView: match.forView === true || match.forView === 1 || match.forView === "Y",
            forAdd: match.forAdd === true || match.forAdd === 1 || match.forAdd === "Y",
            forEdit: match.forEdit === true || match.forEdit === 1 || match.forEdit === "Y",
            forDelete: match.forDelete === true || match.forDelete === 1 || match.forDelete === "Y",
          });
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    };

    loadPermissions();
  }, []);

  /* ================= BASE COLUMNS ================= */
  const baseColumns = [
    { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center' },
    { name: "Name of Equipment", selector: (row) => row.equipmentName, sortable: true, align: 'text-start' },
    { name: "Serial No", selector: (row) => row.itemSerialNumber, sortable: true, align: 'text-center' },
    { name: "Present Location", selector: (row) => row.presentLocation, sortable: true, align: 'text-start' },
    { name: "Project", selector: (row) => row.projectCode, sortable: true, align: 'text-center' },
    { name: "Parent Location", selector: (row) => row.parentLocation, sortable: true, align: 'text-start' },
    { name: "SSRNo", selector: (row) => row.ssrNo, sortable: true, align: 'text-start' },
    { name: "Specification", selector: (row) => row.specification, sortable: true, align: 'text-start' },
  ];

  /* Dynamic columns addition based on Edit permission or download availability */
  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, sortable: true, align: 'text-center' }]
    : baseColumns;

  /* ================= ACTIONS ================= */
  const editEquipment = async (id) => {
    setEquipmentId(id);
    setStatus('edit');
  };

  const handleEquipmentDownload = async (id) => {
    const data = await getEquipmentById(id);
    await printEquipmentDownload(data);
  };

  const addEquipment = () => {
    setStatus('add');
  };

  /* ================= FETCH DATA ================= */
  const getEquipmentMasterList = async () => {
    try {
      const data = await getEquipmentListService();
      if (Array.isArray(data) && data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      setTableData([]);
    }
  };

  useEffect(() => {
    if (permissions.forView) {
      getEquipmentMasterList();
    }
  }, [permissions.forView]);

  useEffect(() => {
    const handleClick = () => setOpenPopover(null);

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  /* ================= TABLE DATA BUILDER ================= */
  const setTableData = (data) => {
    setEquipmentList(
      data.map((item, index) => ({
        sn: index + 1 + '.',
        equipmentName: item.equipmentName ?? '-',
        itemSerialNumber: item.itemSerialNumber ?? '-',
        presentLocation: item.presentLocation ?? '-',
        projectCode: item.projectCode ?? '-',
        parentLocation: item.parentLocation ?? '-',
        ssrNo: item.ssrNo ?? '-',
        specification: (
          <>
            {item.specification
              ? item.specification.length > 50
                ? (
                  <>
                    {item.specification.substring(0, 50)}...

                    <FaEye
                      className="ms-2 text-primary"
                      style={{
                        cursor: "pointer",
                      }}
                      data-tooltip-id={`specification-tooltip-${item.equipmentId}`}
                      data-tooltip-place="top"
                    />

                    <Tooltip
                      id={`specification-tooltip-${item.equipmentId}`}
                      className="custom-tooltip"
                    >
                      {item.specification}
                    </Tooltip>
                  </>
                )
                : item.specification
              : "-"}
          </>
        ),


        action: (
          <>
            {/* Download button remains available to roles who can view */}
            <button
              type="button"
              className="btn btn-sm btn-outline-success me-2"
              onClick={() => handleEquipmentDownload(item.equipmentId)}
              title="Download Details"
            >
              <FaDownload size={16} />
            </button>

            {/* Edit button conditionally rendered by permission */}
            {permissions.forEdit && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => item.equipmentId != null && editEquipment(item.equipmentId)}
                title="Edit Equipment"
              >
                <FaEdit size={16} />
              </button>
            )}
          </>
        ),
      }))
    );
  };

  /* ================= NO VIEW PERMISSION BLOCK ================= */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Equipment List</h3>
            <p className="text-danger mt-3">
              You do not have permission to view this page.
            </p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ================= SUB-ROUTING WORKFLOWS ================= */
  switch (status) {
    case 'add':
      return <EquipmentAddEditComponent mode={'add'} setStatus={setStatus} refreshList={getEquipmentMasterList} />;
    case 'edit':
      return <EquipmentAddEditComponent mode={'edit'} equipmentId={equipmentId} setStatus={setStatus} refreshList={getEquipmentMasterList} />;

    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Equipment List</h3>

              <div id="card-body customized-card">
                <Datatable columns={columns} data={equipmentList} />
              </div>

              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={() => addEquipment()}>
                    ADD
                  </button>
                )}
                <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
              </div>

            </div>
          </div>
        </div>
      );
  }
};

export default Equipment;