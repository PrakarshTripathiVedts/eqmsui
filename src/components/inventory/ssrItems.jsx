import { Link } from "react-router-dom";
import Navbar from "../navbar/navbar";
import Datatable from "../datatable/datatable";
import { useState, useEffect } from "react";
import { FaEdit, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { TbLabelImportantFilled } from "react-icons/tb";
import { syncSSRItemsToLocal, getLocalSSRItems, importSSRItemToMain, getImportedSSRItemsByDivision, deleteSSRItemfromSatge, } from "../../services/inventoryService";
import { format, parseISO } from "date-fns";
import SsrItemsImportModal from "./ssrItemsImportModal ";
import { Tooltip } from "react-tooltip";
import { getDivisionListService, getFormDetailsList } from "../../services/admin.service";
import Select from "react-select";
import { MdDeleteForever } from "react-icons/md";
import Swal from "sweetalert2";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import { generatePdfForListPage } from "../print/generatePdfForListPage";
import { generateExcelForListPage } from "../print/generateExcelForListPage";




const FORM_URL = "ssritems";

const SSRItems = () => {
    const [ssrItemList, setSsrItemList] = useState([]);
    const [ssrImportedItemList, setSsrImportedItemList] = useState([]);
    const [divisionId, setDivisionId] = useState();
    const [divisionOptions, setDivisionOptions] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [action, setAction] = useState('ADD');

    const [showImportModal, setShowImportModal] = useState(false);
    const [rowToImport, setRowToImport] = useState(null);
    const [activeTab, setActiveTab] = useState("SSR");

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
        loadDropdowns();
    }, []);

    const loadDropdowns = async () => {
        try {
            const [divs] = await Promise.all([
                getDivisionListService(),
            ]);

            setDivisionOptions(
                (divs ?? []).map((d) => ({
                    value: d?.divisionId,
                    label: `${d?.divisionName ?? ""} (${d?.divisionCode ?? ""})`,
                }))
            );
        } catch (err) {
            console.error("Failed to load dropdowns", err);
            setDivisionOptions([]);
        }
    };

    const baseColumns = [
        { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center' },
        { name: "SSR No", selector: (row) => row.ssrNo, sortable: true, align: 'text-center' },
        { name: "Ledger Name", selector: (row) => row.ledgerName, sortable: true, align: 'text-start' },
        { name: "Page No", selector: (row) => row.pageNo, sortable: true, align: 'text-center' },
        { name: "Item", selector: (row) => row.itemDescription, sortable: true, align: 'text-start' },
        { name: "CRV No", selector: (row) => row.crvNo, sortable: true, align: 'text-center' },
        { name: "CRV Date", selector: (row) => row.crvDate, sortable: true, align: 'text-center', width: '150px' },
        { name: "Rcvd Qty", selector: (row) => row.itemRcvdQty, sortable: true, align: 'text-center' },
        { name: "Alloted Qty", selector: (row) => row.itemAllottedQty, sortable: true, align: 'text-center' },
        { name: "Rate(Rs.)", selector: (row) => row.itemRate, sortable: true, align: 'text-end' },
        { name: "Imported", selector: (row) => row.isImported, sortable: true, align: 'text-center' },
    ];

    const columns = (permissions.forEdit || permissions.forAdd)
        ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: 'text-center' }]
        : baseColumns;

    const baseColumnsCopy = [
        { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center' },
        { name: "SSR No", selector: (row) => row.ssrNo, sortable: true, align: 'text-center' },
        { name: "Ledger Name", selector: (row) => row.ledgerName, sortable: true, align: 'text-start' },
        { name: "Page No", selector: (row) => row.pageNo, sortable: true, align: 'text-center' },
        { name: "Procurement Name", selector: (row) => row.procurement, sortable: true, align: 'text-start' },
        { name: "Item Name", selector: (row) => row.actualItemName, sortable: true, align: 'text-start' },
        { name: "Location", selector: (row) => row.presentLocation, sortable: true, align: 'text-start' },
        { name: "Specification", selector: (row) => row.specification, sortable: true, align: 'text-start' },
        { name: "Category", selector: (row) => row.categoryName, sortable: true, align: 'text-center' },
    ];

    const columnsCopy = (permissions.forEdit || permissions.forAdd)
        ? [...baseColumnsCopy, { name: "Action", selector: (row) => row.action, align: 'text-center', pdfExclude: true, excelExclude: true }]
        : baseColumnsCopy;



    useEffect(() => {
        if (permissions.forView && divisionId) getSSRItems();
        if (permissions.forView && activeTab === "IMPORTED") getImportedSSRItems();
    }, [permissions.forView, divisionId, activeTab]);

    const getSSRItems = async () => {
        try {

            const data = await getLocalSSRItems(divisionId);
            if (Array.isArray(data) && data.length > 0) setTableData(data);
            else setSsrItemList([]);
        } catch (err) {
            console.error("Failed to fetch component data:", err);
        }
    };

    const getImportedSSRItems = async () => {
        try {
            const data = await getImportedSSRItemsByDivision(divisionId);
            if (Array.isArray(data) && data.length > 0) setTableDataCopy(data);
            else setSsrImportedItemList([]);
        } catch (err) {
            console.error("Failed to fetch component data:", err);
        }
    };

    const handleSync = async () => {

        if (!divisionId) {
            Swal.fire({
                icon: "warning",
                title: "Division Required",
                text: "Please select a division before syncing.",
                confirmButtonText: "OK",
            });
            return;
        }
        Swal.fire({
            title: "Please wait...",
            text: "Sync in progress.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        setSyncing(true);

        try {
            const response = await syncSSRItemsToLocal(divisionId);

            Swal.close();

            await getSSRItems();

            Swal.fire({
                icon: "success",
                title: "Sync Completed",
                text: response.data, // Backend message
                confirmButtonText: "OK",
            });

        } catch (err) {
            Swal.close();

            Swal.fire({
                icon: "error",
                title: "Sync Failed",
                text: err.response?.data || "Failed to sync SSR items.",
                confirmButtonText: "OK",
            });

            console.error("Failed to sync SSR items:", err);
        } finally {
            setSyncing(false);
        }
    };

    const openImportModal = (row) => {
        setRowToImport(row);
        setShowImportModal(true);
        // setAction(row?.ledgerPageCrvId ? 'EDIT' : 'ADD');
    };

    const handleDelete = async (ledgerPageCrvId) => {
        try {
            const result = await Swal.fire({
                title: "Are you sure?",
                text: "You want to delete this SSR Item.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, Delete",
                cancelButtonText: "Cancel"
            });

            if (!result.isConfirmed) return;

            const response = await deleteSSRItemfromSatge(ledgerPageCrvId);

            if (response.success) {
                showAlert("Success", response.message || "SSR Item deleted successfully.", "success");
                await getSSRItems();
            } else {
                showAlert("Error", response.message || "Failed to delete SSR Item.", "error");
            }
        } catch (err) {
            console.error("Failed to delete SSR Item:", err);

            showAlert("Error", err?.response?.data?.message || "Something went wrong.", "error");
        }
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setRowToImport(null);
    };

    const handleImportSubmit = async (payload) => {
        try {

            const confirmed = await showConfirmation();
            if (!confirmed) return;

            const data = {
                ...payload,
                action: action,
            };
            const response = await importSSRItemToMain(data);

            if (response && response.ssrImportedId > 0) {
                showAlert("Success", `SSR Item ${action === "EDIT" ? "updated" : "imported"} successfully.`, "success");

                closeImportModal();

                if (activeTab === "IMPORTED") {
                    await getImportedSSRItems();
                } else {
                    await getSSRItems();
                }
            } else {
                showAlert("Error", `Failed to ${action === "EDIT" ? "update" : "import"} SSR Item.`, "error");
            }
        } catch (err) {
            console.error("Failed to import or update SSR Item:", err);

            showAlert("Error", err?.response?.data?.message || "Something went wrong.", "error");
        }
    };

    const setTableData = (data) => {
        setSsrItemList(
            data.map((item, index) => {
                const isImported = ((item.isImported ?? item.is_imported ?? "N") === "Y") ? "YES" : "NO";
                const rowData = {
                    sn: index + 1 + '.',
                    ssrNo: item.ssrNo || '-',
                    ledgerName: item.ledgerName || '-',
                    pageNo: item.pageNo || '-',
                    itemDescription: item.itemDescription || '-',
                    crvNo: item.crvNo || '-',
                    crvDate: item.crvDate
                        ? format(parseISO(item.crvDate), "dd-MM-yyyy")
                        : '-',
                    itemRcvdQty: item.itemRcvdQty || 0,
                    itemAllottedQty: item.itemAllottedQty || 0,
                    itemRate: item.itemRate || 0,
                    isImported,
                    ledgerPageCrvId: item.ledgerPageCrvId || "0",
                };

                rowData.action = (
                    <div className="d-flex justify-content-center align-items-center">
                        {isImported === 'NO' && (permissions.forAdd || permissions.forEdit) && (
                            <>

                                <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => openImportModal(rowData)}
                                    data-tooltip-id="Tooltip"
                                    data-tooltip-content="Import"
                                    data-tooltip-place="top"
                                >
                                    <TbLabelImportantFilled size={16} />
                                </button>

                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(rowData?.ledgerPageCrvId)}
                                    data-tooltip-id="Tooltip"
                                    data-tooltip-content="Delete"
                                    data-tooltip-place="top"
                                >
                                    <MdDeleteForever size={16} />
                                </button>

                                <Tooltip id="Tooltip" className='text-white tooltipName' />
                            </>
                        )}
                    </div>
                );

                return rowData;
            })
        );
    };

    const setTableDataCopy = (data) => {
        setSsrImportedItemList(
            data.map((item, index) => {
                const rowData = {
                    sn: index + 1 + '.',
                    ssrNo: item.ssrNo ?? '-',
                    ledgerName: item.ledgerName ?? '-',
                    pageNo: item.pageNo ?? '-',
                    procurement: item.procurement || '-',
                    actualItemName: item.actualItemName || '-',
                    presentLocation: item.presentLocation || '-',
                    personInCharge: item.personInCharge || '-',
                    categoryName: item.categoryName || '-',
                    demandNo: item.demandNo || '-',
                    remarks: item.remarks || '-',
                    specification: item.specification || '-',
                    ledgerPageCrvId: item.ledgerPageCrvId || "0",
                    itemCategory: item.itemCategory || '-',
                };

                rowData.action = (
                    <div>
                        {permissions.forEdit && (
                            <>
                                <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => openImportModal(rowData)}
                                    data-tooltip-id="Tooltip"
                                    data-tooltip-content="Update"
                                    data-tooltip-place="top"
                                >
                                    <FaEdit size={16} />
                                </button>

                                <Tooltip id="Tooltip" className='text-white tooltipName' />
                            </>
                        )}
                    </div>
                );

                return rowData;
            })
        );
    };


    const handlePdfExport = () => {
        generatePdfForListPage({
            title: "Imported SSR Items Report",
            columns: columnsCopy,
            data: ssrImportedItemList,
            fileName: "Imported_SSR_Items_Report",
            orientation: "landscape",

            details: {
                "Division": divisionOptions.find(opt => opt.value === Number(divisionId))?.label || "-",
            }
        });
    };

    const handleExcelExport = () => {
        generateExcelForListPage({
            title: "Imported SSR Items Report",
            columns: columnsCopy,
            data: ssrImportedItemList,
            fileName: "Imported_SSR_Items_Report",

            details: {
                "Division": divisionOptions.find(opt => opt.value === Number(divisionId))?.label || "-",
            }
        });
    };


    if (!permissions.forView) {
        return (
            <div>
                <Navbar />
                <div className="card p-2">
                    <div className="card-body text-center">
                        <h3>SSR Report</h3>
                        <p className="text-danger mt-3">You do not have permission to view this page.</p>
                        <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div>
            <Navbar />

            <div className="container-fluid mt-3">

                <ul className="nav nav-tabs nav-fill custom-tabs mb-3">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "SSR" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("SSR");
                                setAction("ADD");
                            }}
                            type="button"
                        >
                            Division Wise SSR Report
                        </button>
                    </li>

                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "IMPORTED" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("IMPORTED");
                                setAction("EDIT");
                            }}
                            type="button"
                        >
                            Imported SSR Items
                        </button>
                    </li>
                </ul>
                {activeTab === "SSR" && (
                    <div className="card mt-3">
                        <div className="card-body text-center">
                            <h3>Division Wise SSR Report</h3>
                            <div className="row justify-content-center align-items-center rowHeadercolor">
                                <div className="col-md-12 d-flex justify-content-end align-items-center flex-wrap">
                                    <div className="d-flex align-items-center me-4 mb-2">
                                        <label htmlFor="divisionId" className="font-label me-2 mb-0"> Division: &nbsp;</label>
                                        <div className="text-start " style={{ width: "400px" }}>
                                            <Select
                                                options={divisionOptions}
                                                value={divisionOptions.find(opt => opt.value === divisionId) || null}
                                                onChange={(selectedOption) => setDivisionId(selectedOption?.value || "")}
                                                placeholder="Select Division"
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <button
                                            className="btn btn-success"
                                            onClick={handleSync}
                                            disabled={syncing}
                                            title="Sync latest data from SIS"
                                        >
                                            {syncing ? "Syncing..." : "SYNC FROM SIS"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="card-body customized-card">
                                <Datatable columns={columns} data={ssrItemList} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "IMPORTED" && (
                    <div className="card mt-3">
                        <div className="card-body text-center">
                            <h3>Imported SSR Items</h3>
                            <div className="row justify-content-center align-items-center rowHeadercolor">
                                <div className="col-md-12 d-flex justify-content-end align-items-center flex-wrap">
                                    <div className="d-flex align-items-center mb-2">
                                        <label htmlFor="divisionId" className="font-label me-2 mb-0"> Division: &nbsp;</label>
                                        <div className="text-start " style={{ width: "400px" }}>
                                            <Select
                                                options={divisionOptions}
                                                value={divisionOptions.find(opt => opt.value === divisionId) || null}
                                                onChange={(selectedOption) => setDivisionId(selectedOption?.value || "")}
                                                placeholder="Select Division"
                                            />
                                        </div>
                                    </div>
                                    <div className="ms-2 pb-2">
                                        <button type="button" className="btn btn-danger me-2" onClick={() => handlePdfExport()}>
                                            <FaFilePdf size={18} />
                                        </button>

                                        <button type="button" className="btn btn-success" onClick={() => handleExcelExport()}>
                                            <FaFileExcel size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="card-body customized-card">
                                <Datatable columns={columnsCopy} data={ssrImportedItemList} />
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <SsrItemsImportModal
                show={showImportModal}
                row={rowToImport}
                onClose={closeImportModal}
                onSubmit={handleImportSubmit}
                action={action}
                modalFor='DIVISION'
            />
        </div>
    );

};

export default SSRItems;