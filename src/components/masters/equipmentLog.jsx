import { useEffect, useState } from "react";
import Datatable from "../datatable/datatable";
import { getEquipmentListService, getEquipmentLogMasterListById } from "../../services/masterservice";
import { getFormDetailsList } from "../../services/admin.service"; // Imported for permission checks
import EquipmentLogAddEditComponent from "./equipmentLogAddEditComponent";
import "../datatable/master.css";

import { Link } from "react-router-dom";
import Navbar from "../navbar/navbar";
import formatDate from "../../common/dateFormatter";
import { FaEdit, FaFileExcel, FaFilePdf } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import Select from "react-select";
import { printEquipmentUsageLog } from "../print/equipmentUsageLogPrint";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "equipmentLog";

const getMinDate = () => {
  const currentDate = new Date();
  const minYear = currentDate.getFullYear();
  const fyStartYear = currentDate.getMonth() < 3 ? minYear - 1 : minYear;
  return new Date(fyStartYear, 3, 1);
};

const getMaxDate = () => {
  const currentDate = new Date();
  const maxYear = currentDate.getFullYear();
  const fyEndYear = currentDate.getMonth() < 3 ? maxYear : maxYear + 1;
  return new Date(fyEndYear, 2, 31);
};

const EquipmentLog = ({ selectedEquipmentId, selectedEquipmentName }) => {
  const [equipmentLogList, setEquipmentLogList] = useState([]);
  const [status, setStatus] = useState('');
  const [equpmentLogId, setEqupmentLogId] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentValue, setEquipmentValue] = useState(selectedEquipmentId || '');
  const [equipmentName, setEquipmentName] = useState(selectedEquipmentName || '');
  const [equipmentData, setEquipmentData] = useState(null);

  const [fromDateValue, setFromDateValue] = useState(getMinDate());
  const [toDateValue, setToDateValue] = useState(getMaxDate());

  /* ================= PERMISSIONS STATE ================= */
  const [permissions, setPermissions] = useState({
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

  const baseColumns = [
    { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center', width: '70px' },
    { name: "Start Time", selector: (row) => row.startTime, sortable: true, align: 'text-center', width: '180px' },
    { name: "End Time", selector: (row) => row.endTime, sortable: true, align: 'text-center', width: '180px' },
    { name: "Total Hours", selector: (row) => row.totalHours, sortable: true, align: 'text-center', width: '120px' },
    { name: "Description", selector: (row) => row.description, sortable: true, align: 'text-start', width: '300px' },
    { name: "Used By", selector: (row) => row.usedByName, sortable: true, align: 'text-start', width: '180px' },
  ];

  /* Dynamic columns addition based on Edit permission with fixed width */
  const columns = permissions.forEdit
    ? [
        ...baseColumns, 
        { name: "Action", selector: (row) => row.action, sortable: true, align: 'text-center', width: '100px' }
      ]
    : baseColumns;
  /* ================= ACTIONS ================= */
  const editEquipmentLog = async (id) => {
    setEqupmentLogId(id);
    setStatus('edit');
  };

  const addEquipmentLog = async () => {
    setStatus('add');
  };

  useEffect(() => {
    if (permissions.forView) {
      getEquipmentMasterList();
    }
  }, [permissions.forView]);

  useEffect(() => {
    if (permissions.forView && equipmentValue && fromDateValue && toDateValue) {
      fetchEquipmentLogMasterListById(equipmentValue, fromDateValue, toDateValue);
    }
  }, [equipmentValue, fromDateValue, toDateValue, permissions.forView]);

  useEffect(() => {
    if (
      equipmentList.length > 0 &&
      (equipmentValue === '' || equipmentValue == null)
    ) {
      setEquipmentValue(selectedEquipmentId || equipmentList[0].equipmentId);
      setEquipmentName(
        selectedEquipmentName || equipmentList[0].equipmentName
      );
    }
  }, [equipmentList, selectedEquipmentId, selectedEquipmentName]);

  const fetchEquipmentLogMasterListById = async (equipmentValue, fromDateValue, toDateValue) => {
    try {
      const fromdate = format(new Date(fromDateValue), "yyyy-MM-dd'T'HH:mm:ss");
      const todate = format(new Date(toDateValue), "yyyy-MM-dd'T'HH:mm:ss");
      const data = await getEquipmentLogMasterListById(equipmentValue, fromdate, todate);
      if (!data) return;
      if (Array.isArray(data) && data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch equipment log data:", err);
    }
  };

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

  const equipmentOptions = equipmentList
  .filter(equip => equip.logRequired === "Y")
  .map(equip => ({
    value: equip.equipmentId,
    label: equip.equipmentName + '-' + equip.itemSerialNumber,
    equipmentData: equip, // Store the entire equipment data for later use
  }));

  const formatDuration = (hours) => {
    if (hours == null) return '-';
    const totalMinutes = Math.round(hours * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const setTableData = (data) => {
    setEquipmentLogList(
      data.map((item, index) => ({
        sn: index + 1 + '.',
        startTime: item.startTime ? formatDate(item.startTime) : '-',
        endTime: item.endTime ? formatDate(item.endTime) : '-',
        totalHours: formatDuration(item.totalHours),
        description: item.description ? item.description : '-',
        usedByName: item.usedByName ? item.usedByName : '-',
        action: permissions.forEdit ? (
          <button className="btn btn-warning btn-sm me-1" onClick={() => item.id != null && editEquipmentLog(item.id)} title="Edit Equipment Log">
            <FaEdit size={16} />
          </button>
        ) : '-',
      }))
    );
  };

  const handleEquipChange = (data) => {
    setEquipmentValue(data?.value);
    setEquipmentName(data?.equipmentData?.equipmentName || data?.label);
    setEquipmentData(data?.equipmentData || null); // Store the selected equipment data

  };

  const handleEquipmentUsageLogPdf = async() => {
    await printEquipmentUsageLog(equipmentLogList, equipmentName, fromDateValue, toDateValue, equipmentList);
  };

  const handleEquipmentUsageLogExcel = () => {
    if (!equipmentLogList || equipmentLogList.length === 0)
      return alert("No records!");

    const formattedFrom = format(fromDateValue, "dd-MM-yyyy");
    const formattedTo = format(toDateValue, "dd-MM-yyyy");

    const excelData = equipmentLogList.map((d) => ({
      SN: d.sn,
      "Start Time": d.startTime,
      "End Time": d.endTime,
      "Total Hrs": d.totalHours,
      "Description": d.description,
      "Used By": d.usedByName
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData, { origin: "A4" });
    const totalColumns = Object.keys(excelData[0]).length;

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Equipment Usage Log Report`],
        [`Equipment: ${equipmentName}    |    From: ${formattedFrom}   To: ${formattedTo}`]
      ],
      { origin: "A1" }
    );

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } }, 
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalColumns - 1 } }, 
    ];

    worksheet["!cols"] = Object.keys(excelData[0]).map((key) => ({
      wch: Math.max(15, key.length + 5),
    }));

    const titleCell = worksheet["A1"];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "4472C4" } },
      };
    }

    const dateCell = worksheet["A2"];
    if (dateCell) {
      dateCell.s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "5B9BD5" } },
      };
    }

    const headerRowNumber = 4;
    Object.keys(excelData[0]).forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({
        r: headerRowNumber - 1,
        c: colIndex,
      });
      const cell = worksheet[cellRef];

      if (cell) {
        cell.s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "1C6EA4" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Usage Log Report");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer]),
      `Equipment_Usage_Report_${equipmentName}.xlsx`
    );
  };

  /* ================= NO VIEW PERMISSION BLOCK ================= */
  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Equipment Usage Log List</h3>
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
      return <EquipmentLogAddEditComponent mode={'add'} equipmentValue={equipmentValue} equipmentName={equipmentName} setStatus={setStatus} refreshList={() => fetchEquipmentLogMasterListById(equipmentValue, fromDateValue, toDateValue)} />;
    case 'edit':
      return <EquipmentLogAddEditComponent mode={'edit'} equpmentLogId={equpmentLogId} equipmentName={equipmentName} setStatus={setStatus} refreshList={() => fetchEquipmentLogMasterListById(equipmentValue, fromDateValue, toDateValue)} />;
    
    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Equipment Usage Log List</h3>
              <br />

              <div className="row justify-content-center align-items-center rowHeadercolor">
                <div className="col-md-12 d-flex justify-content-end align-items-center flex-wrap">
                  <div className="d-flex align-items-center me-4 mb-2">
                    <label htmlFor="equipmentId" className="font-label me-2 mb-0"> Equipment: &nbsp;</label>
                    <div className="text-start " style={{ width: "500px" }}>
                      <Select
                        options={equipmentOptions}
                        value={equipmentOptions.find(opt => opt.value === Number(equipmentValue)) || null}
                        onChange={(data) => handleEquipChange(data)}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-items-center me-4 mb-2">
                    <label htmlFor="fromDate" className="font-label me-2 mb-0">From:</label>
                    <DatePicker
                      selected={fromDateValue}
                      onChange={(newValue) => setFromDateValue(newValue)}
                      className="form-control"
                      placeholderText="Select From Date"
                      dateFormat="dd-MM-yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>

                  <div className="d-flex align-items-center me-4 mb-2">
                    <label htmlFor="toDate" className="font-label me-2 mb-0">To:</label>
                    <DatePicker
                      selected={toDateValue}
                      onChange={(newValue) => setToDateValue(newValue)}
                      className="form-control"
                      placeholderText="Select To Date"
                      dateFormat="dd-MM-yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      minDate={getMinDate()}
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>

                  <button type="button" className="btn btn-danger me-2" onClick={() => handleEquipmentUsageLogPdf()}>
                    <FaFilePdf size={18} />
                  </button>

                  <button type="button" className="btn btn-success" onClick={() => handleEquipmentUsageLogExcel()}>
                    <FaFileExcel size={18} />
                  </button>
                </div>
              </div>

              <div id="card-body customized-card">
                <Datatable columns={columns} data={equipmentLogList} />
              </div>
              
              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={() => addEquipmentLog()}>
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

export default EquipmentLog;