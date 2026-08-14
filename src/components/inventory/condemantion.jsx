import { Link } from "react-router-dom";
import Navbar from "../navbar/navbar";
import Datatable from "../datatable/datatable";
import { useState, useEffect } from "react";
import { FaBookmark, FaEdit, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { getCondemnationList, getImportedSSRItemsByDivision, addingToCondemantion, downloadCondemnationReport, } from "../../services/inventoryService";
import { format, parseISO } from "date-fns";
import { Tooltip } from "react-tooltip";
import { getDivisionListService, getFormDetailsList } from "../../services/admin.service";
import Select from "react-select";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import { generatePdfForListPage } from "../print/generatePdfForListPage";
import { generateExcelForListPage } from "../print/generateExcelForListPage";

const FORM_URL = "condemnation";
const Condemnation = () => {

    const [condemnationList, setCondemnationList] = useState([]);
    const [ssrImportedItemList, setSsrImportedItemList] = useState([]);
    const [divisionId, setDivisionId] = useState();
    const [divisionOptions, setDivisionOptions] = useState([]);
    const [action, setAction] = useState('ADD');
    const [type, setType] = useState('G');

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
        { name: "Procurement Name", selector: (row) => row.procurement, sortable: true, align: 'text-start' },
        { name: "CRV Date", selector: (row) => row.crvDate, sortable: true, align: 'text-center', width: '150px' },
        { name: "Alloted Qty", selector: (row) => row.itemAllottedQty, sortable: true, align: 'text-center' },
        { name: "Rate(Rs.)", selector: (row) => row.itemRate, sortable: true, align: 'text-center' },
        { name: "Cost(Rs.)", selector: (row) => row.cost, sortable: true, align: 'text-end' },
        { name: "Item Name", selector: (row) => row.actualItemName, sortable: true, align: 'text-start' },
        { name: "Location", selector: (row) => row.presentLocation, sortable: true, align: 'text-start' },
        { name: "Specification", selector: (row) => row.specification, sortable: true, align: 'text-start' },
        { name: "Category", selector: (row) => row.itemCategory, sortable: true, align: 'text-center' },
        { name: "Type", selector: (row) => row.type, sortable: true, align: 'text-start' },
    ];

    const columns = (permissions.forEdit || permissions.forAdd)
        ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: 'text-center', pdfExclude: true, excelExclude: true }]
        : baseColumns;

    const baseColumnsCopy = [
        { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center' },
        { name: "SSR No", selector: (row) => row.ssrNo, sortable: true, align: 'text-center' },
        { name: "Ledger Name", selector: (row) => row.ledgerName, sortable: true, align: 'text-start' },
        { name: "Page No", selector: (row) => row.pageNo, sortable: true, align: 'text-center' },
        { name: "Procurement Name", selector: (row) => row.procurement, sortable: true, align: 'text-start' },
        { name: "CRV Date", selector: (row) => row.crvDate, sortable: true, align: 'text-center', width: '150px' },
        { name: "Alloted Qty", selector: (row) => row.itemAllottedQty, sortable: true, align: 'text-center' },
        { name: "Rate(Rs.)", selector: (row) => row.itemRate, sortable: true, align: 'text-end' },
        { name: "Cost(Rs.)", selector: (row) => row.cost, sortable: true, align: 'text-end' },
        { name: "Item Name", selector: (row) => row.actualItemName, sortable: true, align: 'text-start' },
        { name: "Location", selector: (row) => row.presentLocation, sortable: true, align: 'text-start' },
        { name: "Specification", selector: (row) => row.specification, sortable: true, align: 'text-start' },
        { name: "Category", selector: (row) => row.itemCategory, sortable: true, align: 'text-center' },
    ];

    const columnsCopy = (permissions.forEdit || permissions.forAdd)
        ? [...baseColumnsCopy, { name: "Action", selector: (row) => row.action, align: 'text-center' }]
        : baseColumnsCopy;



    useEffect(() => {
        if (permissions.forView && divisionId) getImportedSSRItems();
        if (permissions.forView && activeTab === "MARKED") getSSRItems();
    }, [permissions.forView, divisionId, activeTab]);

    const getSSRItems = async () => {
        try {

            const data = await getCondemnationList(divisionId);
            if (Array.isArray(data) && data.length > 0) setTableData(data);
            else setCondemnationList([]);
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


    const openImportModal = (row) => {
        setRowToImport(row);
        setShowImportModal(true);
        setAction(row?.condemnationId ? 'EDIT' : 'ADD');
        setType(row?.type === "IT" ? 'I' : 'G');
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setRowToImport(null);
        setType('G');
    };

    const handleMarkSubmit = async () => {
        try {

            const confirmed = await showConfirmation();
            if (!confirmed) return;

            const data = {
                type: type,
                ledgerPageCrvId: rowToImport?.ledgerPageCrvId,
                action: action,
            };

            const response = await addingToCondemantion(data);

            if (response && response.condemnationId > 0) {
                showAlert("Success", `SSR Item ${action === "EDIT" ? "updated" : "marked "} for condemnation successfully.`, "success");

                closeImportModal();

                if (activeTab === "MARKED") {
                    await getSSRItems();

                } else {
                    await getImportedSSRItems();
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
        setCondemnationList(
            data.map((item, index) => {
                const typeValue = item.type === "I" ? "IT" : "General";
                const rowData = {
                    sn: index + 1 + '.',
                    ssrNo: item.ssrItemDTO?.ssrNo || '-',
                    ledgerName: item.ssrItemDTO?.ledgerName || '-',
                    pageNo: item.ssrItemDTO?.pageNo || '-',
                    procurement: item.ssrItemDTO?.procurement || '-',
                    crvDate: item.ssrItemDTO?.crvDate
                        ? format(parseISO(item.ssrItemDTO.crvDate), "dd-MM-yyyy")
                        : '-',


                    itemAllottedQty: item.ssrItemDTO?.itemAllottedQty || 0,
                    itemRate: item.ssrItemDTO?.itemRate || 0,
                    cost: item.ssrItemDTO?.itemAllottedQty * item.ssrItemDTO?.itemRate || 0,
                    actualItemName: item.ssrItemDTO?.actualItemName || '-',
                    presentLocation: item.ssrItemDTO?.presentLocation || '-',
                    specification: item.ssrItemDTO?.specification || '-',
                    itemCategory: item.ssrItemDTO?.itemCategory || '-',
                    type: typeValue,
                    ledgerPageCrvId: item.ssrItemDTO?.ledgerPageCrvId || "0",
                    condemnationId: item.condemnationId || "0",
                };

                rowData.action = (
                    <div className="d-flex justify-content-center align-items-center">
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

    const setTableDataCopy = (data) => {
        setSsrImportedItemList(
            data.reverse().map((item, index) => {
                const rowData = {
                    sn: index + 1 + '.',
                    ssrNo: item.ssrNo ?? '-',
                    ledgerName: item.ledgerName ?? '-',
                    pageNo: item.pageNo ?? '-',
                    procurement: item.procurement || '-',
                    crvDate: item.crvDate
                        ? format(parseISO(item.crvDate), "dd-MM-yyyy")
                        : '-',
                    itemAllottedQty: item.itemAllottedQty || 0,
                    itemRate: item.itemRate || 0,
                    cost: item.itemAllottedQty * item.itemRate || 0,
                    actualItemName: item.actualItemName || '-',
                    presentLocation: item.presentLocation || '-',
                    personInCharge: item.personInCharge || '-',
                    itemCategory: item.itemCategory || '-',
                    demandNo: item.demandNo || '-',
                    specification: item.specification || '-',
                    ledgerPageCrvId: item.ledgerPageCrvId || "0",
                };

                rowData.action = (
                    <div>
                        {permissions.forEdit && item.isCondemnationMarked === "N" && (
                            <>
                                <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => openImportModal(rowData)}
                                    data-tooltip-id="Tooltip"
                                    data-tooltip-content="Mark for Condemnation"
                                    data-tooltip-place="top"
                                >
                                    <FaBookmark size={16} />
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

    if (!permissions.forView) {
        return (
            <div>
                <Navbar />
                <div className="card p-2">
                    <div className="card-body text-center">
                        <h3>Condemnation List</h3>
                        <p className="text-danger mt-3">You do not have permission to view this page.</p>
                        <Link className="mt-2 btn back" to="/dashboard">BACK</Link>
                    </div>
                </div>
            </div>
        );
    }

    // const handlePdfExport = () => {
    //     generatePdfForListPage({
    //         title: "Codemnation Items Report",
    //         columns: columns,
    //         data: condemnationList,
    //         fileName: "Codemnation_Item_Report",
    //         orientation: "landscape",

    //         details: {
    //             "Division": divisionOptions.find(opt => opt.value === Number(divisionId))?.label || "-",
    //         }
    //     });
    // };

    const handlePdfExport = async () => {
                    console.log("handle pdf export")
                    const payLoad = {
                      divisionId : divisionId,
                       division : divisionOptions.find(opt => opt.value === Number(divisionId))?.label || "-",
                       
                       
                    }
                    console.log("payload****",payLoad)
                    await downloadCondemnationReport(payLoad);
                }

    const handleExcelExport = () => {
        generateExcelForListPage({
            title: "Codemnation Items Report",
            columns: baseColumns,
            data: condemnationList,
            fileName: "Codemnation_Item_Report",

            details: {
                "Division": divisionOptions.find(opt => opt.value === Number(divisionId))?.label || "-",
            }
        });
    };


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
                            Condemnation Eligible Items
                        </button>
                    </li>

                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "MARKED" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("MARKED");
                                setAction("EDIT");
                            }}
                            type="button"
                        >
                            Condemnation Marked Items
                        </button>
                    </li>
                </ul>
                {activeTab === "SSR" && (
                    <div className="card mt-3">
                        <div className="card-body text-center">
                            <h3>Condemnation Eligible Items</h3>
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
                                </div>
                            </div>

                            <div id="card-body customized-card">
                                <Datatable columns={columnsCopy} data={ssrImportedItemList} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "MARKED" && (
                    <div className="card mt-3">
                        <div className="card-body text-center">
                            <h3>Condemnation Marked Items</h3>
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
                                <Datatable columns={columns} data={condemnationList} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showImportModal && (
                <div
                    className="modal d-block"
                    tabIndex="-1"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                >
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">

                            {/* Modal Header */}
                            <div
                                className="modal-header"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                    color: "#fff",
                                }}
                            >
                                <h5 className="modal-title mb-0">
                                    {action === "ADD"
                                        ? "Mark for Condemnation"
                                        : "Update Condemnation"}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeImportModal}
                                />
                            </div>

                            <div className="modal-body text-start">

                                <div
                                >

                                    <div className="">
                                        <strong>SSR No:</strong>{" "}
                                        {rowToImport?.ssrNo || "-"}
                                    </div>
                                    <div className="">
                                        <strong>Ledger Name:</strong>{" "}
                                        {rowToImport?.ledgerName || "-"}
                                    </div>
                                    <div className="">
                                        <strong>Page No:</strong>{" "}
                                        {rowToImport?.pageNo || "-"}
                                    </div>
                                    <div className="">
                                        <strong>Procurement Name:</strong>{" "}
                                        {rowToImport?.procurement || "-"}
                                    </div>

                                </div>

                                {/* Type */}
                                <div className="my-5 row align-items-center">
                                    <label htmlFor="type" className="col-md-1 col-form-label fw-bold me-2">
                                        Type:
                                    </label>

                                    <div className="col-md-10">
                                        <select
                                            id="type"
                                            name="type"
                                            className="form-control"
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            required
                                        >
                                            <option value="G">General</option>
                                            <option value="I">IT</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="modal-footer justify-content-center">

                                <button
                                    type="button"
                                    className={`${action === "EDIT"
                                        ? "btn-warning"
                                        : "btn-success"
                                        } btn px-4 fw-bold`}
                                    onClick={handleMarkSubmit}
                                >
                                    {action === "EDIT" ? "UPDATE" : "SUBMIT"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );


}

export default Condemnation;
