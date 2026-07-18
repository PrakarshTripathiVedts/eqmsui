import { Link } from "react-router-dom";
import Datatable from "../datatable/datatable";
import Navbar from "../navbar/navbar";
import { useEffect, useState } from "react";
import { getCalibrationMasterListById, getEquipmentListService } from "../../services/masterservice";
import { getFormDetailsList } from "../../services/admin.service"; // Imported for permission checks
import Select from "react-select";
import CalibrationAddEditComponent from "./calibrationAddEditComponent";
import { FaDownload, FaEdit } from "react-icons/fa";
import { format } from "date-fns";
import { Tooltip } from "react-tooltip";
import { generateCalibrationPdf } from "./calibrationPrint";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "calibration";

const Calibration = ({ selectedEquipmentId, selectedEquipmentName }) => {
  const [calibrationList, setCalibrationList] = useState([]);
  const [calibrationId, setCalibrationId] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentValue, setEquipmentValue] = useState(selectedEquipmentId || '');
  const [equipmentName, setEquipmentName] = useState(selectedEquipmentName || '');
  const [hasCalibration, setHasCalibration] = useState(false);
  const [status, setStatus] = useState('');
  const [latestAgency, setLatestAgency] = useState('');
  const [latestDueDate, setLatestDueDate] = useState('');
  const [equipment, setEquipment] = useState({});
  const [latestCalibrationDate, setLatestCalibrationDate] = useState('');

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
    { name: "Agency", selector: (row) => row.calibrationAgency, sortable: true, align: 'text-center' },  // ← ADD
    { name: "Last Calibration Date", selector: (row) => row.calibrationDate, sortable: true, align: 'text-center' },
    { name: "Calibration Due Date", selector: (row) => row.calibrationDueDate, sortable: true, align: 'text-center' },
    { name: "Revision", selector: (row) => row.revision, sortable: true, align: 'text-center' },  // ← ADD
  ];

  /* Dynamic columns addition based on Edit permission */
  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, sortable: true, align: 'text-center' }]
    : baseColumns;

  /* ================= ACTIONS ================= */
  const editCalibration = async (id) => {
    setCalibrationId(id);
    setStatus('edit');
  };

  const addCalibration = async () => {
    setStatus('add');
  };

  useEffect(() => {
    if (permissions.forView) {
      getEquipmentMasterList();
    }
  }, [permissions.forView]);

  useEffect(() => {
    if (permissions.forView && equipmentValue) {
      fetchCalibrationMasterListById(equipmentValue);
    }
  }, [equipmentValue, permissions.forView]);

  useEffect(() => {
    if (equipmentList.length > 0) {
      const targetId = selectedEquipmentId || equipmentList[0].equipmentId;
      const matched = equipmentList.find(e => e.equipmentId === Number(targetId) || e.equipmentId === targetId);
      if (matched) {
        setEquipmentValue(matched.equipmentId);
        setEquipmentName(matched.equipmentName);
        setEquipment(matched);  // ← full object set here
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
    label: equip.equipmentName,
    data: equip, // Store the entire equipment object for later use
  }));

  const handleEquipChange = (data) => {
    setEquipmentValue(data?.value);
    setEquipmentName(data?.label);
    setEquipment(data?.data); // Set the entire equipment object
  };

  const fetchCalibrationMasterListById = async (equipmentValue) => {
    try {
      const data = await getCalibrationMasterListById(equipmentValue);
      if (!data) return;
      if (Array.isArray(data) && data.length > 0) {
        setHasCalibration(true);
        setTableData(data);
      } else {
        setHasCalibration(false);
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch calibration data:", err);
      setHasCalibration(false);
    }
  };

  const handlePrint = (item) => {

    generateCalibrationPdf(item, equipment)
  };



  const setTableData = (data) => {
    const sortedData = [...data].sort(
      (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
    );
    setLatestAgency(sortedData[0]?.calibrationAgency ?? '');
    setLatestDueDate(sortedData[0]?.calibrationDueDate ?? '');
    setLatestCalibrationDate(sortedData[0]?.calibrationDate ?? '');
    setCalibrationList(
      sortedData.map((item, index) => ({
        sn: index + 1 + '.',
        calibrationAgency: item.calibrationAgency ?? '-',   // ← ADD
        calibrationDate: item.calibrationDate ? format(new Date(item.calibrationDate), "dd-MM-yyyy") : '-',
        calibrationDueDate: item.calibrationDueDate ? format(new Date(item.calibrationDueDate), "dd-MM-yyyy") : '-',
        revision: item.revision ?? 0,   // ← ADD
        action: permissions.forEdit ? (
          <>
            {index === 0 && item.calibrationId && (
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
                  onClick={() => item.calibrationId != null && editCalibration(item.calibrationId)}
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
            <h3>Calibration</h3>
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
      return <CalibrationAddEditComponent mode={'add'} equipmentValue={equipmentValue} equipmentName={equipmentName} setStatus={setStatus} latestAgency={latestAgency} latestDueDate={latestDueDate} latestCalibrationDate={latestCalibrationDate} hasCalibration={hasCalibration} equipment={equipment} refreshList={() => fetchCalibrationMasterListById(equipmentValue)} />;
    case 'edit':
      return <CalibrationAddEditComponent mode={'edit'} calibrationId={calibrationId} equipmentName={equipmentName} setStatus={setStatus} equipment={equipment} refreshList={() => fetchCalibrationMasterListById(equipmentValue)} />;

    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Calibration</h3>

              <div className="row justify-content-center align-items-center rowHeadercolor">
                <div className="col-md-12 d-flex justify-content-end align-items-center flex-wrap">
                  <div className="d-flex align-items-center me-4 mb-2">
                    <label htmlFor="equipmentId" className="font-label me-2 mb-0"> Equipment: &nbsp;</label>
                    <div className="text-start " style={{ width: "400px" }}>
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
                <Datatable columns={columns} data={calibrationList} />
              </div>

              <div align="center">
                {permissions.forAdd && !hasCalibration && (
                  <button className="mt-2 btn add me-2" onClick={() => addCalibration()}>
                    ADD
                  </button>
                )}
                {permissions.forAdd && hasCalibration && (
                  <button className="mt-2 btn add me-2" onClick={() => addCalibration()}>
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

export default Calibration;