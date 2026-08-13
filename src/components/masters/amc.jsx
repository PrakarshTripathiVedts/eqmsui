import { Link } from "react-router-dom";
import Datatable from "../datatable/datatable";
import Navbar from "../navbar/navbar";
import { useEffect, useState } from "react";
import { getAmcMasterListById, getEquipmentListService } from "../../services/masterservice";
import { getFormDetailsList } from "../../services/admin.service"; // Imported for permission checks
import Select from "react-select";
import CalibrationAddEditComponent from "./calibrationAddEditComponent";
import { FaDownload, FaEdit } from "react-icons/fa";
import { format } from "date-fns";
import AmcAddEditComponent from "./amcAddEditComponent";
import { Tooltip } from "react-tooltip";
import { generateCalibrationPdf } from "./calibrationPrint";
import { generateAmcPdf } from "./amcPrint";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "amc";

const AMCComponent = ({ selectedEquipmentId, selectedEquipmentName }) => {
  const [amcList, setAmcList] = useState([]);
  const [amcId, setAmcId] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentValue, setEquipmentValue] = useState(selectedEquipmentId || '');
  const [equipmentName, setEquipmentName] = useState(selectedEquipmentName || '');
  const [hasAmc, setHasAmc] = useState(false);
  const [status, setStatus] = useState('');
  const [latestDueDate, setLatestDueDate] = useState('');
  const [equipment, setEquipment] = useState({});
  const [latestAmcStartDate, setLatestAmcStartDate] = useState('');

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
    { name: "Agency", selector: (row) => row.agency, sortable: true, align: 'text-start' },
    { name: "AMC Start Date", selector: (row) => row.amcDate, sortable: true, align: 'text-center' },
    { name: "AMC End Date", selector: (row) => row.amcEndDate, sortable: true, align: 'text-center' },
    { name: "Revision", selector: (row) => row.revision, sortable: true, align: 'text-center' },  // ← ADD
  ];

  /* Dynamic columns addition based on Edit permission */
  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, sortable: true, align: 'text-center' }]
    : baseColumns;

  /* ================= ACTIONS ================= */
  const editAmc = async (id) => {
    setAmcId(id);
    setStatus('edit');
  };

  const addAmc = async () => {
    setStatus('add');
  };

  useEffect(() => {
    if (permissions.forView) {
      getEquipmentMasterList();
    }
  }, [permissions.forView]);

  useEffect(() => {
    if (permissions.forView && equipmentValue) {
      fetchAmcMasterListById(equipmentValue);
    }
  }, [equipmentValue, permissions.forView]);

  useEffect(() => {
    if (equipmentList.length > 0) {
      const targetId = selectedEquipmentId || equipmentList[0].equipmentId;
      const matched = equipmentList.find(e => e.equipmentId === Number(targetId) || e.equipmentId === targetId);
      if (matched) {
        setEquipmentValue(matched.equipmentId);
        setEquipmentName(matched.equipmentName);
        setEquipment(matched);
      }
    }
  }, [equipmentList, selectedEquipmentId, selectedEquipmentName]);

  const getEquipmentMasterList = async () => {
    try {
      const data = await getEquipmentListService();
      if (Array.isArray(data) && data.length > 0) {
        setEquipmentList(data);
      } else {
        setEquipmentList([]);
        console.error("Equipment list is empty or invalid.");
      }
    } catch (error) {
      console.error("Error fetching equipment list:", error);
      setEquipmentList([]);
    }
  };

  const equipmentOptions = equipmentList.map(equip => ({
    value: equip.equipmentId,
    label: `${equip?.equipmentName ?? ""} - ${equip?.itemSerialNumber ?? ""}`,
    data: equip,
  }));

  const handleEquipChange = (data) => {
    setEquipmentValue(data?.value);
    setEquipmentName(data?.label);
    setEquipment(data?.data);
  };

  const fetchAmcMasterListById = async (equipmentValue) => {
    try {
      const data = await getAmcMasterListById(equipmentValue);
      if (!data) return;
      if (Array.isArray(data) && data.length > 0) {
        setHasAmc(true);
        setTableData(data);
      } else {
        setHasAmc(false);
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch AMC data:", err);
      setHasAmc(false);
    }
  };

  const handlePrint = (item) => {

    generateAmcPdf(item, equipment)
  };

  const setTableData = (data) => {
    const sortedData = [...data].sort(
      (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
    );
    setLatestDueDate(sortedData[0]?.amcEndDate ?? '');
    setLatestAmcStartDate(sortedData[0]?.amcStartDate ?? '');  // ← ADD
    setAmcList(
      sortedData.map((item, index) => ({
        sn: index + 1 + '.',
        agency: item.amcAgency ?? '-',
        amcDate: item.amcStartDate ? format(new Date(item.amcStartDate), "dd-MM-yyyy") : '-',
        amcEndDate: item.amcEndDate ? format(new Date(item.amcEndDate), "dd-MM-yyyy") : '-',
        revision: item.revision ?? 0,
        action: permissions.forEdit ? (
          <>
            {index === 0 && item.amcId && (
              <>
                <button className="btn btn-outline-success btn-sm me-3"
                  data-tooltip-id="Tooltip"
                  data-tooltip-content="Print"
                  data-tooltip-place="top"
                  onClick={() => handlePrint(item)}
                >
                  <FaDownload />
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => item.amcId != null && editAmc(item.amcId)}
                  data-tooltip-id="Tooltip"
                  data-tooltip-content="Edit"
                  data-tooltip-place="top"
                >
                  <FaEdit size={16} />
                </button>
                <Tooltip id="Tooltip" className='text-white tooltipName' />

              </>
            )}
          </>
        ) : '-',
      }))
    );
  };

  /* ================= NO VIEW PERMISSION SCREEN ================= */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Annual Maintenance Contract (AMC)</h3>
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
      return <AmcAddEditComponent
        mode={'add'}
        equipmentValue={equipmentValue}
        equipmentName={equipmentName}
        setStatus={setStatus}
        latestDueDate={latestDueDate}
        latestAmcStartDate={latestAmcStartDate}
        hasAmc={hasAmc}
        equipment={equipment}
        amcHistory={amcList}          // ← ADD THIS
        refreshList={() => fetchAmcMasterListById(equipmentValue)}
      />;
    case 'edit':
      return <AmcAddEditComponent
        mode={'edit'}
        amcId={amcId}
        equipmentName={equipmentName}
        setStatus={setStatus}
        equipment={equipment}
        refreshList={() => fetchAmcMasterListById(equipmentValue)}
      />;

    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Annual Maintenance Contract (AMC)</h3>

              <div className="row justify-content-center align-items-center rowHeadercolor">
                <div className="col-md-12 d-flex justify-content-end align-items-center flex-wrap">
                  <div className="d-flex align-items-center mb-2">
                    <label htmlFor="equipmentId" className="font-label me-2 mb-0"> Equipment: &nbsp;</label>
                    <div className="text-start " style={{ width: "40vw" }}>
                      <Select
                        options={equipmentOptions}
                        value={equipmentOptions.find(opt => opt.value === Number(equipmentValue)) || null}
                        onChange={(data) => handleEquipChange(data)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div id="card-body customized-card">
                <Datatable columns={columns} data={amcList} />
              </div>

              <div align="center">
                {permissions.forAdd && !hasAmc && (
                  <button className="mt-2 btn add me-2" onClick={() => addAmc()}>
                    ADD
                  </button>
                )}
                {permissions.forAdd && hasAmc && (
                  <button className="mt-2 btn add me-2" onClick={() => addAmc()}>
                    REVISE
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

export default AMCComponent;