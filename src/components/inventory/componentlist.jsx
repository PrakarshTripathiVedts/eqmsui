import { Link } from "react-router-dom";
import Navbar from "../navbar/navbar";
import Datatable from "../datatable/datatable";
import { useState, useEffect } from "react";
import ComponentAddEdit from "./componentaddedit";
import { FaEdit } from "react-icons/fa";
import { TbTruckDelivery } from "react-icons/tb";
import { getComponentList } from "../../services/componentservices";
import { getFormDetailsList } from "../../services/admin.service";
import { format, parseISO } from "date-fns";
import ComponentIssued from "./componentIssued";

const FORM_URL = "componentList";

const ComponentList = () => {
  const [componentList, setComponentList] = useState([]);
  const [status, setStatus]               = useState('');
  const [componentId, setComponentId]     = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);

  const [permissions, setPermissions] = useState({
    forView: false, forAdd: false, forEdit: false, forDelete: false,
  });

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

  const baseColumns = [
    { name: "SN",             selector: (row) => row.sn,             sortable: true, align: 'text-center' },
    { name: "Type",           selector: (row) => row.componentType,  sortable: true, align: 'text-center' },
    { name: "Component Name", selector: (row) => row.componentName,  sortable: true, align: 'text-start'  },
    { name: "Specs",          selector: (row) => row.componentSpecs, sortable: true, align: 'text-start'  },
    { name: "Room No",        selector: (row) => row.roomNo,         sortable: true, align: 'text-center' },
    { name: "Almirah No",     selector: (row) => row.almirahNo,      sortable: true, align: 'text-center' },
    { name: "Box No",         selector: (row) => row.boxNo,          sortable: true, align: 'text-center' },
    { name: "Unit",           selector: (row) => row.unitCode,       sortable: true, align: 'text-center' },
    { name: "Latest Qty",     selector: (row) => row.latestBalQty,   sortable: true, align: 'text-center' },
    { name: "Latest Qty Date",selector: (row) => row.latestQtyDate,  sortable: true, align: 'text-center' },
    { name: "Remarks",        selector: (row) => row.remarks,        sortable: true, align: 'text-start'  },
  ];

  const columns = (permissions.forEdit || permissions.forAdd)
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: 'text-center' }]
    : baseColumns;

  const editComponent = (id) => { setComponentId(id); setStatus('edit'); };
  const addComponent  = ()    => setStatus('add');

  const issueComponent = (component) => {
    setSelectedComponent(component);
    setStatus('issue');
  };

  useEffect(() => {
    if (permissions.forView) getComponentData();
  }, [permissions.forView]);

  const getComponentData = async () => {
    try {
      const data = await getComponentList();
      if (Array.isArray(data) && data.length > 0) setTableData(data);
      else setComponentList([]);
    } catch (err) {
      console.error("Failed to fetch component data:", err);
    }
  };

  const setTableData = (data) => {
    setComponentList(
      data.map((item, index) => ({
        sn:             index + 1 + '.',
        componentId:    item.componentId,
        componentType:  item.componentType  ?? '-',
        componentName:  item.componentName  ?? '-',
        componentSpecs: item.componentSpecs ?? '-',
        roomNo:         item.roomNo         ?? '-',
        almirahNo:      item.almirahNo      ?? '-',
        boxNo:          item.boxNo          ?? '-',
        unitCode:       item.unitCode       ?? '-',
        latestBalQty:   item.latestBalQty   ?? 0,
        latestQtyDate:  item.latestQtyDate
          ? format(parseISO(item.latestQtyDate), "dd-MM-yyyy")
          : '-',
        remarks:        item.remarks        ?? '-',
        action: (
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {permissions.forEdit && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => item.componentId != null && editComponent(item.componentId)}
                title="Edit Component"
              >
                <FaEdit size={16} />
              </button>
            )}
            {permissions.forAdd && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  item.componentId != null &&
                  issueComponent({
                    componentId:   item.componentId,
                    componentName: item.componentName,
                    unitCode:      item.unitCode,
                    latestBalQty:  item.latestBalQty ?? 0,
                  })
                }
                title="Issue Qty"
                disabled={!item.latestBalQty || item.latestBalQty <= 0}
              >
                <TbTruckDelivery size={16} />
              </button>
            )}
          </div>
        ),
      }))
    );
  };

  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Component List</h3>
            <p className="text-danger mt-3">You do not have permission to view this page.</p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  switch (status) {
    case 'add':
      return <ComponentAddEdit mode="add" setStatus={setStatus} refreshList={getComponentData} />;
    case 'edit':
      return <ComponentAddEdit mode="edit" componentId={componentId} setStatus={setStatus} refreshList={getComponentData} />;
    case 'issue':
      return (
        <ComponentIssued
          component={selectedComponent}
          setStatus={setStatus}
          refreshList={getComponentData}
        />
      );
    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Component List</h3>
              <div id="card-body customized-card">
                <Datatable columns={columns} data={componentList} />
              </div>
              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={addComponent}>ADD</button>
                )}
                <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default ComponentList;