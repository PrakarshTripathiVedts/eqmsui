import { useEffect, useState } from "react";
import Navbar from "../navbar/navbar";
import { getFormDetailsList } from "../../services/admin.service";
import { Link } from "react-router-dom";
import Datatable from "../datatable/datatable";
import { downloadStockVerificationReport, getImportedUniqueLedgers, getStockVerificationData } from "../../services/inventoryService";
import { format, parseISO } from "date-fns";
import Select from "react-select";
import { generatePdfForListPage } from "../print/generatePdfForListPage";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { generateExcelForListPage } from "../print/generateExcelForListPage";




const FORM_URL = "stockverification";
const StockVerification = () => {

    const [permissions, setPermissions] = useState({
        forView: false, forAdd: false, forEdit: false, forDelete: false,
    });

    const [stcokData, setStcokData] = useState([]);
    const [rateCosting, setRateCosting] = useState(1000000);
    const [importedLedgerOptions, setImportedLedgerOptions] = useState([]);
    const [ledgerId, setLedgerId] = useState(0);




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
        getData();
        fetchAndMapImportedLedgerOptions();
    }, []);


    const fetchAndMapImportedLedgerOptions = async () => {
        try {
            const importedledgerList = await getImportedUniqueLedgers();

            const importedMappedOptions = [
                {
                    value: 0,
                    label: "SSR",
                },
                ...(importedledgerList ?? []).map((led) => ({
                    value: led?.ledgerId != null ? Number(led.ledgerId) : null,
                    label: led?.ledgerName,
                })),
            ];

            setImportedLedgerOptions(importedMappedOptions);
        } catch (error) {
            console.error("Error fetching ledger options:", error);
            setImportedLedgerOptions([]);
        }
    };

    useEffect(() => {
        if (permissions.forView && rateCosting) getData();
    }, [permissions.forView, rateCosting, ledgerId]);

    const getData = async (data) => {
        try {
            const data = await getStockVerificationData(rateCosting, ledgerId);
            if (Array.isArray(data) && data.length > 0) setTableData(data);
            else setStcokData([]);
        } catch (err) {
            console.error("Failed to fetch component data:", err);
        }
    };

    const setTableData = (data) => {
        setStcokData(
            data.map((item, index) => {
                const rowData = {
                    sn: index + 1 + '.',
                    ssrNo: item.ssrNo ?? '-',
                    ledgerName: item.ledgerName ?? '-',
                    pageNo: item.pageNo ?? '-',
                    itemDescription: item.itemDescription || '-',
                    crvNo: item.crvNo || '-',
                    crvDate: item.crvDate
                        ? format(parseISO(item.crvDate), "dd-MM-yyyy")
                        : '-',
                    itemRcvdQty: item.itemRcvdQty || 0,
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


                return rowData;
            })
        );
    };



    const baseColumns = [
        { name: "SN", selector: (row) => row.sn, sortable: true, align: 'text-center' },
        { name: "Ledger Name", selector: (row) => row.ledgerName, sortable: true, align: 'text-start' },
        { name: "Page No", selector: (row) => row.pageNo, sortable: true, align: 'text-center' },
        { name: "Item", selector: (row) => row.itemDescription, sortable: true, align: 'text-start' },
        { name: "CRV No", selector: (row) => row.crvNo, sortable: true, align: 'text-center' },
        { name: "CRV Date", selector: (row) => row.crvDate, sortable: true, align: 'text-center', width: '150px' },
        { name: "Rcvd Qty", selector: (row) => row.itemRcvdQty, sortable: true, align: 'text-center' },
        { name: "Alloted Qty", selector: (row) => row.itemAllottedQty, sortable: true, align: 'text-center' },
        { name: "Rate(Rs.)", selector: (row) => row.itemRate, sortable: true, align: 'text-end' },
        { name: "Cost(Rs.)", selector: (row) => row.cost, sortable: true, align: 'text-end' },

    ];

    const columns = (permissions.forEdit || permissions.forAdd)
        ? [...baseColumns, { name: "Action", selector: (row) => row.action, align: 'text-center' }]
        : baseColumns;

    // const handlePdfExport = () => {
    //     generatePdfForListPage({
    //         title: "Stock Verification Report",
    //         columns: baseColumns,
    //         data: stcokData,
    //         fileName: "Stock_Verification_Report",
    //         orientation: "landscape",

    //         details: {
    //             "Rate Above (Rs.)": rateCosting,
    //             "Budget": importedLedgerOptions.find(opt => opt.value === Number(ledgerId))?.label || "SSR",
    //         }
    //     });
    // };

    
      const handlePdfExport = async () => {
                console.log("handle pdf export")
                const payLoad = {
                  ledgerId : ledgerId,
                   Project : importedLedgerOptions.find(opt => opt.value === Number(ledgerId))?.label || "-",
                   rateCosting : rateCosting,
                   
                }
                console.log("payload****",payLoad)
                await downloadStockVerificationReport(payLoad);
            }
    
    
    
    const handleExcelExport = () => {
        generateExcelForListPage({
            title: "Stock Verification Report",
            columns: baseColumns,
            data: stcokData,
            fileName: "Stock_Verification_Report",

            details: {
                "Rate Above (Rs.)": rateCosting,
                "Budget":
                    importedLedgerOptions.find(
                        opt => opt.value === Number(ledgerId)
                    )?.label || "SSR",
            }
        });
    };

    if (!permissions.forView) {
        return (
            <div>
                <Navbar />
                <div className="card p-2">
                    <div className="card-body text-center">
                        <h3>Stock Verification</h3>
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
                <div className="card mt-3">
                    <div className="card-body text-center">
                        <h3>Stock Verification</h3>

                        <div className="row  align-items-center rowHeadercolor">
                            <div className="d-flex align-items-center justify-content-end gap-3 my-4">
                                {/* Rate Costing */}
                                <div className="d-flex align-items-center">
                                    <label
                                        htmlFor="rateCosting"
                                        className="form-label fw-bold mb-0 me-2 text-nowrap"
                                    >
                                        Rate Above (Rs.) :
                                    </label>
                                    <input
                                        type="number"
                                        id="rateCosting"
                                        name="rateCosting"
                                        className="form-control text-start"
                                        style={{ width: "200px" }}
                                        value={rateCosting}
                                        onChange={(e) => setRateCosting(e.target.value)}
                                        onKeyDown={(e) => [".", "e", "E", "+", "-", ","].includes(e.key) && e.preventDefault()}
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Type */}
                                <div className="d-flex align-items-center">
                                    <label
                                        htmlFor="type"
                                        className="form-label fw-bold mb-0 me-2 text-nowrap"
                                    >
                                        Budget :
                                    </label>
                                    <div className="text-start" style={{ width: "400px" }}>
                                        <Select
                                            options={importedLedgerOptions}
                                            value={
                                                importedLedgerOptions.find(
                                                    opt => opt.value === Number(ledgerId)
                                                ) || null
                                            }
                                            onChange={(selectedOption) =>
                                                setLedgerId(selectedOption?.value ?? "")
                                            }
                                            placeholder="Select Ledger"
                                        />
                                    </div>
                                </div>
                                <div className="">
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
                            <Datatable
                                columns={baseColumns}
                                data={stcokData}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default StockVerification;