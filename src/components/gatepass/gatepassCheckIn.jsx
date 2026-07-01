import { useState } from "react";
import { getFormDetailsList } from "../../services/admin.service";
import { getGatepassList } from "../../services/gatepass.service";

const GatepassCheckIn = () => {
  const [gatepassList, setGatepassList] = useState([]);
  const [status, setStatus]             = useState('');
  const [gatepassId, setGatepassId]     = useState('');

  const [permissions, setPermissions] = useState({
    forView: false, forAdd: false, forEdit: false, forDelete: false,
  });

  useEffect(() => {
    const roleId = localStorage.getItem("roleId");
    const loadPermissions = async () => {
      try {
        const details     = await getFormDetailsList(roleId);
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

  useEffect(() => {
    if (permissions.forView) fetchGatepassList();
  }, [permissions.forView]);

  const fetchGatepassList = async () => {
    try {
      const data = await getGatepassList();
      if (Array.isArray(data) && data.length > 0) setTableData(data);
      else setGatepassList([]);
    } catch (err) {
      console.error("Failed to fetch gatepass list:", err);
    }
  };

  const fmt = (val) => val ? format(new Date(val), "dd-MM-yyyy") : '-';

  const setTableData = (data) => {
    setGatepassList(
      data.map((item, index) => ({
        sn:                 index + 1 + '.',
        gatepassNo:         item.gatepassNo         ?? '-',
        gatepassDate:       fmt(item.gatepassDate),
        category:           item.category           ?? '-',
        destination:        item.destination        ?? '-',
        probableReturnDate: fmt(item.probableReturnDate),
        outDate:            fmt(item.outDate),
        // Map O/I/P → readable label; fall back to raw value if unknown
        itemStatus:         STATUS_LABEL[item.itemStatus] ?? item.itemStatus ?? '-',
        action: permissions.forEdit ? (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => { setGatepassId(item.gatepassId); setStatus('edit'); }}
            title="Edit Gatepass"
          >
            <FaEdit size={16} />
          </button>
        ) : '-',
      }))
    );
  };

  const baseColumns = [
    { name: "SN",              selector: (row) => row.sn,                 sortable: true,  align: 'text-center' },
    { name: "Gatepass No",     selector: (row) => row.gatepassNo,         sortable: true,  align: 'text-start'  },
    { name: "Gatepass Date",   selector: (row) => row.gatepassDate,       sortable: true,  align: 'text-center' },
    { name: "Category",        selector: (row) => row.category,           sortable: true,  align: 'text-start'  },
    { name: "Destination",     selector: (row) => row.destination,        sortable: true,  align: 'text-start'  },
    { name: "Probable Return", selector: (row) => row.probableReturnDate, sortable: true,  align: 'text-center' },
    { name: "Out Date",        selector: (row) => row.outDate,            sortable: true,  align: 'text-center' },
    { name: "Item Status",     selector: (row) => row.itemStatus,         sortable: true,  align: 'text-center' },
  ];

  const columns = permissions.forEdit
    ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: 'text-center' }]
    : baseColumns;

  if (!permissions.forView) {
    return (
      <div>
        <Navbar />
        <div className="card p-2">
          <div className="card-body text-center">
            <h3>Gate Pass</h3>
            <p className="text-danger mt-3">You do not have permission to view this page.</p>
            <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
          </div>
        </div>
      </div>
    );
  }

  switch (status) {
    default:
      return (
        <div>
          <Navbar />
          <div className="card p-2">
            <div className="card-body text-center">
              <h3>Gate Pass In</h3>
              <div id="card-body customized-card">
                <Datatable columns={columns} data={gatepassList} />
              </div>
              <div align="center">
                {permissions.forAdd && (
                  <button className="mt-2 btn add me-2" onClick={() => setStatus('add')}>ADD</button>
                )}
                <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
              </div>
            </div>
          </div>
        </div>
      );
  }
}
export default GatepassCheckIn;