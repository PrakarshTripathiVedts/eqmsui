import { FaEdit } from "react-icons/fa";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getComponentList, getComponentMasterListById } from "../../services/componentservices";
import { getFormDetailsList } from "../../services/admin.service"; // Imported for permission checks
import Select from "react-select";
import Datatable from "../datatable/datatable";
import ComponentDetailsAddEditComponent from "./componentdetailsaddedit";

/* ─── match this to your formUrl value in DB for this page ─── */
const FORM_URL = "componentDetails";

const ComponentDetails = ({ selectedComponentId, selectedComponentName }) => {
  const [ComponentDetailsList, setComponentDetailsList] = useState([]);
  const [status, setStatus] = useState('');
  const [ComponentList, setComponentList] = useState([]);
  const [componentValue, setComponentValue] = useState(selectedComponentId || '');
  const [componentName, setComponentName] = useState(selectedComponentName || '');
  const [componentDetailsId, setComponentDetailsId] = useState('');

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

  /* ================= BASE COLUMNS ================= */
  const baseColumns = [
    { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center' },
    { name: "Nomenclature", selector: (row) => row.componentNomenclature, sortable: true, align: 'text-center' },
    { name: "Part No", selector: (row) => row.partNo, sortable: true, align: 'text-center' },
    { name: "Qty ", selector: (row) => row.qty, sortable: true, align: 'text-center' },
  ];

  /* Dynamic columns addition based on Edit permission */
  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, sortable: true, align: 'text-center' }]
    : baseColumns;

  /* ================= ACTIONS ================= */
  const addComponentDetails = async () => {
    setStatus('add');
  };

  const editComponentDetails = async (id) => {
    setComponentDetailsId(id);
    setStatus('edit');
  };

  useEffect(() => {
    if (permissions.forView) {
      getComponentMasterList();
    }
  }, [permissions.forView]);

  const getComponentMasterList = async () => {
    try {
      const data = await getComponentList();
      if (Array.isArray(data) && data.length > 0) {
        setComponentList(data);
      } else {
        setComponentList([]);
        console.error("Component list is empty or invalid.");
      }
    } catch (error) {
      console.error("Error fetching component list:", error);
      setComponentList([]);
    }
  };

  const componentOptions = ComponentList.map(comp => ({
    value: comp.componentId,
    label: comp.componentName
  }));

  useEffect(() => {
    if (permissions.forView && componentValue) {
      fetchComponentMasterListById(componentValue);
    }
  }, [componentValue, permissions.forView]);

  useEffect(() => {
    if (
      ComponentList.length > 0 &&
      (componentValue === "" || componentValue == null)
    ) {
      setComponentValue(selectedComponentId || ComponentList[0].componentId);
      setComponentName(selectedComponentName || ComponentList[0].componentName);
    }
  }, [ComponentList, selectedComponentId, selectedComponentName]);

  const handleCompChange = (data) => {
    setComponentValue(data?.value);
    setComponentName(data?.label);
  };

  const fetchComponentMasterListById = async (componentValue) => {
    try {
      const data = await getComponentMasterListById(componentValue);
      if (!data) return;

      if (Array.isArray(data) && data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch calibration data:", err);
    }
  };

  const setTableData = (data) => {
    setComponentDetailsList(
      data.map((item, index) => ({
        sn: index + 1 + '.',
        componentNomenclature: item.componentNomenclature ?? '-',
        partNo: item.partNo ?? '-',
        qty: item.qty ?? '-',
        action: permissions.forEdit ? (
          <>
            <button 
              className="btn btn-warning btn-sm" 
              title="Edit Equipment"  
              onClick={() => item.componentDetailsId != null && editComponentDetails(item.componentDetailsId)}
            >
              <FaEdit size={16} />
            </button>
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
            <h3>Component Details</h3>
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
      return <ComponentDetailsAddEditComponent mode={'add'} componentValue={componentValue} componentName={componentName} setStatus={setStatus} refreshList={() => fetchComponentMasterListById(componentValue)} />;
    case 'edit':
      return <ComponentDetailsAddEditComponent mode={'edit'} componentDetailsId={componentDetailsId} componentName={componentName} setStatus={setStatus} refreshList={() => fetchComponentMasterListById(componentValue)} />;
    
    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Component Details</h3>

              <div className="row justify-content-center align-items-center rowHeadercolor">
                <div className="col-md-12 d-flex justify-content-end align-items-center flex-wrap">
                  <div className="d-flex align-items-center me-4 mb-2">
                    <label htmlFor="equipmentId" className="font-label me-2 mb-0"> Item: &nbsp;</label>
                    <div className="text-start " style={{ width: "400px" }}>
                      <Select
                        options={componentOptions}
                        value={componentOptions.find(opt => opt.value === Number(componentValue)) || null}
                        onChange={(data) => handleCompChange(data)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div id="card-body customized-card">
                <Datatable columns={columns} data={ComponentDetailsList} />
              </div>

              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={() => addComponentDetails()}>
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

export default ComponentDetails;